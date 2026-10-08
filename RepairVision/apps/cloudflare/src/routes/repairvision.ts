// =============================================================================
//  RepairVision AI Diagnosis API
//  ---------------------------------------------------------------------------
//    GET  /api/repairvision/status    is it set up, and with which model
//    POST /api/repairvision/analyze   multipart: deviceName, manufacturer,
//                                     model, problem, and an optional image
//    POST /api/repairvision/followup  JSON: the case so far and one answer
//
//  Signed-in staff only, like the rest of the repairer area, and limited per
//  person per hour. The photo is checked and sent to Gemma, never stored, and
//  neither it nor the description is logged. Nothing here changes a repair
//  record: a diagnosis is advice for the volunteer, not an outcome.
// =============================================================================
import { REPAIRVISION_LIMITS, deviceContextSchema, followupRequestSchema } from '@circularity/shared';
import type { App, HubReply } from '../lib/router.js';
import { imageSize, MIME_FOR, sniffImage, stripJpegMetadata } from '../lib/images.js';
import { GemmaError, notConfigured, readGemmaConfig } from '../services/repairvision/gemma.js';
import { analyzeDevice, continueDiagnosis, type DiagnosisImage } from '../services/repairvision/engine.js';
import { takeDiagnosisAllowance } from '../services/repairvision/rateLimit.js';

const ALLOWED = new Set<string>(REPAIRVISION_LIMITS.imageMimeTypes);

function fail(reply: HubReply, status: number, code: string, error: string, extra: Record<string, unknown> = {}): void {
  reply.code(status).send({ error, code, ...extra });
}

function sendGemmaError(reply: HubReply, err: GemmaError): void {
  if (err.retryAfterSeconds) reply.header('Retry-After', String(err.retryAfterSeconds));
  fail(reply, err.httpStatus, err.code, err.message, err.retryAfterSeconds ? { retryAfter: err.retryAfterSeconds } : {});
}

class ImageProblem extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

/** Check an uploaded picture the same way stored uploads are checked. */
export function checkImage(bytes: Uint8Array, declaredType: string): DiagnosisImage {
  if (!ALLOWED.has(declaredType)) {
    throw new ImageProblem(415, 'upload/unsupported_type', 'Use a JPEG, PNG or WebP photo.');
  }
  if (bytes.length > REPAIRVISION_LIMITS.maxImageBytes) {
    const mb = REPAIRVISION_LIMITS.maxImageBytes / (1024 * 1024);
    throw new ImageProblem(413, 'upload/too_large', `The photo is larger than ${mb} MB.`);
  }
  const kind = sniffImage(bytes);
  if (!kind || MIME_FOR[kind] !== declaredType) {
    throw new ImageProblem(415, 'upload/unsupported_type', 'That file is not a JPEG, PNG or WebP photo.');
  }
  const size = imageSize(bytes, kind);
  if (!size || size.width < 1 || size.height < 1 || Math.max(size.width, size.height) > 8192) {
    throw new ImageProblem(400, 'upload/invalid', 'That photo could not be read.');
  }
  // Camera metadata (including where a photo was taken) never leaves the hub.
  return { mimeType: MIME_FOR[kind], bytes: kind === 'jpeg' ? stripJpegMetadata(bytes) : bytes };
}

function formText(form: FormData, name: string): string | null {
  const value = form.get(name);
  return typeof value === 'string' ? value : null;
}

export async function repairVisionRoutes(app: App): Promise<void> {
  app.addHook('preHandler', app.requireRole('super_admin', 'admin', 'repairer', 'user'));

  app.get('/api/repairvision/status', async () => {
    const config = readGemmaConfig();
    return {
      configured: Boolean(config.apiKey),
      model: config.model,
      maxRounds: REPAIRVISION_LIMITS.maxRounds,
      maxImageBytes: REPAIRVISION_LIMITS.maxImageBytes,
      imageMimeTypes: REPAIRVISION_LIMITS.imageMimeTypes,
    };
  });

  app.post(
    '/api/repairvision/analyze',
    { bodyLimit: REPAIRVISION_LIMITS.maxImageBytes + 256 * 1024 },
    async (request, reply) => {
      const contentType = request.headers['content-type'] ?? '';
      if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
        return fail(reply, 415, 'validation/content_type', 'Send the form as multipart/form-data.');
      }
      let form: FormData;
      try {
        form = await request.raw.formData();
      } catch {
        return fail(reply, 400, 'validation/failed', 'The form could not be read.');
      }

      const parsed = deviceContextSchema.safeParse({
        deviceName: formText(form, 'deviceName') ?? '',
        manufacturer: formText(form, 'manufacturer'),
        model: formText(form, 'model'),
        problem: formText(form, 'problem') ?? '',
      });
      if (!parsed.success) {
        return fail(reply, 400, 'validation/failed', 'Validation failed', { details: parsed.error.flatten() });
      }

      let image: DiagnosisImage | null = null;
      const file = form.get('image');
      if (file && typeof file !== 'string' && file.size > 0) {
        try {
          image = checkImage(new Uint8Array(await file.arrayBuffer()), file.type);
        } catch (err) {
          if (err instanceof ImageProblem) return fail(reply, err.status, err.code, err.message);
          throw err;
        }
      }

      const config = readGemmaConfig();
      if (!config.apiKey) {
        return sendGemmaError(reply, notConfigured());
      }
      if (!(await takeDiagnosisAllowance(request.auth!.sub))) {
        return fail(reply, 429, 'ai/user_rate_limited', 'You have reached the hourly limit for AI diagnoses. Try again later.');
      }
      try {
        return await analyzeDevice(parsed.data, image, { config });
      } catch (err) {
        if (err instanceof GemmaError) return sendGemmaError(reply, err);
        throw err;
      }
    },
  );

  app.post(
    '/api/repairvision/followup',
    { bodyLimit: REPAIRVISION_LIMITS.maxFollowupBytes },
    async (request, reply) => {
      const parsed = followupRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return fail(reply, 400, 'validation/failed', 'Validation failed', { details: parsed.error.flatten() });
      }
      const config = readGemmaConfig();
      if (!config.apiKey) {
        return sendGemmaError(reply, notConfigured());
      }
      if (!(await takeDiagnosisAllowance(request.auth!.sub))) {
        return fail(reply, 429, 'ai/user_rate_limited', 'You have reached the hourly limit for AI diagnoses. Try again later.');
      }
      try {
        return await continueDiagnosis(parsed.data, { config });
      } catch (err) {
        if (err instanceof GemmaError) return sendGemmaError(reply, err);
        throw err;
      }
    },
  );
}

// =============================================================================
//  The diagnostic engine
//  ---------------------------------------------------------------------------
//  analyzeDevice: device details, a description and an optional photo in, a
//  validated diagnosis out.
//  continueDiagnosis: the case so far and one new answer in, an updated
//  diagnosis out.
//
//  Both: screen for hazards, build the prompt, call Gemma, pull the JSON out of
//  what it wrote, validate it, then apply the safety rules. Nothing here reads
//  or writes repair records, so it can later be hooked up to them (or to past
//  cases) without changing how a diagnosis is made.
// =============================================================================
import {
  REPAIRVISION_LIMITS,
  diagnosisResultSchema,
  type DeviceContext,
  type DiagnosisResponse,
  type DiagnosisResult,
  type FollowupRequest,
} from '@circularity/shared';
import { GemmaError, generateText, toBase64, type GemmaDeps, type GemmaPart } from './gemma.js';
import { SYSTEM_INSTRUCTION, analyzePrompt, followupPrompt } from './prompt.js';
import { enforceSafety, screenForHazards } from './safety.js';

export interface DiagnosisImage {
  mimeType: string;
  bytes: Uint8Array;
}

/**
 * The JSON object in a model's reply. Copes with a reply wrapped in markdown
 * fences or with a sentence before or after it.
 */
export function extractJson(raw: string): unknown {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        /* fall through */
      }
    }
  }
  throw new GemmaError('ai/invalid_response', 502, 'Gemma replied in a format RepairVision could not read. Try again.');
}

/** Parse and validate a reply. Exported for tests. */
export function parseDiagnosis(raw: string): DiagnosisResult {
  const parsed = diagnosisResultSchema.safeParse(extractJson(raw));
  if (!parsed.success) {
    // Which fields failed is useful when setting up; the content is not logged.
    console.warn('repairvision: model reply failed validation', parsed.error.issues.map((i) => i.path.join('.')).join(', '));
    throw new GemmaError('ai/invalid_response', 502, 'Gemma replied with an incomplete diagnosis. Try again.');
  }
  return parsed.data;
}

function finish(
  diagnosis: DiagnosisResult,
  deps: GemmaDeps,
  extra: { round: number; imageAnalyzed: boolean; hazards: string[]; notices: string[] },
): DiagnosisResponse {
  return {
    diagnosis,
    meta: {
      model: deps.config.model,
      round: extra.round,
      maxRounds: REPAIRVISION_LIMITS.maxRounds,
      imageAnalyzed: extra.imageAnalyzed,
      hazards: extra.hazards,
      notices: extra.notices,
      generatedAt: new Date().toISOString(),
    },
  };
}

export async function analyzeDevice(
  context: DeviceContext,
  image: DiagnosisImage | null,
  deps: GemmaDeps,
): Promise<DiagnosisResponse> {
  const hazards = screenForHazards([context.deviceName, context.manufacturer, context.model, context.problem]);
  const parts: GemmaPart[] = [];
  if (image) parts.push({ inlineData: { mimeType: image.mimeType, data: toBase64(image.bytes) } });
  parts.push({ text: analyzePrompt(context, Boolean(image), hazards) });

  const raw = await generateText({ systemInstruction: SYSTEM_INSTRUCTION, parts }, deps);
  const diagnosis = parseDiagnosis(raw);
  // The model is told this, but a first analysis has no "change" to report,
  // and without a photo there is nothing it could have seen.
  diagnosis.evidenceUpdate = null;
  const notices: string[] = [];
  if (!image && diagnosis.visualObservations.length > 0) {
    diagnosis.visualObservations = [];
    notices.push('Visual observations were removed because no photo was provided.');
  }
  const safe = enforceSafety(diagnosis, hazards);
  return finish(safe.diagnosis, deps, {
    round: 0,
    imageAnalyzed: Boolean(image),
    hazards: hazards.map((h) => h.id),
    notices: [...notices, ...safe.notices],
  });
}

export async function continueDiagnosis(input: FollowupRequest, deps: GemmaDeps): Promise<DiagnosisResponse> {
  const round = input.history.length + 1;
  if (round > REPAIRVISION_LIMITS.maxRounds) {
    throw new GemmaError('ai/bad_request', 400, 'This diagnosis has reached its question limit. Start a new one.');
  }
  const hazards = screenForHazards([
    input.context.deviceName,
    input.context.manufacturer,
    input.context.model,
    input.context.problem,
    ...input.history.map((t) => t.answer),
    input.answer,
  ]);
  const prompt = followupPrompt({ ...input, hazards });
  const raw = await generateText({ systemInstruction: SYSTEM_INSTRUCTION, parts: [{ text: prompt }] }, deps);
  const diagnosis = parseDiagnosis(raw);
  const notices: string[] = [];
  if (!input.imageAnalyzed && diagnosis.visualObservations.length > 0) {
    diagnosis.visualObservations = [];
    notices.push('Visual observations were removed because no photo was provided.');
  }
  const safe = enforceSafety(diagnosis, hazards, {
    askedQuestions: [...input.history.map((t) => t.question), input.question],
    lastRound: round >= REPAIRVISION_LIMITS.maxRounds,
  });
  return finish(safe.diagnosis, deps, {
    round,
    imageAnalyzed: input.imageAnalyzed,
    hazards: hazards.map((h) => h.id),
    notices: [...notices, ...safe.notices],
  });
}

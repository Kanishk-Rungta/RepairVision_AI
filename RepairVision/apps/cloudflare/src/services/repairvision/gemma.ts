// =============================================================================
//  Gemma 4 through the Gemini API
//  ---------------------------------------------------------------------------
//  Google hosts the Gemma 4 models behind the same generateContent endpoint as
//  Gemini: https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api
//
//  This calls the REST endpoint with fetch rather than the @google/genai SDK,
//  which keeps the Worker bundle small and has nothing that might not run on
//  workerd. The key is sent in the x-goog-api-key header, never in the URL,
//  so it cannot end up in a log line that prints the address.
//
//  Every failure becomes a GemmaError with a stable code and an HTTP status
//  for our own answer. Nothing here ever invents an answer when the API fails,
//  and nothing ever swaps in a different model.
// =============================================================================
import { bindings } from '../../env.js';

export const DEFAULT_GEMMA_MODEL = 'gemma-4-26b-a4b-it';
const API_ROOT = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_TIMEOUT_MS = 90_000;

export interface GemmaConfig {
  apiKey: string | null;
  model: string;
  thinkingLevel: 'high' | 'minimal';
  jsonMode: boolean;
  timeoutMs: number;
}

/** Read the settings from the Worker's variables and secrets. */
export function readGemmaConfig(): GemmaConfig {
  const b = bindings();
  const model = b.GEMMA_MODEL?.trim() || DEFAULT_GEMMA_MODEL;
  const timeout = Number(b.GEMMA_TIMEOUT_MS);
  return {
    apiKey: b.GEMINI_API_KEY?.trim() || null,
    // Only letters, digits, dots and dashes reach the URL.
    model: /^[a-z0-9][a-z0-9.\-]*$/i.test(model) ? model : DEFAULT_GEMMA_MODEL,
    thinkingLevel: b.GEMMA_THINKING_LEVEL?.trim().toLowerCase() === 'minimal' ? 'minimal' : 'high',
    jsonMode: (b.GEMMA_JSON_MODE ?? '').trim().toLowerCase() !== 'false',
    timeoutMs: Number.isFinite(timeout) && timeout >= 1000 ? Math.min(timeout, 300_000) : DEFAULT_TIMEOUT_MS,
  };
}

export type GemmaErrorCode =
  | 'ai/not_configured'
  | 'ai/auth_failed'
  | 'ai/model_unavailable'
  | 'ai/rate_limited'
  | 'ai/timeout'
  | 'ai/unavailable'
  | 'ai/bad_request'
  | 'ai/blocked'
  | 'ai/empty_response'
  | 'ai/invalid_response';

export class GemmaError extends Error {
  constructor(
    public code: GemmaErrorCode,
    /** The status our API answers with. */
    public httpStatus: number,
    message: string,
    public retryAfterSeconds?: number,
  ) {
    super(message);
  }
}

export function notConfigured(): GemmaError {
  return new GemmaError(
    'ai/not_configured',
    503,
    'AI diagnosis is not set up on this hub yet: the GEMINI_API_KEY secret is missing.',
  );
}

export type GemmaPart = { text: string } | { inlineData: { mimeType: string; data: string } };

export interface GemmaRequest {
  systemInstruction: string;
  parts: GemmaPart[];
}

export interface GemmaDeps {
  config: GemmaConfig;
  /** Swapped for a fake in tests. */
  fetch?: typeof fetch;
}

interface ApiBody {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string; thought?: boolean }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  error?: { code?: number; message?: string; status?: string };
}

/** Bytes to base64 without blowing the stack on a large picture. */
export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function body(request: GemmaRequest, config: GemmaConfig, jsonMode: boolean): string {
  return JSON.stringify({
    systemInstruction: { parts: [{ text: request.systemInstruction }] },
    contents: [{ role: 'user', parts: request.parts }],
    generationConfig: {
      // Low, because a diagnosis should follow the evidence, not get creative.
      temperature: 0.3,
      maxOutputTokens: 8192,
      ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
      thinkingConfig: { thinkingLevel: config.thinkingLevel },
    },
  });
}

/** The API refused JSON mode for this model, rather than the request itself. */
function rejectsJsonMode(status: number, message: string): boolean {
  return status === 400 && /response_?mime_?type|json mode|response.?schema|mime type/i.test(message);
}

function retryAfter(res: Response): number | undefined {
  const value = Number(res.headers.get('retry-after'));
  return Number.isFinite(value) && value > 0 ? Math.ceil(value) : undefined;
}

function errorFor(res: Response, message: string, model: string): GemmaError {
  const status = res.status;
  if (status === 401 || status === 403) {
    return new GemmaError('ai/auth_failed', 502, 'The Gemini API refused the configured API key. Check GEMINI_API_KEY.');
  }
  if (status === 404) {
    return new GemmaError('ai/model_unavailable', 502, `The model ${model} is not available to this API key.`);
  }
  if (status === 429) {
    return new GemmaError(
      'ai/rate_limited',
      429,
      'The Gemini API rate limit has been reached. Wait a minute and try again.',
      retryAfter(res),
    );
  }
  if (status >= 500) {
    return new GemmaError('ai/unavailable', 503, 'The Gemini API is unavailable at the moment. Try again shortly.');
  }
  // Google's message describes our request, not the user's data, so a short
  // version is safe to pass on and helps whoever is setting this up.
  return new GemmaError('ai/bad_request', 502, `The Gemini API rejected the request: ${message.slice(0, 200)}`);
}

/**
 * Send one request to Gemma and return the text it wrote (its thoughts, if
 * any come back, are left out).
 */
export async function generateText(request: GemmaRequest, deps: GemmaDeps): Promise<string> {
  const { config } = deps;
  const doFetch = deps.fetch ?? fetch;
  if (!config.apiKey) throw notConfigured();
  const url = `${API_ROOT}/models/${encodeURIComponent(config.model)}:generateContent`;

  const attempt = async (jsonMode: boolean): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs);
    try {
      return await doFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.apiKey! },
        body: body(request, config, jsonMode),
        signal: controller.signal,
      });
    } catch (err) {
      if (controller.signal.aborted) {
        throw new GemmaError('ai/timeout', 504, 'Gemma took too long to answer. Try again.');
      }
      throw new GemmaError('ai/unavailable', 503, 'Could not reach the Gemini API. Check the connection and try again.');
    } finally {
      clearTimeout(timer);
    }
  };

  let res = await attempt(config.jsonMode);
  let parsed = (await res.json().catch(() => null)) as ApiBody | null;
  if (!res.ok && config.jsonMode && rejectsJsonMode(res.status, parsed?.error?.message ?? '')) {
    // Not every hosted model takes JSON mode. The prompt asks for JSON as
    // well, so ask again without it. Same model, same prompt.
    res = await attempt(false);
    parsed = (await res.json().catch(() => null)) as ApiBody | null;
  }
  if (!res.ok) throw errorFor(res, parsed?.error?.message ?? res.statusText, config.model);

  if (parsed?.promptFeedback?.blockReason) {
    throw new GemmaError('ai/blocked', 422, 'The Gemini API declined to process this request. Try rewording the description.');
  }
  const candidate = parsed?.candidates?.[0];
  const textOut = (candidate?.content?.parts ?? [])
    .filter((p) => !p.thought && typeof p.text === 'string')
    .map((p) => p.text)
    .join('')
    .trim();
  if (!textOut) {
    const reason = candidate?.finishReason;
    if (reason === 'SAFETY' || reason === 'PROHIBITED_CONTENT' || reason === 'BLOCKLIST') {
      throw new GemmaError('ai/blocked', 422, 'The Gemini API declined to answer this request.');
    }
    throw new GemmaError('ai/empty_response', 502, 'Gemma returned an empty answer. Try again.');
  }
  return textOut;
}

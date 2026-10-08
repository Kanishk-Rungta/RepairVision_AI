// =============================================================================
//  POST /api/chat: the site assistant
//  ---------------------------------------------------------------------------
//  Called by the chat character in the corner of the site (the Things widget,
//  apps/web/src/lib/components/ThingsChat.svelte), which sends
//    { "question": "...", "page": "/current/path" }
//  and shows `answer`. When `navigate` is set the site opens that page.
//
//  Open to everyone, like the public pages it answers from, and limited per
//  visitor per hour because every question costs quota on the cafe's Gemini
//  API key. See services/chat/assistant.ts for what the model is given.
// =============================================================================
import type { App, HubReply } from '../lib/router.js';
import { env } from '../env.js';
import { GemmaError, readGemmaConfig } from '../services/repairvision/gemma.js';
import { takeChatAllowance } from '../services/repairvision/rateLimit.js';
import { answerQuestion, type PublicApi } from '../services/chat/assistant.js';

const MAX_QUESTION = 500;
/** A chat answer should come back quickly; diagnosis allows much longer. */
const CHAT_TIMEOUT_MS = 45_000;

function fail(reply: HubReply, status: number, code: string, error: string): void {
  reply.code(status).send({ error, code });
}

/**
 * Read the hub's own public API from inside the Worker, without a network
 * round trip. Imported lazily because app.ts imports this file.
 */
const publicApi: PublicApi = async (path) => {
  const { handleApi } = await import('../app.js');
  const res = await handleApi(new Request(`https://hub.internal${path}`, { headers: { Accept: 'application/json' } }));
  if (!res.ok) return null;
  return res.json().catch(() => null);
};

export async function chatRoutes(app: App): Promise<void> {
  app.post('/api/chat', { bodyLimit: 8 * 1024 }, async (request, reply) => {
    const body = (request.body ?? {}) as { question?: unknown; page?: unknown };
    const question = typeof body.question === 'string' ? body.question.replace(/\s+/g, ' ').trim() : '';
    if (!question || question.length > MAX_QUESTION) {
      return fail(reply, 400, 'validation/failed', `Ask a question of up to ${MAX_QUESTION} characters.`);
    }
    const page = typeof body.page === 'string' && /^\/[\w\-/.%]*$/.test(body.page) ? body.page.slice(0, 200) : null;

    const base = readGemmaConfig();
    if (!base.apiKey) {
      return fail(reply, 503, 'ai/not_configured', 'The assistant is not set up yet: the GEMINI_API_KEY secret is missing.');
    }
    if (!(await takeChatAllowance(request.ip))) {
      return fail(reply, 429, 'ai/user_rate_limited', 'slow down');
    }
    // A chat answer needs no long reasoning, so keep thinking short and the
    // wait bounded. Same model and key as AI Diagnosis.
    const config = { ...base, thinkingLevel: 'minimal' as const, timeoutMs: Math.min(base.timeoutMs, CHAT_TIMEOUT_MS) };
    try {
      const result = await answerQuestion(question, page, { config, api: publicApi, timeZone: env.TZ });
      // `answered` and `sources` are the fields the Things widget reads.
      return { answer: result.answer, navigate: result.navigate, answered: true, sources: [] };
    } catch (err) {
      if (err instanceof GemmaError) {
        if (err.retryAfterSeconds) reply.header('Retry-After', String(err.retryAfterSeconds));
        return fail(reply, err.httpStatus, err.code, err.message);
      }
      throw err;
    }
  });
}

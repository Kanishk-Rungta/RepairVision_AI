// The site assistant (POST /api/chat). The Gemini API is never called: the
// tests hand the assistant a fake fetch and a fake public API, and check what
// it sent and what it made of the reply.
import { beforeAll, describe, expect, it } from 'vitest';
import { call, freshHub, setUpHub } from './helpers.js';
import { DEFAULT_GEMMA_MODEL, GemmaError, type GemmaConfig } from '../src/services/repairvision/gemma.js';
import {
  allowedPaths,
  answerQuestion,
  clockIn,
  loadSiteContext,
  parseReply,
  type PublicApi,
} from '../src/services/chat/assistant.js';

const CONFIG: GemmaConfig = {
  apiKey: 'test-key-not-real',
  model: DEFAULT_GEMMA_MODEL,
  thinkingLevel: 'minimal',
  jsonMode: true,
  timeoutMs: 5_000,
};

const EVENT_TODAY = {
  id: 'evt-today',
  name: 'October Repair Session',
  description: null,
  date: '2026-10-08',
  startTime: '10:00:00',
  endTime: '14:00:00',
  status: 'active',
  supportsLinux: false,
  venue: { name: 'Village Hall', address: '1 High Street', postcode: 'TN1 1AA' },
  photoCount: 0,
  coverUrl: null,
};
const EVENT_NEXT = { ...EVENT_TODAY, id: 'evt-next', date: '2026-11-07', status: 'scheduled' };
const EVENT_PAST = { ...EVENT_TODAY, id: 'evt-past', date: '2026-09-05', status: 'completed' };

/** What the hub's public API returns, keyed by path. */
const PUBLIC: Record<string, unknown> = {
  '/api/public/cafe': {
    name: 'Tinkerton Repair Café',
    tagline: 'Fix it together',
    contactEmail: 'hello@example.org',
    cartoApiKey: 'must-not-reach-the-model',
    linuxEnabled: false,
    homePage: { faqs: [{ q: 'Is it free?', a: 'Yes, repairs are free.' }] },
  },
  '/api/public/venue': { name: 'Village Hall', address: '1 High Street', postcode: 'TN1 1AA', notes: 'key under the mat' },
  '/api/public/events': [EVENT_TODAY, EVENT_NEXT],
  '/api/public/events?past=true': [EVENT_PAST, EVENT_TODAY, EVENT_NEXT],
  '/api/public/stats': { eventCount: 9, completedCount: 55, successRate: 80, co2SavedKg: 871, volunteerCount: 9 },
  '/api/public/skills': {
    categories: [{ id: 'c1', name: 'Electronics', icon: 'x', colour: '#fff', repairerCount: 2 }],
    repairers: [{ id: 'u1', displayName: 'Elsie', bio: null, skills: ['Electronics'], avatarUrl: null }],
  },
};

const fakeApi: PublicApi = async (path) => PUBLIC[path] ?? null;

interface Sent {
  url: string;
  body: {
    systemInstruction: { parts: Array<{ text: string }> };
    contents: Array<{ parts: Array<{ text: string }> }>;
  };
}

function fakeGemma(replyText: string, sent: Sent[] = []): typeof fetch {
  return (async (url: string, init: RequestInit) => {
    sent.push({ url: String(url), body: JSON.parse(String(init.body)) });
    return Response.json({ candidates: [{ content: { parts: [{ text: replyText }] } }] });
  }) as unknown as typeof fetch;
}

const NOW = new Date('2026-10-08T11:30:00Z');

describe('site data for the assistant', () => {
  it('keeps what the website shows and drops what it does not', async () => {
    const ctx = await loadSiteContext(fakeApi, '2026-10-08');
    expect(ctx.cafe?.name).toBe('Tinkerton Repair Café');
    expect(ctx.cafe).not.toHaveProperty('cartoApiKey');
    expect(ctx.homeVenue).toEqual({ name: 'Village Hall', address: '1 High Street', postcode: 'TN1 1AA' });
    expect(ctx.upcomingEvents.map((e) => e.id)).toEqual(['evt-today', 'evt-next']);
    expect(ctx.pastEvents.map((e) => e.id)).toEqual(['evt-past']);
    expect(ctx.skills.team).toEqual([{ id: 'u1', displayName: 'Elsie', skills: ['Electronics'] }]);
  });

  it('lets the model open only real pages of the site', async () => {
    const ctx = await loadSiteContext(fakeApi, '2026-10-08');
    const paths = allowedPaths(ctx);
    expect(paths.has('/events')).toBe(true);
    expect(paths.has('/events/evt-next')).toBe(true);
    expect(paths.has('/team/u1')).toBe(true);
    expect(paths.has('/linux')).toBe(false); // the cafe does not run Linux sessions
    expect(paths.has('/admin/dashboard')).toBe(false);
  });

  it('works out the date and time where the cafe is', () => {
    expect(clockIn('Asia/Kolkata', NOW)).toMatchObject({ date: '2026-10-08', time: '17:00', weekday: 'Thursday' });
    expect(clockIn('Not/AZone', NOW).timeZone).toBe('UTC');
  });
});

describe('reading the model reply', () => {
  const allowed = new Set(['/', '/events', '/events/evt-next']);

  it('reads the answer and the page to open', () => {
    expect(parseReply('{"answer":"Our next session is on Saturday 7 November.","navigate":"/events"}', allowed)).toEqual({
      answer: 'Our next session is on Saturday 7 November.',
      navigate: '/events',
    });
  });

  it('accepts JSON wrapped in a code fence', () => {
    expect(parseReply('```json\n{"answer":"Hi","navigate":null}\n```', allowed)).toEqual({ answer: 'Hi', navigate: null });
  });

  it('drops a page that is not on the list, and any outside link', () => {
    expect(parseReply('{"answer":"See here","navigate":"/admin/settings"}', allowed).navigate).toBeNull();
    expect(parseReply('{"answer":"See here","navigate":"https://evil.example"}', allowed).navigate).toBeNull();
    expect(parseReply('{"answer":"See here","navigate":"//evil.example"}', allowed).navigate).toBeNull();
  });

  it('shows a reply that is not JSON as it is, without a page', () => {
    expect(parseReply('We are open on Saturdays.', allowed)).toEqual({ answer: 'We are open on Saturdays.', navigate: null });
  });
});

describe('answering a question', () => {
  it('sends the question and the live site data to Gemma, and returns its answer', async () => {
    const sent: Sent[] = [];
    const result = await answerQuestion('What events are on right now?', '/', {
      config: CONFIG,
      api: fakeApi,
      timeZone: 'UTC',
      now: NOW,
      fetch: fakeGemma('{"answer":"The October Repair Session is on now at Village Hall.","navigate":"/events/evt-today"}', sent),
    });
    expect(result).toEqual({
      answer: 'The October Repair Session is on now at Village Hall.',
      navigate: '/events/evt-today',
    });
    expect(sent).toHaveLength(1);
    expect(sent[0]!.url).toContain(`/models/${DEFAULT_GEMMA_MODEL}:generateContent`);
    const system = sent[0]!.body.systemInstruction.parts[0]!.text;
    expect(system).toContain('October Repair Session');
    expect(system).toContain('Thursday 2026-10-08');
    expect(system).toContain('"status":"active"');
    expect(system).not.toContain('must-not-reach-the-model');
    expect(system).not.toContain('key under the mat');
    expect(sent[0]!.body.contents[0]!.parts[0]!.text).toContain('What events are on right now?');
  });

  it('passes on a Gemini failure instead of making up an answer', async () => {
    const failing = (async () => new Response('{}', { status: 429 })) as unknown as typeof fetch;
    await expect(
      answerQuestion('Is it free?', null, { config: CONFIG, api: fakeApi, timeZone: 'UTC', now: NOW, fetch: failing }),
    ).rejects.toBeInstanceOf(GemmaError);
  });
});

describe('POST /api/chat', () => {
  beforeAll(async () => {
    await freshHub();
    await setUpHub();
  });

  it('needs a question', async () => {
    const res = await call('/api/chat', { json: { question: '   ' } });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('validation/failed');
  });

  it('refuses an overly long question', async () => {
    const res = await call('/api/chat', { json: { question: 'x'.repeat(501) } });
    expect(res.status).toBe(400);
  });

  it('says plainly when no Gemini key is set', async () => {
    const res = await call('/api/chat', { json: { question: 'When is the next session?', page: '/' } });
    expect(res.status).toBe(503);
    expect(res.body.code).toBe('ai/not_configured');
  });
});

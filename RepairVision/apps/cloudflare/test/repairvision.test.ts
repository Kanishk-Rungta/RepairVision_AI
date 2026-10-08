// RepairVision AI Diagnosis. The Gemini API is never called: every test that
// reaches the model hands the engine a fake fetch and inspects what it sent.
import { beforeAll, describe, expect, it } from 'vitest';
import type { DiagnosisResult, FollowupRequest } from '@circularity/shared';
import { call, freshHub, setUpHub } from './helpers.js';
import { bytes, JPEG_WITH_GPS, TINY_JPEG } from './fixtures.js';
import { DEFAULT_GEMMA_MODEL, GemmaError, generateText, type GemmaConfig } from '../src/services/repairvision/gemma.js';
import { analyzeDevice, continueDiagnosis, parseDiagnosis } from '../src/services/repairvision/engine.js';
import { enforceSafety, screenForHazards } from '../src/services/repairvision/safety.js';
import { takeDiagnosisAllowance } from '../src/services/repairvision/rateLimit.js';
import { checkImage } from '../src/routes/repairvision.js';

const CONFIG: GemmaConfig = {
  apiKey: 'test-key-not-real',
  model: DEFAULT_GEMMA_MODEL,
  thinkingLevel: 'high',
  jsonMode: true,
  timeoutMs: 5_000,
};

const MOUSE = {
  deviceName: 'Wired USB mouse',
  manufacturer: null,
  model: null,
  problem: 'The mouse repeatedly disconnects whenever I move the USB cable.',
};

function modelReply(overrides: Partial<Record<keyof DiagnosisResult, unknown>> = {}): Record<string, unknown> {
  return {
    device: { name: 'Wired USB mouse', category: 'Computer peripheral', model: null },
    summary: 'Intermittent connection when the cable moves.',
    reportedSymptoms: ['Disconnects when the cable is moved'],
    visualObservations: ['Cable strain relief at the mouse end looks bent'],
    possibleCauses: [
      {
        title: 'Broken conductor in the USB cable',
        likelihood: 'high',
        reasoning: 'Movement-dependent faults usually point to a cable break.',
        supportingEvidence: ['Disconnects only when the cable moves'],
        missingEvidence: ['Not yet tried in another USB port'],
      },
      {
        title: 'Worn USB port on the computer',
        likelihood: 'medium',
        reasoning: 'A loose port also gives intermittent contact.',
        supportingEvidence: [],
        missingEvidence: ['Whether other devices work in the same port'],
      },
    ],
    safeChecks: [{ instruction: 'Try another USB port.', purpose: 'Separates a port fault from a cable fault.' }],
    nextQuestion: { question: 'Does the same issue occur in another USB port?', options: ['Yes', 'No', 'Not tested'] },
    safetyWarnings: [],
    evidenceUpdate: null,
    uncertainty: 'The fault has not been tested; a cable or a port are both possible.',
    status: 'needs_more_information',
    ...overrides,
  };
}

interface Sent {
  url: string;
  headers: Headers;
  body: any;
}

/** A fake fetch that answers like generateContent and records each request. */
function fakeApi(responses: Array<{ status?: number; json?: unknown; headers?: Record<string, string> }>) {
  const sent: Sent[] = [];
  let i = 0;
  const fakeFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    sent.push({ url: String(input), headers: new Headers(init?.headers), body: JSON.parse(String(init?.body)) });
    const r = responses[Math.min(i++, responses.length - 1)]!;
    return new Response(JSON.stringify(r.json ?? {}), {
      status: r.status ?? 200,
      headers: { 'content-type': 'application/json', ...(r.headers ?? {}) },
    });
  }) as typeof fetch;
  return { fetch: fakeFetch, sent };
}

const ok = (text: string) => ({ json: { candidates: [{ content: { parts: [{ text }] }, finishReason: 'STOP' }] } });
const okJson = (obj: unknown) => ok(JSON.stringify(obj));

let token = '';
beforeAll(async () => {
  await freshHub();
  token = (await setUpHub()).token;
});

describe('analyzing a device', () => {
  it('1. sends a text-only request to Gemma 4 and returns a validated diagnosis', async () => {
    const api = fakeApi([okJson(modelReply())]);
    const res = await analyzeDevice(MOUSE, null, { config: CONFIG, fetch: api.fetch });

    expect(api.sent).toHaveLength(1);
    const req = api.sent[0]!;
    expect(req.url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemma-4-26b-a4b-it:generateContent',
    );
    expect(req.url).not.toContain('test-key-not-real');
    expect(req.headers.get('x-goog-api-key')).toBe('test-key-not-real');
    expect(req.body.systemInstruction.parts[0].text).toContain('RepairVision');
    expect(req.body.generationConfig.responseMimeType).toBe('application/json');
    expect(req.body.generationConfig.thinkingConfig).toEqual({ thinkingLevel: 'high' });
    const parts = req.body.contents[0].parts;
    expect(parts).toHaveLength(1);
    expect(parts[0].text).toContain('The mouse repeatedly disconnects');
    expect(parts[0].text).toContain('No photo was provided');

    expect(res.meta).toMatchObject({ model: 'gemma-4-26b-a4b-it', round: 0, imageAnalyzed: false, hazards: [] });
    expect(res.diagnosis.possibleCauses[0]!.title).toBe('Broken conductor in the USB cable');
    // Without a photo, the model cannot have seen anything.
    expect(res.diagnosis.visualObservations).toEqual([]);
    expect(res.meta.notices.join(' ')).toMatch(/no photo/i);
  });

  it('2. sends the photo alongside the text', async () => {
    const api = fakeApi([okJson(modelReply())]);
    const image = checkImage(bytes(TINY_JPEG), 'image/jpeg');
    const res = await analyzeDevice(MOUSE, image, { config: CONFIG, fetch: api.fetch });

    const parts = api.sent[0]!.body.contents[0].parts;
    expect(parts).toHaveLength(2);
    expect(parts[0].inlineData.mimeType).toBe('image/jpeg');
    expect(parts[0].inlineData.data).toBe(TINY_JPEG);
    expect(parts[1].text).toContain('A photo of the device is attached');
    expect(res.meta.imageAnalyzed).toBe(true);
    expect(res.diagnosis.visualObservations).toEqual(['Cable strain relief at the mouse end looks bent']);
  });

  it('strips camera metadata from a photo before it leaves the hub', () => {
    const image = checkImage(bytes(JPEG_WITH_GPS), 'image/jpeg');
    expect(new TextDecoder().decode(image.bytes)).not.toContain('GPSSECRET');
  });

  it('asks again without JSON mode if the model refuses it, using the same model', async () => {
    const api = fakeApi([
      { status: 400, json: { error: { code: 400, message: 'JSON mode is not enabled for this model', status: 'INVALID_ARGUMENT' } } },
      okJson(modelReply()),
    ]);
    const res = await analyzeDevice(MOUSE, null, { config: CONFIG, fetch: api.fetch });
    expect(api.sent).toHaveLength(2);
    expect(api.sent[1]!.body.generationConfig.responseMimeType).toBeUndefined();
    expect(api.sent[1]!.url).toContain('gemma-4-26b-a4b-it');
    expect(res.diagnosis.summary).toBeTruthy();
  });
});

describe('reading the model reply', () => {
  it('3. accepts fenced JSON and normalises small slips', () => {
    const reply = modelReply({
      possibleCauses: [{ title: 'Loose connector', likelihood: 'High', supportingEvidence: null, missingEvidence: 'Not tested' }],
      safetyWarnings: null,
      status: 'Needs more information',
      nextQuestion: undefined,
    });
    const d = parseDiagnosis('Here is the result:\n```json\n' + JSON.stringify(reply) + '\n```');
    expect(d.possibleCauses[0]).toMatchObject({
      likelihood: 'high',
      supportingEvidence: [],
      missingEvidence: ['Not tested'],
      reasoning: null,
    });
    expect(d.safetyWarnings).toEqual([]);
    expect(d.status).toBe('needs_more_information');
    expect(d.nextQuestion).toBeNull();
  });

  it('keeps at most three causes', () => {
    const cause = (modelReply().possibleCauses as unknown[])[0];
    const d = parseDiagnosis(JSON.stringify(modelReply({ possibleCauses: [cause, cause, cause, cause, cause] })));
    expect(d.possibleCauses).toHaveLength(3);
  });

  it('4. turns a malformed reply into a recoverable error', async () => {
    const notJson = fakeApi([ok('I think it is probably the cable, good luck!')]);
    await expect(analyzeDevice(MOUSE, null, { config: CONFIG, fetch: notJson.fetch })).rejects.toMatchObject({
      code: 'ai/invalid_response',
      httpStatus: 502,
    });

    const incomplete = fakeApi([okJson({ summary: 'Something', status: 'certain' })]);
    await expect(analyzeDevice(MOUSE, null, { config: CONFIG, fetch: incomplete.fetch })).rejects.toMatchObject({
      code: 'ai/invalid_response',
    });

    const empty = fakeApi([{ json: { candidates: [{ content: { parts: [] }, finishReason: 'STOP' }] } }]);
    await expect(analyzeDevice(MOUSE, null, { config: CONFIG, fetch: empty.fetch })).rejects.toMatchObject({
      code: 'ai/empty_response',
    });
  });

  it('ignores thought parts and reads only the answer', async () => {
    const api = fakeApi([
      { json: { candidates: [{ content: { parts: [{ text: 'thinking...', thought: true }, { text: JSON.stringify(modelReply()) }] } }] } },
    ]);
    const res = await analyzeDevice(MOUSE, null, { config: CONFIG, fetch: api.fetch });
    expect(res.diagnosis.device.name).toBe('Wired USB mouse');
  });
});

describe('when the API cannot answer', () => {
  it('5. refuses clearly when no API key is set, without calling anything', async () => {
    const api = fakeApi([okJson(modelReply())]);
    await expect(
      generateText({ systemInstruction: 'x', parts: [{ text: 'y' }] }, { config: { ...CONFIG, apiKey: null }, fetch: api.fetch }),
    ).rejects.toMatchObject({ code: 'ai/not_configured', httpStatus: 503 });
    expect(api.sent).toHaveLength(0);

    const status = await call('/api/repairvision/status', { token });
    expect(status.status).toBe(200);
    expect(status.body).toMatchObject({ configured: false, model: 'gemma-4-26b-a4b-it', maxRounds: 5 });

    const form = new FormData();
    form.append('deviceName', 'Wired USB mouse');
    form.append('problem', MOUSE.problem);
    const res = await call('/api/repairvision/analyze', { token, body: form });
    expect(res.status).toBe(503);
    expect(res.body.code).toBe('ai/not_configured');
    expect(JSON.stringify(res.body)).not.toMatch(/stack|at .*\.ts/);
  });

  it('6a. times out instead of hanging', async () => {
    const hanging = (async (_url: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
      })) as typeof fetch;
    await expect(
      analyzeDevice(MOUSE, null, { config: { ...CONFIG, timeoutMs: 50 }, fetch: hanging }),
    ).rejects.toMatchObject({ code: 'ai/timeout', httpStatus: 504 });
  });

  it('6b. passes on the API rate limit with its retry time', async () => {
    const api = fakeApi([{ status: 429, json: { error: { code: 429, message: 'Resource exhausted' } }, headers: { 'retry-after': '30' } }]);
    const err = (await analyzeDevice(MOUSE, null, { config: CONFIG, fetch: api.fetch }).catch((e) => e)) as GemmaError;
    expect(err).toBeInstanceOf(GemmaError);
    expect(err.code).toBe('ai/rate_limited');
    expect(err.httpStatus).toBe(429);
    expect(err.retryAfterSeconds).toBe(30);
  });

  it('reports an unavailable model and a rejected key, and never swaps the model', async () => {
    const missing = fakeApi([{ status: 404, json: { error: { message: 'models/x is not found' } } }]);
    await expect(analyzeDevice(MOUSE, null, { config: CONFIG, fetch: missing.fetch })).rejects.toMatchObject({
      code: 'ai/model_unavailable',
    });
    expect(missing.sent).toHaveLength(1);

    const badKey = fakeApi([{ status: 403, json: { error: { message: 'API key not valid' } } }]);
    await expect(analyzeDevice(MOUSE, null, { config: CONFIG, fetch: badKey.fetch })).rejects.toMatchObject({
      code: 'ai/auth_failed',
    });
  });
});

describe('checking what is uploaded', () => {
  function form(file: File | null, fields: Record<string, string> = { deviceName: 'Wired USB mouse', problem: MOUSE.problem }) {
    const f = new FormData();
    for (const [k, v] of Object.entries(fields)) f.append(k, v);
    if (file) f.append('image', file);
    return f;
  }

  it('needs a signed-in volunteer', async () => {
    const res = await call('/api/repairvision/analyze', { body: form(null) });
    expect(res.status).toBe(401);
  });

  it('7. refuses an unsupported file type', async () => {
    const gif = new File([new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 1, 0, 1, 0])], 'a.gif', { type: 'image/gif' });
    const res = await call('/api/repairvision/analyze', { token, body: form(gif) });
    expect(res.status).toBe(415);
    expect(res.body.code).toBe('upload/unsupported_type');

    // A file that claims to be a JPEG but is not one.
    const fake = new File([new TextEncoder().encode('<svg onload=alert(1)>')], 'a.jpg', { type: 'image/jpeg' });
    const res2 = await call('/api/repairvision/analyze', { token, body: form(fake) });
    expect(res2.status).toBe(415);
  });

  it('8. refuses an oversized photo', async () => {
    const big = new Uint8Array(4 * 1024 * 1024 + 10);
    big.set(bytes(TINY_JPEG));
    const res = await call('/api/repairvision/analyze', { token, body: form(new File([big], 'big.jpg', { type: 'image/jpeg' })) });
    expect(res.status).toBe(413);
    expect(res.body.code).toBe('upload/too_large');
  });

  it('refuses a missing description', async () => {
    const res = await call('/api/repairvision/analyze', { token, body: form(null, { deviceName: 'Mouse', problem: '' }) });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('validation/failed');
  });

  it('refuses a follow-up beyond the question limit', async () => {
    const turn = { question: 'Q?', answer: 'A' };
    const res = await call('/api/repairvision/followup', {
      token,
      json: {
        context: MOUSE,
        previous: modelReply(),
        history: [turn, turn, turn, turn, turn],
        question: 'Another?',
        answer: 'Yes',
      },
    });
    expect(res.status).toBe(400);
  });
});

describe('guided troubleshooting', () => {
  const previous = parseDiagnosis(JSON.stringify(modelReply()));

  it('9. carries the whole case into the follow-up and re-evaluates', async () => {
    const updated = modelReply({
      possibleCauses: [
        {
          title: 'Broken conductor in the USB cable',
          likelihood: 'high',
          reasoning: 'The fault followed the mouse to a second port.',
          supportingEvidence: ['Same disconnects in another USB port'],
          missingEvidence: [],
        },
      ],
      evidenceUpdate: 'The fault happens in two ports, so a port fault is now unlikely.',
      nextQuestion: { question: 'Does flexing the cable near the mouse body cause the disconnect?', options: ['Yes', 'No'] },
      status: 'likely_cause_identified',
    });
    const api = fakeApi([okJson(updated)]);
    const request: FollowupRequest = {
      context: MOUSE,
      imageAnalyzed: true,
      previous,
      history: [{ question: 'Is the mouse light on?', answer: 'Yes, it flickers' }],
      question: 'Does the same issue occur in another USB port?',
      answer: 'Yes',
    };
    const res = await continueDiagnosis(request, { config: CONFIG, fetch: api.fetch });

    const prompt: string = api.sent[0]!.body.contents[0].parts[0].text;
    expect(prompt).toContain('The mouse repeatedly disconnects');
    expect(prompt).toContain('Worn USB port on the computer'); // the earlier hypotheses
    expect(prompt).toContain('Cable strain relief'); // the earlier visual observations
    expect(prompt).toContain('Is the mouse light on?');
    expect(prompt).toContain('<user_answer>Yes, it flickers</user_answer>');
    expect(prompt).toContain('Q2: Does the same issue occur in another USB port?');
    expect(prompt).toContain('round 2 of 5');
    expect(api.sent[0]!.body.contents[0].parts).toHaveLength(1);

    expect(res.meta.round).toBe(2);
    expect(res.diagnosis.evidenceUpdate).toMatch(/port fault is now unlikely/);
    expect(res.diagnosis.nextQuestion?.question).toMatch(/flexing the cable/);
  });

  it('drops a repeated question and ends at the round limit', async () => {
    const repeat = fakeApi([okJson(modelReply())]); // asks the port question again
    const res = await continueDiagnosis(
      { context: MOUSE, imageAnalyzed: false, previous, history: [], question: 'Does the same issue occur in another USB port?', answer: 'Not tested' },
      { config: CONFIG, fetch: repeat.fetch },
    );
    expect(res.diagnosis.nextQuestion).toBeNull();
    expect(res.meta.notices.join(' ')).toMatch(/repeated/);

    const last = fakeApi([okJson(modelReply({ nextQuestion: { question: 'Something new?', options: ['Yes', 'No'] } }))]);
    const turn = (n: number) => ({ question: `Question ${n}?`, answer: 'No' });
    const final = await continueDiagnosis(
      { context: MOUSE, imageAnalyzed: false, previous, history: [turn(1), turn(2), turn(3), turn(4)], question: 'Question 5?', answer: 'Yes' },
      { config: CONFIG, fetch: last.fetch },
    );
    expect(final.meta.round).toBe(5);
    expect(final.diagnosis.nextQuestion).toBeNull();
  });
});

describe('safety', () => {
  it('10. stops unsafe troubleshooting for a dangerous device, whatever the model says', async () => {
    const reckless = modelReply({
      device: { name: 'Microwave oven', category: 'Kitchen appliance', model: null },
      possibleCauses: [{ title: 'Failed magnetron', likelihood: 'medium', supportingEvidence: [], missingEvidence: [] }],
      safeChecks: [
        { instruction: 'Open the casing and inspect the magnetron.', purpose: 'Look for burn marks.' },
        { instruction: 'Bypass the door interlock switch to test it.', purpose: 'See if it heats.' },
        { instruction: 'Check that the plug and wall socket show no scorch marks from the outside.', purpose: 'Spot obvious damage.' },
      ],
      nextQuestion: { question: 'Does it hum?', options: ['Yes', 'No'] },
      status: 'needs_more_information',
    });
    const api = fakeApi([okJson(reckless)]);
    const res = await analyzeDevice(
      { deviceName: 'Microwave oven', manufacturer: null, model: null, problem: 'It sparks inside and there is a burning smell.' },
      null,
      { config: CONFIG, fetch: api.fetch },
    );

    expect(api.sent[0]!.body.contents[0].parts[0].text).toMatch(/safety screen found possible hazards/);
    expect(res.meta.hazards).toEqual(expect.arrayContaining(['microwave', 'fire_heat']));
    expect(res.diagnosis.status).toBe('refer_to_professional');
    expect(res.diagnosis.nextQuestion).toBeNull();
    expect(res.diagnosis.safetyWarnings.filter((w) => w.source === 'safety_screen' && w.severity === 'stop').length).toBeGreaterThanOrEqual(2);
    const checks = res.diagnosis.safeChecks.map((c) => c.instruction).join(' ');
    expect(checks).not.toMatch(/open the casing/i);
    expect(checks).not.toMatch(/bypass/i);
    expect(checks).toMatch(/from the outside/);
  });

  it('screens for the high-risk situations it should', () => {
    const ids = (s: string) => screenForHazards([s]).map((h) => h.id);
    expect(ids('My phone battery is swollen and the screen is lifting')).toContain('lithium_battery');
    expect(ids('Old CRT monitor shows no picture')).toContain('high_voltage');
    expect(ids('The power cable has exposed wires near the plug')).toContain('mains_voltage');
    expect(ids('The charger got too hot to touch')).toContain('fire_heat');
    expect(ids('The mouse disconnects when I move the cable')).toEqual([]);
    expect(ids('Smoke alarm keeps chirping')).toEqual([]);
  });

  it('removes protection-defeating steps even for a low-voltage device', () => {
    const d = parseDiagnosis(
      JSON.stringify(
        modelReply({
          safeChecks: [
            { instruction: 'Bypass the polyfuse on the USB hub with a wire.', purpose: 'Rule out the fuse protection.' },
            { instruction: 'Try another USB port.', purpose: 'Separate port and cable faults.' },
          ],
        }),
      ),
    );
    const out = enforceSafety(d, []);
    expect(out.diagnosis.safeChecks.map((c) => c.instruction)).toEqual(['Try another USB port.']);
    expect(out.diagnosis.nextQuestion).not.toBeNull();
  });
});

describe('the per-person limit', () => {
  it('allows the hourly allowance and then refuses', async () => {
    const user = `limit-test-${crypto.randomUUID()}`;
    for (let i = 0; i < 30; i++) expect(await takeDiagnosisAllowance(user)).toBe(true);
    expect(await takeDiagnosisAllowance(user)).toBe(false);
    expect(await takeDiagnosisAllowance(`${user}-other`)).toBe(true);
  });
});

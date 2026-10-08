// The repair vs. replace sums, and POST /api/advisor/estimate through the Worker.
import { beforeAll, describe, expect, it } from 'vitest';
import { advisorEstimateSchema } from '@circularity/shared';
import { compareRepairVsReplace } from '../src/services/advisor/calculate.js';
import { call, freshHub, setUpHub } from './helpers.js';

const parse = (body: unknown) => ({ ...advisorEstimateSchema.parse(body), currency: 'GBP' });

describe('repair vs. replace sums', () => {
  it('adds parts, labour and tools in pence without drifting', () => {
    const r = compareRepairVsReplace(
      parse({
        item: 'Kettle',
        replacementCost: 30,
        parts: [{ name: 'Element', unitPrice: 0.1, quantity: 3 }, { name: 'Switch', unitPrice: 0.2 }],
        labourCost: 0,
        toolsCost: 0,
        successChance: 1,
      }),
      null,
      0.5,
    );
    // 0.1 x 3 + 0.2 is 0.5 exactly, not 0.5000000000000001.
    expect(r.repair.parts).toBe(0.5);
    expect(r.repair.total).toBe(0.5);
  });

  it('says repair when the repair is at most half the price of a new one', () => {
    const r = compareRepairVsReplace(
      parse({ item: 'Toaster', replacementCost: 40, parts: [{ name: 'Spring', unitPrice: 8 }], successChance: 0.9 }),
      null,
      0.5,
    );
    expect(r.verdict).toBe('repair');
    expect(r.repair.saving).toBe(32);
    expect(r.headline).toContain('save about £32.00');
  });

  it('says replace when the repair costs nearly as much as a new one', () => {
    const r = compareRepairVsReplace(
      parse({ item: 'Fan', replacementCost: 25, parts: [{ name: 'Motor', unitPrice: 24 }], successChance: 1 }),
      null,
      0.5,
    );
    expect(r.verdict).toBe('replace');
  });

  it('judges against the cafe\'s own points when it has set them', () => {
    const input = parse({ item: 'Lamp', replacementCost: 100, parts: [{ name: 'Part', unitPrice: 60 }], successChance: 1 });
    expect(compareRepairVsReplace(input, null, 0.5).verdict).toBe('close');
    expect(compareRepairVsReplace(input, null, 0.5, { repairShare: 0.7, replaceShare: 0.95 }).verdict).toBe('repair');
    expect(compareRepairVsReplace(input, null, 0.5, { repairShare: 0.3, replaceShare: 0.5 }).verdict).toBe('replace');
  });

  it('says close in the middle, and leans on waste avoided', () => {
    const r = compareRepairVsReplace(
      parse({ item: 'Blender', replacementCost: 50, parts: [{ name: 'Blade', unitPrice: 30 }], successChance: 1 }),
      { label: 'Blender', co2eKg: 20, weightKg: 1.5 },
      0.5,
    );
    expect(r.verdict).toBe('close');
    expect(r.waste.co2eAvoidedKg).toBe(10);
    expect(r.waste.wasteAvoidedKg).toBe(1.5);
  });

  it('allows for a repair that fails and has to be replaced anyway', () => {
    const risky = compareRepairVsReplace(
      parse({ item: 'Lamp', replacementCost: 20, parts: [{ name: 'Part', unitPrice: 9 }], successChance: 0.1 }),
      null,
      0.5,
    );
    // 9 + 0.9 x 20 = 27, dearer than the 20 it would cost to just replace.
    expect(risky.options[0]!.expectedCost).toBe(27);
    expect(risky.verdict).toBe('replace');
  });

  it('shows a shop quote as its own option and leaves labour alone', () => {
    const r = compareRepairVsReplace(
      parse({ item: 'Phone', replacementCost: 200, parts: [{ name: 'Screen', unitPrice: 40 }], professionalQuote: 90 }),
      null,
      0.5,
    );
    expect(r.options.map((o) => o.id)).toEqual(['repair', 'professional', 'replace']);
    expect(r.options[1]!.cost).toBe(90);
  });

  it('gives no waste figure rather than zero when the item type is unknown', () => {
    const r = compareRepairVsReplace(parse({ item: 'Thing', replacementCost: 10 }), null, 0.5);
    expect(r.waste.co2eAvoidedKg).toBeNull();
    expect(r.waste.workings).toBeNull();
  });

  it('works out cost per year only when age and lifespan are both given', () => {
    const none = compareRepairVsReplace(parse({ item: 'X', replacementCost: 100 }), null, 0.5);
    expect(none.perYear).toBeNull();
    const some = compareRepairVsReplace(
      parse({ item: 'X', replacementCost: 100, parts: [{ name: 'p', unitPrice: 20 }], deviceAgeYears: 3, expectedLifeYears: 5 }),
      null,
      0.5,
    );
    expect(some.perYear).toEqual({ repair: 10, replace: 20 });
  });

  it('warns about defaults and unchecked prices', () => {
    const r = compareRepairVsReplace(parse({ item: 'X', replacementCost: 10, parts: [{ name: 'p', unitPrice: 1 }] }), null, 0.5);
    expect(r.caveats.join(' ')).toContain('default of 80%');
    expect(r.caveats.join(' ')).toContain('without a link');
  });
});

describe('advisor API', () => {
  const state: { token?: string; jobId?: string } = {};
  const today = new Date().toISOString().slice(0, 10);
  beforeAll(freshHub);

  it('is open to people who are not signed in', async () => {
    const res = await call('/api/advisor/estimate', { json: { item: 'x', replacementCost: 10 } });
    expect(res.status).toBe(200);
    const config = await call('/api/advisor/config');
    expect(config.status).toBe(200);
    expect(config.body).toEqual({ currency: 'GBP', repairShare: 0.5, replaceShare: 0.9 });
  });

  it('refuses a malformed or negative request', async () => {
    state.token = (await setUpHub()).token;
    const empty = await call('/api/advisor/estimate', { json: {} });
    expect(empty.status).toBe(400);
    const negative = await call('/api/advisor/estimate', { json: { item: 'x', replacementCost: -5 } });
    expect(negative.status).toBe(400);
  });

  it('rejects an item type that does not exist', async () => {
    const res = await call('/api/advisor/estimate', {
      json: { item: 'x', replacementCost: 10, factorId: 'no-such-item' },
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('advisor/unknown_item');
  });

  it('answers a normal request in the cafe currency', async () => {
    const res = await call('/api/advisor/estimate', {
      json: { item: 'Desk fan', replacementCost: 35, parts: [{ name: 'Capacitor', unitPrice: 3.5, url: 'https://example.com/part' }] },
    });
    expect(res.status).toBe(200);
    expect(res.body.verdict).toBe('repair');
    expect(res.body.options).toHaveLength(2);
    expect(res.body.currency).toBe('GBP');
    expect(res.body.thresholds).toEqual({ repairShare: 0.5, replaceShare: 0.9 });
  });

  it('limits the part finder for people who are not signed in', async () => {
    const short = await call('/api/advisor/parts?q=a');
    expect(short.status).toBe(400);
  });

  // ── Cafe settings ─────────────────────────────────────────────────────────
  it('lets only an admin change the currency and the thresholds', async () => {
    const anon = await call('/api/admin/settings/advisor', { method: 'PATCH', json: { currency: 'EUR', repairShare: 0.6, replaceShare: 0.95 } });
    expect(anon.status).toBe(401);
    const bad = await call('/api/admin/settings/advisor', { method: 'PATCH', token: state.token, json: { currency: 'EURO', repairShare: 0.6, replaceShare: 0.95 } });
    expect(bad.status).toBe(400);
    const backwards = await call('/api/admin/settings/advisor', { method: 'PATCH', token: state.token, json: { currency: 'EUR', repairShare: 0.8, replaceShare: 0.7 } });
    expect(backwards.status).toBe(400);
    const ok = await call('/api/admin/settings/advisor', { method: 'PATCH', token: state.token, json: { currency: 'eur', repairShare: 0.6, replaceShare: 0.95 } });
    expect(ok.status).toBe(200);
    expect(ok.body).toEqual({ currency: 'EUR', repairShare: 0.6, replaceShare: 0.95 });
  });

  it('uses those settings in the answer', async () => {
    // 21 of 35 is 60%: "close" at the defaults, but a repair at a 0.6 repair point.
    const res = await call('/api/advisor/estimate', {
      json: { item: 'Desk fan', replacementCost: 35, successChance: 1, parts: [{ name: 'Motor', unitPrice: 21 }] },
    });
    expect(res.body.currency).toBe('EUR');
    expect(res.body.verdict).toBe('repair');
    expect(res.body.headline).toContain('€');
    expect(res.body.thresholds).toEqual({ repairShare: 0.6, replaceShare: 0.95 });
  });

  // ── Saving an estimate against a repair job ───────────────────────────────
  it('keeps an estimate on a repair job, worked out by the server', async () => {
    const venues = await call('/api/admin/venues', { token: state.token });
    const ev = await call('/api/admin/events', {
      token: state.token,
      json: { name: 'Advisor Café', venueId: venues.body[0].id, date: today, startTime: '10:00', endTime: '13:00', isPublished: true },
    });
    await call(`/api/admin/events/${ev.body.id}/activate`, { method: 'POST', token: state.token });
    const job = await call(`/api/checkin/${ev.body.checkInToken}/jobs`, {
      json: { customerName: 'Sam Visitor', customerContact: '07700 900000', gdprConsent: true, itemDescription: 'Kettle', faultDescription: 'Does not heat' },
    });
    expect(job.status).toBe(200);
    state.jobId = job.body.id;

    const body = { item: 'Kettle', replacementCost: 30, parts: [{ name: 'Element', unitPrice: 6 }], successChance: 0.9 };
    expect((await call(`/api/advisor/jobs/${state.jobId}`)).status).toBe(401);
    expect((await call(`/api/advisor/jobs/${state.jobId}`, { token: state.token })).body.saved).toBeNull();

    const put = await call(`/api/advisor/jobs/${state.jobId}`, { method: 'PUT', token: state.token, json: { ...body, result: { verdict: 'replace' } } });
    expect(put.status).toBe(200);
    // A result sent by the browser is ignored: the server's own sums stand.
    expect(put.body.saved.result.verdict).toBe('repair');
    expect(put.body.saved.savedBy.name).toBe('Ada Admin');

    const got = await call(`/api/advisor/jobs/${state.jobId}`, { token: state.token });
    expect(got.body.saved.request.item).toBe('Kettle');
    // It also rides along with the repair itself.
    const detail = await call(`/api/repairer/jobs/${state.jobId}`, { token: state.token });
    expect(detail.body.job.advisorEstimate.result.verdict).toBe('repair');
  });

  it('does not keep an estimate for a job that does not exist, and can remove one', async () => {
    const missing = await call('/api/advisor/jobs/not-a-job', { method: 'PUT', token: state.token, json: { item: 'x', replacementCost: 10 } });
    expect(missing.status).toBe(404);
    const gone = await call(`/api/advisor/jobs/${state.jobId}`, { method: 'DELETE', token: state.token });
    expect(gone.body.saved).toBeNull();
    expect((await call(`/api/advisor/jobs/${state.jobId}`, { token: state.token })).body.saved).toBeNull();
  });

  it('needs sign-in and a search of sensible length for the parts finder when signed in', async () => {
    const short = await call('/api/advisor/parts?q=a', { token: state.token });
    expect(short.status).toBe(400);
  });
});

// ── Parts finder ────────────────────────────────────────────────────────────
import { afterEach, vi } from 'vitest';
import { env as workerEnv } from 'cloudflare:workers';
import { findParts } from '../src/services/advisor/parts.js';

const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });

describe('parts finder', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete (workerEnv as Record<string, unknown>).PARTS_PRICE_API_URL;
  });

  it('gives a part name, part number and store link from iFixit, with no price', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/search/')) {
        return json({
          results: [
            { dataType: 'wiki', namespace: 'ITEM', title: 'Kettle Element Test One', url: 'https://www.ifixit.com/Item/Kettle_Element_Test_One' },
            { dataType: 'guide', title: 'A guide, not a part', url: 'https://www.ifixit.com/Guide/x' },
          ],
        });
      }
      return json({ suppliers: [{ 'part_#': 'IF123-456', supplier: 'iFixit', url: 'https://www.ifixit.com/Store/x/IF123-456' }] });
    });
    const answer = await findParts('kettle element test one');
    expect(answer.parts).toHaveLength(1);
    expect(answer.parts[0]).toMatchObject({
      name: 'Kettle Element Test One',
      partNumber: 'IF123-456',
      url: 'https://www.ifixit.com/Store/x/IF123-456',
      price: null,
      source: 'link',
    });
    expect(answer.priceProvider).toBe(false);
  });

  it('still answers when iFixit is down', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    const answer = await findParts('no such part anywhere');
    expect(answer.parts).toEqual([]);
  });

  it('uses a configured price provider, and only prices in the currency asked for', async () => {
    (workerEnv as Record<string, unknown>).PARTS_PRICE_API_URL = 'https://prices.example/search';
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.startsWith('https://prices.example/')) {
        return json({
          results: [
            { name: 'Element 2kW', price: 12.5, currency: 'GBP', url: 'https://shop.example/element' },
            { name: 'Element 2kW (US)', price: 15, currency: 'USD', url: 'https://shop.example/us' },
          ],
        });
      }
      return json({ results: [] });
    });
    const answer = await findParts('priced element part', 'GBP');
    expect(answer.priceProvider).toBe(true);
    expect(answer.parts).toHaveLength(1);
    expect(answer.parts[0]).toMatchObject({ price: 12.5, currency: 'GBP', source: 'lookup', supplier: 'shop.example' });
  });

  it('ignores a provider that is not https', async () => {
    (workerEnv as Record<string, unknown>).PARTS_PRICE_API_URL = 'http://prices.example/search';
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => json({ results: [] }));
    expect((await findParts('insecure provider part')).priceProvider).toBe(false);
  });
});


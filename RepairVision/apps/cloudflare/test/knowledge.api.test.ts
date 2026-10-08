// POST /api/knowledge/retrieve through the real Worker: who may call it, what it
// refuses, and that a completed repair turns up as evidence without the
// visitor's personal details.
import { beforeAll, describe, expect, it } from 'vitest';
import { call, freshHub, setUpHub } from './helpers.js';

const today = new Date().toISOString().slice(0, 10);
const state: { admin?: string } = {};

beforeAll(freshHub);

describe('knowledge retrieval API', () => {
  it('needs a signed-in user', async () => {
    const res = await call('/api/knowledge/retrieve', { json: { hypotheses: [{ label: 'cable' }], symptom: '' } });
    expect(res.status).toBe(401);
  });

  it('refuses a malformed request', async () => {
    state.admin = (await setUpHub()).token;
    const none = await call('/api/knowledge/retrieve', { token: state.admin, json: { hypotheses: [], symptom: '' } });
    expect(none.status).toBe(400);
    const badType = await call('/api/knowledge/retrieve', {
      token: state.admin,
      json: { hypotheses: [{ label: 'x', deviceType: 'spaceship' }] },
    });
    expect(badType.status).toBe(400);
  });

  it('returns knowledge-base evidence for a mouse cable fault', async () => {
    const res = await call('/api/knowledge/retrieve', {
      token: state.admin,
      json: {
        hypotheses: [{ label: 'Damaged cable near the mouse body', deviceType: 'mouse' }],
        symptom: 'pointer cuts out when I move the cable',
      },
    });
    expect(res.status).toBe(200);
    const [item] = res.body.evidence;
    expect(item.knowledge[0].id).toBe('mouse-cable-fray');
    expect(item.knowledge[0].checks.length).toBeGreaterThan(0);
    expect(item.guideLinks).toEqual([]);
  });

  it('finds a completed repair, without the visitor name or contact', async () => {
    const venues = await call('/api/admin/venues', { token: state.admin });
    const ev = await call('/api/admin/events', {
      token: state.admin,
      json: { name: 'Test Café', venueId: venues.body[0].id, date: today, startTime: '10:00', endTime: '13:00', isPublished: true },
    });
    await call(`/api/admin/events/${ev.body.id}/activate`, { method: 'POST', token: state.admin });
    const job = await call(`/api/checkin/${ev.body.checkInToken}/jobs`, {
      json: {
        customerName: 'Sam Visitor',
        customerContact: '07700 900000',
        gdprConsent: true,
        itemDescription: 'Wired optical mouse',
        faultDescription: 'Pointer jumps and sticks on the desk',
      },
    });
    expect(job.status).toBe(200);
    await call(`/api/repairer/jobs/${job.body.id}/accept`, { method: 'PATCH', token: state.admin });
    const done = await call(`/api/repairer/jobs/${job.body.id}/complete`, {
      method: 'PATCH',
      token: state.admin,
      json: { outcome: 'completed', outcomeNotes: 'Hair wrapped round the sensor window, cleaned it out', partsUsed: 'None' },
    });
    expect(done.status).toBe(200);

    const res = await call('/api/knowledge/retrieve', {
      token: state.admin,
      json: { hypotheses: [{ label: 'Dirty optical sensor on the mouse' }], symptom: 'pointer jumps' },
    });
    const [item] = res.body.evidence;
    expect(item.cases.length).toBe(1);
    expect(item.cases[0].outcome).toContain('sensor window');
    const text = JSON.stringify(res.body);
    expect(text).not.toContain('Sam Visitor');
    expect(text).not.toContain('07700');
  });
});

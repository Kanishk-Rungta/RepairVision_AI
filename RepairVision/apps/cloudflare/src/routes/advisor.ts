import { eq } from 'drizzle-orm';
import type { App } from '../lib/router.js';
import { advisorEstimateSchema, type SavedAdvisorEstimate } from '@circularity/shared';
import { db } from '../db/index.js';
import { repairJobs, users } from '../db/schema.js';
import { readAuth } from '../lib/auth.js';
import { audit } from '../utils/audit.js';
import { findParts } from '../services/advisor/parts.js';
import { takeAdvisorAllowance } from '../services/advisor/rateLimit.js';
import { AdvisorInputError, runEstimate } from '../services/advisor/run.js';
import { advisorSettings } from '../services/advisor/settings.js';

// Repair vs. Replace Advisor.
//
// Open to everyone, signed in or not: it only does sums on the figures sent,
// plus the hub's CO2e reference data for the item type. The limits that keep
// that fair are in services/advisor/rateLimit.ts.
export async function advisorPublicRoutes(app: App): Promise<void> {
  // The cafe's currency and the points the verdict is judged against, so the
  // page can say them out loud before anyone presses Compare.
  app.get('/api/advisor/config', async () => advisorSettings());

  app.post('/api/advisor/estimate', async (request, reply) => {
    const auth = await readAuth(request);
    if (!(await takeAdvisorAllowance('estimate', { userId: auth?.sub, ip: request.ip }))) {
      reply.code(429).send({ error: 'That is a lot of comparisons. Try again in a little while.', code: 'advisor/rate_limited' });
      return;
    }
    const parsed = advisorEstimateSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Invalid request', code: 'advisor/invalid' });
      return;
    }
    try {
      return await runEstimate(parsed.data);
    } catch (err) {
      if (err instanceof AdvisorInputError) {
        reply.code(400).send({ error: err.message, code: err.code });
        return;
      }
      throw err;
    }
  });

  // Part names and links (iFixit) and, if the cafe has set one up, prices.
  app.get('/api/advisor/parts', async (request, reply) => {
    const auth = await readAuth(request);
    if (!(await takeAdvisorAllowance('parts', { userId: auth?.sub, ip: request.ip }))) {
      reply.code(429).send({ error: 'Too many part searches for now. Try again in a little while.', code: 'advisor/rate_limited' });
      return;
    }
    const { q, currency } = request.query as { q?: string; currency?: string };
    const query = (q ?? '').trim();
    if (query.length < 2 || query.length > 80) {
      reply.code(400).send({ error: 'Say what part you are looking for', code: 'advisor/invalid' });
      return;
    }
    const cur = /^[A-Za-z]{3}$/.test(currency ?? '') ? currency! : (await advisorSettings()).currency;
    return findParts(query, cur);
  });
}

// Keeping an estimate against a repair job. Staff only: it is part of the
// repair's record. The answer is always worked out here again from the figures
// sent, so a saved result is one the server stands behind.
export async function advisorJobRoutes(app: App): Promise<void> {
  app.addHook('preHandler', app.requireRole('super_admin', 'admin', 'repairer'));

  async function jobExists(id: string): Promise<boolean> {
    const [row] = await db.select({ id: repairJobs.id }).from(repairJobs).where(eq(repairJobs.id, id)).limit(1);
    return Boolean(row);
  }

  app.get('/api/advisor/jobs/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const [row] = await db.select({ saved: repairJobs.advisorEstimate }).from(repairJobs).where(eq(repairJobs.id, id)).limit(1);
    if (!row) {
      reply.code(404).send({ error: 'Job not found', code: 'job/not_found' });
      return;
    }
    return { saved: row.saved ?? null };
  });

  app.put('/api/advisor/jobs/:id', async (request, reply) => {
    const me = request.auth!;
    const { id } = request.params as { id: string };
    if (!(await jobExists(id))) {
      reply.code(404).send({ error: 'Job not found', code: 'job/not_found' });
      return;
    }
    const parsed = advisorEstimateSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Invalid request', code: 'advisor/invalid' });
      return;
    }
    let result;
    try {
      result = await runEstimate(parsed.data);
    } catch (err) {
      if (err instanceof AdvisorInputError) {
        reply.code(400).send({ error: err.message, code: err.code });
        return;
      }
      throw err;
    }
    const [who] = await db.select({ name: users.displayName }).from(users).where(eq(users.id, me.sub)).limit(1);
    const saved: SavedAdvisorEstimate = {
      savedAt: new Date().toISOString(),
      savedBy: { id: me.sub, name: who?.name ?? 'A volunteer' },
      request: parsed.data,
      result,
    };
    await db.update(repairJobs).set({ advisorEstimate: saved, updatedAt: new Date() }).where(eq(repairJobs.id, id));
    await audit({
      request,
      actorId: me.sub,
      actorType: me.role,
      action: 'repair.advisor_saved',
      entityType: 'repair_job',
      entityId: id,
      metadata: { verdict: result.verdict },
    });
    return { saved };
  });

  app.delete('/api/advisor/jobs/:id', async (request, reply) => {
    const me = request.auth!;
    const { id } = request.params as { id: string };
    if (!(await jobExists(id))) {
      reply.code(404).send({ error: 'Job not found', code: 'job/not_found' });
      return;
    }
    await db.update(repairJobs).set({ advisorEstimate: null, updatedAt: new Date() }).where(eq(repairJobs.id, id));
    await audit({ request, actorId: me.sub, actorType: me.role, action: 'repair.advisor_removed', entityType: 'repair_job', entityId: id });
    return { saved: null };
  });
}

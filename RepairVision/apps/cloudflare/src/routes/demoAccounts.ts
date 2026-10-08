// =============================================================================
//  One-click demo accounts
//  ---------------------------------------------------------------------------
//    GET  /api/auth/demo-accounts   which demo accounts can be used right now
//    POST /api/auth/demo-login      { account: 'admin' | 'repairer' | 'owner' }
//
//  For trying the hub out: the sign-in and sign-up pages show a button per
//  demo account, and pressing one signs straight in. The accounts themselves
//  are made by demo/seed.py, with the fixed example.com addresses below.
//
//  Off unless the hub says otherwise: DEMO_MODE=true (the public demo) or
//  DEMO_ACCOUNTS=true (a local or hackathon copy). With both off these routes
//  report nothing and refuse to sign anyone in, so a real cafe is never one
//  click away from an admin session. Only these fixed addresses can be signed
//  into, and example.com is reserved, so it can never be a real person.
// =============================================================================
import { eq, inArray } from 'drizzle-orm';
import type { App } from '../lib/router.js';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { bindings, env } from '../env.js';
import { audit } from '../utils/audit.js';

/** The same addresses as demo/seed.py. */
export const DEMO_ACCOUNTS = [
  {
    id: 'admin',
    label: 'Demo admin',
    email: 'demo@example.com',
    description: 'Runs the café: events, volunteers, repairs and reports.',
  },
  {
    id: 'repairer',
    label: 'Demo repairer',
    email: 'repairer@example.com',
    description: 'A volunteer: the repair queue, check-in and AI Diagnosis.',
  },
  {
    id: 'owner',
    label: 'Demo device owner',
    email: 'owner@example.com',
    description: 'A member of the public diagnosing their own device.',
  },
] as const;

export type DemoAccountId = (typeof DEMO_ACCOUNTS)[number]['id'];

export function demoAccountsEnabled(): boolean {
  return env.DEMO_MODE || (bindings().DEMO_ACCOUNTS ?? '').trim().toLowerCase() === 'true';
}

const REFRESH_COOKIE = 'circ_refresh';

export async function demoAccountRoutes(app: App): Promise<void> {
  app.get('/api/auth/demo-accounts', async () => {
    if (!demoAccountsEnabled()) return { enabled: false, accounts: [] };
    // Only offer the ones that exist, so a button never leads to an error.
    const rows = await db
      .select({ email: users.email, role: users.role, isActive: users.isActive })
      .from(users)
      .where(inArray(users.email, DEMO_ACCOUNTS.map((a) => a.email)));
    const active = new Map(rows.filter((r) => r.isActive).map((r) => [r.email, r.role]));
    return {
      enabled: true,
      accounts: DEMO_ACCOUNTS.filter((a) => active.has(a.email)).map((a) => ({
        id: a.id,
        label: a.label,
        email: a.email,
        description: a.description,
        role: active.get(a.email),
      })),
    };
  });

  app.post('/api/auth/demo-login', async (request, reply) => {
    if (!demoAccountsEnabled()) {
      return reply.code(404).send({ error: 'Demo accounts are not enabled on this hub.', code: 'demo/disabled' });
    }
    const wanted = (request.body as { account?: unknown } | undefined)?.account;
    const account = DEMO_ACCOUNTS.find((a) => a.id === wanted);
    if (!account) {
      return reply.code(400).send({ error: 'Unknown demo account.', code: 'validation/failed' });
    }
    const [user] = await db.select().from(users).where(eq(users.email, account.email)).limit(1);
    if (!user || !user.isActive) {
      return reply
        .code(404)
        .send({ error: 'That demo account does not exist yet. Run demo/seed.py first.', code: 'demo/not_seeded' });
    }
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
    const tokens = await app.issueTokens({
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
    });
    reply.setCookie(REFRESH_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * env.REFRESH_TOKEN_DAYS,
    });
    await audit({
      request,
      actorId: user.id,
      actorType: user.role,
      action: 'auth.demo_login',
      entityType: 'user',
      entityId: user.id,
    });
    return {
      accessToken: tokens.accessToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    };
  });
}

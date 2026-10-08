// One-click demo accounts: off by default, and when on, only the fixed
// example.com accounts that actually exist.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { env } from 'cloudflare:workers';
import { call, freshHub, refreshCookie, setUpHub } from './helpers.js';

const bindings = env as unknown as Record<string, string | undefined>;

function setFlag(value: string | undefined): void {
  if (value === undefined) delete bindings.DEMO_ACCOUNTS;
  else bindings.DEMO_ACCOUNTS = value;
}

beforeAll(async () => {
  await freshHub();
  await setUpHub();
  // The device owner, made the way demo/seed.py makes it.
  const owner = await call('/api/auth/register', {
    json: { displayName: 'Demo Device Owner', email: 'owner@example.com', password: 'DemoDemo123' },
  });
  expect(owner.status).toBe(201);
});

afterAll(() => setFlag(undefined));

describe('demo accounts', () => {
  it('are switched off unless the hub turns them on', async () => {
    setFlag(undefined);
    const list = await call('/api/auth/demo-accounts');
    expect(list.body).toEqual({ enabled: false, accounts: [] });
    const login = await call('/api/auth/demo-login', { json: { account: 'owner' } });
    expect(login.status).toBe(404);
    expect(login.body.accessToken).toBeUndefined();
  });

  it('list only the demo accounts that exist, without passwords', async () => {
    setFlag('true');
    const list = await call('/api/auth/demo-accounts');
    expect(list.body.enabled).toBe(true);
    expect(list.body.accounts.map((a: { id: string }) => a.id)).toEqual(['owner']);
    expect(JSON.stringify(list.body)).not.toMatch(/password|DemoDemo/i);
  });

  it('sign straight in to an existing demo account', async () => {
    setFlag('true');
    const login = await call('/api/auth/demo-login', { json: { account: 'owner' } });
    expect(login.status).toBe(200);
    expect(login.body.user).toMatchObject({ email: 'owner@example.com', role: 'user' });
    expect(login.body.accessToken).toBeTruthy();
    expect(refreshCookie(login)).toContain('circ_refresh=');
  });

  it('refuse unknown and not-yet-seeded accounts', async () => {
    setFlag('true');
    expect((await call('/api/auth/demo-login', { json: { account: 'super_admin' } })).status).toBe(400);
    expect((await call('/api/auth/demo-login', { json: { account: 'repairer' } })).status).toBe(404);
    // The real admin made by setup is never reachable through this route.
    expect((await call('/api/auth/demo-login', { json: { email: 'ada@example.org' } })).status).toBe(400);
  });
});

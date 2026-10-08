import { beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '../src/db/index.js';
import { users } from '../src/db/schema.js';
import { call, freshHub, refreshCookie, setUpHub } from './helpers.js';

const ACCOUNT = { displayName: 'Device Owner', email: 'owner@example.org', password: 'MyDevicePass42' };
beforeAll(async () => { await freshHub(); });

describe('public registration and diagnosis access', () => {
  it('requires the application owner to finish setup', async () => {
    expect((await call('/api/auth/register', { json: ACCOUNT })).status).toBe(503);
    await setUpHub();
  });

  it('rejects invalid details and attempts to choose a staff role', async () => {
    expect((await call('/api/auth/register', { json: { ...ACCOUNT, password: 'short' } })).status).toBe(400);
    expect((await call('/api/auth/register', { json: { ...ACCOUNT, role: 'super_admin' } })).status).toBe(400);
    expect((await call('/api/auth/register', { json: { ...ACCOUNT, displayName: ' ' } })).status).toBe(400);
  });

  it('creates a private device-owner account and a persistent session', async () => {
    const registered = await call('/api/auth/register', { json: { ...ACCOUNT, email: ' OWNER@EXAMPLE.ORG ' } });
    expect(registered.status).toBe(201);
    expect(registered.body.user.role).toBe('user');
    expect(registered.body.user.email).toBe(ACCOUNT.email);
    expect(registered.body.user.passwordHash).toBeUndefined();
    expect(registered.headers.get('set-cookie')).toContain('HttpOnly');
    const [saved] = await db.select().from(users).where(eq(users.id, registered.body.user.id));
    expect(saved!.passwordHash).not.toBe(ACCOUNT.password);
    expect(saved!.showOnPublicPage).toBe(false);
    expect(saved!.showOnHomePage).toBe(false);
    expect((await call('/api/repairvision/status', { token: registered.body.accessToken })).status).toBe(200);
    expect((await call('/api/repairer/me', { token: registered.body.accessToken })).status).toBe(403);
    expect((await call('/api/admin/users', { token: registered.body.accessToken })).status).toBe(403);
    const refreshed = await call('/api/auth/refresh', { method: 'POST', cookie: refreshCookie(registered) });
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.user.role).toBe('user');
    const team = await call('/api/public/skills');
    expect(team.status).toBe(200);
    expect(JSON.stringify(team.body)).not.toContain(registered.body.user.id);
  });

  it('handles duplicate emails and signs in existing device owners', async () => {
    expect((await call('/api/auth/register', { json: ACCOUNT })).status).toBe(409);
    const login = await call('/api/auth/login', { json: { email: ACCOUNT.email, password: ACCOUNT.password } });
    expect(login.status).toBe(200);
    expect(login.body.user.role).toBe('user');
    const cookie = refreshCookie(login);
    expect((await call('/api/auth/logout', { method: 'POST', cookie })).status).toBe(200);
    expect((await call('/api/auth/refresh', { method: 'POST', cookie })).status).toBe(401);
  });

  it('rate limits account creation by address', async () => {
    for (let i = 0; i < 10; i++) await call('/api/auth/register', { json: {} });
    expect((await call('/api/auth/register', { json: ACCOUNT })).status).toBe(429);
  });
});

// =============================================================================
//  How often the advisor may be used
//  ---------------------------------------------------------------------------
//  The advisor is open to people who are not signed in, so it needs a limit.
//  Counted in D1, in the same table failed sign-ins use (login_attempts), because
//  a Worker remembers nothing between requests. That table is already cleared
//  daily. A signed-in person is counted on their own; everyone else by address.
//
//  The sums cost almost nothing, so the estimate limit is generous: a repair
//  cafe's wifi puts many visitors behind one address. The part finder calls
//  iFixit, so it is stricter, most of all for people who are not signed in.
// =============================================================================
import { and, count, eq, gt } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { loginAttempts } from '../../db/schema.js';

const WINDOW_MS = 60 * 60 * 1000;

const LIMITS = {
  estimate: { signedIn: 300, anonymous: 200 },
  parts: { signedIn: 120, anonymous: 40 },
} as const;

export type AdvisorAction = keyof typeof LIMITS;

/** Record one use, unless this person or address is over the hourly limit. */
export async function takeAdvisorAllowance(
  action: AdvisorAction,
  who: { userId?: string | null; ip: string },
): Promise<boolean> {
  const key = `advisor:${action}:${who.userId ? `user:${who.userId}` : `ip:${who.ip}`}`;
  const limit = who.userId ? LIMITS[action].signedIn : LIMITS[action].anonymous;
  const [row] = await db
    .select({ n: count() })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.key, key), gt(loginAttempts.createdAt, new Date(Date.now() - WINDOW_MS))));
  if (Number(row?.n ?? 0) >= limit) return false;
  await db.insert(loginAttempts).values({ key });
  return true;
}

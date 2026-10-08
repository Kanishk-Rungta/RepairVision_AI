// =============================================================================
//  How many diagnoses one person may ask for
//  ---------------------------------------------------------------------------
//  Every call to Gemma costs quota on the cafe's API key, so each signed-in
//  person gets AI_DIAGNOSIS_HOURLY_LIMIT requests an hour (30 by default).
//  Counted in D1, the same way failed sign-ins are, because a Worker remembers
//  nothing between requests.
// =============================================================================
import { and, count, eq, gt, lt } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { aiDiagnosisUsage } from '../../db/schema.js';
import { env } from '../../env.js';

const WINDOW_MS = 60 * 60 * 1000;
const KEEP_MS = 24 * 60 * 60 * 1000;

/**
 * Record one request for this person, unless they are over the limit.
 * Returns false when they are.
 */
export async function takeDiagnosisAllowance(userId: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MS);
  const [row] = await db
    .select({ n: count() })
    .from(aiDiagnosisUsage)
    .where(and(eq(aiDiagnosisUsage.userId, userId), gt(aiDiagnosisUsage.createdAt, since)));
  if (Number(row?.n ?? 0) >= env.AI_DIAGNOSIS_HOURLY_LIMIT) return false;
  await db.batch([
    db.insert(aiDiagnosisUsage).values({ userId }),
    db.delete(aiDiagnosisUsage).where(lt(aiDiagnosisUsage.createdAt, new Date(Date.now() - KEEP_MS))),
  ]);
  return true;
}

/**
 * The same allowance for the public site assistant (services/chat), counted
 * per visitor address because visitors are not signed in. Kept in the same
 * table under a "chat:" key, so it cannot collide with a person's id.
 */
export async function takeChatAllowance(visitorKey: string): Promise<boolean> {
  const key = `chat:${visitorKey}`;
  const since = new Date(Date.now() - WINDOW_MS);
  const [row] = await db
    .select({ n: count() })
    .from(aiDiagnosisUsage)
    .where(and(eq(aiDiagnosisUsage.userId, key), gt(aiDiagnosisUsage.createdAt, since)));
  if (Number(row?.n ?? 0) >= env.AI_CHAT_HOURLY_LIMIT) return false;
  await db.insert(aiDiagnosisUsage).values({ userId: key });
  return true;
}

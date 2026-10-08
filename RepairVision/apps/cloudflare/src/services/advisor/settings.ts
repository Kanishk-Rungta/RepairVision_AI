/**
 * The cafe's say in the advisor: the currency prices are shown in and the two
 * shares of a replacement's price that decide "repair" and "replace". Stored on
 * the cafe row (migration 0004). Anything out of range falls back to the
 * default, so a bad value in the database can never produce a nonsense answer.
 */
import { eq } from 'drizzle-orm';
import { ADVISOR_LIMITS, advisorSettingsSchema, type AdvisorSettings } from '@circularity/shared';
import { db } from '../../db/index.js';
import { cafes } from '../../db/schema.js';

export const DEFAULT_ADVISOR_SETTINGS: AdvisorSettings = {
  currency: 'GBP',
  repairShare: ADVISOR_LIMITS.repairShare.default,
  replaceShare: ADVISOR_LIMITS.replaceShare.default,
};

export async function advisorSettings(): Promise<AdvisorSettings> {
  const [cafe] = await db
    .select({ currency: cafes.advisorCurrency, repair: cafes.advisorRepairShare, replace: cafes.advisorReplaceShare })
    .from(cafes)
    .limit(1);
  if (!cafe) return DEFAULT_ADVISOR_SETTINGS;
  const parsed = advisorSettingsSchema.safeParse({
    currency: cafe.currency,
    repairShare: Number(cafe.repair),
    replaceShare: Number(cafe.replace),
  });
  return parsed.success ? parsed.data : DEFAULT_ADVISOR_SETTINGS;
}

export async function saveAdvisorSettings(settings: AdvisorSettings): Promise<boolean> {
  const [cafe] = await db.select({ id: cafes.id }).from(cafes).limit(1);
  if (!cafe) return false;
  await db
    .update(cafes)
    .set({
      advisorCurrency: settings.currency,
      advisorRepairShare: String(settings.repairShare),
      advisorReplaceShare: String(settings.replaceShare),
      updatedAt: new Date(),
    })
    .where(eq(cafes.id, cafe.id));
  return true;
}

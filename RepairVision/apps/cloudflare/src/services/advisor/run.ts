/**
 * One advisor estimate, start to finish: settle the currency from the cafe's
 * settings, look up the item's CO2e figures, and run the sums. Shared by the
 * estimate route and by saving an estimate to a repair job, so a saved answer
 * is always one the server worked out itself, never one the browser sent.
 */
import { eq } from 'drizzle-orm';
import type { AdvisorEstimate, AdvisorEstimateParsed } from '@circularity/shared';
import { db } from '../../db/index.js';
import { co2Factors } from '../../db/schema.js';
import { co2Settings } from '../co2.js';
import { compareRepairVsReplace, type WasteFactor } from './calculate.js';
import { advisorSettings } from './settings.js';

export class AdvisorInputError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
  }
}

export async function runEstimate(input: AdvisorEstimateParsed): Promise<AdvisorEstimate> {
  const [settings, co2] = await Promise.all([advisorSettings(), co2Settings()]);

  let factor: WasteFactor | null = null;
  if (input.factorId && co2.enabled) {
    const [row] = await db.select().from(co2Factors).where(eq(co2Factors.id, input.factorId)).limit(1);
    if (!row || !row.isActive) throw new AdvisorInputError('Unknown item type', 'advisor/unknown_item');
    factor = {
      label: row.label,
      co2eKg: row.co2eKg === null ? null : Number(row.co2eKg),
      weightKg: row.weightKg === null ? null : Number(row.weightKg),
    };
  }

  return compareRepairVsReplace(
    { ...input, currency: (input.currency ?? settings.currency).toUpperCase() },
    factor,
    co2.displacementRate,
    { repairShare: settings.repairShare, replaceShare: settings.replaceShare },
  );
}

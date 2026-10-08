/**
 * Repair vs. replace: the arithmetic.
 *
 * Pure functions, no database and no network, so every rule here can be tested
 * and explained. The route (routes/advisor.ts) looks up the CO2e figures and
 * hands them in.
 *
 * The rules, in the order they are applied:
 *
 *  1. Repair cost = parts + labour + tools. Money is added in pence so a long
 *     list of parts never drifts by a fraction of a penny.
 *  2. Replace cost = the new price + extras (delivery, disposal).
 *  3. Expected cost allows for a repair that fails. If it fails the person
 *     still has to replace, so
 *         expected repair = repair + (1 - successChance) x replace.
 *  4. Verdict. Repair when the repair costs no more than the cafe's repair share (50% unless the cafe changes it) of
 *     replacing, because a repair that costs more than half the price of a new
 *     one rarely makes sense once the older item's shorter remaining life is
 *     counted. Replace when it costs more than the replace share (90% by default) of a new
 *     one, or when allowing for failure makes the repair dearer. In between is
 *     "close", and the answer leans on waste avoided.
 *  5. Waste avoided is the hub's own reference data (see services/co2.ts): the
 *     CO2e of making a new one times the displacement rate, and the item's
 *     weight. Only counted when the verdict is not "replace".
 */
import type {
  AdvisorEstimate,
  AdvisorEstimateResolved,
  AdvisorOption,
  AdvisorVerdict,
  AdvisorWaste,
} from '@circularity/shared';

/** What a cafe gets until it sets its own (Settings, Repair or replace). */
export const REPAIR_SHARE = 0.5;
export const REPLACE_SHARE = 0.9;

export interface Thresholds {
  repairShare: number;
  replaceShare: number;
}

/** What the route knows about the kind of item, from the co2_factors table. */
export interface WasteFactor {
  label: string;
  co2eKg: number | null;
  weightKg: number | null;
}

const toPence = (pounds: number) => Math.round(pounds * 100);
const fromPence = (pence: number) => pence / 100;
const round2 = (n: number) => Math.round(n * 100) / 100;

export function compareRepairVsReplace(
  input: AdvisorEstimateResolved,
  factor: WasteFactor | null,
  displacementRate: number,
  thresholds: Thresholds = { repairShare: REPAIR_SHARE, replaceShare: REPLACE_SHARE },
): AdvisorEstimate {
  const partsPence = input.parts.reduce((sum, p) => sum + toPence(p.unitPrice) * p.quantity, 0);
  const labourPence = toPence(input.labourCost);
  const toolsPence = toPence(input.toolsCost);
  const repairPence = partsPence + labourPence + toolsPence;

  const replacePence = toPence(input.replacementCost) + toPence(input.replacementExtras);

  const fail = 1 - input.successChance;
  const expectedRepairPence = Math.round(repairPence + fail * replacePence);

  const share = replacePence > 0 ? repairPence / replacePence : repairPence > 0 ? Infinity : 0;
  const expectedShare = replacePence > 0 ? expectedRepairPence / replacePence : share;

  let verdict: AdvisorVerdict;
  if (replacePence === 0) verdict = 'repair';
  else if (share <= thresholds.repairShare && expectedShare <= 1) verdict = 'repair';
  else if (share > thresholds.replaceShare || expectedShare > 1) verdict = 'replace';
  else verdict = 'close';

  const waste = wasteAvoided(factor, displacementRate);
  const savingPence = replacePence - repairPence;

  const options: AdvisorOption[] = [
    { id: 'repair', label: 'Repair it yourself', cost: fromPence(repairPence), expectedCost: fromPence(expectedRepairPence) },
  ];
  if (input.professionalQuote !== undefined) {
    const q = toPence(input.professionalQuote);
    options.push({
      id: 'professional',
      label: 'Have a shop repair it',
      cost: fromPence(q),
      expectedCost: fromPence(Math.round(q + fail * replacePence)),
    });
  }
  options.push({ id: 'replace', label: 'Buy a replacement', cost: fromPence(replacePence), expectedCost: fromPence(replacePence) });

  const reasons = explain({ thresholds, verdict, share, expectedShare, repairPence, replacePence, savingPence, successChance: input.successChance, waste, currency: input.currency });
  const caveats = cautions(input);

  return {
    item: input.item,
    currency: input.currency,
    verdict,
    headline: headline(verdict, input.item, savingPence, input.currency),
    reasons,
    options,
    repair: {
      parts: fromPence(partsPence),
      labour: fromPence(labourPence),
      tools: fromPence(toolsPence),
      total: fromPence(repairPence),
      shareOfReplacement: Number.isFinite(share) ? round2(share) : 0,
      saving: fromPence(savingPence),
    },
    replace: { price: input.replacementCost, extras: input.replacementExtras, total: fromPence(replacePence) },
    perYear: perYear(input, repairPence, replacePence),
    waste,
    thresholds,
    lookedUpParts: input.parts.filter((p) => p.source === 'lookup').length,
    caveats,
  };
}

function wasteAvoided(factor: WasteFactor | null, displacementRate: number): AdvisorWaste {
  if (!factor) return { co2eAvoidedKg: null, wasteAvoidedKg: null, workings: null };
  const co2e = factor.co2eKg !== null && factor.co2eKg > 0 ? Math.round(factor.co2eKg * displacementRate * 1000) / 1000 : null;
  return {
    co2eAvoidedKg: co2e,
    wasteAvoidedKg: factor.weightKg !== null && factor.weightKg > 0 ? factor.weightKg : null,
    workings: { label: factor.label, preUseCo2eKg: factor.co2eKg, displacementRate, weightKg: factor.weightKg },
  };
}

/**
 * Cost per year of life: only when the person gave an age and a lifespan.
 * A repaired item is assumed to last the rest of its expected life, and for
 * at least a year; a new one lasts the whole expected life.
 */
function perYear(input: AdvisorEstimateResolved, repairPence: number, replacePence: number) {
  if (input.deviceAgeYears === undefined || input.expectedLifeYears === undefined) return null;
  const left = Math.max(input.expectedLifeYears - input.deviceAgeYears, 1);
  return {
    repair: round2(fromPence(repairPence) / left),
    replace: round2(fromPence(replacePence) / input.expectedLifeYears),
  };
}

function money(n: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(Math.abs(n));
  } catch {
    return `${currency} ${Math.abs(n).toFixed(2)}`;
  }
}

function headline(verdict: AdvisorVerdict, item: string, savingPence: number, currency: string): string {
  const amount = money(fromPence(Math.abs(savingPence)), currency);
  if (verdict === 'repair') return `Repairing the ${item} should save about ${amount}.`;
  if (verdict === 'replace') {
    return savingPence < 0
      ? `Replacing the ${item} looks cheaper by about ${amount}.`
      : `A repair is cheaper on paper, but replacing the ${item} is the safer buy.`;
  }
  return `Repairing and replacing the ${item} cost about the same.`;
}

function explain(a: {
  thresholds: Thresholds;
  verdict: AdvisorVerdict;
  share: number;
  expectedShare: number;
  repairPence: number;
  replacePence: number;
  savingPence: number;
  successChance: number;
  waste: AdvisorWaste;
  currency: string;
}): string[] {
  const out: string[] = [];
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  if (a.replacePence > 0) {
    out.push(`The repair costs ${money(fromPence(a.repairPence), a.currency)}, which is ${Number.isFinite(a.share) ? pct(a.share) : 'more than all'} of the ${money(fromPence(a.replacePence), a.currency)} to replace it.`);
  }
  if (a.successChance < 1) {
    out.push(`If the repair only works ${pct(a.successChance)} of the time, the average cost once a failed repair is replaced anyway is ${pct(a.expectedShare)} of replacing.`);
  }
  if (a.verdict === 'repair') out.push(`That is at or below ${pct(a.thresholds.repairShare)} of a new one, the point at which repairing usually wins.`);
  if (a.verdict === 'replace') out.push(`That is above the point at which repairing usually wins, so the money argument favours replacing.`);
  if (a.verdict === 'close') out.push(`The money is close, so waste avoided is the better tie-breaker.`);
  if (a.verdict !== 'replace' && a.waste.co2eAvoidedKg !== null) {
    out.push(`Repairing avoids about ${a.waste.co2eAvoidedKg} kg of CO2e${a.waste.wasteAvoidedKg !== null ? ` and keeps about ${a.waste.wasteAvoidedKg} kg out of the bin` : ''}.`);
  }
  return out;
}

function cautions(input: AdvisorEstimateResolved): string[] {
  const out: string[] = [];
  if (input.parts.length === 0) out.push('No parts were listed, so the repair cost may be missing the biggest part of the bill.');
  if (input.parts.some((p) => p.source === 'user' && p.url === undefined)) out.push('Part prices were typed in without a link, so check them against a current listing.');
  if (input.successChance === 0.8) out.push('The chance of the repair working is a default of 80%. Use the diagnosis, or an honest guess, to change it.');
  if (input.professionalQuote !== undefined && input.labourCost > 0) out.push('You entered both labour and a shop quote. The shop quote is shown as its own option and is not added to the labour.');
  return out;
}

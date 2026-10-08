// Repair vs. Replace Advisor: what a person tells us, and what we work out.
//
// Every price in a request is typed in by the person asking (or copied from a
// shop page they looked at). Nothing here is a guess about the market. The
// only numbers the server adds are the CO2e and weight reference figures that
// the hub already holds for each kind of item (see co2_factors).
import { z } from 'zod';

/** Money is sent as pounds and pence, such as 24.99, never as text. */
const money = z.number().finite().min(0).max(100_000);

export const ADVISOR_PRICE_SOURCES = ['user', 'lookup'] as const;
export type AdvisorPriceSource = (typeof ADVISOR_PRICE_SOURCES)[number];

export const advisorPartSchema = z.object({
  name: z.string().trim().min(1).max(120),
  unitPrice: money,
  quantity: z.number().int().min(1).max(50).default(1),
  /** "user": typed in. "lookup": came from a parts price provider (see docs). */
  source: z.enum(ADVISOR_PRICE_SOURCES).default('user'),
  /** The page the price was read from, so it can be checked later. */
  url: z.string().url().max(500).optional(),
});

export const advisorEstimateSchema = z.object({
  /** What is broken, in the person's words. Shown back in the answer. */
  item: z.string().trim().min(1).max(160),
  /** A co2_factors id, so waste avoided can be worked out. Optional. */
  factorId: z.string().max(64).optional(),
  /** The price of a replacement they would actually buy. */
  replacementCost: money,
  /** Anything extra a replacement costs: delivery, setup, taking the old one away. */
  replacementExtras: money.default(0),
  parts: z.array(advisorPartSchema).max(20).default([]),
  /** Paid labour for the repair. Zero at a repair cafe. */
  labourCost: money.default(0),
  /** Tools or consumables they would have to buy to do it themselves. */
  toolsCost: money.default(0),
  /** A quote from a repair shop, if they have one. Compared as a third option. */
  professionalQuote: money.optional(),
  /** How likely the repair is to work, 0 to 1. Taken from the diagnosis if known. */
  successChance: z.number().min(0.05).max(1).default(0.8),
  /** For "cost per year of life left". Both optional. */
  deviceAgeYears: z.number().min(0).max(60).optional(),
  expectedLifeYears: z.number().min(0.5).max(60).optional(),
  /** Defaults to the cafe's own currency. */
  currency: z.string().length(3).optional(),
});

export type AdvisorPart = z.infer<typeof advisorPartSchema>;
export type AdvisorEstimateRequest = z.input<typeof advisorEstimateSchema>;
export type AdvisorEstimateParsed = z.infer<typeof advisorEstimateSchema>;
/** What the sums run on: the request, with the currency settled. */
export type AdvisorEstimateResolved = AdvisorEstimateParsed & { currency: string };

/** The cafe's say in how an answer is worked out. */
export const ADVISOR_LIMITS = {
  /** Repair is the verdict at or below this share of a replacement's price. */
  repairShare: { min: 0.1, max: 0.95, default: 0.5 },
  /** Replace is the verdict above this share. */
  replaceShare: { min: 0.2, max: 1.5, default: 0.9 },
} as const;

export const advisorSettingsSchema = z
  .object({
    currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, 'Use a three-letter currency code, such as GBP'),
    repairShare: z.number().min(ADVISOR_LIMITS.repairShare.min).max(ADVISOR_LIMITS.repairShare.max),
    replaceShare: z.number().min(ADVISOR_LIMITS.replaceShare.min).max(ADVISOR_LIMITS.replaceShare.max),
  })
  .refine((v) => v.replaceShare > v.repairShare, {
    message: 'The replace point has to be higher than the repair point',
    path: ['replaceShare'],
  });
export type AdvisorSettings = z.infer<typeof advisorSettingsSchema>;

/** An estimate kept against a repair job. The result is worked out again from `request` when it is saved. */
export interface SavedAdvisorEstimate {
  savedAt: string;
  savedBy: { id: string; name: string };
  request: AdvisorEstimateParsed;
  result: AdvisorEstimate;
}

export type AdvisorVerdict = 'repair' | 'replace' | 'close';

export interface AdvisorOption {
  id: 'repair' | 'professional' | 'replace';
  label: string;
  /** What it costs if it goes to plan. */
  cost: number;
  /** What it costs on average, allowing for a repair that fails and needs a replacement anyway. */
  expectedCost: number;
}

export interface AdvisorWaste {
  /** Kilograms of CO2e a repair avoids, using the hub's displacement rate. Null if unknown. */
  co2eAvoidedKg: number | null;
  /** Kilograms of electronic or household waste kept out of the bin. Null if unknown. */
  wasteAvoidedKg: number | null;
  /** The sums behind both figures, so the page can show its working. */
  workings: {
    label: string;
    preUseCo2eKg: number | null;
    displacementRate: number;
    weightKg: number | null;
  } | null;
}

export interface AdvisorEstimate {
  item: string;
  currency: string;
  verdict: AdvisorVerdict;
  /** One sentence a person can read without the table. */
  headline: string;
  /** Why, in plain steps. */
  reasons: string[];
  options: AdvisorOption[];
  repair: {
    parts: number;
    labour: number;
    tools: number;
    total: number;
    /** Repair cost as a share of the replacement cost, 0.5 meaning half. */
    shareOfReplacement: number;
    /** Money kept if the repair works, compared with replacing. Negative if it costs more. */
    saving: number;
  };
  replace: { price: number; extras: number; total: number };
  perYear: { repair: number; replace: number } | null;
  waste: AdvisorWaste;
  /** The points the verdict was judged against, from the cafe's settings. */
  thresholds: { repairShare: number; replaceShare: number };
  /** Parts whose price did not come from the person asking. */
  lookedUpParts: number;
  /** Things the answer depends on that the person should double-check. */
  caveats: string[];
}

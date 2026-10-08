// =============================================================================
//  RepairVision AI Diagnosis: the shapes shared by the Worker and the web app
//  ---------------------------------------------------------------------------
//  Gemma 4 is asked for JSON in the shape of `diagnosisResultSchema`. What it
//  sends back is untrusted, so the Worker runs it through this schema before
//  anything reaches the browser. The schema is forgiving about small things a
//  language model gets wrong (a "High" instead of "high", a null where an
//  empty list was meant, an over-long sentence) and strict about the rest.
// =============================================================================
import { z } from 'zod';

export const REPAIRVISION_LIMITS = {
  /** Question-and-answer rounds in one guided diagnosis. */
  maxRounds: 5,
  /** Largest picture the Worker accepts, after the browser has shrunk it. */
  maxImageBytes: 4 * 1024 * 1024,
  /** The longest side the browser shrinks a picture to before sending it. */
  imageLongestEdge: 1536,
  imageMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
  /** Largest follow-up request body (it carries the previous diagnosis). */
  maxFollowupBytes: 64 * 1024,
} as const;

export type RepairVisionImageMime = (typeof REPAIRVISION_LIMITS.imageMimeTypes)[number];

// ── Helpers for reading model output ────────────────────────────────────────

/** A string trimmed and cut to `max` characters, rather than refused. */
const text = (max: number) =>
  z
    .string()
    .transform((s) => s.trim().slice(0, max))
    .pipe(z.string().min(1));

const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
    z
      .string()
      .transform((s) => s.trim().slice(0, max))
      .nullable()
      .optional()
      .transform((v) => v ?? null),
  );

/** A list that accepts null or a single item, and keeps at most `max`. */
const list = <T extends z.ZodTypeAny>(item: T, max: number) =>
  z
    .preprocess((v) => (v == null ? [] : Array.isArray(v) ? v : [v]), z.array(item))
    .transform((items) => items.slice(0, max));

const lowerEnum = <T extends [string, ...string[]]>(values: T, aliases: Record<string, T[number]> = {}) =>
  z.preprocess((v) => {
    if (typeof v !== 'string') return v;
    const key = v.trim().toLowerCase().replace(/[\s-]+/g, '_');
    return aliases[key] ?? key;
  }, z.enum(values));

// ── The diagnosis ───────────────────────────────────────────────────────────

export const likelihoodSchema = lowerEnum(['low', 'medium', 'high'], {
  moderate: 'medium',
  med: 'medium',
  very_high: 'high',
  very_low: 'low',
  unlikely: 'low',
  likely: 'high',
});
export type Likelihood = z.infer<typeof likelihoodSchema>;

export const diagnosisStatusSchema = lowerEnum(
  ['needs_more_information', 'likely_cause_identified', 'refer_to_professional'],
  {
    needs_more_info: 'needs_more_information',
    more_information_needed: 'needs_more_information',
    likely_cause: 'likely_cause_identified',
    refer: 'refer_to_professional',
    unsafe: 'refer_to_professional',
    unsafe_stop: 'refer_to_professional',
  },
);
export type DiagnosisStatus = z.infer<typeof diagnosisStatusSchema>;

export const possibleCauseSchema = z.object({
  title: text(160),
  likelihood: likelihoodSchema,
  reasoning: optionalText(800),
  supportingEvidence: list(text(400), 6),
  missingEvidence: list(text(400), 6),
});
export type PossibleCause = z.infer<typeof possibleCauseSchema>;

export const safeCheckSchema = z.object({
  instruction: text(500),
  purpose: text(500),
});
export type SafeCheck = z.infer<typeof safeCheckSchema>;

export const safetyWarningSchema = z.object({
  severity: lowerEnum(['caution', 'stop'], { warning: 'caution', danger: 'stop', high: 'stop', critical: 'stop' }),
  message: text(600),
  /** "model" when Gemma raised it, "safety_screen" when the Worker's own checks did. */
  source: z.enum(['model', 'safety_screen']).default('model'),
});
export type SafetyWarning = z.infer<typeof safetyWarningSchema>;

export const nextQuestionSchema = z.object({
  question: text(400),
  options: list(text(120), 5),
});
export type NextQuestion = z.infer<typeof nextQuestionSchema>;

export const diagnosisResultSchema = z.object({
  device: z.object({
    name: text(160),
    category: optionalText(120),
    model: optionalText(160),
  }),
  summary: text(1200),
  reportedSymptoms: list(text(400), 8),
  /** Only what is visible in the photo. Empty when there was no photo. */
  visualObservations: list(text(400), 8),
  possibleCauses: list(possibleCauseSchema, 3),
  safeChecks: list(safeCheckSchema, 6),
  nextQuestion: z.preprocess((v) => (v === undefined ? null : v), nextQuestionSchema.nullable()),
  safetyWarnings: list(safetyWarningSchema, 6),
  /** How the latest answer changed the picture. Null on the first analysis. */
  evidenceUpdate: optionalText(1200),
  uncertainty: text(800),
  status: diagnosisStatusSchema,
});
export type DiagnosisResult = z.infer<typeof diagnosisResultSchema>;

export interface DiagnosisMeta {
  /** The model that wrote this answer, as reported by configuration. */
  model: string;
  /** 0 for the first analysis, then 1, 2... for each answer. */
  round: number;
  maxRounds: number;
  imageAnalyzed: boolean;
  /** Hazards the Worker's own safety screen found in what the user wrote. */
  hazards: string[];
  /** Plain-language notes about changes the Worker made to the answer. */
  notices: string[];
  generatedAt: string;
}

export interface DiagnosisResponse {
  diagnosis: DiagnosisResult;
  meta: DiagnosisMeta;
}

// ── Requests ────────────────────────────────────────────────────────────────

const field = (min: number, max: number, message: string) =>
  z.string().trim().min(min, message).max(max, `Must be ${max} characters or fewer`);

const optionalField = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer`)
    .nullish()
    .transform((v) => (v ? v : null));

export const deviceContextSchema = z.object({
  deviceName: field(2, 120, 'Say what the device is'),
  manufacturer: optionalField(120),
  model: optionalField(120),
  problem: field(5, 2000, 'Describe the problem in a few words'),
});
export type DeviceContext = z.infer<typeof deviceContextSchema>;

export const qaTurnSchema = z.object({
  question: field(1, 400, 'Question missing'),
  answer: field(1, 1000, 'Answer missing'),
});
export type QaTurn = z.infer<typeof qaTurnSchema>;

export const followupRequestSchema = z.object({
  context: deviceContextSchema,
  /** Whether the first analysis had a photo, so the model knows what it saw came from one. */
  imageAnalyzed: z.boolean().default(false),
  previous: diagnosisResultSchema,
  /** Questions already answered, oldest first, not counting this one. */
  history: z.array(qaTurnSchema).max(REPAIRVISION_LIMITS.maxRounds - 1, 'This diagnosis has reached its question limit'),
  question: field(1, 400, 'Question missing'),
  answer: field(1, 1000, 'Give an answer first'),
});
export type FollowupRequest = z.infer<typeof followupRequestSchema>;

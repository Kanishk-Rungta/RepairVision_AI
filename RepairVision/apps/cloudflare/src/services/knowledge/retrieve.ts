/**
 * Repair knowledge retrieval.
 *
 * Given the faults a diagnosis suggests, find the written material that backs
 * each one up, so the diagnosis can say why instead of just asserting it.
 *
 * Three kinds of source, with different rules:
 *
 *   knowledge_base  Written by the team (kb.ts). Safe to show and to give a model.
 *   repair_case     Jobs this cafe's repairers marked completed, with their notes.
 *                   Safe to show staff. Names and contact details are never read.
 *   guide_link      An iFixit guide. Title and link only. iFixit's terms do not
 *                   allow its content to be given to a model, so nothing but
 *                   the link is kept, and promptContext() leaves it out.
 *
 * Matching is plain word overlap. That is enough for a knowledge base of a
 * dozen entries and keeps the result easy to explain: every source says which
 * words matched. It also means retrieval costs no model call and no new
 * dependency.
 */

import { and, desc, eq, isNotNull } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { repairJobs } from '../../db/schema.js';
import { searchGuides } from '../ifixit.js';
import { KB, KB_LICENSE, type DeviceType, type KbEntry } from './kb.js';

export interface HypothesisInput {
  /** The fault as the diagnosis words it, e.g. "frayed cable near the plug". */
  label: string;
  deviceType?: DeviceType;
}

export interface KnowledgeSource {
  kind: 'knowledge_base';
  id: string;
  title: string;
  deviceType: DeviceType;
  explanation: string;
  /** Safe for anyone to try. */
  checks: string[];
  /** For a technician only. Never offered to a visitor as a next step. */
  technicianOnly: string[];
  license: string;
  score: number;
  matchedTerms: string[];
}

export interface CaseSource {
  kind: 'repair_case';
  id: string;
  jobNumber: string;
  item: string;
  fault: string;
  outcome: string;
  partsUsed: string | null;
  score: number;
  matchedTerms: string[];
}

export interface GuideLinkSource {
  kind: 'guide_link';
  title: string;
  url: string;
  attribution: string;
}

export interface HypothesisEvidence {
  hypothesis: string;
  knowledge: KnowledgeSource[];
  cases: CaseSource[];
  guideLinks: GuideLinkSource[];
}

export interface RetrieveOptions {
  /** How many knowledge entries and how many cases to keep per hypothesis. */
  perKind?: number;
  /** Look up iFixit guide links. Needs the network, so it is off by default. */
  guideLinks?: boolean;
}

// Words that carry no meaning for matching.
const STOP = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'are', 'was', 'not', 'but',
  'has', 'have', 'its', 'when', 'out', 'any', 'all', 'can', 'will', 'does', 'into',
  'near', 'only', 'one', 'under', 'than', 'then', 'they', 'them', 'been', 'just',
]);

/** Lower-case words, without filler, and with a plural "s" removed. */
export function tokenize(text: string): string[] {
  const out = new Set<string>();
  for (const raw of text.toLowerCase().split(/[^a-z0-9]+/)) {
    if (raw.length < 3 || STOP.has(raw)) continue;
    out.add(raw.length > 4 && raw.endsWith('s') ? raw.slice(0, -1) : raw);
  }
  return [...out];
}

/** A source needs at least this much to be worth showing. */
const MIN_SCORE = 3;
/** Weight of a word that is in the hypothesis itself, against one only in the symptom. */
const HYPOTHESIS_WEIGHT = 3;
const SYMPTOM_WEIGHT = 1;
const CASE_SCAN_LIMIT = 300;
const EXCERPT_LIMIT = 300;

interface Scored {
  score: number;
  matched: string[];
}

function overlap(
  hypothesis: Set<string>,
  symptom: Set<string>,
  target: Set<string>,
): Scored {
  let score = 0;
  const matched: string[] = [];
  for (const word of target) {
    if (hypothesis.has(word)) {
      score += HYPOTHESIS_WEIGHT;
      matched.push(word);
    } else if (symptom.has(word)) {
      score += SYMPTOM_WEIGHT;
      matched.push(word);
    }
  }
  return { score, matched };
}

function entryTokens(entry: KbEntry): Set<string> {
  return new Set(tokenize(`${entry.fault} ${entry.keywords.join(' ')}`));
}

/** Knowledge-base entries for one hypothesis, best first. No I/O. */
export function matchKnowledge(
  hypothesis: HypothesisInput,
  symptom: string,
  limit = 2,
): KnowledgeSource[] {
  const h = new Set(tokenize(hypothesis.label));
  const s = new Set(tokenize(symptom));
  const results: KnowledgeSource[] = [];

  for (const entry of KB) {
    if (hypothesis.deviceType && entry.deviceType !== hypothesis.deviceType) continue;
    const { score, matched } = overlap(h, s, entryTokens(entry));
    if (score < MIN_SCORE) continue;
    results.push({
      kind: 'knowledge_base',
      id: entry.id,
      title: entry.fault,
      deviceType: entry.deviceType,
      explanation: entry.explanation,
      checks: entry.checks,
      technicianOnly: entry.technicianOnly,
      license: KB_LICENSE,
      score,
      matchedTerms: matched,
    });
  }
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

function excerpt(text: string | null | undefined): string {
  const t = (text ?? '').replace(/\s+/g, ' ').trim();
  return t.length > EXCERPT_LIMIT ? `${t.slice(0, EXCERPT_LIMIT - 1)}…` : t;
}

/**
 * Past repairs similar to a hypothesis.
 *
 * Only jobs a repairer completed, and that came with outcome notes, count as
 * verified. Customer name and contact are not selected at all.
 */
export async function matchCases(
  hypothesis: HypothesisInput,
  symptom: string,
  limit = 2,
): Promise<CaseSource[]> {
  const rows = await db
    .select({
      id: repairJobs.id,
      jobNumber: repairJobs.jobNumber,
      item: repairJobs.itemDescription,
      fault: repairJobs.faultDescription,
      outcome: repairJobs.outcomeNotes,
      partsUsed: repairJobs.partsUsed,
    })
    .from(repairJobs)
    .where(and(eq(repairJobs.status, 'completed'), isNotNull(repairJobs.outcomeNotes)))
    .orderBy(desc(repairJobs.completedAt))
    .limit(CASE_SCAN_LIMIT);

  const h = new Set(tokenize(hypothesis.label));
  const s = new Set(tokenize(symptom));
  const results: CaseSource[] = [];

  for (const row of rows) {
    const outcome = excerpt(row.outcome);
    if (!outcome) continue;
    const text = new Set(tokenize(`${row.item} ${row.fault} ${outcome}`));
    const { score, matched } = overlap(h, s, text);
    if (score < MIN_SCORE) continue;
    results.push({
      kind: 'repair_case',
      id: row.id,
      jobNumber: row.jobNumber,
      item: excerpt(row.item),
      fault: excerpt(row.fault),
      outcome,
      partsUsed: row.partsUsed ? excerpt(row.partsUsed) : null,
      score,
      matchedTerms: matched,
    });
  }
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Links to iFixit guides. Only the title and address are kept. */
export async function findGuideLinks(query: string, limit = 3): Promise<GuideLinkSource[]> {
  try {
    const { guides } = await searchGuides(query, 0, limit);
    return guides.map((g) => ({
      kind: 'guide_link' as const,
      title: g.title,
      url: g.url,
      attribution: 'iFixit, CC BY-NC-SA. Open the guide for the full text.',
    }));
  } catch {
    // iFixit being unreachable must not stop a diagnosis.
    return [];
  }
}

/** Evidence for each hypothesis. */
export async function retrieveEvidence(
  hypotheses: HypothesisInput[],
  symptom: string,
  options: RetrieveOptions = {},
): Promise<HypothesisEvidence[]> {
  const perKind = options.perKind ?? 2;
  const out: HypothesisEvidence[] = [];
  for (const hypothesis of hypotheses) {
    out.push({
      hypothesis: hypothesis.label,
      knowledge: matchKnowledge(hypothesis, symptom, perKind),
      cases: await matchCases(hypothesis, symptom, perKind),
      guideLinks: options.guideLinks ? await findGuideLinks(hypothesis.label) : [],
    });
  }
  return out;
}

/**
 * The text a model is allowed to see.
 *
 * Built only from knowledge-base entries and repair cases. Guide links are
 * dropped here, in code, so the iFixit rule does not depend on anyone
 * remembering it. Each block is numbered so a model can cite [KB-1] or [CASE-1]
 * and the answer can be traced back to a source.
 */
export function promptContext(evidence: HypothesisEvidence[]): string {
  const blocks: string[] = [];
  for (const item of evidence) {
    const lines = [`Hypothesis: ${item.hypothesis}`];
    item.knowledge.forEach((k, i) => {
      lines.push(`[KB-${i + 1}] ${k.title}: ${k.explanation}`);
      lines.push(`  Safe checks: ${k.checks.join(' | ')}`);
    });
    item.cases.forEach((c, i) => {
      lines.push(
        `[CASE-${i + 1}] ${c.item}. Fault: ${c.fault}. Outcome: ${c.outcome}` +
          (c.partsUsed ? ` Parts: ${c.partsUsed}` : ''),
      );
    });
    if (item.knowledge.length === 0 && item.cases.length === 0) {
      lines.push('No supporting source found. Do not state this fault as supported.');
    }
    blocks.push(lines.join('\n'));
  }
  return blocks.join('\n\n');
}

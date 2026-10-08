// =============================================================================
//  Safety guardrails that do not depend on the model
//  ---------------------------------------------------------------------------
//  Gemma is told the safety rules, but a language model can still miss one.
//  So the Worker also:
//
//    1. screens what the user wrote for high-risk situations (mains voltage,
//       swollen batteries, microwaves, high voltage, smoke and burning) before
//       the call, and tells the model what it found
//    2. after the call, removes any suggested check that would bypass a
//       protection or puncture a battery, whatever the device
//    3. when a hazard was found, adds its own "stop" warning, removes checks
//       that involve opening the device, ends the question round and marks the
//       case for a professional
//
//  These are deliberately simple word patterns: they over-warn rather than
//  under-warn, and they never decide a device is safe.
// =============================================================================
import type { DiagnosisResult, SafetyWarning } from '@circularity/shared';

export interface Hazard {
  id: string;
  label: string;
  message: string;
}

const RULES: Array<Hazard & { pattern: RegExp }> = [
  {
    id: 'mains_voltage',
    label: 'mains or exposed live electricity',
    pattern:
      /\b(mains|live wire|exposed (?:live |copper )?wir\w*|bare wir\w*|(?:110|115|120|220|230|240)\s?v(?:olts?|ac)?\b|wall (?:socket|outlet) (?:spark|burn|melt)\w*|frayed (?:power|mains) (?:cord|cable|lead)|electric(?:al)? shock|shocked me|gave me a shock)/i,
    message:
      'This may involve mains electricity. Do not open the device or touch exposed wiring. Unplug it at the wall only if that is safe, and have a qualified electrician or technician assess it.',
  },
  {
    id: 'lithium_battery',
    label: 'a damaged, swollen or overheating battery',
    pattern:
      /\b(?:swollen|swelling|bulg\w*|puff\w*|expand\w*|leak\w*|punctur\w*|dented|hissing)\b[^.!?\n]{0,40}\bbatter(?:y|ies)\b|\bbatter(?:y|ies)\b[^.!?\n]{0,40}\b(?:swollen|swelling|bulg\w*|puff\w*|expand\w*|leak\w*|punctur\w*|hissing|very hot|too hot|overheat\w*)/i,
    message:
      'A swollen, leaking or overheating lithium battery can catch fire. Stop using and stop charging the device, keep it away from anything flammable, do not press or puncture it, and have it assessed by a professional.',
  },
  {
    id: 'microwave',
    label: 'a microwave oven',
    pattern: /\bmicro-?wave\b/i,
    message:
      'Microwave ovens hold lethal voltages inside, even when unplugged. Do not open the casing. Only a qualified technician should work on it.',
  },
  {
    id: 'high_voltage',
    label: 'high-voltage equipment or large capacitors',
    pattern:
      /\b(high[- ]?voltage|\bhv\b|crt|cathode[- ]ray|flyback|tesla coil|neon sign|plasma (?:tv|screen)|(?:large|big|charged|electrolytic|high[- ]voltage|mains) capacitors?|capacitors? (?:bank|bulg\w*|leak\w*|charged)|power supply unit|\bpsu\b|inverter board|ballast)\b/i,
    message:
      'This equipment may contain high voltage or charged capacitors that stay dangerous after unplugging. Do not open it. Refer it to a qualified technician.',
  },
  {
    id: 'fire_heat',
    label: 'smoke, burning, sparks or overheating',
    pattern:
      /\b(smok(?:e|ed|ing|y)(?! (?:alarm|detector))|burn(?:ing|t|ed)? (?:smell|odou?r|plastic|mark)|smell\w* (?:of )?burn\w*|scorch\w*|melt(?:ed|ing)|sparks?|sparking|flames?|caught fire|on fire|overheat\w*|too hot to (?:touch|hold))\b/i,
    message:
      'Smoke, sparks, burning smells or overheating are a fire risk. Stop using the device, unplug it only if that is safe, let it cool somewhere non-flammable, and have a qualified technician assess it.',
  },
];

/** Hazards mentioned anywhere in the user's own words. */
export function screenForHazards(texts: Array<string | null | undefined>): Hazard[] {
  const joined = texts.filter(Boolean).join('\n');
  return RULES.filter((rule) => rule.pattern.test(joined)).map(({ id, label, message }) => ({ id, label, message }));
}

/** Checks never to show, whatever the device. */
const NEVER =
  /\b(bypass\w*|defeat\w*|disabl\w*|jumper\w*|short(?:-| )?(?:circuit\w*|out)?\s+the|remov\w* the fuse|replace the fuse with (?:a )?(?:wire|foil|higher))\b[^.]*(fuse|\binterlock|\bsafety|\bprotection|\bthermal|\bcut-?out|\bbreaker|\bground|\bearth)|\b(punctur\w*|pierc\w*|press\w* on|squeez\w*|crush\w*)\b[^.]*\bbatter|\bcharg\w*\b[^.]*\b(swollen|bulging|puffed|damaged)\b[^.]*\bbatter|\bdischarg\w*\b[^.]*\bcapacitor/i;

/** Checks that open or work inside the device: fine for a USB mouse, not near a hazard. */
const INVASIVE =
  /\b(open(?:ing)? (?:up )?(?:the |its )?(?:case|casing|housing|cover|shell|enclosure|device|unit|back)|disassembl\w*|take (?:it |the \w+ )?apart|unscrew\w*|remov\w* (?:the )?(?:back |rear |top |bottom )?(?:cover|case|casing|panel|housing)|solder\w*|probe\w*|inside the (?:device|unit|case|casing)|multimeter)\b/i;

function sameQuestion(a: string, b: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  return norm(a) === norm(b);
}

export interface SafetyOutcome {
  diagnosis: DiagnosisResult;
  notices: string[];
}

/**
 * Apply the rules above to a validated diagnosis. `askedQuestions` are the
 * questions already put to the user, so a repeat is dropped. `lastRound`
 * ends the question round.
 */
export function enforceSafety(
  input: DiagnosisResult,
  hazards: Hazard[],
  options: { askedQuestions?: string[]; lastRound?: boolean } = {},
): SafetyOutcome {
  const notices: string[] = [];
  const diagnosis: DiagnosisResult = {
    ...input,
    safeChecks: [...input.safeChecks],
    safetyWarnings: input.safetyWarnings.map((w) => ({ ...w, source: 'model' as const })),
  };

  const before = diagnosis.safeChecks.length;
  diagnosis.safeChecks = diagnosis.safeChecks.filter((c) => !NEVER.test(`${c.instruction} ${c.purpose}`));
  if (diagnosis.safeChecks.length < before) {
    notices.push('A suggested step was removed because it could defeat a safety protection or damage a battery.');
  }

  const modelSaysStop =
    diagnosis.status === 'refer_to_professional' || diagnosis.safetyWarnings.some((w) => w.severity === 'stop');

  if (hazards.length > 0) {
    const screened: SafetyWarning[] = hazards.map((h) => ({ severity: 'stop', message: h.message, source: 'safety_screen' }));
    diagnosis.safetyWarnings = [...screened, ...diagnosis.safetyWarnings].slice(0, 8);
    const count = diagnosis.safeChecks.length;
    diagnosis.safeChecks = diagnosis.safeChecks.filter((c) => !INVASIVE.test(`${c.instruction} ${c.purpose}`));
    if (diagnosis.safeChecks.length < count) {
      notices.push('Steps that involve opening the device were removed because of the safety concern.');
    }
    if (diagnosis.status !== 'refer_to_professional') {
      diagnosis.status = 'refer_to_professional';
      notices.push('Marked for professional assessment because of the safety concern.');
    }
  }

  if ((hazards.length > 0 || modelSaysStop) && diagnosis.nextQuestion) {
    diagnosis.nextQuestion = null;
    notices.push('Guided troubleshooting has stopped because of the safety concern.');
  }

  if (diagnosis.nextQuestion && options.askedQuestions?.some((q) => sameQuestion(q, diagnosis.nextQuestion!.question))) {
    diagnosis.nextQuestion = null;
    notices.push('The model repeated an earlier question, so it was left out.');
  }

  if (diagnosis.nextQuestion && options.lastRound) {
    diagnosis.nextQuestion = null;
    notices.push('This diagnosis has reached its question limit.');
  }

  return { diagnosis, notices };
}

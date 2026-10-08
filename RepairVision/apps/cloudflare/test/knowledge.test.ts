// Repair knowledge retrieval. The matching is pure, so it is tested without a database.
import { describe, expect, it } from 'vitest';
import { KB } from '../src/services/knowledge/kb.js';
import { matchKnowledge, promptContext, tokenize } from '../src/services/knowledge/retrieve.js';

describe('tokenize', () => {
  it('lower-cases, drops filler and short words, and removes plural s', () => {
    expect(tokenize('The Cables are FRAYED')).toEqual(['cable', 'frayed']);
  });
});

describe('knowledge base', () => {
  it('has unique ids and covers all three device types', () => {
    expect(new Set(KB.map((e) => e.id)).size).toBe(KB.length);
    expect(new Set(KB.map((e) => e.deviceType))).toEqual(new Set(['mouse', 'keyboard', 'usb_accessory']));
  });

  it('gives every entry at least one safe check', () => {
    for (const entry of KB) expect(entry.checks.length).toBeGreaterThan(0);
  });
});

describe('matchKnowledge', () => {
  it('finds the cable entry for a mouse that cuts out when the cable moves', () => {
    const [top] = matchKnowledge(
      { label: 'Damaged cable near the mouse body', deviceType: 'mouse' },
      'pointer cuts out when I wiggle the cable',
    );
    expect(top.id).toBe('mouse-cable-fray');
    expect(top.matchedTerms).toContain('cable');
  });

  it('never returns an entry for a different device type', () => {
    const results = matchKnowledge({ label: 'cable fault', deviceType: 'keyboard' }, 'cable');
    expect(results.every((r) => r.deviceType === 'keyboard')).toBe(true);
  });

  it('returns nothing when nothing matches', () => {
    expect(matchKnowledge({ label: 'zzz qqq' }, 'xxx')).toEqual([]);
  });
});

describe('promptContext', () => {
  const evidence = [
    {
      hypothesis: 'Dirty sensor',
      knowledge: matchKnowledge({ label: 'dirty optical sensor', deviceType: 'mouse' }, 'jumpy pointer'),
      cases: [],
      guideLinks: [{ kind: 'guide_link' as const, title: 'SECRET-IFIXIT-TITLE', url: 'https://www.ifixit.com/Guide/1', attribution: 'x' }],
    },
  ];

  it('leaves iFixit guide links out of what a model sees', () => {
    const text = promptContext(evidence);
    expect(text).toContain('[KB-1]');
    expect(text).not.toContain('SECRET-IFIXIT-TITLE');
    expect(text).not.toContain('ifixit.com');
  });

  it('never shows technician-only work to a model', () => {
    const text = promptContext(evidence);
    for (const entry of KB) for (const step of entry.technicianOnly) expect(text).not.toContain(step);
  });

  it('says so when there is no source', () => {
    const text = promptContext([{ hypothesis: 'Unknown', knowledge: [], cases: [], guideLinks: [] }]);
    expect(text).toContain('No supporting source found');
  });
});

// Realistic phrasings, each with the entry a person would expect to come first.
describe('matchKnowledge picks the right entry', () => {
  const cases: Array<[string, 'mouse' | 'keyboard' | 'usb_accessory', string, string]> = [
    ['Damaged cable near the plug', 'mouse', 'mouse disconnects when I move the cable', 'mouse-cable-fray'],
    ['Dirty optical sensor', 'mouse', 'cursor is jumpy and skips across the screen', 'mouse-sensor-dirty'],
    ['Worn left button switch', 'mouse', 'double click happens when I click once', 'mouse-button-switch'],
    ['Scroll wheel encoder dirty', 'mouse', 'page jumps up and down when scrolling', 'mouse-scroll-wheel'],
    ['No power to the mouse', 'mouse', 'no light under the mouse and it is not detected', 'mouse-no-power'],
    ['Worn mouse feet', 'mouse', 'mouse drags and feels scratchy on the desk', 'mouse-feet-worn'],
    ['Pointer speed setting changed', 'mouse', 'pointer suddenly too fast', 'mouse-speed-setting'],
    ['Liquid spilled under keys', 'keyboard', 'coffee spilled and keys feel sticky', 'kb-keys-liquid'],
    ['One dead key', 'keyboard', 'the letter e does not type', 'kb-single-key'],
    ['Keyboard has no power', 'keyboard', 'no lights on caps lock and not detected', 'kb-no-power'],
    ['Wrong layout selected', 'keyboard', 'pressing quote types the at sign', 'kb-wrong-characters'],
    ['Num lock is off', 'keyboard', 'number pad moves the cursor instead of typing numbers', 'kb-fn-numlock'],
    ['Key repeating', 'keyboard', 'a letter keeps typing by itself', 'kb-repeating-key'],
    ['Space bar stabiliser unclipped', 'keyboard', 'space bar rattles and tilts', 'kb-spacebar-keycap'],
    ['Backlight failed', 'keyboard', 'the keyboard backlight does not come on', 'kb-backlight'],
    ['Loose USB connector', 'usb_accessory', 'plug is wobbly and full of lint', 'usb-port-wear'],
    ['Faulty USB cable', 'usb_accessory', 'device only charges and data does not work', 'usb-cable-fault'],
    ['Hub not giving enough power', 'usb_accessory', 'devices drop out when too many are plugged into the hub', 'usb-hub-power'],
    ['Headset sound fault', 'usb_accessory', 'only one ear works and it crackles', 'usb-headset-audio'],
    ['Flash drive not detected', 'usb_accessory', 'usb stick not showing and asks to format', 'usb-flash-drive'],
    ['Slow charging', 'usb_accessory', 'phone is charging slowly with this cable', 'usb-slow-charge'],
    ['Webcam black image', 'usb_accessory', 'webcam shows a black screen', 'usb-webcam'],
    ['Overheating charger', 'usb_accessory', 'adapter is very hot and smells of burning', 'usb-overheat'],
    ['Missing driver', 'usb_accessory', 'computer makes the plug in sound but the device does nothing, unknown device', 'usb-needs-driver'],
  ];

  it.each(cases)('%s (%s): %s', (label, deviceType, symptom, expected) => {
    const [top] = matchKnowledge({ label, deviceType }, symptom);
    expect(top?.id).toBe(expected);
  });
});

// Repair knowledge retrieval. The matching is pure, so it is tested without a database.
import { describe, expect, it } from 'vitest';
import { knowledgeRetrieveSchema } from '@circularity/shared';
import { DEVICE_RISK, DEVICE_TYPES, KB } from '../src/services/knowledge/kb.js';
import { matchKnowledge, promptContext, tokenize } from '../src/services/knowledge/retrieve.js';

describe('tokenize', () => {
  it('lower-cases, drops filler and short words, and removes plural s', () => {
    expect(tokenize('The Cables are FRAYED')).toEqual(['cable', 'frayed']);
  });
});

describe('knowledge base', () => {
  it('has unique ids', () => {
    expect(new Set(KB.map((e) => e.id)).size).toBe(KB.length);
  });

  it('covers every device type with at least two entries', () => {
    for (const type of DEVICE_TYPES) {
      expect(KB.filter((e) => e.deviceType === type).length, type).toBeGreaterThanOrEqual(2);
    }
  });

  it('gives every device type a risk level, and every entry a known device type', () => {
    for (const type of DEVICE_TYPES) expect(DEVICE_RISK[type], type).toBeDefined();
    for (const entry of KB) expect(DEVICE_TYPES as readonly string[]).toContain(entry.deviceType);
  });

  it('accepts every device type in the request schema, and rejects others', () => {
    for (const type of DEVICE_TYPES) {
      const ok = knowledgeRetrieveSchema.safeParse({ hypotheses: [{ label: 'x', deviceType: type }] });
      expect(ok.success, type).toBe(true);
    }
    const bad = knowledgeRetrieveSchema.safeParse({ hypotheses: [{ label: 'x', deviceType: 'spaceship' }] });
    expect(bad.success).toBe(false);
  });

  it('never tells a visitor to take a device apart or solder', () => {
    const banned = /\b(unscrew|solder|desolder|take apart|dismantle|remove the (cover|panel|casing|case|back))\b|\bopen the (case|casing|device|laptop|tv|monitor|speaker|microwave|kettle|tool|battery)\b/i;
    for (const entry of KB) for (const check of entry.checks) expect(check, entry.id).not.toMatch(banned);
  });

  it('keeps technician-only devices to looking and stopping', () => {
    for (const entry of KB.filter((e) => DEVICE_RISK[e.deviceType] === 'technician_only')) {
      expect(entry.checks.length, entry.id).toBeLessThanOrEqual(5);
      expect(entry.technicianOnly.length, entry.id).toBeGreaterThan(0);
    }
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

describe('matchKnowledge for the wider device list', () => {
  const cases: Array<[string, string, string, string]> = [
    ['Laptop not charging', 'laptop', 'laptop will not turn on and the charger has no light', 'laptop-no-power'],
    ['Overheating laptop', 'laptop', 'the fan is very loud and it shuts down', 'laptop-slow-hot'],
    ['No signal on monitor', 'monitor', 'monitor says no signal', 'monitor-no-picture'],
    ['Paper jam', 'printer', 'paper keeps jamming and will not feed', 'printer-paper-jam'],
    ['Router has no internet', 'wifi_router', 'no internet and red light on the router', 'router-no-internet'],
    ['Stick drift', 'game_controller', 'the character moves by itself, thumbstick drift', 'controller-stick-drift'],
    ['Charging port blocked', 'smartphone', 'phone not charging and the port has lint', 'phone-not-charging'],
    ['Battery draining', 'smartphone', 'battery drains fast and phone shuts off', 'phone-battery-drain'],
    ['Water damage', 'smartphone', 'dropped the phone in water', 'phone-water-damage'],
    ['Tablet slow', 'tablet', 'tablet is slow and storage is full', 'tablet-slow-storage'],
    ['Watch will not charge', 'smartwatch', 'smartwatch not charging on its dock', 'watch-charging'],
    ['Swollen power bank', 'power_bank', 'power bank is swollen and hot', 'powerbank-swollen-hot'],
    ['One side dead', 'wired_headphones', 'sound only in one ear and it crackles', 'headphones-one-side'],
    ['Will not pair', 'bluetooth_speaker', 'bluetooth speaker will not pair', 'speaker-no-pair'],
    ['TV no picture', 'tv', 'sound but no picture and a faint image with a torch', 'tv-no-picture'],
    ['Remote dead', 'remote_control', 'remote not working, batteries flat', 'remote-not-working'],
    ['SD card error', 'digital_camera', 'camera says card error, memory card locked', 'camera-card-error'],
    ['Poor reception', 'radio', 'radio has static and poor reception', 'radio-no-sound'],
    ['Lamp bulb', 'desk_lamp', 'lamp does not light, bulb blown', 'lamp-no-light'],
    ['Fan not spinning', 'fan', 'fan hums and will not spin, needs a push', 'fan-wont-spin'],
    ['Toy batteries', 'toy', 'toy has flat batteries and corrosion on the contacts', 'toy-not-working-batteries'],
    ['Clock battery', 'clock', 'wall clock stopped, quartz', 'clock-stopped'],
    ['Torch dim', 'flashlight', 'torch is dim and flickers', 'torch-not-lighting'],
    ['Smart plug offline', 'smart_home_device', 'smart plug offline and will not connect to wifi', 'smart-wont-connect'],
    ['Kettle limescale', 'kettle', 'kettle clicks off before boiling, limescale', 'kettle-not-heating'],
    ['Toaster lever', 'toaster', 'toaster lever will not stay down', 'toaster-wont-stay-down'],
    ['Coffee flow', 'coffee_machine', 'coffee machine has no water flow, needs descale', 'coffee-no-water'],
    ['Iron cold', 'iron', 'iron is not heating up', 'iron-not-heating'],
    ['Dryer cold', 'hair_dryer', 'hair dryer blows cold and the filter is blocked', 'hairdryer-no-heat'],
    ['Shaver charging', 'electric_shaver', 'shaver will not charge', 'shaver-not-charging'],
    ['Weak suction', 'vacuum_cleaner', 'vacuum has weak suction, filter blocked', 'vacuum-weak-suction'],
    ['Microwave no heat', 'microwave', 'microwave runs but does not heat', 'microwave-not-heating'],
    ['Washer drain', 'washing_machine', 'washing machine will not drain, full of water', 'washer-no-drain'],
    ['Fridge warm', 'refrigerator', 'fridge is not cold, door seal gaps', 'fridge-not-cooling'],
    ['Skipped stitches', 'sewing_machine', 'sewing machine skipping stitches and thread breaks', 'sewing-skipped-stitches'],
    ['Drill dead', 'power_tool', 'cordless drill will not start, battery', 'tool-wont-start'],
    ['E-bike no power', 'e_bike_scooter', 'electric bike will not power on, battery', 'ebike-no-power'],
    ['E-bike battery damage', 'e_bike_scooter', 'battery is swollen and smells of burning after a crash', 'ebike-battery-damaged'],
  ];

  it.each(cases)('%s (%s): %s', (label, deviceType, symptom, expected) => {
    const [top] = matchKnowledge({ label, deviceType: deviceType as (typeof DEVICE_TYPES)[number] }, symptom);
    expect(top?.id).toBe(expected);
  });

  it('reports the risk level of the device', () => {
    const [top] = matchKnowledge({ label: 'Microwave does not heat', deviceType: 'microwave' }, 'no heat');
    expect(top.risk).toBe('technician_only');
    expect(promptContext([{ hypothesis: 'x', knowledge: [top], cases: [], guideLinks: [] }])).toContain('risk: technician_only');
  });
});

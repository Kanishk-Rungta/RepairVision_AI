/**
 * The repair knowledge base.
 *
 * Every entry here was written by the team for this project. None of it is
 * copied or paraphrased from a manufacturer manual or from iFixit, so it can
 * be shown to people and passed to a model without licence questions.
 *
 * It covers three kinds of device, all low-voltage and safe to examine from
 * the outside: wired mice, USB keyboards and simple USB accessories.
 *
 * "checks" are things a visitor may do without opening the device. Anything
 * that needs a case opened or a soldering iron goes in "technicianOnly", and
 * is shown to a technician, never offered to a beginner as a next step.
 */

export const DEVICE_TYPES = ['mouse', 'keyboard', 'usb_accessory'] as const;
export type DeviceType = (typeof DEVICE_TYPES)[number];

export interface KbEntry {
  id: string;
  deviceType: DeviceType;
  /** The fault this entry explains, in the words a hypothesis would use. */
  fault: string;
  /** Words a visitor or the model might use for the symptom or the cause. */
  keywords: string[];
  /** Why this fault produces the symptom. */
  explanation: string;
  /** Safe checks, with no tools and no opening the device. */
  checks: string[];
  /** Work for a technician only. */
  technicianOnly: string[];
}

export const KB_LICENSE = 'Original text by The Blacklisted, for this project';

export const KB: KbEntry[] = [
  {
    id: 'mouse-cable-fray',
    deviceType: 'mouse',
    fault: 'Damaged or broken cable near the mouse body or the plug',
    keywords: [
      'cable', 'cord', 'wire', 'frayed', 'bent', 'kink', 'intermittent', 'flicker',
      'disconnects', 'cuts out', 'wiggle', 'moves', 'only works', 'sometimes',
    ],
    explanation:
      'The cable flexes most where it leaves the mouse and where it meets the plug. Repeated bending breaks the thin wires inside while the outer sleeve still looks fine, so the mouse works only when the cable sits at a certain angle.',
    checks: [
      'Look along the cable for a kink, a flat spot, a cut or exposed wire, especially at both ends.',
      'Plug the mouse in and gently bend the cable near the mouse body. Note whether the pointer cuts out.',
      'Repeat near the plug. If the fault follows one spot, the break is there.',
      'Try a different USB port to rule out the port.',
    ],
    technicianOnly: [
      'Open the case and re-terminate the cable at the circuit board.',
      'Replace the cable.',
    ],
  },
  {
    id: 'mouse-sensor-dirty',
    deviceType: 'mouse',
    fault: 'Dirty or blocked optical sensor, or an unsuitable surface',
    keywords: [
      'jumpy', 'jitter', 'erratic', 'skips', 'drifts', 'laggy', 'freezes', 'pointer',
      'cursor', 'sensor', 'dust', 'dirt', 'sticky', 'surface', 'glossy', 'glass',
    ],
    explanation:
      'An optical mouse photographs the surface under it many times a second. Dust, hair or a smeared lens blur those pictures, and shiny or glass surfaces give it little to follow, so the pointer jumps or stalls.',
    checks: [
      'Turn the mouse over. Check that the sensor window is clear and the red or blue light is on.',
      'Blow gently across the sensor window to clear dust, and wipe the feet with a dry cloth.',
      'Try the mouse on a plain, matt surface such as a notebook or a mouse mat.',
      'Try a different USB port.',
    ],
    technicianOnly: ['Open the case and clean the lens with a swab and isopropyl alcohol.'],
  },
  {
    id: 'mouse-button-switch',
    deviceType: 'mouse',
    fault: 'Worn micro-switch under a button',
    keywords: [
      'click', 'double click', 'button', 'left', 'right', 'unresponsive', 'sticks',
      'ghost', 'misses', 'registers twice', 'wont click', 'worn', 'switch',
    ],
    explanation:
      'Each button presses a small switch rated for a limited number of clicks. When the contact wears, one click registers twice, or presses are missed. The left button is used most, so it fails first.',
    checks: [
      'Click each button slowly and note which one misbehaves and whether it feels different from the others.',
      'Press the button at its edges as well as the middle. A change points to a worn switch or a stuck cap.',
      'Test on another computer to confirm the fault is in the mouse and not a setting.',
    ],
    technicianOnly: [
      'Open the case and swap the switch for the unused one on the same board, or desolder and replace it.',
    ],
  },
  {
    id: 'mouse-scroll-wheel',
    deviceType: 'mouse',
    fault: 'Dirty or worn scroll wheel encoder',
    keywords: [
      'scroll', 'wheel', 'jumps', 'scrolls the wrong way', 'skips', 'random scroll',
      'zoom', 'encoder', 'gritty', 'page jumps',
    ],
    explanation:
      'The wheel turns a small encoder that counts steps. Dirt or wear makes it miscount, so the page jumps up and down or scrolls on its own.',
    checks: [
      'Turn the wheel slowly in each direction and watch whether the page ever moves the wrong way.',
      'Check for visible dirt around the wheel and blow it clear.',
      'Test on another computer.',
    ],
    technicianOnly: ['Open the case and clean or replace the encoder.'],
  },
  {
    id: 'kb-keys-liquid',
    deviceType: 'keyboard',
    fault: 'Liquid or sticky residue under the keys',
    keywords: [
      'spill', 'spilled', 'coffee', 'tea', 'water', 'liquid', 'sticky', 'stuck',
      'drink', 'wet', 'residue', 'keys stick', 'repeating', 'not registering',
    ],
    explanation:
      'A sugary drink dries to a film that holds keys down or lets neighbouring contacts touch. Several unrelated keys fail together, or a key types repeatedly.',
    checks: [
      'Unplug the keyboard before anything else.',
      'Turn it upside down over a table and tap gently to let loose liquid and crumbs out.',
      'Check whether the failing keys are close together, which suggests a spill in one area.',
      'Leave it unplugged to dry for at least a day before testing again.',
    ],
    technicianOnly: [
      'Remove keycaps and clean the switches or membrane with isopropyl alcohol.',
      'Open the case and clean the circuit board.',
    ],
  },
  {
    id: 'kb-single-key',
    deviceType: 'keyboard',
    fault: 'One key or one small group of keys not working',
    keywords: [
      'one key', 'single key', 'some keys', 'letter', 'space bar', 'enter', 'shift',
      'dead key', 'not typing', 'wont type', 'missing', 'crumbs', 'dust', 'dirt',
    ],
    explanation:
      'A single dead key usually means dirt under that key, a worn switch or contact, or a broken trace on the board. When the whole row or column fails, the fault is further back along the same line.',
    checks: [
      'Press the key firmly and note whether it feels different from its neighbours.',
      'Open a text editor or a keyboard tester page and see which keys register.',
      'Check whether the dead keys share a row or column.',
      'Look for crumbs or debris around the key and blow it clear.',
    ],
    technicianOnly: [
      'Lift the keycap and clean or replace the switch.',
      'Trace and repair a broken track on the board.',
    ],
  },
  {
    id: 'kb-no-power',
    deviceType: 'keyboard',
    fault: 'No connection: dead USB port, cable or controller',
    keywords: [
      'dead', 'nothing', 'no lights', 'not detected', 'not recognised', 'not recognized',
      'no power', 'caps lock', 'num lock', 'light', 'led', 'unplugged',
    ],
    explanation:
      'If no light comes on and the computer does not notice the keyboard, power is not reaching it. A bad port is the commonest cause, then a damaged cable, then the keyboard controller.',
    checks: [
      'Plug the keyboard into a different USB port, ideally directly on the computer rather than a hub.',
      'Try it on a second computer.',
      'Watch the Caps Lock light when the keyboard is plugged in.',
      'Inspect the cable and plug for damage.',
    ],
    technicianOnly: [
      'Open the case and test the cable for continuity with a multimeter.',
      'Check the controller and its solder joints.',
    ],
  },
  {
    id: 'kb-cable-break',
    deviceType: 'keyboard',
    fault: 'Damaged keyboard cable or connector',
    keywords: [
      'cable', 'cord', 'frayed', 'bent', 'intermittent', 'disconnects', 'beeps',
      'connects and disconnects', 'wiggle', 'sometimes works', 'moves', 'plug',
    ],
    explanation:
      'A keyboard that drops out when the desk or cable is moved has a break in a wire or a loose connector. The sound of the computer connecting and disconnecting is a strong sign.',
    checks: [
      'Listen for the connect and disconnect sound while gently moving the cable.',
      'Inspect the whole cable and the plug for cuts, kinks and bent pins.',
      'If the cable is detachable, try a different cable.',
    ],
    technicianOnly: ['Open the case and re-solder or replace the cable at the board.'],
  },
];

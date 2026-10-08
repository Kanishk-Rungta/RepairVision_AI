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
  {
    id: 'usb-port-wear',
    deviceType: 'usb_accessory',
    fault: 'Loose, dirty or worn USB connector',
    keywords: [
      'loose', 'port', 'connector', 'plug', 'wobbly', 'charging slow', 'wont charge',
      'not detected', 'lint', 'dirt', 'dust', 'bent', 'intermittent', 'connection',
    ],
    explanation:
      'Pocket lint packs into a socket and stops the plug seating fully. Worn or bent contacts also give a connection that comes and goes.',
    checks: [
      'Look into the socket with a torch for lint or debris.',
      'Try a different cable and a different port or charger.',
      'Check whether the plug fits snugly or wobbles.',
    ],
    technicianOnly: [
      'Clean the socket with a wooden toothpick while it is unplugged.',
      'Replace the socket on the board.',
    ],
  },
  {
    id: 'usb-cable-fault',
    deviceType: 'usb_accessory',
    fault: 'Faulty USB cable',
    keywords: [
      'cable', 'cord', 'lead', 'charges only', 'data', 'not recognised', 'not recognized',
      'intermittent', 'frayed', 'hot', 'wont work', 'only charges', 'wiggle',
    ],
    explanation:
      'Many cables carry power but not data, and flexed cables break internally. If the accessory works with a different cable, the first cable was the fault.',
    checks: [
      'Swap in a cable known to work.',
      'Inspect for cuts, kinks and bent plug ends.',
      'Feel the plug after a minute of use. A plug that is warm is normal, but one that is hot should be unplugged and left alone.',
    ],
    technicianOnly: ['Replace the cable; do not open sealed moulded plugs.'],
  },
  {
    id: 'usb-hub-power',
    deviceType: 'usb_accessory',
    fault: 'Insufficient power on a USB hub or port',
    keywords: [
      'hub', 'unpowered', 'drops', 'too many', 'drive', 'devices', 'resets',
      'disconnects', 'power', 'overload', 'multiple', 'adapter',
    ],
    explanation:
      'A hub shares the power of one port between everything plugged into it. Several hungry devices make some of them drop out or reset.',
    checks: [
      'Unplug everything but one device and see whether it behaves.',
      'Plug the device directly into the computer instead of the hub.',
      'If the hub has a power adapter, check it is connected and switched on.',
    ],
    technicianOnly: ['Test the hub output under load with a USB power meter.'],
  },
  {
    id: 'usb-led-light-switch',
    deviceType: 'usb_accessory',
    fault: 'Failed LED strip, fan or small powered accessory',
    keywords: [
      'light', 'led', 'lamp', 'fan', 'flicker', 'dim', 'stopped', 'spin', 'strip',
      'usb light', 'usb fan', 'switch', 'button', 'dead',
    ],
    explanation:
      'Small USB lights and fans have few parts. The switch, the cable and the solder joints where the cable enters are the usual failures, and a fan may simply be clogged with dust.',
    checks: [
      'Try a different USB port or a different charger.',
      'Operate the switch several times and note whether it feels loose.',
      'For a fan, check that nothing is blocking the blades and turn them by hand with the power off.',
      'Look for a cable kink where it enters the device.',
    ],
    technicianOnly: ['Open the case and check the switch and solder joints.'],
  },
  {
    id: 'mouse-no-power',
    deviceType: 'mouse',
    fault: 'Mouse is dead: no light and not detected',
    keywords: [
      'dead', 'nothing', 'no light', 'light off', 'not detected', 'not recognised',
      'not recognized', 'unresponsive', 'does not work', 'completely', 'power', 'plugged in',
    ],
    explanation:
      'An optical mouse lights its sensor as soon as it has power. No light means power is not arriving: a bad port, a broken cable or a failed board.',
    checks: [
      'Look under the mouse. The sensor should glow red or blue when it is plugged in.',
      'Try a different USB port, directly on the computer rather than a hub.',
      'Try the mouse on a second computer.',
      'Inspect the cable and plug for damage.',
    ],
    technicianOnly: [
      'Open the case and test the cable for continuity with a multimeter.',
      'Check the board for a lifted track or a cracked joint.',
    ],
  },
  {
    id: 'mouse-feet-worn',
    deviceType: 'mouse',
    fault: 'Worn or missing mouse feet',
    keywords: [
      'drag', 'drags', 'scratchy', 'rough', 'sticks to desk', 'uneven', 'wobble', 'rocks',
      'feet', 'glide', 'friction', 'scratching', 'noisy', 'wont glide',
    ],
    explanation:
      'The small pads under the mouse let it glide and keep the sensor at the right height. Worn or missing pads make it drag, scratch the surface and hold the sensor too close or too far from the desk.',
    checks: [
      'Turn the mouse over and look for missing, curled or flattened pads.',
      'Wipe the pads and the surface clean.',
      'Check for dried glue or grit stuck to the pads.',
    ],
    technicianOnly: ['Fit new adhesive PTFE feet after cleaning off old glue.'],
  },
  {
    id: 'mouse-speed-setting',
    deviceType: 'mouse',
    fault: 'Pointer speed or DPI setting changed',
    keywords: [
      'too fast', 'too slow', 'speed', 'dpi', 'sensitivity', 'sluggish', 'flies', 'acceleration',
      'suddenly', 'changed', 'slow pointer', 'fast pointer', 'overshoots',
    ],
    explanation:
      'Many mice have a button that cycles the sensor resolution, and the operating system has its own pointer speed setting. A sudden change in speed with no sign of damage is usually a setting, not a fault.',
    checks: [
      'Look for a DPI button, usually behind the wheel, and press it a few times.',
      'Open the pointer speed setting in the computer and move the slider.',
      'Try the mouse on another computer to see whether the speed follows the mouse.',
    ],
    technicianOnly: [],
  },
  {
    id: 'mouse-middle-click',
    deviceType: 'mouse',
    fault: 'Wheel click or side button not registering',
    keywords: [
      'middle click', 'wheel click', 'wheel press', 'side button', 'back button', 'forward button',
      'thumb button', 'extra button', 'not clicking', 'wheel button', 'press wheel', 'stuck',
    ],
    explanation:
      'The wheel and side buttons use their own small switches, which wear and collect dirt like the main buttons. A worn wheel switch is common because the wheel is both turned and pressed.',
    checks: [
      'Press the wheel straight down and then at an angle. Notice whether the click changes.',
      'Test the button in a different program, since some buttons do nothing in some programs.',
      'Test on another computer.',
    ],
    technicianOnly: ['Open the case and clean or replace the switch.'],
  },
  {
    id: 'kb-wrong-characters',
    deviceType: 'keyboard',
    fault: 'Wrong characters appear: language or layout setting',
    keywords: [
      'wrong letter', 'wrong character', 'wrong symbol', 'types different', 'at sign',
      'quote', 'pound', 'hash', 'layout', 'language', 'swapped', 'y and z', 'special characters',
      'symbols', 'different keys',
    ],
    explanation:
      'The keyboard sends the position of a key and the computer decides what character it is. When symbols such as @ and " are swapped, the language or layout in the computer does not match the keyboard.',
    checks: [
      'Open a text editor and type the symbols that are wrong.',
      'Check the keyboard layout or language setting on the computer.',
      'Try the keyboard on another computer set to the same layout.',
    ],
    technicianOnly: [],
  },
  {
    id: 'kb-fn-numlock',
    deviceType: 'keyboard',
    fault: 'Number lock or function lock is on or off',
    keywords: [
      'numbers', 'numpad', 'number pad', 'num lock', 'numlock', 'fn', 'function key',
      'f keys', 'volume', 'media keys', 'arrows instead', 'keypad', 'moves cursor',
      'nothing happens', 'lock',
    ],
    explanation:
      'Num Lock decides whether the number pad types digits or moves the cursor, and a function lock decides whether the top row acts as F-keys or media keys. Pressing them by accident looks like a fault.',
    checks: [
      'Press Num Lock and test the number pad again.',
      'Look for an Fn Lock or Fn key, and try the top row with and without Fn.',
      'Watch the indicator lights when pressing the lock keys.',
    ],
    technicianOnly: [],
  },
  {
    id: 'kb-repeating-key',
    deviceType: 'keyboard',
    fault: 'Key repeating or typing on its own',
    keywords: [
      'repeating', 'repeats', 'types by itself', 'types on its own', 'double letters',
      'extra letters', 'stuck key', 'keeps typing', 'ghost', 'ghosting', 'phantom',
      'doubles', 'bouncing', 'chatter',
    ],
    explanation:
      'A key that types more than once is held partly down by dirt, or its contacts bounce. A key that types by itself is physically stuck or shorted.',
    checks: [
      'Unplug the keyboard and look at the key from the side. It should sit level with its neighbours.',
      'Press and release the key several times to free anything stuck.',
      'Tap the keyboard upside down to loosen crumbs.',
      'Check whether the same key misbehaves on another computer.',
    ],
    technicianOnly: ['Remove the keycap and clean or replace the switch.'],
  },
  {
    id: 'kb-spacebar-keycap',
    deviceType: 'keyboard',
    fault: 'Loose, rattling or sticking space bar or large key',
    keywords: [
      'space bar', 'spacebar', 'enter', 'shift', 'backspace', 'rattle', 'wobble',
      'uneven', 'sticks down', 'stabiliser', 'stabilizer', 'tilts', 'large key', 'clatter',
      'keycap', 'popped off',
    ],
    explanation:
      'Large keys have a metal bar or plastic stabiliser that keeps them level. If it comes unclipped the key tilts, rattles or catches on one side.',
    checks: [
      'Press the key at each end. A key that tilts or catches at one end has lost its stabiliser.',
      'Look for a keycap that has popped off and is sitting loose.',
      'Look for debris stopping the key travelling fully down.',
    ],
    technicianOnly: ['Remove the keycap and refit the stabiliser, or replace it.'],
  },
  {
    id: 'kb-backlight',
    deviceType: 'keyboard',
    fault: 'Keyboard backlight not working',
    keywords: [
      'backlight', 'backlit', 'lights', 'led', 'illumination', 'rgb', 'dark', 'no light',
      'light off', 'brightness', 'glow', 'lighting', 'flicker',
    ],
    explanation:
      'The backlight usually has its own on/off and brightness keys, and may turn off by itself after a delay. If the keys work but the light never comes on, the LEDs or their power track may have failed.',
    checks: [
      'Look for a backlight key, often an Fn combination, and press it several times.',
      'Try the keyboard in a different USB port, because some lighting needs more power.',
      'Check whether the keyboard works normally without light.',
    ],
    technicianOnly: ['Open the case and check the LED strip and its connector.'],
  },
];

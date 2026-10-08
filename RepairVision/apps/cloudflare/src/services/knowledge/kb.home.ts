import type { KbEntry } from './kb.js';

// Lamps, fans, toys, clocks, torches and smart plugs and bulbs.
export const HOME_SMALL_KB: KbEntry[] = [
  // ── Desk lamp ──────────────────────────────────────────────────────────────
  {
    id: 'lamp-no-light',
    deviceType: 'desk_lamp',
    fault: 'Lamp does not light: bulb, switch or lead',
    keywords: [
      'no light', 'wont light', 'dead', 'bulb', 'blown', 'switch', 'plug', 'fuse', 'lead',
      'cable', 'flicker', 'flickering', 'dim', 'led', 'lamp', 'socket',
    ],
    explanation:
      'The bulb is by far the commonest fault. After that come the switch, a loose connection in the plug, or a damaged lead.',
    checks: [
      'Unplug the lamp. Check the bulb is the right type, and tighten it or try one that you know works.',
      'Try the lamp in a different socket.',
      'Look at the whole lead and the plug for scorching, cuts or exposed wire. If you see any, stop using it.',
      'If the lamp has a built-in LED and no bulb, do not open it; take it to a technician.',
    ],
    technicianOnly: [
      'Replace the switch, lead or plug. Test continuity with the lamp unplugged.',
      'Check that the plug fuse is the correct rating.',
    ],
  },
  {
    id: 'lamp-flicker',
    deviceType: 'desk_lamp',
    fault: 'Lamp flickering, buzzing or touch dimmer misbehaving',
    keywords: [
      'flicker', 'flickering', 'buzz', 'buzzing', 'hum', 'dimmer', 'touch', 'dims', 'flashes',
      'blinks', 'intermittent', 'led', 'loose bulb', 'wobbles', 'warm', 'hot',
    ],
    explanation:
      'A loose bulb or a poor contact in the holder causes flicker. LED bulbs may not suit an old dimmer, which makes them buzz and flicker.',
    checks: [
      'With the lamp unplugged, check the bulb is screwed in firmly.',
      'Try a different bulb, and an LED bulb marked as dimmable if there is a dimmer.',
      'Check whether the flicker changes when the lead is moved.',
    ],
    technicianOnly: ['Clean or replace the bulb holder, or replace the lead.'],
  },
  {
    id: 'lamp-arm-loose',
    deviceType: 'desk_lamp',
    fault: 'Lamp arm drooping, joint loose or base wobbling',
    keywords: [
      'droops', 'drooping', 'falls', 'wont stay', 'joint', 'arm', 'spring', 'loose', 'wobble',
      'base', 'head', 'tilt', 'adjust', 'clamp', 'sags', 'stay up',
    ],
    explanation:
      'The arm is held by springs and friction joints, which loosen with use. Tightening a screw usually puts it right.',
    checks: [
      'Unplug the lamp. Look for a tightening screw or nut at each joint.',
      'Check that the clamp or the base is firm on the surface.',
      'Check the spring is not broken or unhooked.',
    ],
    technicianOnly: ['Replace the springs, or re-hook them.'],
  },
  // ── Fan ────────────────────────────────────────────────────────────────────
  {
    id: 'fan-wont-spin',
    deviceType: 'fan',
    fault: 'Fan does not spin, or spins slowly',
    keywords: [
      'wont spin', 'not spinning', 'slow', 'weak', 'stuck', 'stopped', 'hum', 'humming',
      'blades', 'dust', 'buzz', 'start', 'push', 'motor', 'seized', 'needs a push',
    ],
    explanation:
      'A fan that hums but does not turn has a stiff bearing or a failed starting capacitor, and the motor may overheat. A fan that has slowed down is often clogged with dust.',
    checks: [
      'Unplug the fan. Turn the blades by hand: they should spin freely and quietly.',
      'Look for hair, dust or a foreign object in the blades and behind the guard.',
      'Try all the speed settings.',
      'If the fan only starts after a push or hums without turning, stop using it and unplug it.',
    ],
    technicianOnly: [
      'Clean and oil the bearings, or replace the starting capacitor.',
      'Test the motor windings.',
    ],
  },
  {
    id: 'fan-noise-wobble',
    deviceType: 'fan',
    fault: 'Fan noisy, rattling or wobbling',
    keywords: [
      'noisy', 'rattle', 'rattling', 'wobble', 'wobbling', 'vibration', 'squeak', 'squeaking',
      'grinding', 'scraping', 'loud', 'clicking', 'blade', 'unbalanced', 'knocks',
    ],
    explanation:
      'A bent or dirty blade makes the fan unbalanced. A scraping noise usually means a blade or the guard is touching, and a squeak comes from a dry bearing.',
    checks: [
      'Unplug the fan and tighten any screws on the guard and blades.',
      'Check that the blades do not touch the guard and are not bent.',
      'Clean dust off the blades; an uneven coat of dust causes wobble.',
      'Check the fan stands on a flat surface.',
    ],
    technicianOnly: ['Lubricate or replace the bearing.'],
  },
  {
    id: 'fan-switch-oscillate',
    deviceType: 'fan',
    fault: 'Fan speed switch, remote or oscillation not working',
    keywords: [
      'speed', 'switch', 'button', 'remote', 'oscillate', 'oscillation', 'wont turn', 'one speed',
      'timer', 'knob', 'stuck', 'head', 'swivel', 'gear', 'broken', 'selector',
    ],
    explanation:
      'The speed switch and the oscillation gear are cheap parts which wear, and a plastic gear can strip. A remote usually fails on its batteries.',
    checks: [
      'Replace the batteries if there is a remote.',
      'Try each speed in turn and note which one fails.',
      'Check whether the head moves by hand, and whether a pull-up knob engages oscillation.',
    ],
    technicianOnly: ['Replace the switch or the oscillation gear.'],
  },
  // ── Toy ────────────────────────────────────────────────────────────────────
  {
    id: 'toy-not-working-batteries',
    deviceType: 'toy',
    fault: 'Battery-powered toy does not work: batteries or contacts',
    keywords: [
      'wont work', 'dead', 'batteries', 'flat', 'corrosion', 'contacts', 'springs', 'no sound',
      'no movement', 'not moving', 'slow', 'weak', 'lights', 'flicker', 'dim',
    ],
    explanation:
      'Flat or leaking batteries cause most toy faults. A dull or slow toy means weak batteries, and corrosion on the contacts stops them working even when new.',
    checks: [
      'Replace the batteries with fresh ones of the same type, checking the direction.',
      'Check the contacts and springs for white or green crust.',
      'Make sure the battery door is closed and the contacts touch each end of the battery.',
      'Check there is an on-off switch and that it is on.',
    ],
    technicianOnly: ['Clean the contacts or replace the spring.'],
  },
  {
    id: 'toy-moving-parts',
    deviceType: 'toy',
    fault: 'Toy wheels, arms or moving parts stuck or broken',
    keywords: [
      'stuck', 'wheel', 'wheels', 'wont move', 'jammed', 'broken', 'arm', 'leg', 'gear', 'hair',
      'thread', 'grinding', 'clicking', 'motor', 'snapped', 'axle', 'loose',
    ],
    explanation:
      'Hair, thread and carpet fibres wrap round axles and jam gears. A gear that clicks without turning the wheel has probably lost teeth.',
    checks: [
      'Remove the batteries first.',
      'Turn the wheels by hand and look for hair or thread wrapped round the axle.',
      'Listen for a clicking or whirring sound when it is switched on, and note whether the motor spins.',
    ],
    technicianOnly: ['Replace the stripped gear or glue the broken part.'],
  },
  {
    id: 'toy-sound-lights',
    deviceType: 'toy',
    fault: 'Toy sound distorted, lights failing, or buttons not responding',
    keywords: [
      'sound', 'distorted', 'slow voice', 'low voice', 'lights', 'lights dim', 'button',
      'not responding', 'speaker', 'electronic', 'music', 'plays', 'weak sound', 'flat batteries',
    ],
    explanation:
      'A slow, deep or garbled voice is the classic sign of weak batteries. Buttons that do not respond may be dirty pads or a poor contact.',
    checks: [
      'Fit fresh batteries before anything else.',
      'Press each button firmly and note which fail.',
      'Check that the speaker grille is clear.',
    ],
    technicianOnly: ['Clean the button pads and board contacts.'],
  },
  // ── Clock ──────────────────────────────────────────────────────────────────
  {
    id: 'clock-stopped',
    deviceType: 'clock',
    fault: 'Quartz clock stopped or running slowly',
    keywords: [
      'stopped', 'stops', 'slow', 'wrong time', 'loses time', 'battery', 'hands', 'tick',
      'ticking', 'wall clock', 'quartz', 'second hand', 'jumping', 'stuck', 'dead',
    ],
    explanation:
      'A quartz clock almost always has a flat battery. If a new battery does not help, the hands are probably touching each other or the glass.',
    checks: [
      'Replace the battery with a fresh one, checking the direction.',
      'Check the hands: they must not touch each other or the dial or the glass.',
      'Check whether the second hand ticks or sticks at one position.',
    ],
    technicianOnly: ['Replace the quartz movement, which is cheap and swaps in.'],
  },
  {
    id: 'clock-alarm-display',
    deviceType: 'clock',
    fault: 'Alarm clock display dim, alarm not sounding, or time lost after a power cut',
    keywords: [
      'alarm', 'no alarm', 'display', 'dim', 'blank', 'time resets', 'power cut', 'snooze',
      'backup battery', 'blinking', 'flashing', 'digital', 'radio alarm', 'set', 'buzzer',
    ],
    explanation:
      'A blinking display after a power cut is the clock asking to be set again. An alarm that is not heard is often set to the wrong AM or PM, or switched off.',
    checks: [
      'Check the alarm is switched on, and that AM and PM are right.',
      'Check the backup battery, and replace it if the clock loses the time in a power cut.',
      'Check the volume setting and the buzzer.',
    ],
    technicianOnly: [],
  },
  {
    id: 'clock-mechanical',
    deviceType: 'clock',
    fault: 'Mechanical clock not running or not keeping time',
    keywords: [
      'mechanical', 'wind', 'winding', 'pendulum', 'chime', 'spring', 'wound', 'unwound',
      'wont run', 'stops after', 'gains', 'loses', 'level', 'tilted', 'tick', 'tock', 'key',
    ],
    explanation:
      'Pendulum clocks must be level and “in beat”, and a clock that stops after a few minutes is often not level or needs cleaning and oil. Never over-wind a spring.',
    checks: [
      'Make sure the clock stands level and firmly.',
      'Wind it gently until it stops turning easily, never forcing it.',
      'Listen for an even tick and tock, as an uneven beat stops a pendulum clock.',
    ],
    technicianOnly: ['Strip, clean and oil the movement.'],
  },
  // ── Flashlight ─────────────────────────────────────────────────────────────
  {
    id: 'torch-not-lighting',
    deviceType: 'flashlight',
    fault: 'Torch does not light or is dim',
    keywords: [
      'wont light', 'dim', 'dead', 'flickers', 'flicker', 'batteries', 'bulb', 'led', 'contacts',
      'corrosion', 'switch', 'intermittent', 'screw', 'tighten', 'cuts out', 'yellow',
    ],
    explanation:
      'A torch usually has flat or corroded batteries, or a loose head. A dim yellow light means weak batteries.',
    checks: [
      'Fit new batteries, checking the direction, and check the spring and contacts for rust or crust.',
      'Tighten the head and the tail cap, and then twist the head slightly to test the contact.',
      'Try the switch several times.',
    ],
    technicianOnly: ['Clean the contacts or replace the bulb or LED.'],
  },
  {
    id: 'torch-rechargeable',
    deviceType: 'flashlight',
    fault: 'Rechargeable torch will not charge or hold charge',
    keywords: [
      'rechargeable', 'wont charge', 'charging', 'usb', 'battery', 'lasts', 'minutes', 'charge',
      'indicator', 'port', 'cable', 'lithium', '18650', 'dies fast', 'holds charge',
    ],
    explanation:
      'Rechargeable torches use a lithium cell that loses capacity as it ages. The charging port or cable is often to blame when it does not charge at all.',
    checks: [
      'Try a different cable and charger, and look for the charging light.',
      'Check whether the torch works while it is plugged in.',
      'If the cell is removable, check it is the right type and seated correctly.',
    ],
    technicianOnly: ['Replace the lithium cell with an identical one.'],
  },
  {
    id: 'torch-water',
    deviceType: 'flashlight',
    fault: 'Torch not working after getting wet',
    keywords: [
      'water', 'wet', 'rain', 'damp', 'moisture', 'rust', 'waterproof', 'o-ring', 'seal',
      'condensation', 'fogged', 'dropped', 'submerged', 'dried', 'corroded',
    ],
    explanation:
      'Water in a torch rusts the contacts and the spring, and it then fails when it dries because of the corrosion left behind.',
    checks: [
      'Remove the batteries at once and let the torch dry in an airy place.',
      'Look for rust or crust on the contacts and spring.',
      'Check the rubber seal for cracks.',
    ],
    technicianOnly: ['Clean the contacts and replace the seal.'],
  },
  // ── Smart plug / bulb ──────────────────────────────────────────────────────
  {
    id: 'smart-wont-connect',
    deviceType: 'smart_home_device',
    fault: 'Smart plug or bulb will not connect to Wi-Fi or the app',
    keywords: [
      'wont connect', 'offline', 'wifi', 'pairing', 'app', 'setup', 'not found', 'unresponsive',
      'blinking', 'flashing', 'reset', '2.4ghz', 'router', 'no response', 'smart plug', 'smart bulb',
    ],
    explanation:
      'Most smart plugs and bulbs only work on a 2.4 GHz Wi-Fi network, and fail during setup if the phone is on a 5 GHz network. A router change makes an old device go offline.',
    checks: [
      'Make sure the phone is on the 2.4 GHz network for setup.',
      'Reset the device (hold the button, or switch a bulb on and off several times) until it blinks quickly.',
      'Move the device closer to the router for setup.',
      'Check the device is powered, and the app is up to date.',
    ],
    technicianOnly: [],
  },
  {
    id: 'smart-unresponsive',
    deviceType: 'smart_home_device',
    fault: 'Smart plug or bulb stopped responding or randomly switching',
    keywords: [
      'stopped', 'unresponsive', 'random', 'switches on', 'switches off', 'schedule', 'delay',
      'works sometimes', 'offline sometimes', 'timer', 'automation', 'flicker', 'voice', 'hot',
    ],
    explanation:
      'Schedules and automations in the app cause “random” behaviour, and Wi-Fi dropouts make a device go offline for a while.',
    checks: [
      'Check the schedules, timers and automations in the app.',
      'Unplug the device for a minute and plug it back in.',
      'Check the plug is not hot and is not above its rated load.',
      'Stop using a plug that smells or is discoloured.',
    ],
    technicianOnly: ['Test the relay. Do not open a smart plug that is connected to mains.'],
  },
  {
    id: 'smart-bulb-flicker',
    deviceType: 'smart_home_device',
    fault: 'Smart bulb flickering, wrong colour or not dimming',
    keywords: [
      'flicker', 'flickering', 'colour', 'color', 'wrong colour', 'wont dim', 'dims', 'buzz',
      'switch', 'dimmer switch', 'wall switch', 'off at the wall', 'brightness', 'led', 'bulb',
    ],
    explanation:
      'A smart bulb needs constant power, so a wall switch turned off cuts it from the network. Using it with a wall dimmer often makes it flicker.',
    checks: [
      'Leave the wall switch on and control the bulb from the app.',
      'Remove any dimmer switch from the circuit or replace it with a standard switch.',
      'Make sure the bulb is screwed in firmly.',
    ],
    technicianOnly: [],
  },
];

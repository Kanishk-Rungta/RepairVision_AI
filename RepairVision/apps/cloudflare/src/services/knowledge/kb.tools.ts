import type { KbEntry } from './kb.js';

// Power tools, electric bikes and scooters. Battery packs on these are large
// and can hurt people, so a visitor is only asked to look, and the entries
// say when to stop.
export const TOOLS_TRANSPORT_KB: KbEntry[] = [
  // ── Power tool ─────────────────────────────────────────────────────────────
  {
    id: 'tool-wont-start',
    deviceType: 'power_tool',
    fault: 'Power tool does not start or runs weakly',
    keywords: [
      'wont start', 'dead', 'no power', 'weak', 'slow', 'battery', 'charger', 'trigger', 'switch',
      'cable', 'lead', 'drill', 'saw', 'sander', 'grinder', 'carbon brushes', 'sparks',
    ],
    explanation:
      'A cordless tool that does nothing usually has a flat or worn battery pack, or dirty battery contacts. A corded tool has a bad lead, a worn switch or worn carbon brushes.',
    checks: [
      'Remove the battery or unplug the tool before examining it.',
      'Charge the battery fully, and look at the contacts on the battery and in the tool for dirt or burn marks.',
      'For a corded tool, check the lead and the plug for damage. Stop using it if it is damaged.',
      'Try the trigger and the forward/reverse switch.',
    ],
    technicianOnly: ['Replace the carbon brushes, the switch or the battery cells.'],
  },
  {
    id: 'tool-overheat-smell',
    deviceType: 'power_tool',
    fault: 'Power tool smelling of burning, sparking heavily or overheating',
    keywords: [
      'burning smell', 'smoke', 'sparks', 'sparking', 'hot', 'overheats', 'overheating', 'smell',
      'motor', 'cuts out', 'stalls', 'grinding', 'noise', 'burnt', 'blade', 'dull',
    ],
    explanation:
      'A little sparking at the motor is normal, but a lot of sparking, smoke or a hot burning smell means a failing motor or worn brushes. A blunt blade also makes the motor work too hard.',
    checks: [
      'Stop using it. Unplug it or remove the battery.',
      'Check that the vents are clear and the blade or bit is sharp.',
      'Do not use it again until a technician has looked at it.',
    ],
    technicianOnly: ['Inspect the motor and brushes; replace if worn.'],
  },
  {
    id: 'tool-chuck-blade',
    deviceType: 'power_tool',
    fault: 'Drill chuck slipping, blade wobbling or tool vibrating',
    keywords: [
      'chuck', 'slipping', 'wobble', 'wobbling', 'vibration', 'vibrates', 'loose', 'bit slips',
      'blade', 'wont tighten', 'clutch', 'torque', 'gearbox', 'grinding noise', 'play',
    ],
    explanation:
      'A chuck that cannot hold a bit is worn or full of dust, and a wobbling blade is bent or badly fitted.',
    checks: [
      'Remove the battery or unplug the tool first.',
      'Open the chuck fully and clear dust from the jaws, then tighten it again on a bit.',
      'Check the blade or disc is fitted correctly and not bent.',
      'Check the clutch ring and the speed selector sit in a position.',
    ],
    technicianOnly: ['Replace the chuck, or service the gearbox.'],
  },
  // ── E-bike / scooter ───────────────────────────────────────────────────────
  {
    id: 'ebike-no-power',
    deviceType: 'e_bike_scooter',
    fault: 'Electric bike or scooter will not power on or has lost range',
    keywords: [
      'no power', 'wont turn on', 'dead', 'battery', 'range', 'short range', 'display', 'error',
      'charger', 'charge', 'not charging', 'cuts out', 'cuts off', 'throttle', 'motor', 'assist',
    ],
    explanation:
      'The battery pack is the heart of an e-bike. A pack that has lost range is ageing, and one that will not power on may have a fault in the battery management system, a loose connector or a bad charger.',
    checks: [
      'Make sure the key, the power switch and the display are all on, and the battery sits firmly in its mount.',
      'Look at the charger lights, and try charging, only using the charger supplied with it.',
      'Look at the battery casing for dents, cracks, swelling or a burning smell. If you see any, stop.',
      'Check that the brake levers have not cut the motor via the safety switch, and look at the display for an error code.',
    ],
    technicianOnly: [
      'Do not open a battery pack. Only a trained technician should test or repair it.',
      'Test the controller and the connectors.',
    ],
  },
  {
    id: 'ebike-battery-damaged',
    deviceType: 'e_bike_scooter',
    fault: 'Electric bike or scooter battery swollen, hot, wet or damaged',
    keywords: [
      'swollen', 'bulging', 'hot', 'burning smell', 'smoke', 'hissing', 'cracked', 'damaged',
      'dropped', 'crash', 'water', 'wet', 'rain', 'fire', 'dented', 'leak', 'melted',
    ],
    explanation:
      'A large lithium battery that has been crushed, soaked or overheated can burst into a fire that is very hard to put out. This is not a case for testing.',
    checks: [
      'Do not charge or use it. Move it outdoors, or away from anything that burns, if it is safe to do so.',
      'If it is smoking, hissing or very hot, keep away and call the emergency services.',
      'Hand it to a technician or a battery-recycling point; never leave it in a home or a car.',
    ],
    technicianOnly: ['Treat as a damaged lithium pack: isolate, record and dispose of it safely.'],
  },
  {
    id: 'ebike-brakes-tyres',
    deviceType: 'e_bike_scooter',
    fault: 'Brakes weak, puncture, noisy chain or loose parts on an electric bike or scooter',
    keywords: [
      'brakes', 'weak brakes', 'squeal', 'puncture', 'flat tyre', 'flat tire', 'chain', 'noisy',
      'loose', 'wobble', 'handlebar', 'spokes', 'wheel', 'creaking', 'slipping', 'gears',
    ],
    explanation:
      'The mechanical parts of an e-bike, such as brakes, tyres and chain, are the same as on any bike and wear faster because of the weight and speed.',
    checks: [
      'Switch the power off and remove the battery before touching the wheels.',
      'Squeeze the brake levers: they should feel firm, and not touch the handlebar.',
      'Check tyre pressure and look for punctures or a worn tread.',
      'Check the handlebar, the wheels and the folding joints for looseness.',
    ],
    technicianOnly: ['Adjust the brakes, replace pads or the chain; check the motor-cut-off sensors.'],
  },
];

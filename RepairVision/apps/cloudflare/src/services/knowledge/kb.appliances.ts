import type { KbEntry } from './kb.js';

// Mains-powered household appliances. Every check here is done unplugged and
// from the outside. Opening one of these is technician work, and for the
// microwave and the refrigerator a visitor is told to stop at looking.
export const APPLIANCES_KB: KbEntry[] = [
  // ── Kettle ─────────────────────────────────────────────────────────────────
  {
    id: 'kettle-not-heating',
    deviceType: 'kettle',
    fault: 'Kettle does not heat or switches off before boiling',
    keywords: [
      'wont heat', 'not heating', 'dead', 'no power', 'switches off', 'clicks off', 'wont boil',
      'light', 'base', 'power base', 'limescale', 'scale', 'thermostat', 'cuts out', 'tripped',
    ],
    explanation:
      'Limescale on the element or the steam sensor makes a kettle switch off too early. A kettle that is dead has a fault in the power base, the plug or the thermostat.',
    checks: [
      'Unplug it. Look at the plug pins and the lead for burn marks, cuts or damage.',
      'Test the wall socket with another appliance.',
      'Lift the kettle off and on its base, and look for dirt or scorching on the contacts.',
      'Descale it with white vinegar or citric acid according to the instructions, then rinse well.',
    ],
    technicianOnly: [
      'Replace the thermostat or the element.',
      'Test the power base and its contacts.',
    ],
  },
  {
    id: 'kettle-leak',
    deviceType: 'kettle',
    fault: 'Kettle leaking from the base or the spout',
    keywords: [
      'leak', 'leaking', 'drip', 'dripping', 'water underneath', 'seal', 'gasket', 'crack',
      'wet', 'puddle', 'element seal', 'base', 'damp', 'cracked',
    ],
    explanation:
      'A leak means the seal around the element has failed or the body has cracked. Water near the mains connection is dangerous.',
    checks: [
      'Unplug it and do not use it again.',
      'Dry it and find out where the water comes from, noting whether it leaks when filled or only when heating.',
      'Check the power base is completely dry before plugging anything in.',
    ],
    technicianOnly: ['Replace the element seal, or replace the kettle.'],
  },
  // ── Toaster ────────────────────────────────────────────────────────────────
  {
    id: 'toaster-wont-stay-down',
    deviceType: 'toaster',
    fault: 'Toaster lever will not stay down or pops up early',
    keywords: [
      'wont stay down', 'pops up', 'lever', 'no heat', 'not toasting', 'latch', 'solenoid',
      'magnet', 'crumbs', 'stuck', 'wont pop up', 'timer', 'springs', 'down',
    ],
    explanation:
      'The lever is held down by an electromagnet that only works when the toaster has power. If it does not stay down, there is no power, or crumbs or a stuck carriage stop it latching.',
    checks: [
      'Unplug it. Check the plug, lead and wall socket.',
      'Turn it upside down over a bin and shake out crumbs.',
      'Check the lever moves freely, and that nothing is wedged in a slot.',
      'Never use a knife or a fork to dig out a stuck slice while it is plugged in.',
    ],
    technicianOnly: ['Replace the electromagnet, the timer or the lever carriage.'],
  },
  {
    id: 'toaster-uneven-burning',
    deviceType: 'toaster',
    fault: 'Toaster toasting unevenly, burning, or one side not working',
    keywords: [
      'uneven', 'burnt', 'burning', 'one side', 'not toasting', 'too dark', 'too light',
      'element', 'heating element', 'dial', 'pale', 'smoke', 'smell', 'smoking',
    ],
    explanation:
      'Elements fail one at a time, so one side of the toast stays pale. Crumbs on the elements burn and smoke. A dial that no longer matches its setting means the timer has drifted.',
    checks: [
      'Unplug it and let it cool. Look into the slots with a torch and check the elements all glow in a trial run.',
      'Empty the crumb tray and shake out crumbs.',
      'If it smokes with no bread in it, stop using it.',
    ],
    technicianOnly: ['Replace the element or the timer assembly.'],
  },
  // ── Coffee machine ─────────────────────────────────────────────────────────
  {
    id: 'coffee-no-water',
    deviceType: 'coffee_machine',
    fault: 'Coffee machine pumps no water, or flow is slow',
    keywords: [
      'no water', 'wont brew', 'slow', 'trickle', 'blocked', 'limescale', 'scale', 'descale',
      'pump', 'noise', 'loud pump', 'air lock', 'tank', 'drips', 'wont pump',
    ],
    explanation:
      'Limescale blocks the narrow pipes, and an air lock stops a pump from priming. A tank that is not seated properly also gives no water.',
    checks: [
      'Unplug it. Check the water tank is full and sits firmly on its valve.',
      'Run a descaling cycle with a descaler suited to the machine.',
      'Prime the pump by running water through without a coffee pod or grounds.',
      'Check the filter or the portafilter is not clogged.',
    ],
    technicianOnly: ['Replace the pump or clear the blocked pipework.'],
  },
  {
    id: 'coffee-leak-or-cold',
    deviceType: 'coffee_machine',
    fault: 'Coffee machine leaking or making lukewarm coffee',
    keywords: [
      'leak', 'leaking', 'cold', 'lukewarm', 'not hot', 'drips', 'seal', 'gasket', 'water on counter',
      'brew head', 'puddle', 'overflow', 'temperature', 'weak coffee', 'heater',
    ],
    explanation:
      'A worn gasket or seal in the brew head lets water run out around the sides, and a machine that gives lukewarm coffee has a failing heating element or a scaled-up boiler.',
    checks: [
      'Unplug it and look for a worn or cracked gasket round the brew head.',
      'Check the drip tray is not overfull.',
      'Descale the machine, then retest the temperature of the coffee.',
    ],
    technicianOnly: ['Replace the gasket, the thermostat or the heating element.'],
  },
  // ── Iron ───────────────────────────────────────────────────────────────────
  {
    id: 'iron-not-heating',
    deviceType: 'iron',
    fault: 'Iron not heating, or not hot enough',
    keywords: [
      'not heating', 'cold', 'wont heat', 'lukewarm', 'dead', 'no light', 'thermostat',
      'dial', 'cable', 'lead', 'plug', 'cuts out', 'temperature', 'power', 'heat',
    ],
    explanation:
      'A dead iron often has a damaged lead, because the cable is flexed all the time. A weak iron may have a drifting thermostat.',
    checks: [
      'Unplug it. Examine the lead for fraying, twists or scorching, especially where it enters the iron.',
      'Check the wall socket with another appliance.',
      'Turn the temperature dial through its range and listen for the click of the thermostat.',
      'Stop using an iron with a damaged lead.',
    ],
    technicianOnly: ['Replace the lead, or the thermostat.'],
  },
  {
    id: 'iron-steam-leak',
    deviceType: 'iron',
    fault: 'Iron leaking water, spitting, or not producing steam',
    keywords: [
      'leak', 'leaking', 'spitting', 'no steam', 'drips', 'water', 'brown water', 'stains',
      'limescale', 'scale', 'descale', 'blocked', 'holes', 'soleplate', 'steam', 'dripping',
    ],
    explanation:
      'Limescale blocks the steam holes and flakes off to stain clothes. Spitting is also caused by ironing at too low a temperature for steam.',
    checks: [
      'Unplug it and empty the tank.',
      'Descale it as the instructions say, using the self-clean function if it has one.',
      'Use water as the maker advises, and set a high enough temperature for steam.',
      'Check the tank cap and seal are closed.',
    ],
    technicianOnly: ['Replace the water pump or the tank seals.'],
  },
  // ── Hair dryer ─────────────────────────────────────────────────────────────
  {
    id: 'hairdryer-no-heat',
    deviceType: 'hair_dryer',
    fault: 'Hair dryer blows cold, stops after a few minutes or has no power',
    keywords: [
      'no heat', 'cold air', 'blows cold', 'stops', 'cuts out', 'overheats', 'shuts off',
      'filter', 'blocked', 'dust', 'hair', 'lint', 'smell', 'burning smell', 'dead',
    ],
    explanation:
      'A blocked rear filter makes the dryer overheat and trip its safety cut-out. It then cools, and works again after a rest.',
    checks: [
      'Unplug it and let it cool.',
      'Remove the rear grille and clear the fluff and hair from it.',
      'Check the lead for damage, especially near the handle.',
      'If it smells of burning or sparks, stop using it and do not try again.',
    ],
    technicianOnly: ['Replace the heating element, thermal fuse or switch.'],
  },
  {
    id: 'hairdryer-noise-switch',
    deviceType: 'hair_dryer',
    fault: 'Hair dryer loud, rattling, or switch not working',
    keywords: [
      'noisy', 'loud', 'rattle', 'grinding', 'squeal', 'switch', 'speed', 'heat setting',
      'button', 'fan', 'blade', 'vibrate', 'stuck', 'hum', 'hairs wrapped',
    ],
    explanation:
      'Hair wound round the fan shaft makes grinding noises, and the multi-position switch is a common thing to wear out.',
    checks: [
      'Unplug it, and check the fan can be turned by hand without catching.',
      'Clear hair and dust from the intake and outlet.',
      'Try all the switch settings and note which fails.',
    ],
    technicianOnly: ['Replace the switch, or clear the fan.'],
  },
  // ── Electric shaver / toothbrush ───────────────────────────────────────────
  {
    id: 'shaver-not-charging',
    deviceType: 'electric_shaver',
    fault: 'Shaver or electric toothbrush will not charge or runs briefly',
    keywords: [
      'not charging', 'wont charge', 'battery', 'dies', 'short run', 'charger', 'base', 'stand',
      'contacts', 'induction', 'light', 'flat', 'toothbrush', 'shaver', 'charge',
    ],
    explanation:
      'Small rechargeable cells wear after some hundreds of charges. A charger base with dirty contacts, or a faulty charger, is a cheaper fault.',
    checks: [
      'Wipe the charging contacts on the device and base with a dry cloth.',
      'Try another socket, and check the charging light.',
      'Check the charger is the one that came with the device.',
      'Do not use or charge the device if it is hot or swollen.',
    ],
    technicianOnly: ['Replace the battery or the charger.'],
  },
  {
    id: 'shaver-weak-cut',
    deviceType: 'electric_shaver',
    fault: 'Shaver cuts badly, or toothbrush head vibrates weakly',
    keywords: [
      'weak', 'pulls', 'not cutting', 'blunt', 'dull', 'foil', 'blades', 'head', 'worn',
      'noisy', 'vibration', 'brush head', 'hairs', 'clogged', 'oil', 'dirty',
    ],
    explanation:
      'Foils and blades wear and need replacing about every year or two. Clogged hair slows the motor.',
    checks: [
      'Clean out the cutting head and brush the hair out.',
      'Check whether the foil or the cutters are bent or worn.',
      'Fit a new head or brush head and compare.',
    ],
    technicianOnly: [],
  },
  // ── Vacuum cleaner ─────────────────────────────────────────────────────────
  {
    id: 'vacuum-weak-suction',
    deviceType: 'vacuum_cleaner',
    fault: 'Vacuum cleaner has weak suction or smells',
    keywords: [
      'weak suction', 'no suction', 'loses suction', 'blocked', 'clogged', 'filter', 'bag',
      'full', 'hose', 'pipe', 'smell', 'dust', 'brush', 'pick up', 'poor',
    ],
    explanation:
      'Nearly all weak suction is a blockage: a full bag or bin, a clogged filter, or a blocked hose. A burning smell may be a belt slipping or a motor straining.',
    checks: [
      'Unplug it. Empty the bin or change the bag.',
      'Wash or replace the filters as the instructions say, and let them dry completely.',
      'Check the hose and pipe for a blockage, by looking through them or by passing a long pole through.',
      'Look at the brush head for hair or thread wrapped round it.',
    ],
    technicianOnly: ['Replace the motor or the sealing gaskets.'],
  },
  {
    id: 'vacuum-brush-belt',
    deviceType: 'vacuum_cleaner',
    fault: 'Vacuum brush roll not spinning, belt broken, or battery vacuum cutting out',
    keywords: [
      'brush not spinning', 'brush roll', 'belt', 'snapped', 'burning smell', 'stops', 'cuts out',
      'cordless', 'battery', 'overheats', 'hair', 'wound', 'charge', 'runs short', 'rubber',
    ],
    explanation:
      'A rubber belt drives the brush, and it stretches or snaps. Hair wrapped around the brush overloads it. A cordless vacuum that cuts out is usually overheating or has a tired battery.',
    checks: [
      'Unplug it or take out the battery before looking at the brush.',
      'Cut away hair and thread wound round the brush, and spin it by hand.',
      'Look for a snapped belt.',
      'For a cordless one, leave it to cool and check the battery and charger.',
    ],
    technicianOnly: ['Fit a new belt, or replace the battery pack.'],
  },
  // ── Microwave ──────────────────────────────────────────────────────────────
  {
    id: 'microwave-not-heating',
    deviceType: 'microwave',
    fault: 'Microwave runs but does not heat, or does not run at all',
    keywords: [
      'not heating', 'no heat', 'cold', 'wont start', 'dead', 'light works', 'turntable', 'door',
      'noise', 'humming', 'buzz', 'spark', 'sparking', 'arcing', 'display', 'plate',
    ],
    explanation:
      'A microwave that spins and lights up but does not heat has a fault in the high-voltage section. That section stores a lethal charge even when the microwave is unplugged.',
    checks: [
      'Unplug it. Do not use it again if it sparks or smells of burning.',
      'Check the plug and lead for damage, and the wall socket with another appliance.',
      'Look into the cooking space for burn or arcing marks. Do not remove any cover or panel.',
      'Check the door closes firmly and the seal is not damaged.',
    ],
    technicianOnly: [
      'Do not open a microwave. Only a trained technician should discharge its capacitor and work inside.',
      'Replace the magnetron, diode or capacitor, or advise replacing the whole unit.',
    ],
  },
  {
    id: 'microwave-door-turntable',
    deviceType: 'microwave',
    fault: 'Microwave door does not close, or turntable does not turn',
    keywords: [
      'door', 'wont close', 'latch', 'hinge', 'broken door', 'turntable', 'not turning', 'plate',
      'roller', 'ring', 'coupler', 'rattles', 'seal', 'handle', 'wont open', 'display',
    ],
    explanation:
      'A door that does not close squarely may bypass the safety switches, which is a safety fault. A turntable that does not turn is usually a missing roller ring or a worn coupler, and is much simpler.',
    checks: [
      'Unplug it. Lift out the glass plate and the roller ring and check the ring is seated.',
      'Check the plate sits properly on its coupler.',
      'Do not use a microwave whose door is bent, damaged, or does not shut firmly.',
    ],
    technicianOnly: ['Replace the door latches, hinges or interlock switches.'],
  },
  // ── Washing machine ────────────────────────────────────────────────────────
  {
    id: 'washer-no-drain',
    deviceType: 'washing_machine',
    fault: 'Washing machine will not drain or spin',
    keywords: [
      'not draining', 'wont drain', 'water left', 'wont spin', 'stuck', 'full of water', 'pump',
      'filter', 'blocked', 'coin', 'sock', 'hose', 'error', 'code', 'locked door', 'wont open',
    ],
    explanation:
      'A machine that stops with water left in the drum most often has a blocked pump filter or drain hose. Coins and socks get stuck there.',
    checks: [
      'Switch it off at the wall. Check the drain hose for kinks and that it is not pushed too far into the standpipe.',
      'Clean the pump filter, usually behind a small panel at the bottom front. Place a towel and a shallow tray first.',
      'Check the drum is not overloaded, and that clothes are not bunched on one side.',
      'Note any error code shown.',
    ],
    technicianOnly: ['Replace the drain pump, or clear the hose.'],
  },
  {
    id: 'washer-leak-noise',
    deviceType: 'washing_machine',
    fault: 'Washing machine leaking, noisy or shaking',
    keywords: [
      'leak', 'leaking', 'puddle', 'noisy', 'loud', 'shakes', 'walks', 'vibrates', 'bangs',
      'grinding', 'rumble', 'door seal', 'hose', 'bearing', 'unbalanced', 'feet',
    ],
    explanation:
      'A leak from the door usually means a torn rubber seal or a worn detergent drawer. A noisy and shaking machine is usually unlevel or overloaded, and a rumble that gets worse points to worn drum bearings.',
    checks: [
      'Switch it off at the wall and find out where the water comes from, the door seal, the drawer or the back hoses.',
      'Check the door seal for tears and trapped items.',
      'Check the machine is level on all four feet and the transit bolts were removed.',
      'Spin the empty drum by hand and listen for roughness.',
    ],
    technicianOnly: ['Replace the door seal, hoses or drum bearings.'],
  },
  // ── Refrigerator ───────────────────────────────────────────────────────────
  {
    id: 'fridge-not-cooling',
    deviceType: 'refrigerator',
    fault: 'Refrigerator not cold enough, noisy, or icing up',
    keywords: [
      'not cold', 'warm', 'not cooling', 'noisy', 'humming', 'clicking', 'ice', 'frost', 'icing',
      'door seal', 'water', 'leak', 'fridge', 'freezer', 'compressor', 'running constantly',
    ],
    explanation:
      'A fridge that warms up often has a door seal that does not close, a blocked airflow, or dirty coils. The sealed cooling system, with its refrigerant, is never a visitor repair.',
    checks: [
      'Check the temperature setting, and that the door shuts fully with nothing blocking it.',
      'Check the rubber door seal for gaps with a sheet of paper: it should grip when the door is closed.',
      'Check that the vents inside are not blocked by food, and that there is space behind and around the fridge.',
      'Defrost a freezer that has built up thick ice.',
    ],
    technicianOnly: [
      'Clean the condenser coils.',
      'Sealed refrigerant system: only a qualified technician may touch the compressor or gas.',
    ],
  },
  {
    id: 'fridge-leak-light',
    deviceType: 'refrigerator',
    fault: 'Refrigerator leaking water inside or underneath, or light not working',
    keywords: [
      'leak', 'leaking', 'water inside', 'water underneath', 'puddle', 'drain', 'blocked drain',
      'light', 'bulb', 'door switch', 'smell', 'dripping', 'ice maker', 'water dispenser', 'dispenser',
    ],
    explanation:
      'Water pooling in the bottom of the fridge is usually a blocked defrost drain. A light that does not come on is a simple bulb, or a door switch.',
    checks: [
      'Find the drain hole at the back of the fridge compartment and clear it with warm water and a soft cotton bud.',
      'Check the drip tray under the fridge.',
      'For the light, switch off at the wall first and see whether the bulb is a standard type.',
      'Check that water supply pipes for any dispenser are not kinked.',
    ],
    technicianOnly: ['Replace the door switch or the water valve.'],
  },
  // ── Sewing machine ─────────────────────────────────────────────────────────
  {
    id: 'sewing-skipped-stitches',
    deviceType: 'sewing_machine',
    fault: 'Sewing machine skipping stitches, breaking thread or jamming',
    keywords: [
      'skipped stitches', 'skipping', 'thread breaks', 'breaking thread', 'jam', 'jammed', 'bird nest',
      'tangled', 'tension', 'needle', 'bent needle', 'bobbin', 'threading', 'loose stitches', 'loops',
    ],
    explanation:
      'Most stitch problems come from threading. A blunt or bent needle and wrong tension are the next most common causes, and fluff in the bobbin area causes jams.',
    checks: [
      'Switch it off. Rethread the machine completely, with the presser foot raised.',
      'Fit a new needle, the right size and type for the fabric, inserted fully and the right way round.',
      'Take out the bobbin and brush the fluff from under the needle plate.',
      'Test on a scrap of fabric with the tension at the middle setting.',
    ],
    technicianOnly: ['Service the machine: adjust the timing and lubricate it.'],
  },
  {
    id: 'sewing-no-motion',
    deviceType: 'sewing_machine',
    fault: 'Sewing machine not running, slow, or foot pedal not responding',
    keywords: [
      'wont run', 'not running', 'slow', 'pedal', 'foot pedal', 'motor', 'stuck', 'stiff', 'hand wheel',
      'dead', 'no power', 'light works', 'clutch', 'locked', 'wont sew', 'jerky',
    ],
    explanation:
      'If the light comes on but the machine does not run, the foot pedal or its lead is a common cause. A stiff hand wheel can mean thread jammed in the bobbin area, or lack of oil.',
    checks: [
      'Switch it off. Turn the hand wheel gently towards you and check it moves freely.',
      'Check the foot pedal lead and plug are firm and not damaged.',
      'Check the bobbin winder is disengaged, as the clutch can leave the needle stopped.',
      'Remove the needle plate and clear the thread.',
    ],
    technicianOnly: ['Replace the foot controller, the belt or the motor.'],
  },
];

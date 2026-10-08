import type { KbEntry } from './kb.js';

// Phones, tablets, smartwatches and power banks. All hold a lithium battery,
// so no entry asks a visitor to open the device.
export const PHONES_POWER_KB: KbEntry[] = [
  // ── Smartphone ─────────────────────────────────────────────────────────────
  {
    id: 'phone-not-charging',
    deviceType: 'smartphone',
    fault: 'Phone not charging, or only charging when the cable is held',
    keywords: [
      'not charging', 'wont charge', 'slow charging', 'charging port', 'charge', 'charger',
      'cable', 'lint', 'loose', 'wiggle', 'intermittent', 'battery', 'plug', 'usb c',
      'lightning', 'micro usb',
    ],
    explanation:
      'Pocket lint packs into the charging port and stops the plug seating fully. Cables and chargers also wear out far more often than the phone does.',
    checks: [
      'Try a different cable and a different charger or wall socket.',
      'Shine a torch into the charging port and look for lint or debris.',
      'Restart the phone and plug it in for at least half an hour.',
      'Check whether the plug wobbles or falls out.',
    ],
    technicianOnly: [
      'Clean the port with a wooden or plastic pick while the phone is off.',
      'Replace the charging port or the battery.',
    ],
  },
  {
    id: 'phone-battery-drain',
    deviceType: 'smartphone',
    fault: 'Battery draining fast, or phone shutting off suddenly',
    keywords: [
      'battery drains', 'drains fast', 'dies', 'shuts off', 'turns off', 'percent', 'old battery',
      'cold', 'hot', 'swollen', 'battery health', 'apps', 'background', 'lasts', 'hours',
    ],
    explanation:
      'Batteries lose capacity with age, and a worn one may drop from a normal level to zero quickly. A busy app in the background, or a bad signal, can drain a healthy battery too.',
    checks: [
      'Check the battery usage list in settings to see which app is using the most.',
      'Check the battery health setting if the phone has one.',
      'Look at the back and sides of the phone: if the case is bulging or lifting, stop using it.',
      'Restart the phone and update its software.',
    ],
    technicianOnly: ['Replace the battery.'],
  },
  {
    id: 'phone-screen-touch',
    deviceType: 'smartphone',
    fault: 'Cracked screen, ghost touches or unresponsive touch',
    keywords: [
      'cracked', 'screen', 'touch', 'unresponsive', 'ghost touch', 'dead zone', 'lines', 'black',
      'dropped', 'broken', 'display', 'green line', 'flicker', 'not responding', 'glass',
    ],
    explanation:
      'A crack can break the touch layer even if the picture still shows. Ghost touches, with no crack, are often caused by a screen protector, a dirty or damp screen, or a software fault.',
    checks: [
      'Wipe the screen with a dry cloth and take off any screen protector and case.',
      'Restart the phone, and try booting into safe mode if the phone has one.',
      'Keep sharp glass covered with clear tape to avoid cuts.',
      'Note whether the dead area is always in the same place.',
    ],
    technicianOnly: ['Replace the display assembly.'],
  },
  {
    id: 'phone-water-damage',
    deviceType: 'smartphone',
    fault: 'Phone exposed to water or liquid',
    keywords: [
      'water', 'wet', 'dropped in', 'rain', 'toilet', 'sink', 'liquid', 'drink', 'moisture',
      'fogged', 'spilled', 'swim', 'submerged', 'damp',
    ],
    explanation:
      'Liquid causes damage over time through corrosion, so the first minutes matter most. Powering on a wet phone or charging it can short the board.',
    checks: [
      'Switch the phone off at once and do not charge it.',
      'Take the phone out of its protective cover and, if you can, remove the SIM tray.',
      'Wipe the outside and leave it to dry in a warm, airy place for at least a day. Uncooked rice does not help.',
    ],
    technicianOnly: ['Open the phone and clean the corrosion with isopropyl alcohol.'],
  },
  // ── Tablet ─────────────────────────────────────────────────────────────────
  {
    id: 'tablet-charging',
    deviceType: 'tablet',
    fault: 'Tablet will not charge or turn on',
    keywords: [
      'not charging', 'wont charge', 'wont turn on', 'dead', 'black screen', 'battery',
      'charger', 'cable', 'port', 'power button', 'slow charge', 'charging port', 'flat',
    ],
    explanation:
      'A deeply drained tablet may show nothing for several minutes after being plugged in. Chargers with too low a rating also fail to charge a tablet while it is in use.',
    checks: [
      'Charge it for an hour with a charger of the right rating before judging.',
      'Try a different cable and a different socket.',
      'Look into the charging port for lint.',
      'Hold the power button for ten to fifteen seconds to force a restart.',
    ],
    technicianOnly: ['Replace the charging port or the battery.'],
  },
  {
    id: 'tablet-screen',
    deviceType: 'tablet',
    fault: 'Tablet screen cracked, unresponsive, or showing lines',
    keywords: [
      'cracked', 'screen', 'touch', 'unresponsive', 'lines', 'flicker', 'black', 'ghost touch',
      'broken', 'dropped', 'display', 'dead spot', 'glass', 'dim',
    ],
    explanation:
      'The glass, touch layer and display are fused on most tablets, so a crack can affect touch even if the picture is fine.',
    checks: [
      'Restart the tablet and remove any case or protector.',
      'Wipe the screen with a dry cloth and check for a pattern in the dead areas.',
      'Cover sharp glass with clear tape.',
    ],
    technicianOnly: ['Replace the screen assembly.'],
  },
  {
    id: 'tablet-slow-storage',
    deviceType: 'tablet',
    fault: 'Tablet very slow, full or freezing',
    keywords: [
      'slow', 'freezes', 'lag', 'full', 'storage', 'memory', 'crashes', 'apps close',
      'update', 'restart', 'hangs', 'stuck', 'frozen',
    ],
    explanation:
      'Tablets slow down badly when storage is nearly full or when they are left without updates. This is a software fault, and fixing it does not need any tools.',
    checks: [
      'Check the free storage in settings, and clear out photos, videos and unused apps.',
      'Restart the tablet and install pending updates.',
      'Note whether one app is slow or the whole tablet is.',
    ],
    technicianOnly: ['Back up the data and reset the tablet to factory settings.'],
  },
  // ── Smartwatch ─────────────────────────────────────────────────────────────
  {
    id: 'watch-charging',
    deviceType: 'smartwatch',
    fault: 'Smartwatch will not charge',
    keywords: [
      'not charging', 'wont charge', 'charger', 'dock', 'magnetic', 'contacts', 'dirty',
      'sweat', 'dead', 'battery', 'cradle', 'puck', 'cable', 'wont turn on',
    ],
    explanation:
      'The charging contacts on the back of a watch collect sweat and skin oil, which blocks the connection. The charging dock itself also wears out.',
    checks: [
      'Wipe the back of the watch and the charger contacts with a dry cloth.',
      'Check that the watch sits flat and correctly aligned on the dock.',
      'Try a different cable and power source, not a fast charger.',
    ],
    technicianOnly: ['Replace the battery or the charging coil.'],
  },
  {
    id: 'watch-battery-screen',
    deviceType: 'smartwatch',
    fault: 'Smartwatch battery draining, or screen unresponsive',
    keywords: [
      'battery drains', 'drains fast', 'dies', 'screen', 'unresponsive', 'touch', 'frozen',
      'notifications', 'always on', 'display', 'brightness', 'old', 'restart', 'bluetooth',
    ],
    explanation:
      'Always-on screens, heart-rate tracking and constant notifications drain a watch quickly. After a few years, the battery also loses capacity.',
    checks: [
      'Restart the watch, and check the battery usage in the companion app.',
      'Turn off the always-on display and lower the brightness.',
      'Look at the back of the watch: if the case is lifting or swollen, stop wearing it.',
    ],
    technicianOnly: ['Replace the battery.'],
  },
  {
    id: 'watch-strap-sensor',
    deviceType: 'smartwatch',
    fault: 'Broken strap, or heart-rate sensor reading wrongly',
    keywords: [
      'strap', 'band', 'broken strap', 'lug', 'pin', 'heart rate', 'sensor', 'reading wrong',
      'not reading', 'fit', 'loose', 'sweat', 'tattoo', 'clasp', 'buckle',
    ],
    explanation:
      'Straps wear and break at the pins where they attach, and a loose fit or dirt on the sensor makes a heart-rate reading unreliable.',
    checks: [
      'Wipe the sensor on the back of the watch and check it is not scratched.',
      'Wear the watch snug, a finger-width above the wrist bone.',
      'Check that the strap pins click firmly into place; try a spare strap.',
    ],
    technicianOnly: ['Replace the strap pins or the case back sensor.'],
  },
  // ── Power bank ─────────────────────────────────────────────────────────────
  {
    id: 'powerbank-not-charging-out',
    deviceType: 'power_bank',
    fault: 'Power bank will not charge itself or will not charge a device',
    keywords: [
      'not charging', 'wont charge', 'no output', 'dead', 'lights', 'indicator', 'flat',
      'cable', 'port', 'wont hold charge', 'drains', 'capacity', 'power bank', 'battery pack',
    ],
    explanation:
      'A power bank that will not take or give charge is often a bad cable or port, or its battery cells have aged. Cheap ones lose capacity quickly.',
    checks: [
      'Try a different cable, charger and device.',
      'Look at the indicator lights while plugging it in and note what they do.',
      'Check the ports for lint, bent metal or burn marks.',
    ],
    technicianOnly: [
      'Do not open a power bank. Take it to a technician or a battery-recycling point.',
    ],
  },
  {
    id: 'powerbank-swollen-hot',
    deviceType: 'power_bank',
    fault: 'Power bank swollen, very hot or smelling: unsafe battery',
    keywords: [
      'swollen', 'bulging', 'puffy', 'hot', 'very hot', 'burning smell', 'smell', 'smoke',
      'leak', 'crack', 'case split', 'melted', 'hissing', 'dented', 'fire',
    ],
    explanation:
      'A swollen or overheating lithium cell is damaged inside and can catch fire. This is a safety problem and the device should not be tested further.',
    checks: [
      'Stop using it. Do not charge it again, and do not press or pierce it.',
      'Put it on a non-flammable surface away from anything that burns.',
      'Take it to a technician or a battery-recycling point; do not put it in the bin.',
    ],
    technicianOnly: ['Handle as a damaged lithium cell. Do not return it to the visitor.'],
  },
  {
    id: 'powerbank-wrong-cable',
    deviceType: 'power_bank',
    fault: 'Power bank charges only slowly or turns off by itself',
    keywords: [
      'slow', 'turns off', 'switches off', 'low current', 'auto off', 'small device', 'earbuds',
      'watch', 'button', 'timeout', 'stops charging', 'fast charge', 'cable', 'shuts off',
    ],
    explanation:
      'Many power banks switch off when the device draws very little current, which suits earbuds and watches poorly. A thin cable limits charging speed.',
    checks: [
      'Press the power bank’s button to wake it, or check for a low-current mode.',
      'Try a thicker, shorter cable that is rated for charging.',
      'Check the power bank is itself charged.',
    ],
    technicianOnly: ['Do not open a power bank. Test it only with a USB power meter.'],
  },
];

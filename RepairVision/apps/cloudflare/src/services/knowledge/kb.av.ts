import type { KbEntry } from './kb.js';

// Headphones, speakers, televisions, remotes, cameras and radios.
export const AUDIO_VIDEO_KB: KbEntry[] = [
  // ── Wired headphones ───────────────────────────────────────────────────────
  {
    id: 'headphones-one-side',
    deviceType: 'wired_headphones',
    fault: 'Sound only in one ear, or cutting in and out',
    keywords: [
      'one side', 'one ear', 'left', 'right', 'cuts out', 'intermittent', 'crackle', 'crackling',
      'static', 'wiggle', 'cable', 'jack', 'plug', 'only works when', 'bent', 'earbud',
    ],
    explanation:
      'The wires inside an audio cable break where the cable bends most: at the jack and at the earpieces. A broken wire to one side gives one-sided sound, and a half-broken one crackles.',
    checks: [
      'Try them on another phone or player to rule out the device.',
      'Push the plug fully in and rotate it; check that the sound changes.',
      'Wiggle the cable near the plug, then near each earpiece while music plays, and listen for the cut-out.',
      'Look inside the socket on the device for lint, as it stops the plug going in fully.',
    ],
    technicianOnly: ['Cut back to the break and re-solder, or fit a new plug.'],
  },
  {
    id: 'headphones-no-sound-mic',
    deviceType: 'wired_headphones',
    fault: 'No sound, or microphone not working on wired headphones',
    keywords: [
      'no sound', 'silent', 'quiet', 'low volume', 'mic', 'microphone', 'not picked up',
      'call', 'volume', 'mute', 'in-line', 'remote', 'ear tips', 'wax', 'blocked',
    ],
    explanation:
      'Quiet sound in earbuds is very often a blocked nozzle, with wax or dirt in the mesh. A microphone that does not work can come from a mute switch, a dirty plug ring or wrong plug type.',
    checks: [
      'Look at the earbud mesh for wax or dirt, and clean it gently with a dry soft brush.',
      'Check the in-line volume and mute buttons.',
      'Check that the device settings select the headphones for sound and the mic.',
      'Check that the plug has the right number of rings for the device (some phones and computers differ).',
    ],
    technicianOnly: [],
  },
  {
    id: 'headphones-pads-band',
    deviceType: 'wired_headphones',
    fault: 'Broken headband, worn ear pads or loose hinge',
    keywords: [
      'headband', 'snapped', 'cracked', 'ear pads', 'peeling', 'flaking', 'cushion', 'hinge',
      'loose', 'sliding', 'adjust', 'broken', 'plastic', 'earcup', 'over-ear',
    ],
    explanation:
      'Pads break down with age and sweat, and plastic headbands crack at the hinges. The sound is usually fine and the fault is purely physical.',
    checks: [
      'Look at where the headband meets the earcups for cracks.',
      'Remove peeling pads gently; many clip on and can be replaced.',
      'Check the slider holds its position when adjusted.',
    ],
    technicianOnly: ['Replace the pads, or glue or splint a cracked band.'],
  },
  // ── Bluetooth speaker ──────────────────────────────────────────────────────
  {
    id: 'speaker-no-pair',
    deviceType: 'bluetooth_speaker',
    fault: 'Bluetooth speaker will not pair or keeps disconnecting',
    keywords: [
      'pair', 'pairing', 'bluetooth', 'wont connect', 'disconnects', 'drops', 'not found',
      'connection', 'range', 'forget', 'reset', 'paired', 'cuts out', 'connect',
    ],
    explanation:
      'A speaker that is already paired to another device will not appear for a new one. Old pairings and distance cause dropouts.',
    checks: [
      'Turn Bluetooth off on other nearby devices that it may have paired with before.',
      'Remove the speaker from the phone’s saved devices and pair it again.',
      'Hold the speaker’s pairing button until the light flashes quickly.',
      'Try with the speaker and phone close together.',
    ],
    technicianOnly: [],
  },
  {
    id: 'speaker-no-sound-distorted',
    deviceType: 'bluetooth_speaker',
    fault: 'Speaker silent, crackling, distorted or very quiet',
    keywords: [
      'no sound', 'silent', 'quiet', 'distorted', 'crackle', 'crackling', 'buzz', 'rattle',
      'volume', 'tinny', 'blown', 'grille', 'bass', 'low battery', 'hiss',
    ],
    explanation:
      'Low battery lowers volume and distorts sound. Crackling at high volume can mean a damaged speaker cone, while a rattle usually means something loose inside.',
    checks: [
      'Charge the speaker fully before testing.',
      'Turn volume up on both the speaker and the phone and play something simple.',
      'Try a cable connection if the speaker has an aux input.',
      'Listen for rattles by tapping the speaker gently.',
    ],
    technicianOnly: ['Open the speaker and check the driver, connectors and amplifier.'],
  },
  {
    id: 'speaker-not-charging',
    deviceType: 'bluetooth_speaker',
    fault: 'Speaker not charging or battery draining quickly',
    keywords: [
      'not charging', 'wont charge', 'dies', 'battery', 'drains', 'charging port', 'charger',
      'cable', 'indicator', 'plugged in', 'only works plugged', 'hours', 'lasts',
    ],
    explanation:
      'A lithium battery wears out after a few hundred charges. The cable and the charging port are the more common culprits for a speaker that will not charge.',
    checks: [
      'Try a different cable and charger.',
      'Check whether the speaker works while plugged in.',
      'Look for lint in the charging port.',
      'Check the sides of the speaker for any bulging.',
    ],
    technicianOnly: ['Replace the battery or the charging port.'],
  },
  // ── Television ─────────────────────────────────────────────────────────────
  {
    id: 'tv-no-picture',
    deviceType: 'tv',
    fault: 'Television has power but no picture',
    keywords: [
      'no picture', 'black screen', 'sound but no picture', 'no signal', 'standby', 'red light',
      'backlight', 'hdmi', 'input', 'source', 'dark', 'flash', 'torch', 'blank',
    ],
    explanation:
      'A TV with sound but a dark screen has a backlight failure if a faint picture shows under a torch. A TV that shows "no signal" has a problem with the source or cable.',
    checks: [
      'Check the input source and try a different cable or device.',
      'Shine a torch close to the screen and look for a faint picture.',
      'Unplug the TV for a few minutes, then plug it in again.',
      'Note any pattern in the standby light, such as a number of flashes.',
    ],
    technicianOnly: [
      'Test the power board and the backlight strips. Parts inside a TV stay live after unplugging.',
    ],
  },
  {
    id: 'tv-wont-turn-on',
    deviceType: 'tv',
    fault: 'Television will not turn on or keeps restarting',
    keywords: [
      'wont turn on', 'no power', 'dead', 'clicking', 'restarts', 'boot loop', 'standby',
      'flashing light', 'remote', 'power button', 'tries to start', 'logo', 'stuck on logo',
    ],
    explanation:
      'A TV that clicks and does not start, or restarts in a loop, often has a failing power board or capacitor. A flat remote battery is the commonest false alarm.',
    checks: [
      'Try the buttons on the TV itself as well as the remote.',
      'Check the wall socket with another device, and any extension lead.',
      'Look for a standby light and count any blinks.',
      'Unplug it for ten minutes and try again.',
    ],
    technicianOnly: ['Test and replace the power board or capacitors.'],
  },
  {
    id: 'tv-lines-colours',
    deviceType: 'tv',
    fault: 'Lines, colour problems or a cracked panel on the television',
    keywords: [
      'lines', 'vertical lines', 'horizontal lines', 'tint', 'colours wrong', 'colors wrong',
      'cracked', 'broken screen', 'black patch', 'spot', 'pink', 'green', 'flicker', 'blotches',
    ],
    explanation:
      'Lines or colour problems can come from a loose internal cable or a damaged panel. A crack or black patch in the panel itself cannot usually be repaired cost-effectively.',
    checks: [
      'Check the picture from a different source to see whether the fault is in the TV.',
      'Press the menu button on the TV itself: if lines appear on the menu too, the problem is inside the TV.',
      'Look at the panel for a point of impact or a crack.',
    ],
    technicianOnly: ['Reseat the panel ribbon cables or replace the panel.'],
  },
  // ── Remote control ─────────────────────────────────────────────────────────
  {
    id: 'remote-not-working',
    deviceType: 'remote_control',
    fault: 'Remote control not working',
    keywords: [
      'remote', 'not working', 'no response', 'batteries', 'weak', 'infrared', 'ir',
      'buttons', 'range', 'sensor', 'pairing', 'bluetooth', 'dead', 'wont work',
    ],
    explanation:
      'Most remotes fail from flat or corroded batteries. Infrared remotes are line of sight, and can be tested because a phone camera can see the infrared light.',
    checks: [
      'Replace the batteries with fresh ones, checking the direction.',
      'Check inside the battery compartment for white or green corrosion.',
      'Point the remote at a phone camera and press a button: the light on the front of the remote should flash on screen.',
      'Check nothing blocks the TV’s sensor.',
    ],
    technicianOnly: ['Clean the battery contacts and the rubber button pad.'],
  },
  {
    id: 'remote-some-buttons',
    deviceType: 'remote_control',
    fault: 'Some remote buttons do not work or need hard pressing',
    keywords: [
      'some buttons', 'button', 'hard press', 'sticky', 'worn', 'rubber', 'dirty', 'spilled',
      'stuck', 'dead button', 'volume', 'channel', 'power', 'press',
    ],
    explanation:
      'The rubber pad inside a remote wears where it is pressed most. A carbon contact on the pad wears off, or dirt gets under the button.',
    checks: [
      'Try each button and note which fail.',
      'Wipe the remote with a barely damp cloth, with the batteries out.',
      'Shake out crumbs from the gaps.',
    ],
    technicianOnly: ['Open the remote and clean the rubber pad and board contacts with alcohol.'],
  },
  {
    id: 'remote-battery-corrosion',
    deviceType: 'remote_control',
    fault: 'Corroded battery compartment',
    keywords: [
      'corrosion', 'corroded', 'leaked', 'leak', 'white powder', 'green', 'crust', 'battery',
      'acid', 'compartment', 'springs', 'contacts', 'old batteries', 'crusty',
    ],
    explanation:
      'Leaked batteries leave a crust on the metal contacts that blocks the electrical connection, so the remote or toy seems dead.',
    checks: [
      'Wear gloves and avoid touching the crust or getting it in the eyes.',
      'Remove the old batteries and dispose of them properly.',
      'Look at how far the corrosion has spread across the contacts.',
    ],
    technicianOnly: ['Scrape the contacts clean, then wipe with vinegar or lemon juice and dry thoroughly.'],
  },
  // ── Digital camera ─────────────────────────────────────────────────────────
  {
    id: 'camera-wont-power',
    deviceType: 'digital_camera',
    fault: 'Camera will not turn on or battery will not hold charge',
    keywords: [
      'wont turn on', 'dead', 'battery', 'charger', 'does not charge', 'power', 'no response',
      'contacts', 'flat', 'dies quickly', 'lens error', 'shuts off', 'turns off',
    ],
    explanation:
      'A camera that does not start is most often a flat or worn battery, dirty battery contacts or a bad charger. Lens errors on start-up are a mechanical fault.',
    checks: [
      'Charge the battery fully, and try the camera with a second battery if there is one.',
      'Look at the battery and the camera contacts for dirt, and wipe with a dry cloth.',
      'Check that the memory card is firmly in, and try without it.',
    ],
    technicianOnly: ['Replace the battery, or repair the lens mechanism.'],
  },
  {
    id: 'camera-blurry-spots',
    deviceType: 'digital_camera',
    fault: 'Blurry photos, dark spots or smudges on pictures',
    keywords: [
      'blurry', 'blur', 'out of focus', 'spots', 'dark spots', 'smudge', 'smudges', 'dust',
      'lens', 'sensor', 'autofocus', 'hazy', 'dirty', 'fingerprint', 'focus',
    ],
    explanation:
      'A smeared lens gives hazy photos. Spots that appear in the same place in every picture are dust on the sensor, and autofocus can fail through wear.',
    checks: [
      'Wipe the front and the rear of the lens gently with a lens cloth.',
      'Take a photo of a bright plain wall and look for spots in the same place.',
      'Try manual focus, and a faster shutter speed to test for shake.',
    ],
    technicianOnly: ['Clean the sensor; repair the autofocus mechanism.'],
  },
  {
    id: 'camera-card-error',
    deviceType: 'digital_camera',
    fault: 'Camera card error: card not recognised or cannot save pictures',
    keywords: [
      'card error', 'memory card', 'sd card', 'not recognised', 'not recognized', 'cannot save',
      'locked', 'format', 'full', 'corrupt', 'no card', 'write protected', 'card',
    ],
    explanation:
      'The small lock switch on an SD card can slide into the locked position. Otherwise the card can be full, corrupt, or have dirty contacts.',
    checks: [
      'Slide the lock switch on the side of the card away from the locked position.',
      'Remove and reseat the card, wiping its gold contacts gently.',
      'Try a different card, and read the card on a computer to copy off the photos before formatting.',
    ],
    technicianOnly: ['Repair the card slot in the camera.'],
  },
  // ── Radio ──────────────────────────────────────────────────────────────────
  {
    id: 'radio-no-sound',
    deviceType: 'radio',
    fault: 'Radio silent, crackling or poor reception',
    keywords: [
      'no sound', 'silent', 'crackle', 'crackling', 'static', 'hiss', 'poor reception', 'weak',
      'fuzzy', 'aerial', 'antenna', 'volume', 'tuning', 'dial', 'noisy', 'fading', 'signal',
    ],
    explanation:
      'Poor radio reception is usually down to the aerial or its position. Crackling when the volume or tuning knob is turned is dirt in the control.',
    checks: [
      'Fully extend the aerial, or move the radio near a window.',
      'Check the batteries or the power adapter.',
      'Turn the volume and tuning knobs back and forth a few times to clear the dust.',
      'Try another station and another band.',
    ],
    technicianOnly: [
      'Clean the controls with contact cleaner. Do not open a mains radio while it is plugged in.',
    ],
  },
  {
    id: 'radio-batteries-power',
    deviceType: 'radio',
    fault: 'Radio dead or dim display: power or batteries',
    keywords: [
      'dead', 'no power', 'wont turn on', 'batteries', 'adapter', 'dim', 'display', 'clock reset',
      'flat', 'corroded', 'drains', 'plug', 'mains', 'socket', 'lights',
    ],
    explanation:
      'A radio that is dead or dim usually has flat or corroded batteries, or its mains adapter has failed.',
    checks: [
      'Fit fresh batteries and check the contacts for corrosion.',
      'Check the mains adapter has the right voltage printed on it, and try another socket.',
      'Look at the lead for damage, and unplug at once if anything looks burnt.',
    ],
    technicianOnly: ['Replace the adapter or repair the power socket.'],
  },
  {
    id: 'radio-dial-buttons',
    deviceType: 'radio',
    fault: 'Radio tuning dial, volume knob or buttons worn or stuck',
    keywords: [
      'dial', 'knob', 'tuning', 'stuck', 'loose', 'slipping', 'buttons', 'preset', 'scratchy',
      'jumpy', 'volume', 'wont tune', 'crunchy', 'worn', 'drifts', 'drifting',
    ],
    explanation:
      'The dial cord can slip, and volume and tuning controls get worn or dirty. The result is jumpy volume or a dial that moves without changing the station.',
    checks: [
      'Turn the controls slowly and feel for roughness or slipping.',
      'Check whether the knob is loose on its shaft.',
      'Note whether the station drifts when the radio warms up.',
    ],
    technicianOnly: ['Clean or replace the potentiometer or the dial cord.'],
  },
];

import type { KbEntry } from './kb.js';

// Computers, screens, printers, network gear and game controllers.
export const COMPUTING_KB: KbEntry[] = [
  // ── Laptop ─────────────────────────────────────────────────────────────────
  {
    id: 'laptop-no-power',
    deviceType: 'laptop',
    fault: 'Laptop will not turn on: charger, battery or power socket',
    keywords: [
      'wont turn on', 'will not start', 'dead', 'no power', 'no lights', 'not charging',
      'charger', 'battery', 'power button', 'black screen', 'nothing happens', 'plugged in',
    ],
    explanation:
      'A laptop that shows no sign of life is most often not receiving power: a failed charger, a worn charging lead or socket, or a drained battery. Only after those are ruled out is the motherboard suspected.',
    checks: [
      'Check the wall socket with another device and look for a charging light on the laptop or on the charger.',
      'Look along the charger lead and at the plug that goes into the laptop for kinks, burn marks or bent pins.',
      'Hold the power button for ten seconds, then try again with the charger connected.',
      'Try a charger of the same voltage and plug type if one is available.',
    ],
    technicianOnly: [
      'Test the charger output and the charging socket.',
      'Open the laptop and test the battery and the power board.',
    ],
  },
  {
    id: 'laptop-slow-hot',
    deviceType: 'laptop',
    fault: 'Laptop overheating, loud fan or running very slowly',
    keywords: [
      'hot', 'overheating', 'fan', 'loud', 'noisy', 'slow', 'freezes', 'shuts down',
      'turns off', 'vents', 'dust', 'lag', 'hangs', 'crashes', 'throttling',
    ],
    explanation:
      'Dust blocks the air vents and the fan, so the processor gets hot and slows itself down or shuts off to protect itself. A soft surface under the laptop blocks airflow in the same way.',
    checks: [
      'Put the laptop on a hard, flat surface and listen to the fan.',
      'Look at the vents on the sides and underneath for dust and fluff.',
      'Check which program is using the processor, in the system task manager.',
      'Check whether it is also slow when only one program is open.',
    ],
    technicianOnly: ['Open the laptop, clean the fan and renew the thermal paste.'],
  },
  {
    id: 'laptop-screen-keyboard',
    deviceType: 'laptop',
    fault: 'Laptop screen blank, flickering or cracked; or built-in keyboard faulty',
    keywords: [
      'screen', 'display', 'flicker', 'flickering', 'lines', 'cracked', 'dim', 'backlight',
      'black', 'hinge', 'lid', 'external monitor', 'keyboard', 'keys', 'touchpad', 'trackpad',
    ],
    explanation:
      'If the laptop starts but the screen is dark, connecting an external monitor shows whether the computer itself works. A flickering screen that changes when the lid moves points at the cable through the hinge.',
    checks: [
      'Shine a torch at the screen: a faint picture means the backlight, not the display, has failed.',
      'Connect an external monitor or television and see whether a picture appears there.',
      'Open and close the lid slowly and watch whether the picture flickers at certain angles.',
      'Check that the brightness has not been turned right down.',
    ],
    technicianOnly: ['Replace the screen or the display cable.', 'Replace the keyboard or touchpad.'],
  },
  // ── Desktop PC ─────────────────────────────────────────────────────────────
  {
    id: 'pc-no-boot',
    deviceType: 'desktop_pc',
    fault: 'Desktop computer will not start or shows no picture',
    keywords: [
      'wont start', 'no power', 'dead', 'no display', 'no signal', 'beeps', 'black screen',
      'fans spin', 'power supply', 'restarts', 'boot loop', 'monitor', 'cable',
    ],
    explanation:
      'Many "dead computer" cases are a loose power lead, a switched-off power supply or a monitor on the wrong input. If the fans spin but nothing appears, the display cable or the memory is next.',
    checks: [
      'Check the power lead is firm at both ends and the switch on the back of the power supply is on.',
      'Check that the monitor is on, on the right input, and that its cable is firm at both ends.',
      'Note whether lights come on, fans spin and whether it beeps.',
      'Disconnect everything except power, monitor, keyboard and mouse, then try again.',
    ],
    technicianOnly: [
      'Reseat the memory and graphics card.',
      'Test the power supply. Never open a power supply.',
    ],
  },
  {
    id: 'pc-noise-slow',
    deviceType: 'desktop_pc',
    fault: 'Desktop computer slow, noisy or restarting by itself',
    keywords: [
      'slow', 'noisy', 'loud', 'grinding', 'clicking', 'hard drive', 'restarts', 'random restart',
      'freezes', 'hot', 'fan', 'dust', 'blue screen', 'crash',
    ],
    explanation:
      'A clicking or grinding sound with slowness can mean a failing hard drive, so the files should be backed up at once. Restarts under load often point to heat or a weak power supply.',
    checks: [
      'Back up important files before anything else if the drive is clicking.',
      'Listen to find out whether the noise is the fan or the drive.',
      'Check that the air vents on the case are clear and the case is not in a closed cupboard.',
      'Note when it restarts: at start, when busy or after a long time.',
    ],
    technicianOnly: ['Open the case, clean the dust and check the drive health.'],
  },
  {
    id: 'pc-no-sound-usb',
    deviceType: 'desktop_pc',
    fault: 'No sound or dead USB ports on a desktop computer',
    keywords: [
      'no sound', 'no audio', 'speakers', 'headphones', 'usb ports', 'ports not working',
      'front panel', 'front ports', 'volume', 'mute', 'output', 'jack',
    ],
    explanation:
      'No sound is often the wrong output chosen or speakers that are unplugged from power. Dead front-panel ports are usually an internal lead that has come loose, while the back ports still work.',
    checks: [
      'Check the volume and the mute setting, and that the right output device is selected.',
      'Check the speakers are powered on and plugged into the green socket on the back.',
      'Try the ports on the back of the computer in place of the front ones.',
    ],
    technicianOnly: ['Reconnect the front-panel leads inside the case.'],
  },
  // ── Monitor ────────────────────────────────────────────────────────────────
  {
    id: 'monitor-no-picture',
    deviceType: 'monitor',
    fault: 'Monitor shows no picture or says "no signal"',
    keywords: [
      'no signal', 'no picture', 'black', 'blank', 'no input', 'standby', 'power light',
      'orange light', 'cable', 'hdmi', 'displayport', 'vga', 'dvi', 'input',
    ],
    explanation:
      'A monitor that powers on but says "no signal" is usually not receiving a picture: the cable, the input selected or the computer. A monitor with no power light has a different fault.',
    checks: [
      'Check that the power light comes on, and try a different wall socket.',
      'Re-seat the video cable at both ends and use the monitor menu to choose the correct input.',
      'Try a different cable, or connect another device to the monitor.',
      'Connect the computer to a different screen to see whether the computer is sending a picture.',
    ],
    technicianOnly: ['Open the monitor and check the power board. Mains parts stay live when unplugged.'],
  },
  {
    id: 'monitor-flicker-lines',
    deviceType: 'monitor',
    fault: 'Monitor flickering, with lines, dead pixels or wrong colours',
    keywords: [
      'flicker', 'flickering', 'lines', 'stripes', 'vertical lines', 'dead pixel', 'wrong colours',
      'wrong colors', 'tint', 'dim', 'refresh rate', 'cable', 'static', 'tearing',
    ],
    explanation:
      'A loose or poor cable causes flicker, noise and colour casts, while lines that stay put when the cable moves usually mean the panel itself is failing. A wrong refresh rate also causes flicker.',
    checks: [
      'Re-seat or replace the video cable and tighten any screws on the plug.',
      'Check the resolution and refresh rate in the display settings.',
      'Try the monitor on another computer.',
      'Press gently on the frame to see whether the fault changes, without pressing on the screen.',
    ],
    technicianOnly: ['Replace the panel or the main board. Not usually worth it on an older monitor.'],
  },
  {
    id: 'monitor-dim-backlight',
    deviceType: 'monitor',
    fault: 'Monitor very dim or backlight failed',
    keywords: [
      'dim', 'dark', 'faint', 'backlight', 'barely visible', 'brightness', 'torch', 'shadow',
      'picture but dark', 'goes dark', 'clicking', 'whine', 'buzz',
    ],
    explanation:
      'If a picture is only visible when a torch is shone on the screen, the display works but the backlight is out. That is usually a failed backlight strip or its driver.',
    checks: [
      'Turn the brightness up and check any power-saving or ambient-light setting.',
      'Shine a torch at the screen at an angle and look for a faint picture.',
      'Listen for a high whine or buzz from the monitor.',
    ],
    technicianOnly: ['Replace the backlight strip or the backlight driver board.'],
  },
  // ── Printer ────────────────────────────────────────────────────────────────
  {
    id: 'printer-paper-jam',
    deviceType: 'printer',
    fault: 'Paper jam, or paper not feeding',
    keywords: [
      'paper jam', 'jam', 'jammed', 'paper stuck', 'not feeding', 'wont pick up', 'crumpled',
      'multiple sheets', 'feed', 'roller', 'tray', 'misfeed', 'paper',
    ],
    explanation:
      'Paper jams come from damp or curled paper, an overfull tray, scraps of torn paper left behind, or smooth worn pick-up rollers that no longer grip.',
    checks: [
      'Switch the printer off and unplug it before touching anything.',
      'Pull stuck paper out gently in the direction the paper travels, and check for torn scraps.',
      'Use fresh, dry, flat paper, and do not overfill the tray.',
      'Look at the rubber pick-up rollers for a shiny or worn surface.',
    ],
    technicianOnly: ['Clean or replace the pick-up rollers.'],
  },
  {
    id: 'printer-poor-print',
    deviceType: 'printer',
    fault: 'Streaks, faded or missing colours: clogged print head or low ink',
    keywords: [
      'streaks', 'lines', 'faded', 'missing colour', 'missing color', 'blank', 'ink', 'toner',
      'smudge', 'blurry', 'banding', 'head', 'nozzle', 'cartridge', 'cleaning',
    ],
    explanation:
      'Inkjet printheads dry out when unused and block with dried ink. A laser printer with streaks usually has a worn drum or low toner.',
    checks: [
      'Check the ink or toner levels and look for any message on the display.',
      'Run the printer’s own nozzle check and head cleaning from its menu, once or twice only.',
      'Check that the cartridges are fully seated and remove any protective tape.',
      'Print a few pages on plain paper to compare.',
    ],
    technicianOnly: ['Soak or replace the printhead on an inkjet. Never open the fuser of a laser printer while hot.'],
  },
  {
    id: 'printer-offline',
    deviceType: 'printer',
    fault: 'Printer offline, not found or not responding to the computer',
    keywords: [
      'offline', 'not found', 'not connecting', 'wifi', 'wireless', 'network', 'usb', 'queue',
      'stuck', 'pending', 'wont print', 'driver', 'error', 'not responding', 'spooler',
    ],
    explanation:
      'A printer that is on but reported offline is usually a connection problem: it has moved to a new Wi-Fi network, the cable is loose, or the print queue is stuck.',
    checks: [
      'Check the printer has no error message and its Wi-Fi light shows connected.',
      'Restart the printer, the computer and the router, in that order.',
      'Clear the print queue of old jobs.',
      'Try a USB cable if the printer supports it, to test the printer without Wi-Fi.',
    ],
    technicianOnly: [],
  },
  // ── Wi-Fi router ───────────────────────────────────────────────────────────
  {
    id: 'router-no-internet',
    deviceType: 'wifi_router',
    fault: 'No internet through the router',
    keywords: [
      'no internet', 'no connection', 'offline', 'red light', 'wan', 'broadband', 'cable',
      'modem', 'dsl', 'fibre', 'outage', 'provider', 'lights', 'router',
    ],
    explanation:
      'When the router powers on but there is no internet, the fault is often outside the home: a service outage. Otherwise it is a loose cable or a router that needs a restart.',
    checks: [
      'Check the provider’s outage page or ask a neighbour.',
      'Check every cable on the router is firm, including the one from the wall socket.',
      'Switch the router off at the wall for a minute, then on again, and wait five minutes.',
      'Look at the router lights and note which are red or off.',
    ],
    technicianOnly: ['Test the router or line with the provider’s equipment.'],
  },
  {
    id: 'router-weak-wifi',
    deviceType: 'wifi_router',
    fault: 'Weak, dropping or slow Wi-Fi',
    keywords: [
      'weak wifi', 'slow wifi', 'dropping', 'drops', 'disconnects', 'signal', 'range', 'dead spot',
      'wireless', 'slow internet', 'buffering', 'interference', 'distance', 'walls',
    ],
    explanation:
      'Wi-Fi is weakened by walls, distance and interference from other networks or appliances. Moving the router, or changing channel, often helps more than replacing it.',
    checks: [
      'Test the speed next to the router, then in the problem room.',
      'Move the router somewhere higher and more central, away from metal and thick walls.',
      'Try the 5 GHz band for speed or the 2.4 GHz band for range, if both are offered.',
      'Check whether the problem affects one device or all of them.',
    ],
    technicianOnly: [],
  },
  {
    id: 'router-power-adapter',
    deviceType: 'wifi_router',
    fault: 'Router dead or restarting: power adapter fault',
    keywords: [
      'dead', 'no lights', 'restarts', 'rebooting', 'power adapter', 'power supply', 'hot',
      'wall plug', 'keeps rebooting', 'random restart', 'adapter', 'brick', 'wont turn on',
    ],
    explanation:
      'Routers run for years from a small plug-in adapter, which wears out first. A router that restarts at random, or has no lights at all, often just needs the right replacement adapter.',
    checks: [
      'Look for the voltage and current printed on the adapter and on the router; they should match.',
      'Check the adapter is firm in the wall, and feel whether it is very hot.',
      'Try a different wall socket.',
    ],
    technicianOnly: ['Replace the adapter with one of the same voltage, polarity and current rating.'],
  },
  // ── Game controller ────────────────────────────────────────────────────────
  {
    id: 'controller-stick-drift',
    deviceType: 'game_controller',
    fault: 'Stick drift: the character moves without touching the stick',
    keywords: [
      'drift', 'stick drift', 'moves by itself', 'joystick', 'thumbstick', 'analog', 'analogue',
      'camera moves', 'worn', 'calibrate', 'dead zone', 'ghost input',
    ],
    explanation:
      'Thumbsticks use small potentiometers that wear with use. When the centre position wears, the controller reads a small push even when the stick is left alone.',
    checks: [
      'Leave the controller on a flat surface and view the stick values in the console or computer test screen.',
      'Rotate the stick several times to clear dirt.',
      'Run the calibration tool in the settings, if the controller has one.',
    ],
    technicianOnly: ['Replace the stick module.'],
  },
  {
    id: 'controller-button-battery',
    deviceType: 'game_controller',
    fault: 'Controller buttons sticking, not responding, or not charging',
    keywords: [
      'button', 'buttons', 'sticky', 'not responding', 'wont charge', 'not charging', 'battery',
      'disconnects', 'wireless', 'pairing', 'bluetooth', 'trigger', 'bumper', 'dpad', 'd-pad',
    ],
    explanation:
      'Sticky buttons are often a spilled drink. A controller that will not charge usually has a poor cable or a worn charging socket, and one that keeps disconnecting may need re-pairing.',
    checks: [
      'Try a different cable and port to charge it.',
      'Re-pair the controller with the console or computer.',
      'Press each button slowly and note which feel different.',
      'Check that nothing sticky is visible around the buttons.',
    ],
    technicianOnly: ['Open the controller and clean or replace the button contacts.'],
  },
  {
    id: 'controller-usb-socket',
    deviceType: 'game_controller',
    fault: 'Loose charging port or connection on a wired controller',
    keywords: [
      'loose', 'port', 'socket', 'usb', 'wobbles', 'cable', 'intermittent', 'disconnects',
      'wired', 'plug', 'charging port', 'micro usb', 'usb c', 'cuts out',
    ],
    explanation:
      'The charging port takes a lot of strain from being plugged in during play. Wiggling the cable and seeing the connection drop shows it is the port or the cable.',
    checks: [
      'Try a different cable.',
      'Gently wiggle the plug and watch whether the connection drops.',
      'Look inside the port for lint.',
    ],
    technicianOnly: ['Replace the USB port on the circuit board.'],
  },
];

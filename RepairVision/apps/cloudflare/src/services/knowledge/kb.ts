/**
 * The repair knowledge base.
 *
 * Every entry here was written by the team for this project. None of it is
 * copied or paraphrased from a manufacturer manual or from iFixit, so it can
 * be shown to people and passed to a model without licence questions.
 *
 * It covers common household and personal devices. It cannot cover every
 * device there is, and an entry is general guidance for a kind of device, not
 * a manual for a model.
 *
 * "checks" are things a visitor may do without opening the device. Anything
 * that needs a case opened or a soldering iron goes in "technicianOnly", and
 * is shown to a technician, never offered to a beginner as a next step.
 *
 * Every device type has a risk level (DEVICE_RISK). For mains-powered or
 * battery-heavy devices the checks are limited to looking, listening and
 * unplugging, and the entry says when to stop and hand the device on.
 *
 * The entries live in kb.core.ts and the kb.*.ts files beside it, and are
 * joined into KB at the bottom of this file.
 */

export const DEVICE_TYPES = [
  // computers and networking
  'laptop', 'desktop_pc', 'monitor', 'printer', 'wifi_router', 'game_controller',
  // inputs and USB
  'mouse', 'keyboard', 'usb_accessory',
  // phones, wearables and power
  'smartphone', 'tablet', 'smartwatch', 'power_bank',
  // audio and video
  'wired_headphones', 'bluetooth_speaker', 'tv', 'remote_control', 'digital_camera', 'radio',
  // small home items
  'desk_lamp', 'fan', 'toy', 'clock', 'flashlight', 'smart_home_device',
  // mains appliances
  'kettle', 'toaster', 'coffee_machine', 'iron', 'hair_dryer', 'electric_shaver',
  'vacuum_cleaner', 'microwave', 'washing_machine', 'refrigerator', 'sewing_machine',
  // tools and transport
  'power_tool', 'e_bike_scooter',
] as const;
export type DeviceType = (typeof DEVICE_TYPES)[number];

/**
 * How careful a visitor must be.
 *   low             Low voltage, and safe to examine from the outside.
 *   caution         Mains-powered or holds a lithium battery. Unplug it, look,
 *                   and do not open it.
 *   technician_only Stores dangerous energy (a microwave, a fridge, a large
 *                   battery). Nothing beyond looking, then a technician.
 */
export type Risk = 'low' | 'caution' | 'technician_only';

export const DEVICE_RISK: Record<DeviceType, Risk> = {
  laptop: 'caution', desktop_pc: 'caution', monitor: 'caution', printer: 'caution',
  wifi_router: 'low', game_controller: 'low',
  mouse: 'low', keyboard: 'low', usb_accessory: 'low',
  smartphone: 'caution', tablet: 'caution', smartwatch: 'caution', power_bank: 'technician_only',
  wired_headphones: 'low', bluetooth_speaker: 'caution', tv: 'caution', remote_control: 'low',
  digital_camera: 'caution', radio: 'caution',
  desk_lamp: 'caution', fan: 'caution', toy: 'low', clock: 'low', flashlight: 'low',
  smart_home_device: 'caution',
  kettle: 'caution', toaster: 'caution', coffee_machine: 'caution', iron: 'caution',
  hair_dryer: 'caution', electric_shaver: 'caution', vacuum_cleaner: 'caution',
  microwave: 'technician_only', washing_machine: 'caution', refrigerator: 'technician_only',
  sewing_machine: 'caution',
  power_tool: 'caution', e_bike_scooter: 'technician_only',
};

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

import { CORE_KB } from './kb.core.js';
import { COMPUTING_KB } from './kb.computing.js';
import { PHONES_POWER_KB } from './kb.phones.js';
import { AUDIO_VIDEO_KB } from './kb.av.js';
import { HOME_SMALL_KB } from './kb.home.js';
import { APPLIANCES_KB } from './kb.appliances.js';
import { TOOLS_TRANSPORT_KB } from './kb.tools.js';

export const KB: KbEntry[] = [
  ...CORE_KB,
  ...COMPUTING_KB,
  ...PHONES_POWER_KB,
  ...AUDIO_VIDEO_KB,
  ...HOME_SMALL_KB,
  ...APPLIANCES_KB,
  ...TOOLS_TRANSPORT_KB,
];

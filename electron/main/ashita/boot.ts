import {
  ensureSection,
  findSection,
  getValue,
  parseIni,
  readIniFile,
  setValue,
  writeIniFile,
  type ParsedIni,
} from './ini';
import { getAshitaBootConfigPath } from '../paths';

export interface FFXISettings {
  windowWidth?: number;
  windowHeight?: number;
  soundEnabled?: boolean;
  hardwareMouse?: boolean;
  showOpeningMovie?: boolean;
  gamma?: number;
  maxSounds?: number;
  windowMode?: 0 | 1 | 3;
  soundAlwaysOn?: boolean;
}

const SETTING_TO_KEY: Record<keyof FFXISettings, string> = {
  windowWidth: '0001',
  windowHeight: '0002',
  soundEnabled: '0007',
  hardwareMouse: '0021',
  showOpeningMovie: '0022',
  gamma: '0028',
  maxSounds: '0029',
  windowMode: '0034',
  soundAlwaysOn: '0035',
};

const BOOLEAN_KEYS: ReadonlySet<keyof FFXISettings> = new Set<keyof FFXISettings>([
  'soundEnabled',
  'hardwareMouse',
  'showOpeningMovie',
  'soundAlwaysOn',
]);

// Ashita's INI parser treats a backslash as an escape character, so every path value
// must be written DOUBLED in the resulting .ini. See the Ashita-shipped example at
// resources/ashita/config/boot/example-privateserver.ini (`file = .\\bootloader\\pol.exe`).
// ini.ts writes values verbatim, so the doubling has to survive this template literal.
const XILOADER_RELATIVE_PATH = '..\\\\xiloader\\\\xiloader.exe';

// Every [ffxi.registry] key Ashita understands, written explicitly as -1 ("use the value
// already in the real registry").
//
// Leaving a key OUT is NOT the same as -1: Ashita's registry hook still answers the game's
// read for it, and hands back a default instead of passing the real value through. With an
// empty [ffxi.registry] the game got junk for every setting -- a 3840x2160 window on a 2560x1440
// screen (title bar off-screen), and a pad config the game opened and dropped on the spot.
// 0000-0045 are the numbered settings; the pad trio is what the FFXI gamepad config writes.
const REGISTRY_PASSTHROUGH_KEYS = [
  ...Array.from({ length: 46 }, (_, i) => String(i).padStart(4, '0')),
  'padmode000',
  'padsin000',
  'padguid000',
];

const REGISTRY_DEFAULTS = REGISTRY_PASSTHROUGH_KEYS.map((key) => `${key} = -1`).join('\n');

const TEMPLATE = `; LSB Launcher boot profile
; The launcher edits specific keys but leaves other lines untouched, so feel free
; to add additional Ashita config sections below.

[ashita.launcher]
autoclose   = 1
name        = LSB

[ashita.boot]
file        = ${XILOADER_RELATIVE_PATH}
command     = --server 127.0.0.1
gamemodule  = FFXiMain.dll
script      = lsb.txt
args        =

[ashita.language]
playonline  = 2
ashita      = 2

[ffxi.registry]
${REGISTRY_DEFAULTS}
`;

function ensureFile(profile: string): ParsedIni {
  const path = getAshitaBootConfigPath(profile);
  const existing = readIniFile(path);
  if (existing) {
    if (backfillRegistryDefaults(existing)) writeIniFile(path, existing);
    return existing;
  }
  const fresh = parseIni(TEMPLATE);
  writeIniFile(path, fresh);
  return fresh;
}

/**
 * Add any missing [ffxi.registry] key as -1, leaving existing values alone.
 *
 * Ashita rewrites this file on exit and drops keys it has no value for, so a profile that
 * launched once comes back missing entries -- and a missing key is answered with a default
 * rather than the real registry value. Backfilling on every read keeps profiles created by
 * older builds, or trimmed by Ashita, from silently losing settings again.
 *
 * Returns whether anything was added.
 */
function backfillRegistryDefaults(ini: ParsedIni): boolean {
  const section = ensureSection(ini, 'ffxi.registry');
  let changed = false;
  for (const key of REGISTRY_PASSTHROUGH_KEYS) {
    if (getValue(section, key) === null) {
      setValue(section, key, '-1');
      changed = true;
    }
  }
  return changed;
}

export function setServerHost(profile: string, host: string): void {
  const path = getAshitaBootConfigPath(profile);
  const ini = ensureFile(profile);
  const boot = ensureSection(ini, 'ashita.boot');
  setValue(boot, 'command', `--server ${host}`);
  writeIniFile(path, ini);
}

export function getFFXISettings(profile: string): FFXISettings {
  const ini = ensureFile(profile);
  const section = findSection(ini, 'ffxi.registry');
  if (!section) return {};

  const result: FFXISettings = {};
  for (const [setting, key] of Object.entries(SETTING_TO_KEY) as [keyof FFXISettings, string][]) {
    const raw = getValue(section, key);
    if (raw === null) continue;
    const num = Number(raw);
    if (!Number.isFinite(num)) continue;
    // -1 is Ashita's "no override, use the game's own registry value". It is an absent
    // setting, not a real one -- reading it literally is what put -1 in every Graphics box.
    if (num === -1) continue;

    if (BOOLEAN_KEYS.has(setting)) {
      (result as Record<string, unknown>)[setting] = num !== 0;
    } else if (setting === 'windowMode') {
      result.windowMode = num === 0 || num === 1 || num === 3 ? num : 1;
    } else {
      (result as Record<string, unknown>)[setting] = num;
    }
  }
  return result;
}

export function setFFXISettings(profile: string, partial: Partial<FFXISettings>): void {
  const path = getAshitaBootConfigPath(profile);
  const ini = ensureFile(profile);
  const section = ensureSection(ini, 'ffxi.registry');

  for (const [setting, value] of Object.entries(partial) as [
    keyof FFXISettings,
    FFXISettings[keyof FFXISettings],
  ][]) {
    if (value === undefined || value === null) continue;
    const key = SETTING_TO_KEY[setting];
    const stringValue = BOOLEAN_KEYS.has(setting) ? (value ? '1' : '0') : String(value);
    setValue(section, key, stringValue);
  }

  writeIniFile(path, ini);
}

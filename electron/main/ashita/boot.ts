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

const TEMPLATE = `; LSB Launcher boot profile
; The launcher edits specific keys but leaves other lines untouched, so feel free
; to add additional Ashita config sections below.

[ashita.boot]
file        = ..\\xiloader\\xiloader.exe
command     = --server 127.0.0.1
gamemodule  = FFXiMain.dll
script      = lsb.txt
args        =

[ffxi.registry]
`;

function ensureFile(profile: string): ParsedIni {
  const path = getAshitaBootConfigPath(profile);
  const existing = readIniFile(path);
  if (existing) return existing;
  const fresh = parseIni(TEMPLATE);
  writeIniFile(path, fresh);
  return fresh;
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

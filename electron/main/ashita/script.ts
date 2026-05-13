import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { getAshitaScriptPath } from '../paths';

export type ScriptLine =
  | { kind: 'load'; type: 'addon' | 'plugin'; name: string }
  | { kind: 'other'; text: string };

function parseLine(raw: string): ScriptLine {
  const trimmed = raw.trim();
  if (!trimmed) return { kind: 'other', text: raw };
  let m = trimmed.match(/^\/?addon\s+load\s+(\S+)/i);
  if (m) return { kind: 'load', type: 'addon', name: m[1] };
  m = trimmed.match(/^\/?load\s+plugin\s+(\S+)/i);
  if (m) return { kind: 'load', type: 'plugin', name: m[1] };
  m = trimmed.match(/^\/?load\s+(\S+)/i);
  if (m) return { kind: 'load', type: 'plugin', name: m[1] };
  return { kind: 'other', text: raw };
}

function lineToString(line: ScriptLine): string {
  if (line.kind === 'other') return line.text;
  return line.type === 'addon' ? `/addon load ${line.name}` : `/load ${line.name}`;
}

function readScriptFile(profile: string): ScriptLine[] {
  const path = getAshitaScriptPath(profile);
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf-8').split(/\r?\n/).map(parseLine);
}

function writeScriptFile(profile: string, lines: ScriptLine[]): void {
  const path = getAshitaScriptPath(profile);
  mkdirSync(dirname(path), { recursive: true });
  const content = lines.map(lineToString).join('\r\n');
  const tmp = path + '.tmp';
  writeFileSync(tmp, content, 'utf-8');
  renameSync(tmp, path);
}

export function getEnabledScripts(profile: string): { addons: Set<string>; plugins: Set<string> } {
  const addons = new Set<string>();
  const plugins = new Set<string>();
  for (const line of readScriptFile(profile)) {
    if (line.kind !== 'load') continue;
    (line.type === 'addon' ? addons : plugins).add(line.name.toLowerCase());
  }
  return { addons, plugins };
}

export function setScriptEnabled(
  profile: string,
  type: 'addon' | 'plugin',
  name: string,
  enabled: boolean
): void {
  const lines = readScriptFile(profile);
  const lower = name.toLowerCase();
  const existing = lines.findIndex(
    (l) => l.kind === 'load' && l.type === type && l.name.toLowerCase() === lower
  );
  if (enabled) {
    if (existing >= 0) return;
    lines.push({ kind: 'load', type, name });
  } else {
    if (existing < 0) return;
    lines.splice(existing, 1);
  }
  writeScriptFile(profile, lines);
}

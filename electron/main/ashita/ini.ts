import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'fs';
import { dirname } from 'path';

export type IniLine =
  | { kind: 'comment'; text: string }
  | { kind: 'blank' }
  | { kind: 'kv'; key: string; value: string };

export interface IniSection {
  name: string;
  lines: IniLine[];
}

export interface ParsedIni {
  preamble: IniLine[];
  sections: IniSection[];
}

export function parseIni(content: string): ParsedIni {
  const lines = content.split(/\r?\n/);
  const preamble: IniLine[] = [];
  const sections: IniSection[] = [];
  let current: IniSection | null = null;

  for (const raw of lines) {
    const trimmed = raw.trim();
    const bucket = current?.lines ?? preamble;

    if (!trimmed) {
      bucket.push({ kind: 'blank' });
      continue;
    }
    if (trimmed.startsWith(';') || trimmed.startsWith('#')) {
      bucket.push({ kind: 'comment', text: raw });
      continue;
    }
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      current = { name: trimmed.slice(1, -1), lines: [] };
      sections.push(current);
      continue;
    }
    const eq = raw.indexOf('=');
    if (eq < 0) {
      bucket.push({ kind: 'comment', text: raw });
      continue;
    }
    const key = raw.slice(0, eq).trim();
    const value = raw.slice(eq + 1).trim();
    bucket.push({ kind: 'kv', key, value });
  }

  return { preamble, sections };
}

function lineToString(line: IniLine): string {
  if (line.kind === 'blank') return '';
  if (line.kind === 'comment') return line.text;
  return `${line.key} = ${line.value}`;
}

export function stringifyIni(ini: ParsedIni): string {
  const out: string[] = [];
  for (const line of ini.preamble) out.push(lineToString(line));
  for (const section of ini.sections) {
    out.push(`[${section.name}]`);
    for (const line of section.lines) out.push(lineToString(line));
  }
  return out.join('\r\n');
}

export function findSection(ini: ParsedIni, name: string): IniSection | null {
  return ini.sections.find((s) => s.name === name) ?? null;
}

export function ensureSection(ini: ParsedIni, name: string): IniSection {
  const existing = findSection(ini, name);
  if (existing) return existing;
  const section: IniSection = { name, lines: [] };
  ini.sections.push(section);
  return section;
}

export function getValue(section: IniSection, key: string): string | null {
  for (const line of section.lines) {
    if (line.kind === 'kv' && line.key === key) return line.value;
  }
  return null;
}

export function setValue(section: IniSection, key: string, value: string): void {
  for (const line of section.lines) {
    if (line.kind === 'kv' && line.key === key) {
      line.value = value;
      return;
    }
  }
  section.lines.push({ kind: 'kv', key, value });
}

export function readIniFile(path: string): ParsedIni | null {
  if (!existsSync(path)) return null;
  return parseIni(readFileSync(path, 'utf-8'));
}

export function writeIniFile(path: string, ini: ParsedIni): void {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + '.tmp';
  writeFileSync(tmp, stringifyIni(ini), 'utf-8');
  renameSync(tmp, path);
}

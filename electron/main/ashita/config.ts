import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { getAshitaBootConfigPath } from '../paths';

const PARSER_OPTS = {
  ignoreAttributes: false,
  preserveOrder: false,
  parseTagValue: false,
  trimValues: true,
};

const BUILDER_OPTS = {
  ignoreAttributes: false,
  format: true,
  indentBy: '  ',
};

type ScriptType = 'addon' | 'plugin';

function parseScriptLine(line: string): { type: ScriptType; name: string } | null {
  const trimmed = line.trim().replace(/^\//, '');
  let m = trimmed.match(/^addon\s+load\s+(\S+)/i);
  if (m) return { type: 'addon', name: m[1] };
  m = trimmed.match(/^load\s+plugin\s+(\S+)/i);
  if (m) return { type: 'plugin', name: m[1] };
  m = trimmed.match(/^load\s+(\S+)/i);
  if (m) return { type: 'plugin', name: m[1] };
  return null;
}

function buildScriptLine(type: ScriptType, name: string): string {
  return type === 'addon' ? `/addon load ${name}` : `/load ${name}`;
}

function extractScripts(raw: unknown): string[] {
  const r = raw as Record<string, any>;
  const node = r?.settings?.ashita?.scripts?.script ?? r?.scripts?.script;
  if (node === undefined || node === null) return [];
  if (Array.isArray(node)) return node.map((s) => String(s));
  return [String(node)];
}

interface ParsedConfig {
  raw: Record<string, any>;
  addons: Map<string, string>;
  plugins: Map<string, string>;
}

function readConfig(profile: string): ParsedConfig {
  const path = getAshitaBootConfigPath(profile);
  const empty: ParsedConfig = { raw: {}, addons: new Map(), plugins: new Map() };
  if (!existsSync(path)) return empty;

  const xml = readFileSync(path, 'utf-8');
  const parser = new XMLParser(PARSER_OPTS);
  const raw = parser.parse(xml) as Record<string, any>;
  const scripts = extractScripts(raw);

  const addons = new Map<string, string>();
  const plugins = new Map<string, string>();
  for (const line of scripts) {
    const parsed = parseScriptLine(line);
    if (!parsed) continue;
    const map = parsed.type === 'addon' ? addons : plugins;
    map.set(parsed.name.toLowerCase(), parsed.name);
  }
  return { raw, addons, plugins };
}

export function getEnabledScripts(profile: string): { addons: Set<string>; plugins: Set<string> } {
  const cfg = readConfig(profile);
  return {
    addons: new Set(cfg.addons.keys()),
    plugins: new Set(cfg.plugins.keys()),
  };
}

export function setScriptEnabled(
  profile: string,
  type: ScriptType,
  name: string,
  enabled: boolean
): void {
  const path = getAshitaBootConfigPath(profile);
  const cfg = readConfig(profile);
  const map = type === 'addon' ? cfg.addons : cfg.plugins;
  const key = name.toLowerCase();
  if (enabled) map.set(key, name);
  else map.delete(key);

  const lines: string[] = [];
  for (const original of cfg.addons.values()) lines.push(buildScriptLine('addon', original));
  for (const original of cfg.plugins.values()) lines.push(buildScriptLine('plugin', original));

  const settings = cfg.raw.settings ?? {};
  const ashita = settings.ashita ?? {};
  ashita.scripts = { script: lines };
  settings.ashita = ashita;

  const builder = new XMLBuilder(BUILDER_OPTS);
  const body = builder.build({ settings });
  const xml = '<?xml version="1.0" encoding="utf-8"?>\n' + body;

  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + '.tmp';
  writeFileSync(tmp, xml, 'utf-8');
  renameSync(tmp, path);
}

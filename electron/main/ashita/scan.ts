import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { getAshitaAddonsDir, getAshitaPluginsDir } from '../paths';
import { parseAddonMetadata } from './metadata';
import { getEnabledScripts } from './script';

export interface AddonInfo {
  name: string;
  path: string;
  enabled: boolean;
  author?: string;
  version?: string;
  description?: string;
}

export interface PluginInfo {
  name: string;
  path: string;
  enabled: boolean;
  fileSize: number;
  modifiedAt: string;
}

export function scanAddons(profile: string): AddonInfo[] {
  const dir = getAshitaAddonsDir();
  if (!existsSync(dir)) return [];
  const enabled = getEnabledScripts(profile).addons;

  return readdirSync(dir)
    .filter((name) => {
      try {
        if (!statSync(join(dir, name)).isDirectory()) return false;
      } catch {
        return false;
      }
      // An addon is a folder holding <name>.lua -- that file IS what `/addon load <name>`
      // loads, so a folder without one cannot be loaded at all.
      //
      // Being a directory was the whole test, which listed every folder that happens to sit in
      // the addons directory. Ashita's own addon collection ships a `.vscode` folder, so the
      // launcher offered editor settings as an addon -- and enabling it would have written a
      // `/addon load .vscode` line that fails silently at boot.
      return existsSync(join(dir, name, `${name}.lua`));
    })
    .map((name) => {
      const luaPath = join(dir, name, `${name}.lua`);
      let meta = {};
      try {
        meta = parseAddonMetadata(readFileSync(luaPath, 'utf-8'));
      } catch {
        // Unreadable or malformed header: still a real addon, just one we cannot describe.
      }
      return {
        name,
        path: join(dir, name),
        enabled: enabled.has(name.toLowerCase()),
        ...meta,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function scanPlugins(profile: string): PluginInfo[] {
  const dir = getAshitaPluginsDir();
  if (!existsSync(dir)) return [];
  const enabled = getEnabledScripts(profile).plugins;

  return readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.dll'))
    .map((file) => {
      const filePath = join(dir, file);
      const stat = statSync(filePath);
      const name = file.replace(/\.dll$/i, '');
      return {
        name,
        path: filePath,
        enabled: enabled.has(name.toLowerCase()),
        fileSize: stat.size,
        modifiedAt: stat.mtime.toISOString(),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

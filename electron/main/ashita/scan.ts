import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { getAshitaAddonsDir, getAshitaPluginsDir } from '../paths';
import { parseAddonMetadata } from './metadata';
import { getEnabledScripts } from './config';

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
        return statSync(join(dir, name)).isDirectory();
      } catch {
        return false;
      }
    })
    .map((name) => {
      const luaPath = join(dir, name, `${name}.lua`);
      let meta = {};
      if (existsSync(luaPath)) {
        try {
          meta = parseAddonMetadata(readFileSync(luaPath, 'utf-8'));
        } catch {
          // ignore parse errors
        }
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

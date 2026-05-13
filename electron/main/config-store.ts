import { app } from 'electron';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export interface LauncherConfig {
  serverHost: string;
  serverPort: number;
  ashitaProfile: string;
}

const DEFAULTS: LauncherConfig = {
  serverHost: '127.0.0.1',
  serverPort: 8088,
  ashitaProfile: 'default',
};

let cached: LauncherConfig | null = null;

function configPath(): string {
  return join(app.getPath('userData'), 'launcher.json');
}

export function getConfig(): LauncherConfig {
  if (cached) return cached;
  const path = configPath();
  if (existsSync(path)) {
    try {
      const parsed = JSON.parse(readFileSync(path, 'utf-8'));
      const next: LauncherConfig = { ...DEFAULTS, ...parsed };
      cached = next;
      return next;
    } catch {
      // fall through to defaults
    }
  }
  const fresh: LauncherConfig = { ...DEFAULTS };
  cached = fresh;
  return fresh;
}

export function updateConfig(patch: Partial<LauncherConfig>): LauncherConfig {
  const current = getConfig();
  cached = { ...current, ...patch };
  writeFileSync(configPath(), JSON.stringify(cached, null, 2), 'utf-8');
  return cached;
}

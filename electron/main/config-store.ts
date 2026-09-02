import { app } from 'electron';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export interface LauncherConfig {
  serverHost: string;
  serverPort: number;
}

// Change this to the real server host before building installers for testers, or every
// tester connects to their own machine. Exported so the UI can warn loudly rather than
// letting it fail silently at the xiloader console.
export const UNCONFIGURED_SERVER_HOST = '127.0.0.1';

const DEFAULTS: LauncherConfig = {
  serverHost: UNCONFIGURED_SERVER_HOST,
  serverPort: 8088,
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
  const next: LauncherConfig = { ...current, ...patch };
  cached = next;
  writeFileSync(configPath(), JSON.stringify(next, null, 2), 'utf-8');
  return next;
}

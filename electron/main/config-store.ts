import { app } from 'electron';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export interface LauncherConfig {
  serverHost: string;
  serverPort: number;
}

// The test server testers connect to unless they change it in the launcher. This is what a
// fresh install uses, so an installer built from this branch works with no setup at all.
const DEFAULT_SERVER_HOST = '167.172.157.30';

// The login AUTH port from settings/default/network.lua. Used only to answer "is the server
// up" on the home screen -- see server/api.ts, which opens a TCP connection to it.
//
// It was 8088, LSB's optional REST API, which is not running on the test server and is not
// worth opening a port for: the question a tester is asking is "can I log in", and the login
// port answers exactly that.
const DEFAULT_SERVER_PORT = 54231;

// Kept as the "nobody configured this build" sentinel, NOT as the default any more. The
// renderer warns on any loopback host, so a build shipped without a host still says so.
export const UNCONFIGURED_SERVER_HOST = '127.0.0.1';

const DEFAULTS: LauncherConfig = {
  serverHost: DEFAULT_SERVER_HOST,
  serverPort: DEFAULT_SERVER_PORT,
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

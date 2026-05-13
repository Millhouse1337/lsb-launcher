import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { getXiloaderDir, getXiloaderPath } from '../paths';
import { getConfig } from '../config-store';

export async function launchGame(): Promise<void> {
  const exe = getXiloaderPath();
  if (!existsSync(exe)) {
    throw new Error(
      `xiloader.exe not found at ${exe}. Place a build of xiloader in the resources/xiloader directory and rebuild.`
    );
  }

  const cfg = getConfig();
  // We pass --server as a hint; xiloader forks differ in supported flags, so the
  // bundled xiloader's xiloader.ini is the source of truth. Document this in README.
  const child = spawn(exe, ['--server', cfg.serverHost], {
    cwd: getXiloaderDir(),
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
}

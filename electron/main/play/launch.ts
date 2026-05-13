import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { ASHITA_PROFILE, getAshitaExePath, getAshitaRoot, getXiloaderPath } from '../paths';
import { getConfig } from '../config-store';
import { setServerHost } from '../ashita/boot';

export async function launchGame(): Promise<void> {
  const ashitaExe = getAshitaExePath();
  if (!existsSync(ashitaExe)) {
    throw new Error(
      `Ashita-cli.exe not found at ${ashitaExe}. Extract Ashita v4 into resources/ashita/ so Ashita-cli.exe is at the root.`
    );
  }
  if (!existsSync(getXiloaderPath())) {
    throw new Error(
      `xiloader.exe not found at ${getXiloaderPath()}. Drop the LandSandBoat xiloader release in resources/xiloader/.`
    );
  }

  // Sync server host into the boot INI so Ashita passes the right --server to xiloader.
  const cfg = getConfig();
  setServerHost(ASHITA_PROFILE, cfg.serverHost);

  const child = spawn(ashitaExe, [ASHITA_PROFILE], {
    cwd: getAshitaRoot(),
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
}

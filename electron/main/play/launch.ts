import { existsSync } from 'fs';
import { ASHITA_PROFILE, getAshitaExePath, getAshitaRoot, getXiloaderPath } from '../paths';
import { getConfig } from '../config-store';
import { setFFXISettings, setServerHost } from '../ashita/boot';
import { ensureScriptFile } from '../ashita/script';
import { runElevated } from '../elevate';

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

  // Ashita rewrites this INI on exit and resets every [ffxi.registry] key to -1, so the saved
  // graphics settings have to be written back in on the way out or they only survive one run.
  setFFXISettings(ASHITA_PROFILE, cfg.ffxi);

  // The boot INI references script = lsb.txt. If that file has never been written,
  // Ashita loads no plugins and no addons at all -- including LSM.
  ensureScriptFile(ASHITA_PROFILE);

  // Ashita-cli.exe is manifested as requireAdministrator, so it has to be started through
  // ShellExecute to get a UAC prompt -- see runElevated.
  // Usage is: ashita-cli.exe [configname.ini] -- it wants the file name, not the bare
  // profile, and exits with "file was not found" if the extension is missing.
  try {
    await runElevated(ashitaExe, [`${ASHITA_PROFILE}.ini`], getAshitaRoot());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/cancell?ed/i.test(message)) {
      throw new Error('Launch cancelled. Ashita needs administrator permission to start FFXI.');
    }
    throw err;
  }
}

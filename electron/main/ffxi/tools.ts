import { execFileSync } from 'child_process';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { runElevated } from '../elevate';

// Where the retail installer records the FFXI directory. FFXI is 32-bit, so on a 64-bit
// Windows the key really lives under WOW6432Node; the bare path is the fallback for the
// 32-bit-only case. Value 0001 is the FFXI folder (1000 is the PlayOnlineViewer folder).
const INSTALL_FOLDER_KEYS = [
  'HKLM\\SOFTWARE\\WOW6432Node\\PlayOnlineUS\\InstallFolder',
  'HKLM\\SOFTWARE\\PlayOnlineUS\\InstallFolder',
];

// FFXI ships the same tools three times, one per region. They are byte-identical, so this is
// only about which folder happens to exist -- any of them gives the same gamepad config.
const TOOLS_DIRS = ['ToolsUS', 'Tools', 'ToolsEU'];

const PAD_CONFIG_EXE = 'FFXiPadConfig.exe';

function readInstallFolder(): string | null {
  for (const key of INSTALL_FOLDER_KEYS) {
    try {
      const out = execFileSync('reg', ['query', key, '/v', '0001'], {
        encoding: 'utf-8',
        windowsHide: true,
      });
      // reg prints "    0001    REG_SZ    C:\...\FINAL FANTASY XI\"
      const match = out.match(/REG_SZ\s+(.+)/);
      const path = match?.[1]?.trim();
      if (path) return path;
    } catch {
      // Key missing on this machine; try the next one.
    }
  }
  return null;
}

/** Absolute path to FFXI's gamepad config tool, or null if FFXI is not installed. */
export function getPadConfigPath(): string | null {
  const installFolder = readInstallFolder();
  if (!installFolder) return null;

  for (const tools of TOOLS_DIRS) {
    const candidate = join(installFolder, tools, PAD_CONFIG_EXE);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

export function isPadConfigAvailable(): boolean {
  return getPadConfigPath() !== null;
}

export async function openPadConfig(): Promise<void> {
  const exe = getPadConfigPath();
  if (!exe) {
    throw new Error(
      'Could not find FFXiPadConfig.exe. Check that FINAL FANTASY XI is installed -- the launcher reads its location from the PlayOnline registry key.'
    );
  }

  // The tool has no manifest, so it runs unelevated by default -- but it saves the pad bindings
  // to HKLM, where Users only have read access. Unelevated they would be silently redirected to
  // the per-user VirtualStore, which the game (running elevated under Ashita) never reads: the
  // config would look saved and do nothing. Elevating writes them where the game will find them.
  await runElevated(exe, [], dirname(exe));
}

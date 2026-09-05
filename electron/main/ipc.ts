import { ipcMain, shell } from 'electron';
import { getConfig, updateConfig, type LauncherConfig } from './config-store';
import { getServerStatus } from './server/api';
import { launchGame } from './play/launch';
import { scanAddons, scanPlugins } from './ashita/scan';
import { setScriptEnabled } from './ashita/script';
import { getFFXISettings, setFFXISettings, setServerHost, type FFXISettings } from './ashita/boot';
import { ASHITA_PROFILE, getAshitaAddonsDir, getAshitaPluginsDir } from './paths';
import { isPadConfigAvailable, openPadConfig } from './ffxi/tools';

export function registerIpcHandlers(): void {
  ipcMain.handle('config:get', () => getConfig());
  ipcMain.handle('config:update', (_e, patch: Partial<LauncherConfig>) => {
    const cfg = updateConfig(patch);
    if (patch.serverHost !== undefined) {
      setServerHost(ASHITA_PROFILE, cfg.serverHost);
    }
    return cfg;
  });

  ipcMain.handle('server:status', () => {
    const cfg = getConfig();
    return getServerStatus(cfg.serverHost, cfg.serverPort);
  });

  ipcMain.handle('play:launch', () => launchGame());

  ipcMain.handle('ashita:listAddons', () => scanAddons(ASHITA_PROFILE));
  ipcMain.handle('ashita:listPlugins', () => scanPlugins(ASHITA_PROFILE));
  ipcMain.handle('ashita:toggleAddon', (_e, name: string, enabled: boolean) => {
    setScriptEnabled(ASHITA_PROFILE, 'addon', name, enabled);
  });
  ipcMain.handle('ashita:togglePlugin', (_e, name: string, enabled: boolean) => {
    setScriptEnabled(ASHITA_PROFILE, 'plugin', name, enabled);
  });
  ipcMain.handle('ashita:openAddonsFolder', () => shell.openPath(getAshitaAddonsDir()));
  ipcMain.handle('ashita:openPluginsFolder', () => shell.openPath(getAshitaPluginsDir()));

  ipcMain.handle('ffxi:padConfigAvailable', () => isPadConfigAvailable());
  ipcMain.handle('ffxi:openPadConfig', () => openPadConfig());

  ipcMain.handle('ffxi:getSettings', () => {
    const stored = getConfig().ffxi;
    // Seed from the INI the first time, so settings saved before the launcher tracked these
    // itself are not lost. After that the launcher's copy wins -- the INI is Ashita's to clobber.
    if (Object.keys(stored).length > 0) return stored;
    return getFFXISettings(ASHITA_PROFILE);
  });
  ipcMain.handle('ffxi:setSettings', (_e, partial: Partial<FFXISettings>) => {
    const next: FFXISettings = { ...getConfig().ffxi, ...partial };
    updateConfig({ ffxi: next });
    setFFXISettings(ASHITA_PROFILE, next);
  });
}

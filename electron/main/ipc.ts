import { ipcMain, shell } from 'electron';
import { getConfig, updateConfig, type LauncherConfig } from './config-store';
import { getServerStatus } from './server/api';
import { launchGame } from './play/launch';
import { scanAddons, scanPlugins } from './ashita/scan';
import { setScriptEnabled } from './ashita/config';
import { getAshitaAddonsDir, getAshitaPluginsDir } from './paths';

export function registerIpcHandlers(): void {
  ipcMain.handle('config:get', () => getConfig());
  ipcMain.handle('config:update', (_e, patch: Partial<LauncherConfig>) => updateConfig(patch));

  ipcMain.handle('server:status', () => {
    const cfg = getConfig();
    return getServerStatus(cfg.serverHost, cfg.serverPort);
  });

  ipcMain.handle('play:launch', () => launchGame());

  ipcMain.handle('ashita:listAddons', () => scanAddons(getConfig().ashitaProfile));
  ipcMain.handle('ashita:listPlugins', () => scanPlugins(getConfig().ashitaProfile));
  ipcMain.handle('ashita:toggleAddon', (_e, name: string, enabled: boolean) => {
    setScriptEnabled(getConfig().ashitaProfile, 'addon', name, enabled);
  });
  ipcMain.handle('ashita:togglePlugin', (_e, name: string, enabled: boolean) => {
    setScriptEnabled(getConfig().ashitaProfile, 'plugin', name, enabled);
  });
  ipcMain.handle('ashita:openAddonsFolder', () => shell.openPath(getAshitaAddonsDir()));
  ipcMain.handle('ashita:openPluginsFolder', () => shell.openPath(getAshitaPluginsDir()));
}

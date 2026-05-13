import { app } from 'electron';
import { join } from 'path';

export function getResourcesPath(): string {
  return app.isPackaged ? process.resourcesPath : join(app.getAppPath(), 'resources');
}

export function getXiloaderDir(): string {
  return join(getResourcesPath(), 'xiloader');
}

export function getXiloaderPath(): string {
  return join(getXiloaderDir(), 'xiloader.exe');
}

export function getAshitaRoot(): string {
  return join(getResourcesPath(), 'ashita');
}

export function getAshitaAddonsDir(): string {
  return join(getAshitaRoot(), 'addons');
}

export function getAshitaPluginsDir(): string {
  return join(getAshitaRoot(), 'plugins');
}

export function getAshitaBootConfigPath(profile: string): string {
  return join(getAshitaRoot(), 'config', 'boot', `${profile}.xml`);
}

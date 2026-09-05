import { contextBridge, ipcRenderer } from 'electron';

const api = {
  config: {
    get: () => ipcRenderer.invoke('config:get'),
    update: (patch: unknown) => ipcRenderer.invoke('config:update', patch),
  },
  server: {
    getStatus: () => ipcRenderer.invoke('server:status'),
  },
  play: {
    launch: () => ipcRenderer.invoke('play:launch'),
  },
  ashita: {
    listAddons: () => ipcRenderer.invoke('ashita:listAddons'),
    listPlugins: () => ipcRenderer.invoke('ashita:listPlugins'),
    toggleAddon: (name: string, enabled: boolean) =>
      ipcRenderer.invoke('ashita:toggleAddon', name, enabled),
    togglePlugin: (name: string, enabled: boolean) =>
      ipcRenderer.invoke('ashita:togglePlugin', name, enabled),
    openAddonsFolder: () => ipcRenderer.invoke('ashita:openAddonsFolder'),
    openPluginsFolder: () => ipcRenderer.invoke('ashita:openPluginsFolder'),
  },
  ffxi: {
    getSettings: () => ipcRenderer.invoke('ffxi:getSettings'),
    setSettings: (partial: unknown) => ipcRenderer.invoke('ffxi:setSettings', partial),
    padConfigAvailable: () => ipcRenderer.invoke('ffxi:padConfigAvailable'),
    openPadConfig: () => ipcRenderer.invoke('ffxi:openPadConfig'),
  },
};

contextBridge.exposeInMainWorld('api', api);

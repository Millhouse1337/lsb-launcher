interface ServerStatus {
  online: boolean;
  sessions?: number;
  error?: string;
}

interface AddonInfo {
  name: string;
  path: string;
  enabled: boolean;
  author?: string;
  version?: string;
  description?: string;
}

interface PluginInfo {
  name: string;
  path: string;
  enabled: boolean;
  fileSize: number;
  modifiedAt: string;
}

interface LauncherConfig {
  serverHost: string;
  serverPort: number;
  ashitaProfile: string;
}

interface LauncherApi {
  config: {
    get: () => Promise<LauncherConfig>;
    update: (patch: Partial<LauncherConfig>) => Promise<LauncherConfig>;
  };
  server: {
    getStatus: () => Promise<ServerStatus>;
  };
  play: {
    launch: () => Promise<void>;
  };
  ashita: {
    listAddons: () => Promise<AddonInfo[]>;
    listPlugins: () => Promise<PluginInfo[]>;
    toggleAddon: (name: string, enabled: boolean) => Promise<void>;
    togglePlugin: (name: string, enabled: boolean) => Promise<void>;
    openAddonsFolder: () => Promise<string>;
    openPluginsFolder: () => Promise<string>;
  };
}

interface Window {
  api: LauncherApi;
}

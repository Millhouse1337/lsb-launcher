/// <reference types="vite/client" />
// Gives TypeScript the module declarations for asset imports (png/jpg/svg/...), which Vite
// resolves to a fingerprinted URL string at build time. Without this an `import banner from
// './x.png'` is a compile error even though the bundler handles it fine.

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
}

interface FFXISettings {
  windowWidth?: number;
  windowHeight?: number;
  soundEnabled?: boolean;
  hardwareMouse?: boolean;
  showOpeningMovie?: boolean;
  gamma?: number;
  maxSounds?: number;
  windowMode?: 0 | 1 | 3;
  soundAlwaysOn?: boolean;
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
  ffxi: {
    getSettings: () => Promise<FFXISettings>;
    setSettings: (partial: Partial<FFXISettings>) => Promise<void>;
  };
}

interface Window {
  api: LauncherApi;
}

# LSB Launcher

A minimal, user-friendly launcher for LandSandBoat FFXI servers. Wraps Ashita v4 + xiloader with a clean UI, an addon manager, and FFXI graphics/sound settings.

## What it does (v1)

- **Home** — shows server status (online / player count) from the LSB world server's HTTP API, plus a Play button that spawns Ashita with the launcher's own boot profile.
- **Extensions** — toggles Ashita v4 addons and plugins on/off by editing the boot profile's script file.
- **Settings** — server host/port, window mode/resolution, gamma, sound, hardware mouse, opening movie.

## Prerequisites

- Node.js 20+
- Windows 10/11
- A LandSandBoat server reachable from your machine with `network.ENABLE_HTTP = true` and `network.HTTP_HOST = "0.0.0.0"`.

## Setup

```sh
git clone https://github.com/Millhouse1337/lsb-launcher.git
cd lsb-launcher
npm install
```

Then drop your chosen builds of Ashita v4 and xiloader into `resources/` — see [resources/README.md](resources/README.md) for the expected layout.

## Run in dev

```sh
npm run dev
```

This starts electron-vite with hot reload. The Electron window opens pointed at `127.0.0.1:8088` by default — change it in the Settings tab.

## Build an installer

```sh
npm run dist
```

Produces an NSIS `.exe` under `release/`. The installer bundles your `resources/xiloader/` and `resources/ashita/` contents.

> **First-run note:** the installer is unsigned in v1. Windows SmartScreen warns players on first run; they click *More info → Run anyway*. Buy an Authenticode cert when ready and configure `electron-builder.yml`.

## How launching actually works

```
User clicks Play
   ↓
Launcher writes [ashita.boot] command = --server <host> in resources/ashita/config/boot/lsb.ini
   ↓
Launcher spawns Ashita-cli.exe lsb (the "lsb" profile)
   ↓
Ashita reads lsb.ini, runs the bootloader pointed to by [ashita.boot] file (xiloader.exe)
   ↓
xiloader connects to your LSB server, hands off to FFXI's pol.exe
```

The launcher *owns* `lsb.ini` and `scripts/lsb.txt`. It writes/edits them atomically and leaves any other lines you add untouched.

## Server-side checklist

Make sure your LSB server exposes the launcher's data sources:

| Setting | File | Required value |
|---|---|---|
| `network.ENABLE_HTTP` | [settings/default/network.lua:36](https://github.com/LandSandBoat/server/blob/base/settings/default/network.lua#L36) | `true` |
| `network.HTTP_HOST` | same | `"0.0.0.0"` to allow remote connections |
| `network.HTTP_PORT` | same | `8088` (or whatever you point the launcher at) |
| Firewall | server box | TCP 8088 inbound, plus 54001/54002/54231 and UDP 54230 for play |

## Architecture

```
+-----------------------------+
| Renderer (React + Mantine)  |  Home / Extensions / Settings
+--------------+--------------+
               | window.api  (contextBridge)
+--------------v--------------+
| Electron main process       |
|  ashita/ini.ts              |  generic INI parser, preserves comments
|  ashita/boot.ts             |  boot INI: server host + [ffxi.registry]
|  ashita/script.ts           |  scripts/<profile>.txt: addon/plugin load lines
|  ashita/scan.ts             |  list addons/ + plugins/ with enabled state
|  play/launch.ts             |  spawn Ashita-cli.exe <profile>
|  server/api.ts              |  fetch /api/sessions
|  config-store.ts            |  persist launcher prefs
+--------------+--------------+
               |
   bundled resources/{xiloader,ashita}
```

All filesystem, network, and process work happens in the main process. The renderer is sandboxed (contextIsolation on, nodeIntegration off).

## Roadmap

- **Auto-patcher** for DAT swaps
- **Native login form** instead of xiloader's console window
- **News panel**
- **Code signing** (Authenticode)
- **Auto-update** for the launcher itself (`electron-updater`)
- **Branding pass** — logo, icon, theme

## License

GPL-3.0, matching LandSandBoat. The bundled third-party binaries (xiloader, Ashita) retain their own upstream licenses — see [resources/README.md](resources/README.md).

# LSB Launcher

A minimal, user-friendly launcher for LandSandBoat FFXI servers. Wraps `xiloader.exe` with a clean UI, an Ashita addon manager, and a few launcher-level settings.

## What it does (v1)

- **Home** — shows server status (online / player count) from the LSB world server's HTTP API, plus a Play button that spawns the bundled xiloader.
- **Extensions** — toggles Ashita v4 addons and plugins on/off by editing the boot profile XML. Open-folder shortcuts for both directories.
- **Settings** — server host/port and Ashita boot profile. FFXI graphics/sound editing is deferred (see [Roadmap](#roadmap)).

## Prerequisites

- Node.js 20+
- Windows 10/11 (the launcher itself works cross-platform during dev, but the resources it manages — xiloader, Ashita, FFXI — are Windows-only).
- A LandSandBoat server reachable from your machine with `network.ENABLE_HTTP = true` and `network.HTTP_HOST = "0.0.0.0"`.

## Setup

```sh
git clone https://github.com/<you>/lsb-launcher.git
cd lsb-launcher
npm install
```

Then drop your chosen builds of xiloader and Ashita into `resources/` — see [resources/README.md](resources/README.md) for the expected layout.

## Run in dev

```sh
npm run dev
```

This starts electron-vite with hot reload. The Electron window opens with the launcher pointed at `127.0.0.1:8088` by default — change it in the Settings tab.

## Build an installer

```sh
npm run dist
```

Produces an NSIS `.exe` under `release/`. The installer bundles your `resources/xiloader/` and `resources/ashita/` contents under the install directory.

> **First-run note:** the installer is unsigned in v1. Windows SmartScreen will warn players on first run; they click *More info → Run anyway*. Buying an Authenticode cert (~$100-300/yr) removes the warning — add it in `electron-builder.yml` under `win.certificateFile`/`certificatePassword` when ready.

## Server-side checklist

Make sure your LSB server is configured to expose the launcher's data sources:

| Setting | File | Required value |
|---|---|---|
| `network.ENABLE_HTTP` | [settings/default/network.lua:36](https://github.com/LandSandBoat/server/blob/base/settings/default/network.lua#L36) | `true` |
| `network.HTTP_HOST` | same | `"0.0.0.0"` to allow remote connections |
| `network.HTTP_PORT` | same | `8088` (or whatever you tell the launcher) |
| Firewall | server box | TCP 8088 inbound, plus the standard 54001/54002/54231 and UDP 54230 for actual play |

## Architecture

```
+-----------------------------+
| Renderer (React + Mantine)  |  three tabs
+--------------+--------------+
               | window.api  (contextBridge)
+--------------v--------------+
| Electron main process       |
|  electron/main/server/      |  fetch /api/sessions
|  electron/main/play/        |  spawn xiloader.exe
|  electron/main/ashita/      |  scan dirs + edit boot XML
|  electron/main/config-store |  persist launcher prefs
+--------------+--------------+
               |
   bundled resources/{xiloader,ashita}
```

All filesystem, network, and process work happens in the main process. The renderer is sandboxed (contextIsolation on, nodeIntegration off).

## Roadmap

Things that were considered for v1 and pushed to later:

- **FFXI registry blob editor** — `winreg` is in package.json reserved for this. FFXI stores resolution/gamma/sound/language as a binary blob under `HKCU\Software\PlayOnlineUS\SquareEnix\FinalFantasyXI\0001`. Editing it safely requires a parser nobody has written yet for this project.
- **Auto-patcher** for DAT swaps.
- **Native login form** instead of xiloader's console window. Would need to reimplement the LSB auth protocol (see [src/login/auth_session.h:33-66](https://github.com/LandSandBoat/server/blob/base/src/login/auth_session.h#L33-L66) and `tools/headlessxi/hxiclient.py` as the reference).
- **News panel** sourced from a CMS or markdown feed.
- **Code signing** (Authenticode).
- **Auto-update** for the launcher itself (`electron-updater`).

## License

GPL-3.0, matching LandSandBoat. The bundled third-party binaries (xiloader, Ashita) retain their own upstream licenses — see [resources/README.md](resources/README.md).

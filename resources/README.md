# Bundled third-party binaries

The launcher ships with pre-bundled copies of **xiloader** and **Ashita v4**. They are deliberately not committed to git — drop your chosen builds here before running `npm run dev` or `npm run dist`.

## Expected layout

```
resources/
├── xiloader/
│   └── xiloader.exe            <- LandSandBoat xiloader release (protocol 2.1.x)
└── ashita/
    ├── Ashita-cli.exe          <- must be at the root, not in a subdirectory
    ├── Ashita.dll
    ├── addons/                 <- Lua addons; each addon is its own subdirectory
    ├── plugins/                <- native .dll plugins
    ├── polplugins/
    ├── bootloader/
    ├── scripts/                <- the launcher writes its boot script here
    └── config/
        └── boot/               <- the launcher writes lsb.ini here on first run
```

**Important:** Ashita downloads usually unzip into a subdirectory like `Ashita-v4/`. Flatten it so `Ashita-cli.exe` sits directly under `resources/ashita/`. The launcher's [electron/main/paths.ts](../electron/main/paths.ts) expects this layout.

## Sourcing

- **xiloader** — download the latest 2.1.x release from https://github.com/LandSandBoat/xiloader/releases. You want the `xiloader.exe` asset (the other two are source archives).
- **Ashita v4** — download from https://www.ashitaxi.com/. Extract and flatten as described above.

## What the launcher does with these

On first run, the launcher generates:

- `resources/ashita/config/boot/lsb.ini` — a boot profile pointing at `..\xiloader\xiloader.exe` with a `[ffxi.registry]` section for graphics/sound settings
- `resources/ashita/scripts/lsb.txt` — script file containing addon/plugin auto-load lines

Both files are owned by the launcher: it edits specific keys/lines and leaves the rest alone. Safe to edit by hand if you know what you're doing.

## Why these aren't committed

1. They're large binaries (Ashita + addons is tens of MB).
2. They have their own upstream licenses; bundling pristine copies here would muddy the GPLv3 boundary.
3. You may want to ship a tweaked xiloader without rebasing this repo.

Document the exact versions you ship in your release notes so players know what they're running.

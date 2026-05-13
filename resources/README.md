# Bundled third-party binaries

The launcher ships with pre-bundled copies of **xiloader** and **Ashita v4**. They are deliberately not committed to git — drop your chosen builds here before running `npm run dev` or `npm run dist`.

## Expected layout

```
resources/
├── xiloader/
│   ├── xiloader.exe            <- required, any xiloader build that speaks LSB protocol 2.1.0
│   └── xiloader.ini            <- optional, pre-configured ServerAddress/ServerPort
└── ashita/
    ├── Ashita.exe              <- not used by the launcher directly; included for player convenience
    ├── addons/                 <- Lua addons; each addon is its own subdirectory
    ├── plugins/                <- native .dll plugins
    └── config/
        └── boot/
            └── default.xml     <- the boot profile the launcher reads/writes
```

## Sourcing

- **xiloader** — clone & build from a fork that speaks the LSB-side protocol version pinned at `SupportedXiloaderVersion = { 2, 1, 0 }`. The reference is `atom0s/xiloader` plus any LSB-specific patches your server applies.
- **Ashita v4** — the canonical Windows installer lays down the entire layout above. Copy `<install-root>/Ashita` here. The addons and plugins directories will be discovered by the launcher's Extensions tab automatically.

## Why these aren't committed

1. They're large binaries (Ashita + addons is tens of MB).
2. They have their own upstream licenses; bundling pristine copies in this repo would muddy the GPLv3 boundary.
3. You may want to ship a tweaked xiloader without rebasing this repo.

Document the exact versions you ship in your release notes so players know what they're running.

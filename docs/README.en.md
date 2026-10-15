# RiceCall

[繁體中文](../README.md) · [Official site](https://ricecall.com) · [Downloads](https://github.com/NerdyHomeReOpen/RiceCall/releases/tag/latest)

## Overview

RiceCall is an independently developed community voice chat desktop app. This repository contains a React/Next.js interface and an Electron main process. RiceCall Main Service owns accounts, voice groups, channels, real-time data, and the MySQL database; the client connects to it through APIs.

## Architecture

```text
Next.js UI (src/app, src/page-components, src/components)
  ├─ Redux state (src/store) and API/Socket clients (src/api) → Main Service
  ├─ WebRTC audio (src/hooks/web-rtc, src/providers)
  └─ Electron preload/IPC (src/main) → windows, tray, updates, operating system
```

`src/main/electron.ts` and `src/main/web.ts` are separate runtime entry points. `public/` contains static assets, `resources/` contains packaging resources, and `electron-builder.json` configures installers.

## Modules and subsystems

| Kind | Location | Responsibility |
| --- | --- | --- |
| UI | `src/app/`, `src/page-components/`, `src/components/`, `src/popups/` | Pages, reusable components, and popups. |
| State and transport | `src/store/`, `src/api/`, `src/main/api/`, `src/main/socket/` | UI state and HTTP/Socket connections. |
| Desktop | `src/main/` | Electron main process, preload, IPC, Discord integration, and updates. |
| Audio | `src/hooks/web-rtc/`, `src/providers/WebRTC.tsx` | WebRTC/SFU, devices, and recording state. |
| Shared | `src/i18n/`, `src/extensions/`, `src/services/`, `src/types/` | Localization, editor extensions, service wrappers, and types. |

## Complete build and run steps

1. Install Node.js 20 or newer, Yarn 1.22.22, and the Electron packaging toolchain for your target platform. Make sure Main Service and the static JSON endpoint are reachable.
2. Copy `.env.example` to `.env`. Set `RICE_CALL_API_URL`, `RICE_CALL_WS_URL`, and `RICE_CALL_DOCS_BASE_URL`. `RICE_CALL_ERROR_SUBMISSION_URL` is optional. Use `.env.dev` with the same keys to override development endpoints.
3. Install dependencies and start development:

   ```bash
   yarn install --frozen-lockfile
   yarn dev
   ```

4. Validate and package:

   ```bash
   yarn typecheck
   yarn lint
   yarn check-names
   yarn build:ci
   yarn build
   ```

`yarn build:ci` builds the Next.js and Electron code; `yarn build` also runs electron-builder to produce installers. Use `yarn build:deb` for Linux `.deb` or `yarn build:dmg` for macOS `.dmg`. `yarn start` runs the prebuilt web output and Electron process.

## Terms of use

RiceCall (RC Voice) is independently developed by NerdyHomeReOpen and is not affiliated with the original RaidCall team, servers, or any official organization. All releases are currently test builds. Use them at your own risk. Accounts, levels, VIP status, voice groups, and other data may be reset, lost, or deleted.

RiceCall is not a continuation, remake, or officially licensed version of RaidCall. It does not restore RaidCall services or provide RaidCall technical support or account recovery. This noncommercial community project is intended for academic research and technical exchange. Contact the team about copyright or trademark concerns.

Report issues through the in-app **Feedback** menu, [GitHub Issues](https://github.com/NerdyHomeReOpen/RiceCall/issues), or [Discord](https://discord.gg/s86Yra4dUb). The team reserves final decisions on test data and services.

## Download and contribute

Download an installer for your platform from the [official site](https://ricecall.com) or the [latest GitHub release](https://github.com/NerdyHomeReOpen/RiceCall/releases/tag/latest). Read the terms above before downloading. Developers can use the [contributor form](https://forms.gle/ZowwAS22dGpKkGcZ8) or submit a [pull request](https://github.com/NerdyHomeReOpen/RiceCall/pulls).

## Further documentation

See `docs/` for project documentation and RiceCall Engineering Standard for shared naming and vocabulary.

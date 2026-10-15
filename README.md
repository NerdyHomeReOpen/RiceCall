<div align="center">
  <img width="1920" height="1080" alt="discord_banner" src="https://github.com/user-attachments/assets/488a1f4c-4e03-463a-85c7-a1eef22cc505" />
  <div height="20px">　</div>
  <div>
    <a title="Crowdin" target="_blank" href="https://discord.gg/adCWzv6wwS"><img src="https://img.shields.io/badge/Join-Discord-blue?logo=discord"/></a>
    <a title="Crowdin" target="_blank" href="https://ricecall.com"><img src="https://img.shields.io/badge/Latest-0.3.21-green"/></a>
    <a title="Crowdin" target="_blank" href="https://crowdin.com"><img src="https://badges.crowdin.net/ricecall/localized.svg"></a>
  </div>
</div>

## Terms of Use

**[RiceCall](https://github.com/NerdyHomeReOpen/RiceCall)** (hereinafter referred to as RC Voice) is an **independently developed** project by **[NerdyHomeReOpen](https://github.com/NerdyHomeReOpen)** (hereinafter referred to as the Team).  
**It has no connection whatsoever with the original RaidCall development team, servers, or any official organization.** Please use at your own risk.

Currently, all versions of RC Voice are test builds. If you encounter issues while using the software, you are welcome to report them through the following channels:

- In-app: Top-right menu > Feedback
- GitHub: [Issue Report](https://github.com/NerdyHomeReOpen/RiceCall/issues)
- Discord: Join our [Discord](https://discord.gg/s86Yra4dUb) server to report or ask an issue freely

Please note that all data in RC Voice (including but not limited to accounts, levels, VIP, and voice servers) **may be reset, lost, or deleted**. The Team reserves final decision rights.

RC Voice is **not a continuation, remake, or officially licensed version of RaidCall**, and it **does not provide restoration of RaidCall services, support, or account data recovery**.  
This project is purely a community-driven initiative by enthusiasts, intended to provide a new voice communication platform, **without any commercial purpose**.

All RC Voice content is provided solely for academic research and technical exchange. If there are any concerns regarding copyright, trademarks, or other rights, please contact us for resolution.

While RC Voice may reference or reuse certain RaidCall-related materials, the final product is entirely an independent creation of the Team, and **does not represent the stance or intent of RaidCall.**  
Therefore, we **do not provide any technical support, account recovery, or data retrieval services related to RaidCall.** For such issues, please contact the original RaidCall officials.

### How to Contribute

We welcome developers from all backgrounds to contribute to the development and maintenance of RC Voice. You can participate through the following methods:

- Fill out the [Application Form](https://forms.gle/ZowwAS22dGpKkGcZ8) (if needed, we will contact you and assign a contributor role)
- Fork the project and submit a [Pull Request](https://github.com/NerdyHomeReOpen/RiceCall/pulls) with new features or fixes

Thank you for your support and participation!

## Installation Guide

Please read the documentation before downloading.

> [Official Website Download](https://ricecall.com)  
> [GitHub Download](https://github.com/NerdyHomeReOpen/RiceCall/releases/tag/latest)

## Technical Architecture

- **Frontend (Client):** React, Electron
- **Backend (Server):** Node.js
- **Database:** MySQL
- **Communication Protocols:** WebRTC / WebSocket / HTTP

## Project Structure

```bash
RiceCall
├── .github/                  # CI/CD workflows and issue templates
├── build-deb/                # Linux post-install scripts
├── docs/                     # Project documentation
├── public/                   # Static assets (images, icons, fonts, etc.)
├── resources/                # Electron packaging resources (icons, tray)
├── src/
│   ├── api/                  # API client
│   ├── app/                  # Next.js App Router entry pages/layout
│   ├── components/           # Reusable UI components
│   ├── configs/              # Popup and socket configuration
│   ├── constants/            # Shared constants (emojis, etc.)
│   ├── extensions/           # TipTap editor extensions
│   ├── hooks/                # Custom React hooks
│   ├── i18n/                 # Client i18n setup and translations
│   ├── main/                 # Electron main-process (main, preload, IPC, handlers)
│   ├── page-components/      # Renderer page components (Home, Server, Login, etc.)
│   ├── popups/               # Popup view components
│   ├── providers/            # React context providers
│   ├── services/             # Service modules
│   ├── store/                # Redux store and slices
│   ├── types/                # Shared TypeScript types
│   ├── utils/                # Utility functions
│   ├── globals.css           # Global styles
│   └── next-env.d.ts         # Next.js environment type declarations
├── dev-app-update.yml        # Electron auto-update configuration
├── electron-builder.json     # Electron packaging configuration
├── electron-builder-dev.json # Electron packaging configuration for dev builds
├── eslint.config.mjs         # ESLint configuration
├── LICENSE                   # Project license
├── next-env.d.ts             # Next.js environment type declarations
├── next.config.ts            # Next.js configuration
├── package.json              # Dependencies and npm/yarn scripts
├── tsconfig.electron.json    # TypeScript config for the Electron main process
├── tsconfig.json             # TypeScript config for the renderer
└── yarn.lock                 # Dependency lockfile
```

## Setting Up Local Environment

### 1. Copy `.env.example` to `.env` and fill in all required options

```env
# MainService API and WebSocket endpoints
RICE_CALL_API_URL=http://localhost:4500
RICE_CALL_WS_URL=http://localhost:4500

# Published static files
RICE_CALL_DOCS_BASE_URL=https://your-host

# Optional error reporting endpoint
RICE_CALL_ERROR_SUBMISSION_URL=
```

To switch the app to a development server, create `.env.dev` with the same variable names for the endpoints you want to override. Release workflows generate both environment files from the existing GitHub secrets.

### 2. Install dependencies

```bash
yarn install
```

### 3. Start the development client

```bash
yarn dev
```

### 4. Build the application

```bash
yarn build
```

### Other Scripts

```bash
yarn lint
yarn check-names
yarn typecheck
yarn build:ci # Build the web output and Electron source without packaging
yarn format
```

## 模組與子系統盤點

桌面客戶端同時有 React/Next.js 畫面與 Electron 主程序；`src/main/` 的 `electron.ts`／`web.ts` 是不同執行環境的 adapter。它透過遠端服務取得資料，沒有擁有主服務的 MySQL 資料庫。

| 類別 | 能力與位置 | 為什麼在此專案 |
| --- | --- | --- |
| 入口模組 | React/Next.js 頁面、元件與彈窗：`src/app/`、`src/page-components/`、`src/components/`、`src/popups/` | 提供桌面與 Web 畫面。 |
| 入口模組 | Electron 主程序、preload 與 IPC：`src/main/` | 接入視窗、托盤、系統設定、更新及作業系統能力。 |
| 功能模組 | Redux store 與切片：`src/store/` | 管理使用者、伺服器、頻道、訊息及 UI 狀態。 |
| 子系統 | HTTP／Socket 客戶端：`src/api/`、`src/main/api/`、`src/main/socket/` | 連接 Main Service，接收即時事件。 |
| 子系統 | WebRTC／SFU 與音訊：`src/hooks/web-rtc/`、`src/providers/WebRTC.tsx` | 處理語音傳輸、混音、錄製及裝置狀態。 |
| 子系統 | 多語系、編輯器、Discord 與更新：`src/i18n/`、`src/extensions/`、`src/main/discord/`、`src/main/app/` | 提供客戶端專有的整合能力。 |

**共用候選：** Electron/web adapter 介面、API／Socket client、WebRTC hooks、Redux slice 慣例及 UI 元件。複製時要對齊 IPC 通道、遠端事件契約和媒體生命週期；Electron 模組不適合直接放入 Nuxt 或 Node 服務。

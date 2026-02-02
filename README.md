<div align="center">
  <img width="1920" height="1080" alt="discord_banner" src="https://github.com/user-attachments/assets/488a1f4c-4e03-463a-85c7-a1eef22cc505" />
  <div height="20px">　</div>
  <div>
    <a title="Crowdin" target="_blank" href="https://discord.gg/adCWzv6wwS"><img src="https://img.shields.io/badge/Join-Discord-blue?logo=discord"/></a>
    <a title="Crowdin" target="_blank" href="https://ricecall.com"><img src="https://img.shields.io/badge/Latest-0.3.16-green"/></a>
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
├── build/                    # Electron build artifacts (local)
├── build_deb/                # Linux post-install scripts
├── public/                   # Static assets (images, icons, fonts, etc.)
├── resources/                # Electron packaging resources
├── scripts/                  # Development and maintenance scripts
├── src/
│   ├── app/                  # Next.js App Router entry pages/layout
│   ├── components/           # Reusable UI components
│   ├── extensions/           # TipTap editor extensions
│   ├── i18n/                 # Client i18n setup and translations
│   ├── main/                 # Electron main-process helpers/services
│   ├── pages/                # Legacy renderer pages integrated with Electron
│   ├── popups/               # Popup view components
│   ├── providers/            # React context providers
│   ├── services/             # IPC bridge for renderer
│   ├── styles/               # Global styles and CSS modules
│   ├── types/                # Shared TypeScript types
│   ├── utils/                # Utility functions
│   ├── constant.ts           # Shared constants
│   ├── emojis.ts             # Emoji definitions
│   └── next-env.d.ts         # Next.js environment type declarations
├── dev-app-update.yml        # Electron auto-update configuration
├── electron-builder.json     # Electron packaging configuration
├── electron-builder-dev.json # Electron packaging configuration for dev builds
├── eslint.config.mjs         # ESLint configuration
├── LICENSE                   # Project license
├── main.ts                   # Electron main-process entry point
├── next.config.ts            # Next.js configuration
├── package.json              # Dependencies and npm/yarn scripts
├── tsconfig.electron.json    # TypeScript config for the Electron main process
├── tsconfig.json             # TypeScript config for the renderer
└── yarn.lock                 # Dependency lockfile
```

## Setting Up Local Environment

### 1. Copy `.env.example` to `.env` and fill in all required options

```env
# Server Settings (All variables must be filled)
API_URL=http://localhost:4500 # Do not include the trailing slash
WS_URL=http://localhost:4500 # Use the same URL if your server runs locally

# Crowdin Settings (Optional)
CROWDIN_DISTRIBUTION_HASH= # If not provided, will use local files (./src/i18n/locales/[lang]/[ns]) instead

# Update Settings (Optional)
UPDATE_CHANNEL=latest # The channel to update the app (latest, dev)
```

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
yarn build       # Build for all platforms
yarn build:deb   # Build Linux .deb package
yarn build:dmg   # Build macOS .dmg package
```

### Other Scripts

```bash
yarn format # Format all files with Prettier
```

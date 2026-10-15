# RiceCall

[English](docs/README.en.md) · [官方網站](https://ricecall.com) · [版本下載](https://github.com/NerdyHomeReOpen/RiceCall/releases/tag/latest)

## 專案概述

RiceCall 是由社群獨立開發的語音交流桌面應用程式。本 repository 包含 React／Next.js 畫面與 Electron 主程序；帳號、語音群、頻道及即時資料由 RiceCall Main Service 提供。客戶端不直接擁有主服務的 MySQL 資料庫。

## 專案架構

```text
Next.js 畫面（src/app、src/page-components、src/components）
  ├─ Redux 狀態（src/store）與 API／Socket client（src/api）→ Main Service
  ├─ WebRTC 音訊（src/hooks/web-rtc、src/providers）
  └─ Electron preload／IPC（src/main）→ 視窗、托盤、更新與作業系統
```

`src/main/electron.ts` 與 `src/main/web.ts` 是不同執行環境的入口。`public/` 放靜態素材，`resources/` 放打包資源，`electron-builder.json` 定義安裝檔。

## 模組與子系統

| 類別 | 位置 | 職責 |
| --- | --- | --- |
| 畫面模組 | `src/app/`、`src/page-components/`、`src/components/`、`src/popups/` | 頁面、共用元件與彈窗。 |
| 狀態與通訊 | `src/store/`、`src/api/`、`src/main/api/`、`src/main/socket/` | 管理 UI 狀態並連接 HTTP／Socket 服務。 |
| 桌面子系統 | `src/main/` | Electron 主程序、preload、IPC、Discord 與更新。 |
| 音訊子系統 | `src/hooks/web-rtc/`、`src/providers/WebRTC.tsx` | WebRTC／SFU、裝置與錄製狀態。 |
| 共用能力 | `src/i18n/`、`src/extensions/`、`src/services/`、`src/types/` | 翻譯、編輯器、服務封裝與型別。 |

## 完整建置與執行

1. 安裝 Node.js 20 以上、Yarn 1.22.22，以及目標平台的 Electron 打包工具鏈；確保 Main Service 與靜態 JSON 網址可連線。
2. 複製 `.env.example` 為 `.env`，設定 `RICE_CALL_API_URL`、`RICE_CALL_WS_URL`、`RICE_CALL_DOCS_BASE_URL`。錯誤回報網址 `RICE_CALL_ERROR_SUBMISSION_URL` 為選用。若要切換開發端點，可建立同名鍵的 `.env.dev`。
3. 安裝依賴並啟動開發版：

   ```bash
   yarn install --frozen-lockfile
   yarn dev
   ```

4. 執行檢查並建置：

   ```bash
   yarn typecheck
   yarn lint
   yarn check-names
   yarn build:ci
   yarn build
   ```

`yarn build:ci` 只產生 Next.js 與 Electron 編譯產物；`yarn build` 另外呼叫 electron-builder 產生平台安裝檔。Linux `.deb` 用 `yarn build:deb`，macOS `.dmg` 用 `yarn build:dmg`。`yarn start` 使用已建置的 Web 產物啟動 Web 與 Electron 程序。

## 使用聲明

RiceCall（RC 語音）由 NerdyHomeReOpen 獨立開發，與原 RaidCall 開發團隊、伺服器或官方組織無關。所有版本目前皆為測試版本，請自行評估使用風險。帳號、等級、VIP、語音群等資料可能重置、遺失或刪除。

RiceCall 不是 RaidCall 的延續、重製或官方授權版本，也不提供 RaidCall 服務還原、技術支援或帳號資料恢復。本專案由社群以非商業目的開發，內容供學術研究與技術交流。如有版權、商標等疑慮，請聯繫團隊協商。

問題可透過應用程式右上角「意見反饋」、[GitHub Issues](https://github.com/NerdyHomeReOpen/RiceCall/issues) 或 [Discord](https://discord.gg/s86Yra4dUb) 回報。團隊保留對測試資料與服務的最終決定權。

## 下載與參與

一般使用者可從[官方網站](https://ricecall.com)或 [GitHub 最新版本](https://github.com/NerdyHomeReOpen/RiceCall/releases/tag/latest)下載適用平台的安裝檔；下載前請閱讀上方使用聲明。開發者可填寫[參與表單](https://forms.gle/ZowwAS22dGpKkGcZ8)或提交 [Pull Request](https://github.com/NerdyHomeReOpen/RiceCall/pulls)。

## 延伸文件

`docs/` 收錄專案文件；程式命名與跨專案詞彙以 RiceCall Engineering Standard 為準。

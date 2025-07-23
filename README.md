<div align="center">
  <img src="https://github.com/user-attachments/assets/cd9fb652-f032-4fb7-b949-91305d37f103" height="100px" align="center">
  <div height="20px">　</div>
  <div>
    <img src="https://img.shields.io/badge/Join-Discord-blue?logo=discord&link=https%3A%2F%2Fdiscord.gg%2FadCWzv6wwS"/>
    <img src="https://img.shields.io/badge/Latest-v0.1.15-green"/>
  </div>
</div>

## 使用聲明

**[RiceCall](https://github.com/NerdyHomeReOpen/RiceCall)**（以下簡稱 RC 語音）為 **[NerdyHomeReOpen](https://github.com/NerdyHomeReOpen)**（以下簡稱本團隊）**獨立開發**之專案，**與 RaidCall 原開發團隊、伺服器或任何官方組織無任何關聯**。請使用者自行斟酌並承擔使用風險（_Use at your own risk_）。

目前 RC 語音所有版本皆為測試版本，若在使用過程中發現問題，歡迎透過以下方式回報：

- 應用程式內：右上角選單 > 意見反饋
- GitHub：[問題回報](https://github.com/NerdyHomeReOpen/RiceCall/issues)
- Discord：加入 [官方群組](https://discord.gg/adCWzv6wwS) 以獲取最新資訊

請注意，RC 語音之所有資料（包括但不限於帳號、等級、VIP、語音群等）**可能會遭到重置、遺失或刪除**，本團隊保有最終決策權。

RC 語音**並非 RaidCall 的延續、重製或官方授權版本**，亦**不提供 RaidCall 服務的還原、支援或帳號資料恢復**。此專案純屬愛好者社群自發性的開發行動，旨在提供一個新的語音交流平台，**不以商業化為目的**。

RC 語音所有內容僅供學術研究與技術交流使用。如涉及任何版權、商標或其他權利問題，歡迎來信與我們聯繫協商。

RC 語音雖參考或沿用部分 RaidCall 相關素材，但最終成品皆為本團隊獨立創作，**不代表 RaidCall 官方立場或意圖**。因此，我們**不提供與 RaidCall 相關之任何技術支援、帳號恢復或資料查詢服務**。如有相關問題，請洽原 RaidCall 官方。

### 開源參與方式

我們歡迎各界開發者參與 RC 語音的開發與維護。您可透過以下方式加入貢獻：

- 填寫 [意願表單](https://forms.gle/ZowwAS22dGpKkGcZ8)（請先加入 [Discord 官方群組](https://discord.gg/adCWzv6wwS)，若我們有需要會聯繫您並指派身份組）
- Fork 本專案並提交 [Pull Request](https://github.com/NerdyHomeReOpen/RiceCall/pulls)，貢獻新功能或修復

感謝您的支持與參與！

## 安裝方法

下方為載點，請先閱讀過說明文件後再開始下載:

[下載點](https://github.com/NerdyHomeReOpen/RiceCall/releases/latest)

## 常見問題

### Q. 這裡是官方嗎

A. 不是，我們是一群由熱忱組成的團隊，跟原官方無任何關係

### Q. 為什麼沒有群

A. 目前沒有推薦語音群，無聊沒事可以去 10 或 2000000 逛逛喔

### Q. 怎麼獲得VIP

A. 目前未開放購買，將會在正式版開放時提供管道

### Q. 我要多久可以升一次等級

A. 請在 [這裡](https://docs.google.com/spreadsheets/d/1cV9BghtRDgzh9QBgsSON9NoVdPoGUHsOJEJwrzxNLJk/edit?usp=sharing) 查看

### Q. 轉圈圈怎麼辦

A. 登出重新登入，頻繁觸發請至 [Discord 官方群組](https://discord.gg/adCWzv6wwS) 或 [Issues](https://github.com/NerdyHomeReOpen/RiceCall/issues) 回報

### Q. 彈出錯誤視窗怎麼辦

A. 請截圖並附上觸發方式至 [Discord 官方群組](https://discord.gg/adCWzv6wwS) 或 [Issues](https://github.com/NerdyHomeReOpen/RiceCall/issues) 回報

### Q. 我無法登入

A. 請先確定自己下載的是[最新版本](https://github.com/NerdyHomeReOpen/RiceCall/releases/latest) ，對照版本號，若持續發生請至 [Discord 官方群組](https://discord.gg/adCWzv6wwS) 或 [Issues](https://github.com/NerdyHomeReOpen/RiceCall/issues) 回報

### Q: 我的問題不在以上的內容中

A: 請加入我們的 [Discord 官方群組](https://discord.gg/adCWzv6wwS) 或至 [Issues](https://github.com/NerdyHomeReOpen/RiceCall/issues) 頁面詳細描述你所遇到的問題

## 技術架構

- **前端 (Client):** React, Electron
- **後端 (Server):** Node.js
- **資料庫 (Database):** SQLite
- **通訊協定 (Protocol):** WebRTC / WebSocket

## 專案架構

```bash
RiceCall
├── public/                   # 靜態資源 (圖片、icons 等)
├── resources/                # Electron 打包相關資源
├── src/                      # 原始碼
│   ├── app/                  # Next.js 頁面
│   ├── components/           # React/Electron 元件
│   ├── providers/            # React Providers
│   ├── services/             # API 呼叫、資料處理
│   ├── styles/               # CSS
│   ├── types/                # 類型定義
│   ├── utils/                # 功能檔案
│   ├── i18n                  # i18n 文件獲取設定
├── .env.example              # 環境變數範例
├── .gitignore                # Git 忽略清單
├── .prettierrc               # Prettier 設定
├── crowdin.yml               # Crowdin 設定
├── dev-app-update.yml        # 應用程式更新設定 (Electron auto-update)
├── Dockerfile                # Docker 部署設定
├── electron-builder.json     # Electron 打包設定
├── eslint.config.mjs         # ESLint 設定
├── LICENSE                   # 專案授權
├── main.ts                   # Electron 入口文件
├── next.config.ts            # Next 設定
├── package.json              # npm/yarn 依賴管理
├── README.md                 # 這份文件
├── tsconfig.electron.json    # TypeScript 設定 (用於 main.ts)
├── tsconfig.json             # TypeScript 設定
├── yarn.lock                 # Yarn 鎖定依賴版本
```

## 建置本地環境

### 1. Copy .env.example to .env and fill all required option

```env
# Server Settings (All variables need to be fill)
NEXT_PUBLIC_API_URL=http://localhost:4500 # Don't add the final /
NEXT_PUBLIC_WS_URL=https://localhost:4500 # If your server is on the same machine, use the same url

# Crowdin Settings (Optional)
NEXT_PUBLIC_CROWDIN_DISTRIBUTION_HASH=put_your_hash_here # If not provided, will use local files (./src/i18n/locales/[lang]/[ns]) instead
```

### 2. Install dependency

```bash
yarn install
```

### 3. Start dev client

```bash
yarn dev
```

### 4. Build

```bash
yarn build # For all platform
yarn build:deb # For linux .deb file
yarn build:dmg # For macOS .dmg file
```

### Other scripts

```bash
yarn format # Format all files with prettier
```

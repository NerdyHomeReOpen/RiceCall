<div align="center">
  <img src="https://github.com/user-attachments/assets/cd9fb652-f032-4fb7-b949-91305d37f103" height="100px" align="center">
  <div height="20px">　</div>
  <div>
    <img src="https://img.shields.io/badge/Join-Discord-blue?logo=discord&link=https%3A%2F%2Fdiscord.gg%2FadCWzv6wwS"/>
    <img src="https://img.shields.io/badge/Latest-v0.1.10-green"/>
  </div>
</div>

## 使用聲明 (Disclaimer)

**[RiceCall](https://github.com/NerdyHomeReOpen/RiceCall)** (下稱 RC 語音) 是由 **[NerdyHomeReOpen](https://github.com/NerdyHomeReOpen)** (下稱本團隊) **獨立開發**的專案，與 RaidCall 的原開發團隊、伺服器或任何官方組織**沒有任何關聯，請謹慎下載並使用 (Use on your own risks)**

RC 語音現行版本均為測試版本，若在運行時發現問題，請至[問題回報](https://github.com/NerdyHomeReOpen/RiceCall/issues)或是應用程式內 [右上角選單 > 意見反饋] 回報您遇到的問題，另外也可以加入我們的 [Discord](https://discord.gg/adCWzv6wwS) 伺服器以獲取最新資訊。

RC 語音之**資料 (包括但不限於: 帳號、等級、VIP、語音群) 皆可能遺失或移除**，本團隊保有最終決議權。

RC 語音**並非** RaidCall 的延續或官方授權版本，亦**不涉及恢復過去的 RaidCall 服務或其伺服器**。

RC 語音的開發純屬愛好者社群的自主行動，目的在於提供一個新的語音交流平台，並非商業化項目。

RC 語音所有內容僅供學術研究與技術交流使用。如涉及任何版權、商標或其他權利問題，請聯繫我們進行溝通。

RC 語音可能會參考或取用部分 RaidCall 相關的素材，但所有內容皆屬本團隊的獨立創作，且不代表 RaidCall 官方立場或意圖。

RC 語音不負責與 RaidCall 相關的任何技術支援、帳號恢復或資料遺失等問題。如有任何與 RaidCall 相關的問題，請直接聯繫其原開發團隊或官方渠道。

本團隊歡迎所有開發者參與 RC 語音的開發！你可以透過以下方式貢獻：

- 至[此表單](https://forms.gle/ZowwAS22dGpKkGcZ8)填寫幫助意願 (記得先加入我們的 [Discord](https://discord.gg/adCWzv6wwS)，若我們需要你的幫忙會給予你身份組)
- 若想直接新增功能，可以 Fork 此專案，進行修改後提交 [Pull Request](https://github.com/NerdyHomeReOpen/RiceCall/pulls)
- 回報 Bug 或提出新功能建議，請到 [Issues](https://github.com/NerdyHomeReOpen/RiceCall/issues) 頁面

## 安裝方法 (Download)

下方為載點，請先閱讀過說明文件後再開始下載:

[下載點](https://github.com/NerdyHomeReOpen/RiceCall/releases/latest)

## 常見問題 (FAQ)

### Q: 我卡在轉圈圈畫面怎麼辦

A: 請從右上角選單 -> 登出，然後再登入一次

### Q: 我語音一直沒聲音

A: 如果你正在使用學校、公司等網路，可能會導致連線不到，請換一個網路連線，目前還沒有根除方法

### Q: 我開機自動啟動後沒有連線

A: 重新啟動應用程式再試一次

### Q: 我的問題不在以上的內容中

A: 請加入我們的 [Discord](https://discord.gg/adCWzv6wwS) 伺服器或至 [Issues](https://github.com/NerdyHomeReOpen/RiceCall/issues) 頁面詳細描述你所遇到的問題

## 技術架構 (Tech Stack)

- **前端 (Client):** React, Electron
- **後端 (Server):** Node.js
- **資料庫 (Database):** SQLite
- **通訊協定 (Protocol):** WebRTC / WebSocket

## 專案架構 (Framework)

```bash
RiceCall
├── public/                   # 靜態資源 (圖片、icons 等)
├── resources/                # Electron 打包相關資源
├── src/                      # 應用程式的主要原始碼
│   ├── app/                  # Next.js 頁面
│   ├── components/           # React/Electron 元件
│   ├── providers/            # React Providers
│   ├── services/             # API 呼叫、資料處理
│   ├── styles/               # CSS
│   ├── types/                # 類型定義
│   ├── utils/                # 功能檔案
├── main.js                   # Electron 入口文件
├── .env.example              # 環境變數範例
├── .gitignore                # Git 忽略清單
├── .prettierrc               # Prettier 設定
├── dev-app-update.yml        # 應用程式更新設定 (Electron auto-update)
├── Dockerfile                # Docker 部署設定
├── electron-builder.json     # Electron 打包設定
├── eslint.config.mjs         # ESLint 設定
├── LICENSE                   # 專案授權
├── package.json              # npm/yarn 依賴管理
├── postcss.config.mjs        # PostCSS 設定
├── README.md                 # 專案說明文件
├── tsconfig.json             # TypeScript 設定
├── yarn.lock                 # Yarn 鎖定依賴版本
```

## 建置本地環境 (Build)

1. 安裝 Modules

```bash
yarn install
```

2. 建立 .env 或複製 .env.example 後更名為 .env，以下為環境變數範例

```env
NEXT_PUBLIC_SERVER_URL=你的伺服器公開網址
NEXT_PUBLIC_SERVER_URL_SECONDARY=備援網址(使用中華電信網路將會使用該網址，若無則設定和 NEXT_PUBLIC_SERVER_URL 相同)
```

3. 啟動 Client

```bash
yarn electron-dev
```

客戶端即會運行於本地電腦上

> http://localhost:3000



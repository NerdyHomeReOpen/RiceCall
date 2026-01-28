# 子系統架構 (Subsystem Architecture)

本章節詳細介紹 RiceCall 的核心子系統架構。這些子系統共同協作，構建出一個跨平台（Electron & Web）、高效能且可維護的即時通訊應用程式。

我們將系統劃分為數個關鍵領域，每個領域負責特定的技術職責，確保關注點分離（Separation of Concerns）。

## 文件列表

1. **[IPC 通訊層 (IPC Layer)](./ipc-layer.md)**
   - **職責**：應用程式的通訊骨幹。
   - **說明**：負責前端 UI 與底層邏輯（或 Electron 主進程）之間的資料交換。透過統一的 `src/ipc.ts` 介面，隔離了底層實作細節，讓業務邏輯層只需調用一致的 API，無需關心當前運行環境。

2. **[彈窗系統 (Popup System)](./popup-system.md)**
   - **職責**：視窗與互動介面管理。
   - **說明**：管理應用程式中的所有視窗行為，包含獨立視窗（Window）、模態對話框（Modal）以及懸浮控制項。此系統統一處理了視窗的生命週期、參數傳遞以及父子視窗間的通訊同步。

3. **[Socket 服務 (Socket Service)](./socket-service.md)**
   - **職責**：即時通訊與事件驅動核心。
   - **說明**：負責維護與伺服器的長連線。採用事件驅動架構（Event-Driven Architecture），結合 Redux 狀態管理，處理即時訊息、語音信令、狀態更新等高頻率互動。
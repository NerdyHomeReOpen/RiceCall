# 架構重構實作報告：Electron/Web 雙平台支援

**日期**: 2026-01-27
**比較範圍**: Commit [`f15853c`](https://github.com/NerdyHomeReOpen/RiceCall/commit/f15853c) (基線) vs `HEAD` (目前版本)

## 1. 總覽 (Overview)

本次重構的主要目標是將原先高度依賴 Electron 的單體架構 (Monolithic Architecture)，轉型為支援 Web 與 Electron 雙平台的模組化架構。透過「平台抽象層 (Platform Abstraction Layer)」與「處理器模式 (Handler Pattern)」，實現了核心業務邏輯的跨平台共用。

## 2. 核心架構變更 (Architectural Changes)

### 2.1 平台抽象層 (Platform Abstraction Layer) - `src/platform/`

這是本次重構的核心。所有的平台特定功能（IPC, Popup, Auth, Data, Socket, Window）都被封裝在 `src/platform` 目錄下。每個模組遵循統一的設計模式：

*   **契約 (Contract) - `types.ts`**: 定義該功能的介面 (Interface)。無論是 Web 或 Electron 都必須實作此介面。
*   **Electron 實作 - `electron.ts`**: 使用 Electron 原生 API (如 `ipcRenderer`, `BrowserWindow`, `fs`) 的實作。
*   **Web 實作 - `web.ts`**: 使用 Web 標準 API (如 `fetch`, `localStorage`, `BroadcastChannel`) 或模擬行為的實作。
*   **工廠 (Factory) - `index.ts`**: 根據執行環境 (`isElectron()`) 動態注入正確的實作單例。

**優點**: 前端元件 (React Components) 不需要知道當前運行在哪個平台，只需呼叫統一的介面。

### 2.2 處理器模式 (Handler Pattern) - `src/handlers/`

原先散落在 `main.ts` 或 `ipc.ts` 中的業務邏輯被拆解並遷移至 `src/handlers/`。

*   **舊架構**: `ipcMain.on('channel', (event, args) => { ...邏輯... })`
*   **新架構**: 
    *   Handler 是純粹的函式：`(args) => result`。
    *   **Electron**: 將這些 Handler 註冊到 `ipcMain`。
    *   **Web**: 透過「模擬 IPC (Fake IPC)」直接在瀏覽器端執行這些 Handler。

這使得業務邏輯與傳輸層 (Transport Layer) 解耦，便於測試與重用。

### 2.3 IPC Facade - `src/ipc.ts`

為了保持對現有大量前端程式碼的相容性，`src/ipc.ts` 被保留作為 **Facade (外觀模式)**。它不再包含實作細節，而是作為統一入口，將請求代理 (Delegate) 給 `src/platform` 中的各個模組。這讓大部分的 React 元件無需修改即可運作於新架構上。

## 3. 模組詳細分析 (Module Analysis)

### 3.1 IPC 通訊 (`src/platform/ipc/`)

*   **重構前**: 直接依賴 `window.require('electron').ipcRenderer`。
*   **重構後**: 
    *   定義了 `IpcRenderer` 介面。
    *   **Web 實作**: 創造了一個模擬的 `ipcRenderer`。當呼叫 `invoke` 或 `send` 時，它不會發送跨行程訊息，而是直接查找並執行 `src/handlers` 中註冊的對應函式。
    *   **Broadcast**: Web 版利用 `BroadcastChannel` 模擬跨視窗（或跨 Tab）的事件廣播。

### 3.2 視窗/彈窗系統 (`src/platform/popup/`)

*   **重構前**: 每個 Popup 都是一個獨立的 Electron `BrowserWindow`，透過 IPC 交換資料。
*   **重構後**:
    *   引入 `src/popup.config.ts` 集中管理 Popup 設定。
    *   **Electron**: 維持多視窗模式。
    *   **Web**: 引入 `InAppPopupHost` (React Component)，將 Popup 渲染為頁面內的浮層 (Overlay/Modal)。
    *   **統一介面**: `PopupController` 介面統一了 `open`, `close`, `submit` 等行為，讓業務邏輯無需關心 Popup 是獨立視窗還是 DOM 元素。

### 3.3 Socket 連線 (`src/platform/socket/`)

*   **重構前**: `src/socket.ts` 直接處理 Socket.IO 連線，邏輯混雜。
*   **重構後**: 
    *   `src/platform/socket/` 封裝了 `SocketService`。
    *   支援在不同平台使用不同的連線策略（雖然目前底層都是 Socket.IO，但架構上允許未來替換）。
    *   `SocketManager` 元件負責生命週期管理。

### 3.4 資料與認證 (`src/platform/data/`, `src/platform/auth/`)

*   資料存取與認證邏輯被抽離為獨立服務。
*   Web 版使用 HTTP API 直接與後端通訊。
*   Electron 版則可能透過 IPC 請求 Main Process 進行操作（或共用同樣的 HTTP 邏輯，視 Handler 設定而定）。

## 4. 結論

本次重構成功建立了 **Electron + Web 同構 (Isomorphic)** 的基礎。

1.  **解耦**: 業務邏輯不再綁死 Electron API。
2.  **Web Ready**: 透過 Web 實作層，RiceCall 已具備在瀏覽器中運行的能力（`dev-web-PoC` 分支驗證）。
3.  **可維護性**: Handler 模式讓後端邏輯更清晰，`platform` 目錄讓平台差異一目了然。

此架構為未來的功能擴充與維護提供了穩固的基礎。

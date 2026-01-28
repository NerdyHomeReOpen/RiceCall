# RiceCall 架構重構詳細方塊圖 (Architecture Block Diagrams)

**日期**: 2026-01-27
**版本比較**: Commit [`f15853c`](https://github.com/NerdyHomeReOpen/RiceCall/commit/f15853c) (Legacy) vs `HEAD` (Refactored)

這份文件透過詳細的文字方塊圖，描述系統重構前後的組件互動、依賴關係與資料流向。

---

## 1. 舊架構 (Legacy Architecture - `f15853c`)

**特徵**: 單體式 Electron 應用，前端直接依賴 Electron API，業務邏輯高度耦合在 Main Process。

```mermaid
graph TD
    subgraph Renderer_Process [Renderer Process (React)]
        UI[UI Components]
        
        subgraph Legacy_IPC_Facade [src/ipc.ts]
            IPC_Funcs[Functions: login, minimize, openPopup]
            IPC_Direct[Direct calls to window.require('electron')]
        end
        
        Socket_Legacy[src/socket.ts (Global Socket Instance)]
    end

    subgraph IPC_Channel [IPC Channel]
        Msg_Sync[Synchronous Messages]
        Msg_Async[Asynchronous Messages]
    end

    subgraph Main_Process [Main Process (Node.js)]
        Main_Entry[main.ts (God Object)]
        
        subgraph Main_Logic [Coupled Logic inside main.ts]
            Win_Mgmt[Window Management]
            Auth_Logic[Auth Logic]
            Data_IO[File System I/O]
            App_Lifecycle[App Lifecycle]
            Tray_Logic[Tray & Menus]
        end
        
        Native_Wins[BrowserWindows (Main & Popups)]
    end

    %% Relationships
    UI --> IPC_Funcs
    IPC_Funcs -->|ipcRenderer.send| IPC_Channel
    Socket_Legacy -->|Direct Connection| UI
    
    IPC_Channel -->|ipcMain.on| Main_Entry
    Main_Entry --> Main_Logic
    Main_Logic --> Native_Wins
    
    %% Critical Coupling
    IPC_Direct -.->|Hard Dependency| IPC_Channel
```

### 舊架構資料流範例 (開啟 Popup)

1.  **UI**: `ActionLink.tsx` 呼叫 `ipc.popup.open(...)`
2.  **src/ipc.ts**: 直接呼叫 `electron.ipcRenderer.send('open-popup', ...)`
3.  **Main Process**: `ipcMain.on('open-popup')` 接收事件
4.  **Main Logic**: `new BrowserWindow(...)` 建立原生視窗
5.  **Main Logic**: 載入 URL `file://.../popup.html`

---

## 2. 新架構 (Refactored Architecture - `HEAD`)

**特徵**: 平台抽象化，業務邏輯模組化 (Handlers)，支援 Web 與 Electron 雙運行模式。

### 2.1 高層抽象視圖 (High-Level Overview)

```text
+-----------------------------------------------------------------------+
|                       Renderer Layer (React)                          |
|  [UI Components] --> [src/ipc.ts (Facade)]                            |
|                           |
+---------------------------|-------------------------------------------+
                            v
+-----------------------------------------------------------------------+
|                 Platform Abstraction Layer (Factory)                  |
|                   [src/platform/ipc/index.ts]                         |
|             (Detects Environment: isElectron?)                        |
+-----------------------------------------------------------------------+
           /                                          \
          / (True)                                     \ (False)
         v                                              v
+-------------------------+                 +-------------------------+
|    Electron Adapter     |                 |       Web Adapter       |
| [platform/*/electron.ts]|                 |   [platform/*/web.ts]   |
+-------------------------+                 +-------------------------+
           |
           | IPC (Real)                                 | Direct Function Call / API
           v                                            v
+-------------------------+                 +-------------------------+
|   Main Process (Node)   |                 |    Browser Runtime      |
| [ipcMain.on]            |                 | [Fake IPC Implementation]|
+-------------------------+                 +-------------------------+
           |
           +------------------+     +-------------------+
                              |     |
                              v     v
                  +-----------------------------+
                  |   Shared Business Logic     |
                  |     [src/handlers/*.ts]     |
                  | (Auth, Data, Settings...)   |
                  +-----------------------------+
```

---

### 2.2 詳細組件互動圖 (Detailed Component Interaction)

#### A. 核心通訊與邏輯 (IPC & Handlers)

這個部分展示了 `src/ipc.ts` 如何透過不同的路徑最終執行到 `src/handlers` 中的程式碼。

```text
 [ User Action ] e.g., Click Login
       |
       v
 [ src/ipc.ts ] (Facade)
 func auth.login(data)
       |
       v
 [ src/platform/ipc/index.ts ] (Singleton Provider)
 getIpcRenderer() -> returns Implementation
       |
       +-----------------------------------+---------------------------------------+
       | ELECTRON PATH                     | WEB PATH                              |
       |                                   |                                       |
 [ src/platform/ipc/electron.ts ]    [ src/platform/ipc/web.ts ]               |
 class ElectronIpcRenderer           class WebIpcRenderer                      |
 method invoke('auth-login', data)   method invoke('auth-login', data)         |
       |
       | (IPC Over Bridge)                 | (Lookup in Registry)              |
       v                                   v                                   |
 [ Main Process / main.ts ]          [ Handler Registry (Memory) ]             |
 ipcMain.handle('auth-login')        map.get('auth-login')                     |
       |
       +-----------------+-----------------+
                         |
                         v
               [ src/handlers/auth.handler.ts ]
               func loginHandler(data, context)
                         |
           +-------------+-------------+
           |                           |
  [ context.api (Node) ]      [ context.api (Web) ]                            |
  Executes logic using        Executes logic using                             |
  Axios/Electron-Store        Fetch/LocalStorage                               |
```

#### B. 彈窗系統 (Popup System)

這部分展示了最複雜的 UI 差異：Electron 使用原生視窗，Web 使用 React Portal/Overlay。

```text
 [ src/utils/popup.ts ] (Popup Facade)
 open(type, id, data)
       |
       v
 [ src/platform/popup/index.ts ] (Factory)
 getPopupController()
       |
       +-----------------------------------+---------------------------------------+
       | ELECTRON PATH                     | WEB PATH                              |
       |                                   |                                       |
 [ src/platform/popup/electron.ts ]  [ src/platform/popup/web.ts ]             |
 class ElectronPopupController       class WebPopupController                  |
 method open(...)                    method open(...)                          |
       |
       | 1. Sends IPC 'open-popup'         | 1. Stores initData to sessionStorage|
       | 2. Main Process creates           | 2. Broadcasts 'open-popup' event    |
       |    new BrowserWindow              |    (via BroadcastChannel)           |
       |                                   |                                       |
       v                                   v                                   |
 [ New OS Window ]                   [ src/platform/popup/InAppPopupHost.tsx ] |
 Loads /popup page                   (React Component listening to Broadcast)  |
       |
       |                                   | Renders:                          |
       |                             [ <div className="popup-overlay"> ]       |
       |                               [ <PopupContainer /> ]                  |
       |                             [ </div> ]                                |
       |                                                                       |
       +-----------------+-----------------+
                         |
                         v
               [ src/app/popup/page.tsx ]                                      |
               (Shared Popup UI Component)                                     |
                         |
             [ src/popupLoader.ts ]                                            |
             Loads: UserInfo, Settings, etc.                                   |
```

#### C. Socket 連線 (Socket System)

`src/socket.ts` 被廢棄，取而代之的是模組化的 Socket 服務。

```text
 [ src/ipc.ts ] (Facade)
 ipc.socket.on(...)
       |
       v
 [ src/platform/socket/index.ts ]
 getSocketClient()
       |
       +-----------------------------------+---------------------------------------+
       | ELECTRON PATH                     | WEB PATH                              |
       |                                   |                                       |
 [ src/platform/socket/electron.ts ] [ src/platform/socket/web.ts ]            |
 (Wraps Electron IPC to talk         (Direct Socket.IO Client)                 |
  to Main Process Socket)                  |
       |
       v                                   |
 [ Main Process ]                          |
 [ src/platform/socket/electron-main.ts ]  |
 (Real Socket.IO connection in Node)       |
       |
       +-----------------+-----------------+
                         |
                         v
                  [ Socket.IO Server ]                                         |
```

---

## 3. 模組介面定義 (Module Interfaces)

以下列出關鍵的介面定義，這定義了重構後的「契約」。

### 3.1 `IpcRenderer` Contract
```typescript
// src/platform/ipc/types.ts
interface IpcRenderer {
  send(channel: string, ...args: any[]): void;
  invoke(channel: string, ...args: any[]): Promise<any>;
  on(channel: string, listener: (...args: any[]) => void): void;
  removeListener(channel: string, listener: (...args: any[]) => void): void;
}
```

### 3.2 `PopupController` Contract
```typescript
// src/platform/popup/types.ts
interface PopupController {
  open(type: PopupType, id: string, initialData?: any, options?: PopupOptions): void;
  close(id: string): void;
  closeAll(): void;
  submit(to: string, data?: any): void; // Popup to Main communication
}
```

### 3.3 `HandlerContext` (The "Dependency Injection")
```typescript
// src/platform/ipc/types.ts
// 這個 Context 傳入 Handler，讓 Handler 不需要知道自己在 Electron 還是 Web
interface HandlerContext {
  storage: IpcStorage;      // Electron-store vs LocalStorage
  api: ApiClient;           // Axios/Net vs Fetch
  broadcast: Broadcaster;   // BrowserWindow.send vs BroadcastChannel
}
```
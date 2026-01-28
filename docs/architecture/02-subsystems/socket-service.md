# Socket 服務 (Socket Service)

Socket 服務是 RiceCall 負責即時通訊的核心子系統。它經歷了一次重大的架構重構，從原本集中於單一頁面元件的處理方式，轉變為分層明確、職責分離的事件驅動架構。

## 1. 架構演進 (Architecture Evolution)

### 1.1 舊版架構 (Legacy Architecture)
在 Commit [`bcde516`](https://github.com/NerdyHomeReOpen/RiceCall/commit/bcde516) 之前，Socket 的邏輯高度耦合於 UI 層：

*   **位置**: `src/app/page.tsx` (`RootPageComponent`)。
*   **實作**: 
    *   所有的 `ipc.socket.on` 事件監聽器直接寫在 `useEffect` 中。
    *   使用大量的 `useState` 來管理應用程式的全域狀態（如 `channelMessages`, `friends`, `servers`）。
    *   收到事件後直接呼叫 `setState` 更新畫面。
*   **缺點**: 
    *   `page.tsx` 檔案過於龐大且複雜。
    *   狀態管理邏輯與 UI 渲染邏輯混雜。
    *   難以維護與測試。

### 1.2 現行架構 (Current Architecture)
目前的架構採用了 **Redux** 進行狀態管理，並引入 **SocketManager** 作為事件處理中心，實現了關注點分離：

*   **通訊層 (Connection)**: `src/platform/socket/` 負責底層連線管理與跨平台適配。
*   **控制層 (Controller)**: `src/components/SocketManager.tsx` 負責監聽 Socket 事件並派發 Redux Actions。
*   **資料層 (State)**: `src/store/slices/` 負責實際的資料更新邏輯。
*   **操作層 (Utils)**: `src/utils/popup.ts` 封裝發送訊息的邏輯。

## 2. 核心元件詳解

### 2.1 SocketManager (`src/components/SocketManager.tsx`)
這是前端接收 Socket 事件的總機。它不包含複雜的業務邏輯，主要職責是：
1.  掛載 Socket 事件監聽器 (`ipc.socket.on`)。
2.  接收到事件後，將資料打包並 `dispatch` 到對應的 Redux Slice。
3.  處理基礎的連線狀態（如 `connect`, `disconnect` 的 UI 狀態更新）。

```typescript
// 範例：接收頻道訊息
useEffect(() => {
  const unsub = ipc.socket.on('channelMessage', (...args: Types.ChannelMessage[]) => {
    dispatch(addChannelMessages(args)); // 派發 Action，不直接操作 State
  });
  return () => unsub();
}, [dispatch]);
```

### 2.2 Redux Slices (`src/store/slices/`)
每個 Slice 對應一種資料模型（如 `channelMessagesSlice`, `serversSlice`）。它們負責：
1.  定義資料結構 (`initialState`)。
2.  定義 Reducer 來處理資料變更（如新增、更新、刪除）。

### 2.3 平台適配 (`src/platform/socket/`)
詳見 `src/platform/socket/index.ts`。此層確保上層邏輯無需關心當前是 Electron 環境還是 Web 環境。
*   **Electron**: 透過 IPC 與 Main Process 的 Socket 連線通訊。
*   **Web**: 直接在瀏覽器端建立 Socket.IO 連線。

## 3. 資料流 (Data Flow)

### 3.1 接收訊息 (Receiving)
由伺服器推播至前端畫面的路徑：

1.  **Server** 發送 Socket 事件 (e.g., `channelMessage`)。
2.  **Platform Layer** (`src/platform/socket`) 接收並標準化事件。
3.  **SocketManager** (`src/components/SocketManager.tsx`) 監聽到事件。
4.  **SocketManager** 呼叫 `dispatch(addChannelMessages(data))`。
5.  **Redux Store** 更新 `channelMessages` 狀態。
6.  **UI Components** (`useAppSelector`) 偵測到 State 變更，自動重新渲染。

### 3.2 發送訊息 (Sending)
由使用者操作觸發至伺服器的路徑：

1.  **UI Component** (e.g., `MessageInputBox.tsx`) 接收使用者輸入。
2.  **Helper Function** (`src/utils/popup.ts`) 被呼叫 (e.g., `sendChannelMessage`)。
3.  **IPC Interface** 呼叫 `ipc.socket.send('channelMessage', payload)`。
4.  **Platform Layer** 根據環境將封包送出：
    *   **Electron**: Renderer -> IPC -> Main Process -> Socket.emit。
    *   **Web**: Browser -> Socket.emit。

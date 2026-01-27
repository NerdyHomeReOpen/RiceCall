# 開發指南 (Developer Guides)

## 快速上手：如何新增一個 IPC 功能

假設你要新增一個「取得系統資訊」的功能。

### 步驟 1: 定義介面與 Handler
在 `src/handlers/system.handler.ts` (需建立) 撰寫邏輯：

```typescript
// 定義 Handler
export const getSystemInfoHandler = async (args: any, context: HandlerContext) => {
  // 使用 context.api 或 context.storage
  return { os: 'shared', version: '1.0' };
};
```

### 步驟 2: 註冊 Handler
在 `src/handlers/index.ts` 中引入並註冊：

```typescript
import { getSystemInfoHandler } from './system.handler';

export function createAllHandlers() {
  return mergeRegistrations(
    // ...
    {
      async: {
        'get-system-info': getSystemInfoHandler
      }
    }
  );
}
```

### 步驟 3 (Electron Only): Main Process 對接 (如果是純邏輯則跳過)
如果這個 Handler 需要 Node.js 原生能力 (如讀檔)，你需要實作 Electron 專用的 Handler 並在 `src/platform/ipc/electron.ts` 覆寫它，或者直接在 `src/handlers` 裡透過 `isElectron` 檢查 (不推薦)。
*通常如果是通用邏輯，步驟 2 就夠了。*

### 步驟 4: 使用 Facade 呼叫
在 `src/ipc.ts` 暴露給 UI (或者直接在 UI 用 `getIpc().invoke`，但推薦走 Facade)：

```typescript
// src/ipc.ts
export const ipcFacade = {
  // ...
  system: {
    getInfo: () => getIpc().invoke('get-system-info')
  }
}
```

### 步驟 5: UI 呼叫
```typescript
const info = await ipc.system.getInfo();
```

---

## 注意事項
1.  **不要直接 import `electron`**：永遠透過 `src/platform/*` 存取。
2.  **Popup 狀態管理**：Web Popup 關閉時是銷毀 DOM，Electron 是關閉視窗。確保 `useEffect` 的 cleanup 函式寫好。
3.  **Context 依賴**：Handler 盡量只依賴 `context` 傳入的 `api` 和 `storage`，這樣單元測試時很容易 Mock。

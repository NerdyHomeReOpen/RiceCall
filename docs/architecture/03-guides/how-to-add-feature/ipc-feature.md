# 如何新增 IPC 功能 (IPC Feature)

本文件說明如何新增一個「請求/回應」模式的功能（例如：讀取設定、檔案操作、系統資訊取得）。

假設你要新增一個「取得系統資訊」的功能。

## 步驟 1: 定義 Handler
在 `src/handlers/` 目錄下建立或修改對應的 Handler 檔案（例如 `system.handler.ts`）：

```typescript
// 定義 Handler 邏輯
// context 提供了跨平台的 API 存取能力
export const getSystemInfoHandler = async (args: any, context: HandlerContext) => {
  return { os: 'shared', version: '1.0' };
};
```

## 步驟 2: 註冊 Handler
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

## 步驟 3: 使用 Facade 封裝 (推薦)
在 `src/ipc.ts` 中將底層呼叫封裝為語意化的 API，方便 UI 使用且提供型別提示：

```typescript
// src/ipc.ts
export const ipcFacade = {
  // ...
  system: {
    getInfo: () => getIpc().invoke('get-system-info')
  }
}
```

## 步驟 4: UI 呼叫
在 React Component 中使用：
```typescript
const info = await ipc.system.getInfo();
```

---

## 最佳實踐
1.  **Context 依賴**：撰寫 Handler 時，盡量只依賴 `context` 傳入的 `api` 和 `storage`，避免直接依賴全域變數或特定平台的 API，這樣單元測試時很容易 Mock。
2.  **型別定義**：建議為 Handler 的輸入參數 (`args`) 和回傳值定義明確的 TypeScript Interface。

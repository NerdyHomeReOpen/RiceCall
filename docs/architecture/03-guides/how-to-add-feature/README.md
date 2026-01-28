# 新增功能指南 (Feature Implementation Guide)

本章節提供在 RiceCall 架構下開發新功能的標準流程。我們根據通訊模式將功能開發分為兩類：

## 1. [新增 IPC 功能 (IPC Feature)](./ipc-feature.md)
適用於 **「請求 / 回應」 (Request / Response)** 模式的操作。
*   **場景**: 讀取設定檔、獲取系統資訊、檔案讀寫、同步資料庫查詢。
*   **特點**: 由前端主動發起，等待後端回應結果。

## 2. [新增 Socket 事件 (Socket Event)](./socket-event.md)
適用於 **「即時通訊」 (Real-time Communication)** 模式的操作。
*   **場景**: 聊天訊息、語音信令、好友狀態更新、即時通知。
*   **特點**: 雙向通訊，伺服器可隨時推播資料給前端。

---

## 通用開發原則
1.  **不要直接 import `electron`**：永遠透過 `src/platform/*` 或 `src/ipc.ts` 存取，以確保 Web 相容性。
2.  **Popup 狀態管理**：Web Popup 關閉時是銷毀 DOM，Electron 是關閉視窗。確保 `useEffect` 的 cleanup 函式寫好，避免記憶體洩漏。

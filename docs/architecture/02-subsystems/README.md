# 子系統詳解 (Subsystems)

本章節深入探討系統中關鍵模組的實作細節。

## 文件列表

1. **[IPC 通訊層 (IPC Layer)](./ipc-layer.md)**
   - 模擬 IPC 的原理。
   - `src/ipc.ts` Facade 的角色。

2. **[彈窗系統 (Popup System)](./popup-system.md)**
   - 解決 Web 與 Electron 視窗模型差異的核心設計。
   - `InAppPopupHost` 與 `PopupController`。

3. **[Socket 服務 (Socket Service)](./socket-service.md)**
   - 如何管理 WebSocket 連線。
   - 平台差異處理。

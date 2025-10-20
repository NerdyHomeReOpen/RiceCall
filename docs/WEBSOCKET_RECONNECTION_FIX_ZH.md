# WebSocket 重連邏輯分析與修復

## 問題描述

**原始問題**：為什麼伺服器端斷線重連會導致客戶端噴出房間？

## 問題根源

### 原本的邏輯流程

1. 伺服器重啟或網路暫時中斷
2. Socket.io 觸發 `disconnect` 事件
3. 客戶端的 `handleDisconnect` 函數**無條件清空所有狀態**：
   - 使用者資料
   - 伺服器列表
   - 頻道資料
   - 好友列表
   - 所有其他應用程式狀態
4. Socket.io 自動嘗試重新連線
5. 重連成功後觸發 `reconnect` 和 `connect` 事件
6. **問題**：此時客戶端狀態已經是空的，使用者看起來像是離開了所有房間

### 為什麼會這樣設計？

原本的 `handleDisconnect` 函數沒有區分：
- **主動登出**（應該清空狀態）
- **網路暫時中斷**（應該保留狀態以便重連）

所有斷線事件都被當作登出處理，導致重連時使用者被踢出房間。

## 解決方案

### Socket.io 的 disconnect 事件參數

Socket.io 的 `disconnect` 事件會傳遞一個 `reason` 參數，告訴我們斷線的原因：

#### 應該清空狀態的情況
- `io server disconnect` - 伺服器主動斷開（登出）
- `io client disconnect` - 客戶端主動斷開（登出）

#### 不應該清空狀態的情況（會自動重連）
- `transport close` - 網路連線中斷
- `transport error` - 傳輸層錯誤
- `ping timeout` - 連線逾時

### 修改內容

#### 1. 更新型別定義 (`src/types/index.ts`)
```typescript
export type ServerToClientEvents = {
  disconnect: (reason?: string) => void; // 加入 reason 參數
};
```

#### 2. 修改斷線處理邏輯 (`src/app/page.tsx`)
```typescript
const handleDisconnect = (reason?: string) => {
  console.info('[Socket] disconnected, reason:', reason);
  
  // 只有在主動斷線時才清空狀態
  // 暫時性的網路問題不清空狀態，等待自動重連
  const shouldClearState = 
    reason === 'io server disconnect' || 
    reason === 'io client disconnect';
  
  if (shouldClearState) {
    // 清空所有狀態（原本的行為）
  } else {
    // 保留狀態，準備重連
  }
  
  setIsConnected(false);
};
```

## 修復後的行為

### 場景 1：伺服器重啟
1. 伺服器關閉 → `disconnect` 事件，原因是 `transport close`
2. 客戶端**保留**所有狀態（伺服器、頻道、使用者資料）
3. Socket.io 自動重新連線
4. 重連成功 → 使用者無縫地留在原本的房間 ✅

### 場景 2：使用者登出
1. 使用者點擊登出 → `disconnect` 事件，原因是 `io server disconnect`
2. 客戶端**清空**所有狀態
3. 維持原本的登出行為 ✅

### 場景 3：網路暫時中斷
1. 網路中斷 → `disconnect` 事件，原因是 `transport error`
2. 客戶端**保留**所有狀態
3. 網路恢復 → Socket.io 自動重連
4. 使用者無需手動重新加入房間 ✅

## 技術細節

### 修改的檔案
1. `src/app/page.tsx` - 修改 `handleDisconnect` 函數
2. `src/types/index.ts` - 更新 `ServerToClientEvents` 型別定義
3. `docs/WEBSOCKET_RECONNECTION_FIX.md` - 詳細的英文技術文件

### 程式碼變更
- 新增斷線原因判斷邏輯
- 保留原有的狀態清空邏輯（僅在必要時執行）
- 加入清楚的日誌訊息以便除錯

## 測試建議

### 1. 測試伺服器重啟
- 加入語音頻道
- 重啟 WebSocket 伺服器
- 確認使用者在重連後仍在頻道中

### 2. 測試網路中斷
- 加入語音頻道
- 暫時中斷網路連線（關閉 WiFi）
- 恢復網路後確認使用者仍在頻道中

### 3. 測試正常登出
- 加入語音頻道
- 點擊登出按鈕
- 確認所有狀態都被清空
- 確認重新登入後不會自動加入之前的頻道

## 未來改進建議

### 客戶端
1. **重連 UI 提示**：當 `isConnected` 為 false 但狀態被保留時，顯示「重新連線中...」
2. **重連逾時**：在多次重連失敗後，清空狀態並強制登出
3. **狀態同步**：重連成功後向伺服器請求最新狀態，確保資料正確
4. **樂觀更新**：追蹤重連前的待處理操作，重連後重新執行

### 伺服器端
1. 在短暫斷線期間保留使用者的房間成員資格
2. 設定寬限期，避免立即將使用者移出房間
3. 重連後發送「重新加入」事件以恢復使用者位置

## 參考資料
- [Socket.io 客戶端斷線事件](https://socket.io/docs/v4/client-api/#event-disconnect)
- [Socket.io 重連機制](https://socket.io/docs/v4/client-options/#reconnection)

## 安全檢查

✅ CodeQL 安全掃描：未發現安全問題
✅ TypeScript 編譯：無錯誤
✅ 程式碼變更：最小化且聚焦

## 結論

此修復解決了伺服器重連時使用者被踢出房間的問題，同時保留了正常登出的功能。透過檢查斷線原因，我們能夠區分暫時性的網路問題和主動的登出操作，提供更好的使用者體驗。

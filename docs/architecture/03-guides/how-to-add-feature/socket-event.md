# 如何新增 Socket 事件 (Socket Event)

本文件說明如何新增一個即時通訊功能（例如：接收訊息、狀態更新、通知）。

假設你要新增一個「好友正在輸入... (Typing)」的即時通知功能。

## 步驟 1: 定義型別 (Types)
首先確保 `src/types/index.ts` 中有相關的事件資料定義（通常需與後端協定一致）。

```typescript
// src/types/index.ts
export interface TypingEvent {
  userId: string;
  isTyping: boolean;
}
```

## 步驟 2: 準備 Redux State (Store)
如果這個事件需要改變畫面狀態，請在 `src/store/slices/` 中建立或更新 Slice。

```typescript
// src/store/slices/typingSlice.ts (範例)
const typingSlice = createSlice({
  name: 'typing',
  initialState: {},
  reducers: {
    setTypingStatus: (state, action: PayloadAction<TypingEvent>) => {
      // 更新狀態邏輯
    }
  }
});
export const { setTypingStatus } = typingSlice.actions;
```

## 步驟 3: 監聽事件 (Listener)
在 `src/components/SocketManager.tsx` 中掛載監聽器。這是前端接收 Socket 事件的唯一入口。

```typescript
// src/components/SocketManager.tsx
useEffect(() => {
  // 'friendTyping' 是後端發送的事件名稱
  const unsub = ipc.socket.on('friendTyping', (data: Types.TypingEvent) => {
    dispatch(setTypingStatus(data)); // 派發 Action
  });
  
  return () => unsub(); // 記得取消訂閱
}, [dispatch]);
```

## 步驟 4: 發送事件 (Sender)
如果需要由前端主動發送事件，請在 `src/utils/popup.ts` 或相關 Utility 中封裝。

```typescript
// src/utils/popup.ts
export function sendTypingStatus(targetId: string, isTyping: boolean) {
  ipc.socket.send('typing', { targetId, isTyping });
}
```

---

## 最佳實踐
1.  **關注點分離**：`SocketManager` 只負責接收資料並轉發給 Store，不應包含複雜的業務邏輯。
2.  **單一資料源**：UI 應始終透過 `useAppSelector` 從 Store 讀取資料，而不是由 Socket 直接 callback 更新 Component State。

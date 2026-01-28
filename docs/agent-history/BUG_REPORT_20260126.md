# Bug Report: Chat Window Not Updating on Message Sent

## Issue Description
When a user sends a direct message, the server correctly emits a `directMessage` event back to the client. The Electron Main process receives this event (confirmed via logs), but the chat popup window (`DirectMessage` popup) fails to display the new message.

## Root Cause Analysis

### 1. Regression Introduced in Refactor
The issue was traced back to **Commit [`849793f`](https://github.com/NerdyHomeReOpen/RiceCall/commit/849793f)** ("feat: refactor and abstract electron related operations to support web"). During the architectural refactoring to support the Web platform, the socket event broadcasting logic in the Electron Main process was altered.

### 2. Socket Event Broadcasting Logic
*   **Previous Behavior (Working - e.g., tag 0.3.13):**
    The `src/socket.ts` file broadcasted received socket events to **all open windows**.
    ```typescript
    // Old implementation
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send(event, ...args);
    });
    ```

*   **Broken Behavior (Current):**
    A new helper function `getTargetWindows()` was introduced, which **only returned the main window** (`targetWindow`), excluding all popup windows.
    ```typescript
    // Broken implementation in src/socket.ts
    function getTargetWindows(): BrowserWindow[] {
      if (targetWindow && !targetWindow.isDestroyed()) {
        return [targetWindow]; // Only sends to Main Window
      }
      return [];
    }
    ```

### 3. Impact on Chat Popup
Since the chat interface runs in a separate **Popup Window** (not the Main Window), it stopped receiving IPC events forwarded from the Main process. Consequently, the React component inside the popup never triggered its event listeners to update the UI, even though the Main process successfully received the data from the server.

## Resolution

The fix involves restoring the original behavior to broadcast events to all windows. This ensures that independent popup windows (like Chat, Friend Verification, etc.) receive real-time updates.

**File:** `src/socket.ts`

**Change:**
```typescript
// Modified getTargetWindows function
function getTargetWindows(): BrowserWindow[] {
  // Return all windows to ensure popups receive socket events
  return BrowserWindow.getAllWindows();
}
```

## Verification
*   **Before Fix:** Main process logs event receipt, but chat popup remains static.
*   **After Fix:** Main process logs event receipt, forwards it via IPC to all windows. Chat popup listener fires, and the message appears in the UI immediately.

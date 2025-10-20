# WebSocket Reconnection Fix

## Problem Description

### Issue
When the WebSocket server disconnects and reconnects (due to server restart, network issues, etc.), clients are kicked from their rooms and lose all application state.

### User Impact
- Users appear to leave voice channels unexpectedly
- All server/channel data is cleared from the UI
- Users need to manually rejoin servers and channels after reconnection
- Poor user experience during server maintenance or temporary network issues

## Root Cause Analysis

### Original Behavior
The `handleDisconnect` function in `src/app/page.tsx` was aggressively clearing ALL application state on ANY disconnect event:

```typescript
const handleDisconnect = () => {
  console.info('[Socket] disconnected');
  // Cleared ALL state including:
  // - User data
  // - Servers list
  // - Channels
  // - Friends
  // - All other application data
  setIsConnected(false);
};
```

### Why This Was Wrong
Socket.io's automatic reconnection flow:
1. Network issue or server restart occurs
2. Socket fires `disconnect` event → Client clears ALL state
3. Socket.io automatically attempts to reconnect
4. On success, fires `reconnect` event → Client has empty state
5. Fires `connect` event → Client reconnects with empty state
6. **Result**: User appears to have left all rooms

### The Key Insight
Socket.io's `disconnect` event includes a `reason` parameter that tells us WHY the disconnection happened:

- **Intentional disconnects** (should clear state):
  - `io server disconnect` - Server explicitly disconnected the client (logout)
  - `io client disconnect` - Client explicitly called disconnect (logout)

- **Temporary network issues** (should NOT clear state):
  - `transport close` - Network connection closed (will auto-reconnect)
  - `transport error` - Transport layer error (will auto-reconnect)
  - `ping timeout` - Connection timeout (will auto-reconnect)

## Solution

### Changes Made

#### 1. Updated Type Definition (`src/types/index.ts`)
```typescript
export type ServerToClientEvents = {
  // ...
  disconnect: (reason?: string) => void; // Added reason parameter
  // ...
};
```

#### 2. Modified Disconnect Handler (`src/app/page.tsx`)
```typescript
const handleDisconnect = (reason?: string) => {
  console.info('[Socket] disconnected, reason:', reason);
  
  // Only clear state if disconnect is intentional (logout or server-initiated)
  // Don't clear state for temporary network issues that will auto-reconnect
  const shouldClearState = 
    reason === 'io server disconnect' || 
    reason === 'io client disconnect';
  
  if (shouldClearState) {
    console.info('[Socket] Clearing state due to intentional disconnect');
    // Clear all state (original behavior)
  } else {
    console.info('[Socket] Preserving state for reconnection');
    // Keep state intact for auto-reconnection
  }
  
  setIsConnected(false);
};
```

#### 3. Enhanced Reconnect Handler
```typescript
const handleReconnect = (attemptNumber: number) => {
  console.info('[Socket] reconnected successfully, attempt number:', attemptNumber);
  // Connection will be set to true by the 'connect' event that follows
  // State is preserved from before disconnect, so user stays in their room
};
```

## How It Works Now

### Scenario 1: Server Restart
1. Server goes down → `disconnect` event with reason `transport close`
2. Client preserves all state (servers, channels, user data)
3. Socket.io automatically reconnects
4. `reconnect` event fires → Client still has all state
5. `connect` event fires → Client reconnects to same rooms
6. **Result**: User seamlessly stays in their room

### Scenario 2: User Logout
1. User clicks logout → Client calls `ipc.auth.logout()`
2. Server responds with `disconnect` → reason: `io server disconnect`
3. Client detects intentional disconnect and clears all state
4. **Result**: Proper logout behavior maintained

### Scenario 3: Network Interruption
1. User's network drops → `disconnect` event with reason `transport error`
2. Client preserves all state
3. Network reconnects → Socket.io auto-reconnects
4. **Result**: User stays in room without manual intervention

## Testing Recommendations

To verify the fix works correctly:

1. **Test Server Reconnection**:
   - Join a voice channel
   - Restart the WebSocket server
   - Verify user stays in the channel after reconnection

2. **Test Network Interruption**:
   - Join a voice channel
   - Simulate network interruption (disconnect WiFi briefly)
   - Verify user stays in the channel after network returns

3. **Test Intentional Logout**:
   - Join a voice channel
   - Click logout button
   - Verify all state is cleared properly
   - Verify user is not in the channel after re-login

## Future Considerations

### Potential Enhancements
1. **Reconnection UI**: Show a "Reconnecting..." indicator when `isConnected` is false but state is preserved
2. **Timeout**: After N failed reconnection attempts, clear state and force logout
3. **Stale State**: On reconnect, request fresh data from server to ensure state is up-to-date
4. **Optimistic Updates**: Track pending actions and retry after reconnection

### Server-Side Improvements
The server should also:
1. Maintain user's room membership during brief disconnections
2. Have a grace period before removing users from rooms
3. Send a "rejoin" event after reconnection to restore user's position

## Related Files
- `src/app/page.tsx` - Main application component with socket handlers
- `src/types/index.ts` - TypeScript type definitions for socket events
- `main.ts` - Electron main process with socket.io client setup

## References
- [Socket.io Client Disconnect Event](https://socket.io/docs/v4/client-api/#event-disconnect)
- [Socket.io Reconnection](https://socket.io/docs/v4/client-options/#reconnection)

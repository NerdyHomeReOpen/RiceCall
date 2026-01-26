/**
 * Platform Socket Factory
 * 
 * Returns the appropriate socket client based on the current platform.
 */

export type { SocketClient } from './types';
import type { SocketClient } from './types';
import { isElectron, getIpcRenderer } from '@/platform/ipc';
import { createElectronSocketClient } from './electron';
import { createWebSocketClient } from './web';

let socketClient: SocketClient | null = null;

/**
 * Get the socket client singleton for the current platform.
 */
export function getSocketClient(): SocketClient {
  if (!socketClient) {
    if (isElectron()) {
      socketClient = createElectronSocketClient(getIpcRenderer);
    } else {
      socketClient = createWebSocketClient();
    }
  }
  return socketClient;
}

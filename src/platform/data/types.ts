/**
 * DataClient interface and type definitions.
 * 
 * This defines the contract for data operations that can be fulfilled
 * by either Electron (via IPC) or Web (via HTTP) implementations.
 */

import type { DataService } from './dataService';

export type { DataService, DataServiceApiClient } from './dataService';

/**
 * DataClient wraps platform-specific data fetching.
 * - In Electron: uses ipcRenderer.invoke() to call main process
 * - In Web: uses DataService directly with HTTP ApiClient
 */
export type DataClient = DataService & {
  /**
   * Special method for Electron hot-reload. In web mode, this is equivalent to `user()`.
   */
  userHotReload(params: { userId: string }): ReturnType<DataService['user']>;
};

/**
 * Convert method name to IPC channel name.
 * Standard pattern: methodName -> data-methodName
 */
export function toIpcChannel(methodName: string): string {
  return `data-${methodName}`;
}

/**
 * Special IPC channels that don't follow the standard pattern.
 */
export const SPECIAL_IPC_CHANNELS: Record<string, string> = {
  userHotReload: 'data-user-hot-reload',
};

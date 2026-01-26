/**
 * Electron DataClient implementation.
 * Uses ipcRenderer.invoke() to call the main process DataService.
 * 
 * Electron is the primary platform. Uses Proxy to auto-generate IPC calls
 * based on the standard channel naming convention: data-${methodName}
 * 
 * Adding a new method only requires updating dataService.ts - no changes here!
 */

import type { DataClient } from './types';
import { toIpcChannel, SPECIAL_IPC_CHANNELS } from './types';

type IpcRenderer = {
  invoke<T>(channel: string, ...args: unknown[]): Promise<T>;
};

/**
 * Create an Electron DataClient that delegates all calls to main process via IPC.
 * Uses Proxy to automatically generate IPC calls from method names.
 */
export function createElectronDataClient(ipcRenderer: IpcRenderer): DataClient {
  return new Proxy({} as DataClient, {
    get(_target, prop: string) {
      // Check special channels first (non-standard naming)
      if (prop in SPECIAL_IPC_CHANNELS) {
        return (params: unknown) => ipcRenderer.invoke(SPECIAL_IPC_CHANNELS[prop], params);
      }
      // Standard pattern: data-${methodName}
      return (params: unknown) => ipcRenderer.invoke(toIpcChannel(prop), params);
    },
  });
}

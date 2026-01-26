/**
 * Platform-agnostic DataClient factory.
 * 
 * This module provides getDataClient() which returns the appropriate
 * DataClient implementation based on the runtime environment.
 */

import type { DataClient } from './types';
import { createWebDataClient } from './web';
import { createElectronDataClient } from './electron';
import { getApiClient } from '@/platform/api';
import { Logger } from '@/utils/logger';

export type { DataClient, DataService, DataServiceApiClient } from './types';
export { createDataService } from './dataService';
export { createWebDataClient } from './web';
export { createElectronDataClient } from './electron';

const logger = new Logger('DataClient');

function isElectronRenderer(): boolean {
  return typeof window !== 'undefined' && typeof (window as unknown as { require?: unknown }).require === 'function';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ipcRenderer: any = null;
let singleton: DataClient | null = null;

/**
 * Get the platform-appropriate DataClient.
 * - In Electron renderer: uses IPC to call main process
 * - In Web browser: uses HTTP API directly
 */
export function getDataClient(): DataClient {
  if (singleton) return singleton;

  if (isElectronRenderer()) {
    try {
      // Dynamic require for Electron
      const electron = (window as unknown as { require: NodeRequire }).require('electron');
      ipcRenderer = electron.ipcRenderer;
      singleton = createElectronDataClient(ipcRenderer);
      logger.info('Using Electron DataClient');
      return singleton;
    } catch (e) {
      logger.warn(`Failed to initialize Electron DataClient: ${e}`);
      // Fall through to web client
    }
  }

  // Web mode: use HTTP API directly
  const api = getApiClient();
  singleton = createWebDataClient(api);
  logger.info('Using Web DataClient');
  return singleton;
}

/**
 * Check if we're in Electron mode (for special cases like auth that still need direct IPC).
 */
export function isElectron(): boolean {
  return isElectronRenderer() && ipcRenderer !== null;
}

/**
 * Get the raw ipcRenderer for special cases (auth, etc.) that aren't yet migrated.
 * Returns null in web mode.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getIpcRenderer(): any {
  if (!isElectronRenderer()) return null;
  
  if (!ipcRenderer) {
    try {
      const electron = (window as unknown as { require: NodeRequire }).require('electron');
      ipcRenderer = electron.ipcRenderer;
    } catch {
      return null;
    }
  }
  
  return ipcRenderer;
}

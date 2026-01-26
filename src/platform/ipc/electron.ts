/**
 * Electron IPC implementation.
 * Registers handlers with real ipcMain and provides real ipcRenderer.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { IpcRenderer, HandlerRegistration, IpcStorage, HandlerContext } from './types';

/**
 * Register handlers with Electron's ipcMain.
 * Call this in main.ts with all your handlers.
 */
export function registerHandlers(
  ipcMain: any,
  registration: HandlerRegistration,
  context: HandlerContext
): void {
  // Register sync handlers (ipcMain.on with event.returnValue)
  if (registration.sync) {
    for (const [channel, handler] of Object.entries(registration.sync)) {
      ipcMain.on(channel, (event: any, ...args: any[]) => {
        try {
          event.returnValue = handler(context, ...args);
        } catch (error) {
          console.error(`[IPC] Sync handler error for ${channel}:`, error);
          event.returnValue = null;
        }
      });
    }
  }

  // Register async handlers (ipcMain.handle)
  if (registration.async) {
    for (const [channel, handler] of Object.entries(registration.async)) {
      ipcMain.handle(channel, async (_event: any, ...args: any[]) => {
        try {
          return await handler(context, ...args);
        } catch (error) {
          console.error(`[IPC] Async handler error for ${channel}:`, error);
          throw error;
        }
      });
    }
  }

  // Register send handlers (ipcMain.on without return value)
  if (registration.send) {
    for (const [channel, handler] of Object.entries(registration.send)) {
      ipcMain.on(channel, (_event: any, ...args: any[]) => {
        try {
          handler(context, ...args);
        } catch (error) {
          console.error(`[IPC] Send handler error for ${channel}:`, error);
        }
      });
    }
  }
}

/**
 * Get the real Electron ipcRenderer.
 * Only call this in renderer process when running in Electron.
 */
export function getElectronIpcRenderer(): IpcRenderer {
  const { ipcRenderer } = window.require('electron');
  return ipcRenderer;
}

/**
 * Create Electron storage adapter using electron-store.
 */
export function createElectronStorage(store: any): IpcStorage {
  return {
    get: <T>(key: string, defaultValue?: T): T | undefined => {
      const value = store.get(key);
      return value !== undefined ? value : defaultValue;
    },
    set: <T>(key: string, value: T): void => {
      store.set(key, value);
    },
    delete: (key: string): void => {
      store.delete(key);
    },
  };
}

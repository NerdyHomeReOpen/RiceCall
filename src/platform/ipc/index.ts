/**
 * Platform-agnostic IPC module.
 * Provides factory function that returns appropriate IpcRenderer
 * based on current platform (Electron or Web).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { IpcRenderer, HandlerContext } from './types';
import { getElectronIpcRenderer } from './electron';
import { createWebIpcRenderer, createWebStorage, createWebBroadcast } from './web';
import { getApiClient } from '@/platform/api';
import { createAllHandlers } from '@/handlers';

// Singleton instance
let ipcRendererInstance: IpcRenderer | null = null;

// Web context singleton
let webContext: HandlerContext | null = null;

// Broadcast listeners for Web mode
let broadcastListeners: Map<string, Set<(...args: any[]) => void>> | null = null;

/**
 * Detects if running in Electron environment.
 */
export function isElectron(): boolean {
  return typeof window !== 'undefined' && typeof window.require === 'function';
}

/**
 * Initialize Web IPC with handlers.
 * Called automatically on first getIpcRenderer() in Web mode.
 */
function initWebIpc(): IpcRenderer {
  const storage = createWebStorage();
  const { broadcast, onBroadcast } = createWebBroadcast();
  const api = getApiClient();

  webContext = {
    storage,
    api,
    broadcast,
  };

  const registration = createAllHandlers();
  const ipcRenderer = createWebIpcRenderer(registration, webContext);

  // Set up broadcast listener map
  broadcastListeners = new Map();

  // Wire up broadcast to notify listeners
  onBroadcast((channel, ...args) => {
    const listeners = broadcastListeners?.get(channel);
    if (listeners) {
      listeners.forEach((cb) => {
        try {
          cb({}, ...args); // First arg is fake event
        } catch (e) {
          console.error(`[WebIPC] Broadcast listener error for ${channel}:`, e);
        }
      });
    }
  });

  // Enhance ipcRenderer.on to also register for broadcasts
  const originalOn = ipcRenderer.on.bind(ipcRenderer);
  ipcRenderer.on = (channel: string, listener: (event: any, ...args: any[]) => void) => {
    originalOn(channel, listener);
    // Also register for broadcasts
    if (!broadcastListeners!.has(channel)) {
      broadcastListeners!.set(channel, new Set());
    }
    broadcastListeners!.get(channel)!.add(listener);
  };

  const originalRemoveListener = ipcRenderer.removeListener.bind(ipcRenderer);
  ipcRenderer.removeListener = (channel: string, listener: (...args: any[]) => void) => {
    originalRemoveListener(channel, listener);
    broadcastListeners?.get(channel)?.delete(listener);
  };

  const originalRemoveAllListeners = ipcRenderer.removeAllListeners.bind(ipcRenderer);
  ipcRenderer.removeAllListeners = (channel: string) => {
    originalRemoveAllListeners(channel);
    broadcastListeners?.delete(channel);
  };

  return ipcRenderer;
}

/**
 * Gets the appropriate IpcRenderer instance for the current platform.
 * 
 * - Electron: Returns real ipcRenderer
 * - Web: Returns fake ipcRenderer (auto-initialized)
 */
export function getIpcRenderer(): IpcRenderer {
  if (ipcRendererInstance) {
    return ipcRendererInstance;
  }

  if (isElectron()) {
    ipcRendererInstance = getElectronIpcRenderer();
  } else {
    ipcRendererInstance = initWebIpc();
  }

  return ipcRendererInstance;
}

/**
 * Get the Web handler context.
 * Only available in Web mode after getIpcRenderer() is called.
 */
export function getWebContext(): HandlerContext | null {
  return webContext;
}

// Re-export types and functions
export type { IpcRenderer, IpcHandler, IpcHandlerMap, HandlerRegistration, IpcStorage, HandlerContext } from './types';
export { registerHandlers, createElectronStorage } from './electron';
export { createWebStorage, createWebBroadcast } from './web';

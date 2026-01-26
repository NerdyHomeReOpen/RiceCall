/**
 * Web IPC implementation.
 * Provides a fake ipcRenderer that directly calls handlers.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { IpcRenderer, HandlerRegistration, IpcStorage, HandlerContext } from './types';

/**
 * Web storage adapter using localStorage.
 */
export function createWebStorage(prefix: string = 'ricecall_'): IpcStorage {
  return {
    get: <T>(key: string, defaultValue?: T): T | undefined => {
      try {
        const item = localStorage.getItem(prefix + key);
        if (item === null) return defaultValue;
        return JSON.parse(item) as T;
      } catch {
        return defaultValue;
      }
    },
    set: <T>(key: string, value: T): void => {
      try {
        localStorage.setItem(prefix + key, JSON.stringify(value));
      } catch {
        // ignore
      }
    },
    delete: (key: string): void => {
      try {
        localStorage.removeItem(prefix + key);
      } catch {
        // ignore
      }
    },
  };
}

/**
 * Create a Web IpcRenderer that directly calls handlers.
 */
export function createWebIpcRenderer(
  registration: HandlerRegistration,
  context: HandlerContext
): IpcRenderer {
  const listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  // Merge all handlers
  const syncHandlers = registration.sync ?? {};
  const asyncHandlers = registration.async ?? {};
  const sendHandlers = registration.send ?? {};

  return {
    send(channel: string, ...args: any[]): void {
      // Try send handlers first (fire and forget)
      if (sendHandlers[channel]) {
        try {
          sendHandlers[channel](context, ...args);
        } catch (error) {
          console.error(`[WebIPC] Send handler error for ${channel}:`, error);
        }
        return;
      }
      // Fallback to sync handlers (but ignore return value)
      if (syncHandlers[channel]) {
        try {
          syncHandlers[channel](context, ...args);
        } catch (error) {
          console.error(`[WebIPC] Send handler error for ${channel}:`, error);
        }
      }
    },

    sendSync(channel: string, ...args: any[]): any {
      const handler = syncHandlers[channel];
      if (!handler) {
        console.warn(`[WebIPC] No sync handler for channel: ${channel}`);
        return null;
      }
      try {
        return handler(context, ...args);
      } catch (error) {
        console.error(`[WebIPC] Sync handler error for ${channel}:`, error);
        return null;
      }
    },

    async invoke(channel: string, ...args: any[]): Promise<any> {
      const handler = asyncHandlers[channel];
      if (!handler) {
        console.warn(`[WebIPC] No async handler for channel: ${channel}`);
        return null;
      }
      try {
        return await handler(context, ...args);
      } catch (error) {
        console.error(`[WebIPC] Async handler error for ${channel}:`, error);
        throw error;
      }
    },

    on(channel: string, listener: (event: any, ...args: any[]) => void): void {
      if (!listeners.has(channel)) {
        listeners.set(channel, new Set());
      }
      listeners.get(channel)!.add(listener);
    },

    removeListener(channel: string, listener: (...args: any[]) => void): void {
      listeners.get(channel)?.delete(listener);
    },

    removeAllListeners(channel: string): void {
      listeners.delete(channel);
    },
  };
}

/**
 * Create a broadcast function for Web.
 * Uses BroadcastChannel API for cross-tab communication.
 */
export function createWebBroadcast(channelName: string = 'ricecall_ipc'): {
  broadcast: (channel: string, ...args: any[]) => void;
  onBroadcast: (callback: (channel: string, ...args: any[]) => void) => () => void;
} {
  const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(channelName) : null;
  const localListeners: Set<(channel: string, ...args: any[]) => void> = new Set();

  // Listen for broadcasts from other tabs
  bc?.addEventListener('message', (event) => {
    const { channel, args } = event.data;
    localListeners.forEach((cb) => cb(channel, ...args));
  });

  return {
    broadcast: (channel: string, ...args: any[]): void => {
      // Send to other tabs
      bc?.postMessage({ channel, args });
      // Also notify local listeners
      localListeners.forEach((cb) => cb(channel, ...args));
    },
    onBroadcast: (callback: (channel: string, ...args: any[]) => void): (() => void) => {
      localListeners.add(callback);
      return () => localListeners.delete(callback);
    },
  };
}

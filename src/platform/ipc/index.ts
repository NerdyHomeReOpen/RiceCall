/**
 * Platform-agnostic IPC module.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { IpcRenderer, HandlerContext } from './types';
import { getElectronIpcRenderer } from './electron';
import { createWebIpcRenderer, createWebStorage, createWebBroadcast } from './web';
import { getApiClient } from '@/platform/api';
import { createAllHandlers } from './handlers/web';
import { isElectron } from '@/platform/isElectron';
import { loadEnv } from '@/env';

let ipcRendererInstance: IpcRenderer | null = null;
let webContext: HandlerContext | null = null;
let broadcastListeners: Map<string, Set<(...args: any[]) => void>> | null = null;

function initWebIpc(): IpcRenderer {
  // Fix: Ensure environment variables are loaded for Web
  loadEnv();

  const storage = createWebStorage();
  const { broadcast, onBroadcast } = createWebBroadcast();
  const api = getApiClient();

  // Wrap broadcast for the handler context to match the expected signature (without the event object)
  const contextBroadcast = (channel: string, ...args: any[]) => broadcast(channel, {}, ...args);
  webContext = { storage, api, broadcast: contextBroadcast };

  const registration = createAllHandlers();
  const ipcRenderer = createWebIpcRenderer(registration, webContext);

  broadcastListeners = new Map();

  // Unified broadcast dispatcher for Web
  onBroadcast((channel, event, ...args) => {
    // Normalization Middleware: Mimic Electron IPC serialization behavior
    // and ensure object structure stability for React components.
    if (args && args.length > 0) {
      try {
        // 1. Deep copy and remove undefined fields (mimic Structured Clone)
        args = JSON.parse(JSON.stringify(args));
      } catch {}
    }

    const listeners = broadcastListeners?.get(channel);
    if (listeners) {
      // Snapshot listeners to prevent "listeners added during emission" from being triggered immediately
      const listenersSnapshot = new Set(listeners);
      listenersSnapshot.forEach((cb) => {
        try {
          cb(event, ...args);
        } catch (e) {
          console.error(`[WebIPC] Error in listener for ${channel}:`, e);
        }
      });
    }
  });

  ipcRenderer.on = (channel: string, listener: (event: any, ...args: any[]) => void) => {
    // We only use the broadcast system for .on in Web mode to support cross-tab
    if (!broadcastListeners!.has(channel)) {
      broadcastListeners!.set(channel, new Set());
    }
    // Loopback Prevention: Filter out local sends.
    // SocketBridge uses onBroadcast directly, so it won't be affected.
    // UI components use ipc.on, so they will be protected from receiving their own requests.
    // EXCEPTION: popup-submit must loop back because the popup is in-app in Web mode.
    const wrappedListener = (event: any, ...args: any[]) => {
      const isPopupSubmit = channel === 'popup-submit';
      if (event?.isLocalSend && !event?.isRemote && !isPopupSubmit) return;
      listener(event, ...args);
    };
    // Store the original listener as a property of the wrapper for removal
    (wrappedListener as any)._original = listener;
    broadcastListeners!.get(channel)!.add(wrappedListener);
  };

  ipcRenderer.removeListener = (channel: string, listener: (...args: any[]) => void) => {
    const listeners = broadcastListeners?.get(channel);
    if (listeners) {
      // Find the wrapper that corresponds to this listener
      for (const l of listeners) {
        if ((l as any)._original === listener) {
          listeners.delete(l);
          break;
        }
      }
    }
  };

  const originalSend = ipcRenderer.send.bind(ipcRenderer);
  ipcRenderer.send = (channel: string, ...args: any[]) => {
    // 1. Trigger local handlers (like auth-logout)
    originalSend(channel, ...args);
    // 2. Broadcast to UI listeners (including SocketBridge)
    // Tag this as a local send to prevent loopback to UI listeners
    broadcast(channel, { isLocalSend: true }, ...args);
  };

  // systemSend: For Socket -> UI, bypasses broadcast loop by a flag
  (ipcRenderer as any).systemSend = (channel: string, ...args: any[]) => {
    (ipcRenderer as any)._isSystemSending = true;
    try {
      // Prevent sound overlapping by restricting playSound to local tab only
      const localOnly = channel === 'playSound';
      broadcast(channel, { localOnly }, ...args);
    } finally {
      (ipcRenderer as any)._isSystemSending = false;
    }
  };

  (ipcRenderer as any).onBroadcast = onBroadcast;

  return ipcRenderer;
}

export function getIpcRenderer(): IpcRenderer {
  if (ipcRendererInstance) return ipcRendererInstance;
  ipcRendererInstance = isElectron() ? getElectronIpcRenderer() : initWebIpc();
  return ipcRendererInstance;
}

export function getWebContext(): HandlerContext | null {
  return webContext;
}

export { isElectron } from '@/platform/isElectron';
export type { IpcRenderer, IpcHandler, IpcHandlerMap, HandlerRegistration, IpcStorage, HandlerContext } from './types';
export { registerHandlers, createElectronStorage } from './electron';
export { createWebStorage, createWebBroadcast } from './web';

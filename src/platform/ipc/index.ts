/**
 * Platform-agnostic IPC module.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { IpcRenderer, HandlerContext } from './types';
import { getElectronIpcRenderer } from './electron';
import { createWebIpcRenderer, createWebStorage, createWebBroadcast } from './web';
import { getApiClient } from '@/platform/api';
import { createAllHandlers } from '@/handlers';

let ipcRendererInstance: IpcRenderer | null = null;
let webContext: HandlerContext | null = null;
let broadcastListeners: Map<string, Set<(...args: any[]) => void>> | null = null;

export function isElectron(): boolean {
  return typeof window !== 'undefined' && typeof window.require === 'function';
}

function initWebIpc(): IpcRenderer {
  const storage = createWebStorage();
  const { broadcast, onBroadcast } = createWebBroadcast();
  const api = getApiClient();

  webContext = { storage, api, broadcast };

  const registration = createAllHandlers();
  const ipcRenderer = createWebIpcRenderer(registration, webContext);

  broadcastListeners = new Map();

  // Unified broadcast dispatcher for Web
  onBroadcast((channel, event, ...args) => {
    console.log(`[DEBUG.IPC] onBroadcast received: channel=${channel}, isRemote=${event?.isRemote}`, args);
    const listeners = broadcastListeners?.get(channel);
    if (listeners) {
      listeners.forEach((cb) => {
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
    broadcastListeners!.get(channel)!.add(listener);
  };

  ipcRenderer.removeListener = (channel: string, listener: (...args: any[]) => void) => {
    broadcastListeners?.get(channel)?.delete(listener);
  };

  const originalSend = ipcRenderer.send.bind(ipcRenderer);
  ipcRenderer.send = (channel: string, ...args: any[]) => {
    console.log(`[DEBUG.IPC] ipc.send called: channel=${channel}`, args);
    // 1. Trigger local handlers (like auth-logout)
    originalSend(channel, ...args);
    // 2. Broadcast to UI listeners (including SocketBridge)
    broadcast(channel, ...args);
  };

  // systemSend: For Socket -> UI, bypasses broadcast loop by a flag
  (ipcRenderer as any).systemSend = (channel: string, ...args: any[]) => {
    (ipcRenderer as any)._isSystemSending = true;
    try {
      broadcast(channel, ...args);
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

export type { IpcRenderer, IpcHandler, IpcHandlerMap, HandlerRegistration, IpcStorage, HandlerContext } from './types';
export { registerHandlers, createElectronStorage } from './electron';
export { createWebStorage, createWebBroadcast } from './web';

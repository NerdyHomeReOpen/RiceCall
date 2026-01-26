/**
 * Web Window Implementation
 * 
 * Handles window control for in-app popups in Web mode.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { WindowController } from './types';
import type { IpcRenderer } from '@/platform/ipc';
import { closeInAppPopup, minimizeInAppPopup } from '@/platform/popup/inAppPopupHost';

/**
 * Get the current popup ID from URL or global variable
 */
function getCurrentPopupId(): string | null {
  try {
    return new URL(window.location.href).searchParams.get('id') || (globalThis as any).__ricecallCurrentPopupId || null;
  } catch {
    return null;
  }
}

export function createWebWindowController(getIpc: () => IpcRenderer): WindowController {
  return {
    resize(width: number, height: number): void {
      // Web popups don't support resize via IPC (they use CSS)
      getIpc().send('resize', width, height);
    },

    minimize(): void {
      const id = getCurrentPopupId();
      if (id) {
        minimizeInAppPopup(id);
      }
    },

    maximize(): void {
      // Web popups don't support maximize
      getIpc().send('window-control-maximize');
    },

    unmaximize(): void {
      // Web popups don't support unmaximize
      getIpc().send('window-control-unmaximize');
    },

    close(): void {
      const id = getCurrentPopupId();
      if (id) {
        closeInAppPopup(id);
      }
    },

    onMaximize(callback: () => void): () => void {
      getIpc().on('maximize', callback);
      return () => getIpc().removeListener('maximize', callback);
    },

    onUnmaximize(callback: () => void): () => void {
      getIpc().on('unmaximize', callback);
      return () => getIpc().removeListener('unmaximize', callback);
    },
  };
}

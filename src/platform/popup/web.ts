import { getIpcRenderer } from '@/platform/ipc';
import type * as Types from '@/types';
import type { PopupController, PopupId, PopupOpenOptions } from './types';
import { closeAllInAppPopups, closeInAppPopup, openInAppPopup } from './inAppPopupHost';
import { loaders, initPopupLoader } from './popupLoader';

export class WebPopupController implements PopupController {
  async open(type: Types.PopupType, id: PopupId, initialData: unknown, options?: PopupOpenOptions): Promise<void> {
    console.log(`[WebPopup] Opening popup: ${type} (id: ${id})`, initialData);
    
    // Simulate Electron's pre-fetching behavior:
    // Load data in the Controller (Main Process equivalent) BEFORE opening the window.
    try {
      // Dynamic import ipc to avoid circular dependency
      // ipc -> platform/popup -> web -> ipc
      const { default: ipc } = await import('@/ipc');

      // Initialize loader with Web dependencies
      // It's safe to call this multiple times (it just sets the deps variable)
      initPopupLoader({
        data: ipc.data,
        getSystemSettings: () => ipc.systemSettings.get() || {},
      });
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const loader = (loaders as any)[type];
      let fullData = initialData;

      if (loader) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fullData = await (loader as any)(initialData).catch((e: any) => {
          console.error(`[WebPopup] Loader error for ${type}:`, e);
          return null; 
        });
      }
      
      // If loader failed (returned null), do not open (matches Electron behavior)
      if (loader && !fullData) {
        console.error(`[WebPopup] Failed to load data for ${type}, aborting.`);
        return;
      }

      openInAppPopup(type, id, fullData, options);

    } catch (e) {
      console.error(`[WebPopup] Error during open for ${type}:`, e);
    }
  }

  close(id: PopupId): void {
    console.log(`[WebPopup] Closing popup: ${id}`);
    closeInAppPopup(id);
  }

  closeAll(): void {
    console.log(`[WebPopup] Closing all popups`);
    closeAllInAppPopups();
  }

  submit(to: PopupId, data?: unknown): void {
    console.log(`[WebPopup] Submitting result to: ${to}`, data);
    // Use the global IPC broadcast to ensure the sender window ALSO receives the event
    getIpcRenderer().send('popup-submit', to, data ?? null);
  }

  onSubmit<T>(host: PopupId, callback: (data: T) => void): () => void {
    console.log(`[WebPopup] Registering onSubmit listener for: ${host}`);
    
    const listener = (_: unknown, to: string, data: T) => {
      if (to === host) {
        console.log(`[WebPopup] Received submit for: ${host}`, data);
        callback(data);
      }
    };

    getIpcRenderer().on('popup-submit', listener);
    return () => {
      console.log(`[WebPopup] Unregistering onSubmit listener for: ${host}`);
      getIpcRenderer().removeListener('popup-submit', listener);
    };
  }
}

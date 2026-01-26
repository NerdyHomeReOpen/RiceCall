import { getIpcRenderer } from '@/platform/ipc';
import type * as Types from '@/types';
import type { PopupController, PopupId, PopupOpenOptions } from './types';
import { closeAllInAppPopups, closeInAppPopup, openInAppPopup } from './inAppPopupHost';

export class WebPopupController implements PopupController {
  open(type: Types.PopupType, id: PopupId, initialData: unknown, options?: PopupOpenOptions): void {
    console.log(`[WebPopup] Opening popup: ${type} (id: ${id})`, initialData);
    openInAppPopup(type, id, initialData, options);
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

import type * as Types from '@/types';
import type { PopupController, PopupId, PopupOpenOptions } from './types';
import { closeAllInAppPopups, closeInAppPopup, openInAppPopup } from './inAppPopupHost';

/**
 * Minimal web implementation.
 *
 * For this PoC we use a URL-based "popup" that reuses the existing `/popup` route.
 * It opens a new browser tab/window when possible, otherwise falls back to navigating.
 *
 * This keeps us close to the Electron model (a separate window), while still being web-native.
 */
export class WebPopupController implements PopupController {
  open(type: Types.PopupType, id: PopupId, initialData: unknown, options?: PopupOpenOptions): void {
    try {
      if (typeof window !== 'undefined' && localStorage.getItem('ricecall:debug:popup') === '1') {
        console.log('[WebPopupController.open]', { type, id, initialData, options });
      }
    } catch {
      // ignore
    }
    openInAppPopup(type, id, initialData, options);
  }

  close(id: PopupId): void {
    closeInAppPopup(id);
  }

  closeAll(): void {
    closeAllInAppPopups();
  }

  submit(to: PopupId, data?: unknown): void {
    // Use BroadcastChannel for same-origin communication.
    const channel = new BroadcastChannel(this.channelName());
    channel.postMessage({ to, data: data ?? null });
    channel.close();
  }

  onSubmit<T>(host: PopupId, callback: (data: T) => void): () => void {
    const channel = new BroadcastChannel(this.channelName());
    const listener = (event: MessageEvent) => {
      const msg = event.data as { to?: string; data?: T };
      if (msg?.to === host) callback(msg.data as T);
    };
    channel.addEventListener('message', listener);
    return () => {
      channel.removeEventListener('message', listener);
      channel.close();
    };
  }

  private channelName() {
    return 'ricecall-popup-submit';
  }

  // Note: initialData storage is no longer needed for the in-app host.
}

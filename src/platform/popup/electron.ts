/* eslint-disable @typescript-eslint/no-explicit-any */
import type * as Types from '@/types';
import type { PopupController, PopupId, PopupOpenOptions } from './types';
import { getIpcRenderer } from '@/platform/ipc';

export class ElectronPopupController implements PopupController {
  open(type: Types.PopupType, id: PopupId, initialData: unknown, options?: PopupOpenOptions): void {
    getIpcRenderer().send('open-popup', type, id, initialData, options?.force);
  }

  close(id: PopupId): void {
    getIpcRenderer().send('close-popup', id);
  }

  closeAll(): void {
    getIpcRenderer().send('close-all-popups');
  }

  submit(to: PopupId, data?: unknown): void {
    getIpcRenderer().send('popup-submit', to, data);
  }

  onSubmit<T>(host: PopupId, callback: (data: T) => void): () => void {
    const ipc = getIpcRenderer();
    ipc.removeAllListeners('popup-submit');
    const listener = (_: any, from: string, receivedData: T) => {
      if (from === host) callback(receivedData);
      ipc.removeAllListeners('popup-submit');
    };
    ipc.on('popup-submit', listener);
    return () => ipc.removeListener('popup-submit', listener);
  }
}

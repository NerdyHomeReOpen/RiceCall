import type * as Types from '@/types';
import ipc from '@/ipc';
import type { PopupController, PopupId, PopupOpenOptions } from './types';

export class ElectronPopupController implements PopupController {
  open(type: Types.PopupType, id: PopupId, initialData: unknown, options?: PopupOpenOptions): void {
    ipc.popup.open(type, id, initialData, options?.force);
  }

  close(id: PopupId): void {
    ipc.popup.close(id);
  }

  closeAll(): void {
    ipc.popup.closeAll();
  }

  submit(to: PopupId, data?: unknown): void {
    ipc.popup.submit(to, data);
  }

  onSubmit<T>(host: PopupId, callback: (data: T) => void): () => void {
    return ipc.popup.onSubmit(host, callback);
  }
}

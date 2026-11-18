import type * as Types from '@/types';

import { modules } from '@/main/modules';

export const initialData = {
  get: (id: string): unknown | null => {
    return modules.default.getInitialData(id);
  },
};

export const popup = {
  open: async <T extends Types.PopupType>(type: T, id: string, ...[initialData, force]: Types.PopupOpenArgs<T>): Promise<unknown> => {
    // Only popups whose data has no required fields may omit it.
    return await modules.default.openPopup(type, id, initialData ?? ({} as Types.PopupOpenData<T>), force);
  },

  // Opens a popup requested by Main Service over the socket.
  openRequest: async ({ type, id, initialData, force }: Types.PopupOpenRequest): Promise<unknown> => {
    return await modules.default.openPopup(type, id, initialData, force);
  },

  close: (id: string): void => {
    modules.default.closePopup(id);
  },

  closeAll: (): void => {
    modules.default.closeAllPopups();
  },

  submit: (to: string, data?: unknown): void => {
    modules.default.popupSubmit(to, data);
  },

  onSubmit: <T>(host: string, callback: (data: T) => void): (() => void) => {
    modules.default.eventEmitter.removeAllListeners(`popup-submit-${host}`);
    return modules.default.listen(`popup-submit-${host}`, callback);
  },
};

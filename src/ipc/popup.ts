import * as Types from '@/types';
import { modules } from './modules';

export const initialData = {
  get: (id: string): unknown | null => {
    return modules.default.getInitialData(id);
  },
};

export const popup = {
  open: async (type: Types.PopupType, id: string, initialData: unknown = {}, force?: boolean): Promise<unknown> => {
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

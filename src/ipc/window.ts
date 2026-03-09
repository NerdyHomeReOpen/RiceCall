import { modules } from './modules';

export const window_ = {
  minimize: (popupId?: string): void => {
    modules.default.windowMinimize(popupId);
  },

  maximize: (): void => {
    modules.default.windowMaximize();
  },

  unmaximize: (): void => {
    modules.default.windowUnmaximize();
  },

  close: (): void => {
    modules.default.windowClose();
  },

  onMaximize: (callback: () => void): (() => void) => {
    return modules.default.listen('maximize', callback);
  },

  onUnmaximize: (callback: () => void): (() => void) => {
    return modules.default.listen('unmaximize', callback);
  },
};

import * as Types from '@/types';
import { modules } from './modules';

export const customThemes = {
  get: (): Types.Theme[] => {
    return modules.default.getCustomThemes();
  },

  add: (theme: Types.Theme): void => {
    modules.default.addCustomTheme(theme);
  },

  delete: (index: number): void => {
    modules.default.deleteCustomTheme(index);
  },

  onUpdate: (callback: (themes: Types.Theme[]) => void): (() => void) => {
    return modules.default.listen('custom-themes', callback);
  },

  saveImage: async (buffer: ArrayBuffer, directory: string, filenamePrefix: string, extension: string): Promise<string | null> => {
    return await modules.default.saveImage(buffer, directory, filenamePrefix, extension);
  },

  current: {
    get: (): Types.Theme | null => {
      return modules.default.getCurrentTheme();
    },

    set: (theme: Types.Theme | null): void => {
      modules.default.setCurrentTheme(theme);
    },

    onUpdate: (callback: (theme: Types.Theme | null) => void): (() => void) => {
      return modules.default.listen('current-theme', callback);
    },
  },
};

import * as Types from '@/types';
import { modules } from './modules';

export const language = {
  get: (): Types.LanguageKey => {
    return modules.default.getLanguage();
  },

  set: (language: Types.LanguageKey): void => {
    modules.default.setLanguage(language);
  },

  onUpdate: (callback: (language: Types.LanguageKey) => void): (() => void) => {
    return modules.default.listen('language', callback);
  },
};

import * as Types from '@/types';

import { store, eventEmitter } from '@/web/main';

import Logger from '@/logger';

export function getCustomThemes() {
  const customThemes = store.get('customThemes');
  return Array.from({ length: 7 }, (_, i) => customThemes[i] ?? {});
}

export function addCustomTheme(theme: Types.Theme) {
  const customThemes = store.get('customThemes');
  // Keep total 7 themes
  customThemes.unshift(theme);
  store.set('customThemes', customThemes);
  eventEmitter.emit(
    'custom-themes',
    Array.from({ length: 7 }, (_, i) => customThemes[i] ?? {}),
  );
}

export function deleteCustomTheme(index: number) {
  const customThemes = store.get('customThemes');
  // Keep total 7 themes
  customThemes.splice(index, 1);
  store.set('customThemes', customThemes);
  eventEmitter.emit(
    'custom-themes',
    Array.from({ length: 7 }, (_, i) => customThemes[i] ?? {}),
  );
}

export function getCurrentTheme() {
  return store.get('currentTheme');
}

export function setCurrentTheme(theme: Types.Theme | null) {
  store.set('currentTheme', theme);
  eventEmitter.emit('current-theme', theme);
}

export async function saveImage(buffer: ArrayBuffer): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
    try {
      const blob = new Blob([buffer]);
      const reader = new FileReader();
      reader.onloadend = () => {
        new Logger('System').info(`Save image success: ${reader.result as string}`);
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        new Logger('System').error(`Save image error: unknown error`);
        resolve(null);
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      const error = e instanceof Error ? e : new Error('Unknown error');
      new Logger('System').error(`Save image error: ${error.message}`);
      resolve(null);
    }
  });
}

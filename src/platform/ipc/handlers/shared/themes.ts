/**
 * Themes handlers - shared between Electron and Web.
 * Provides custom themes and current theme management.
 */

import type { IpcRouter } from '../../router';
import type * as Types from '@/types';
import { FileStorage } from '@/platform/fileStorage';

const CUSTOM_THEMES_KEY = 'customThemes';
const CURRENT_THEME_KEY = 'currentTheme';
const MAX_THEMES = 7;

/**
 * Register shared themes handlers.
 */
export function registerSharedThemesHandlers(ipc: IpcRouter, store: any, broadcast: (channel: string, value: any) => void) {
  // --------------------------------------------------------------------------
  // Getters
  // --------------------------------------------------------------------------

  ipc.on('get-custom-themes', (event: any) => {
    const themes = store.get(CUSTOM_THEMES_KEY) ?? [];
    // Always return array of 7 elements
    event.returnValue = Array.from({ length: MAX_THEMES }, (_, i) => themes[i] ?? {});
  });

  ipc.on('get-current-theme', (event: any) => {
    event.returnValue = store.get(CURRENT_THEME_KEY) ?? null;
  });

  // --------------------------------------------------------------------------
  // Actions
  // --------------------------------------------------------------------------

  ipc.handle('save-theme-image', async (_event: any, buffer: ArrayBuffer): Promise<string | null> => {
    return await FileStorage.store(buffer, 'custom_themes', 'theme', 'webp');
  });

  ipc.on('add-custom-theme', (_event: any, theme: Types.Theme) => {
    const themes = store.get(CUSTOM_THEMES_KEY) ?? [];
    themes.unshift(theme);
    store.set(CUSTOM_THEMES_KEY, themes);
    const result = Array.from({ length: MAX_THEMES }, (_, i) => themes[i] ?? {});
    broadcast('custom-themes', result);
  });

  ipc.on('delete-custom-theme', (_event: any, index: number) => {
    const themes = store.get(CUSTOM_THEMES_KEY) ?? [];
    themes.splice(index, 1);
    store.set(CUSTOM_THEMES_KEY, themes);
    const result = Array.from({ length: MAX_THEMES }, (_, i) => themes[i] ?? {});
    broadcast('custom-themes', result);
  });

  ipc.on('set-current-theme', (_event: any, theme: Types.Theme | null) => {
    store.set(CURRENT_THEME_KEY, theme);
    broadcast('current-theme', theme);
  });
}
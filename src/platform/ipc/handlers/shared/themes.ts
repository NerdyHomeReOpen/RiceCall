/**
 * Themes handlers - shared between Electron and Web.
 * Provides custom themes and current theme management.
 */

import type { HandlerContext, HandlerRegistration } from '@/platform/ipc/types';
import type * as Types from '@/types';

const CUSTOM_THEMES_KEY = 'customThemes';
const CURRENT_THEME_KEY = 'currentTheme';
const MAX_THEMES = 7;

/**
 * Create themes handlers.
 */
export function createThemesHandlers(): HandlerRegistration {
  return {
    sync: {
      'get-custom-themes': (ctx: HandlerContext): Partial<Types.Theme>[] => {
        const themes = ctx.storage.get<Types.Theme[]>(CUSTOM_THEMES_KEY, []);
        // Always return array of 7 elements
        return Array.from({ length: MAX_THEMES }, (_, i) => themes[i] ?? {});
      },

      'get-current-theme': (ctx: HandlerContext): Types.Theme | null => {
        return ctx.storage.get<Types.Theme | null>(CURRENT_THEME_KEY, null);
      },
    },

    send: {
      'add-custom-theme': (ctx: HandlerContext, theme: Types.Theme) => {
        const themes = ctx.storage.get<Types.Theme[]>(CUSTOM_THEMES_KEY, []);
        themes.unshift(theme);
        ctx.storage.set(CUSTOM_THEMES_KEY, themes);
        const result = Array.from({ length: MAX_THEMES }, (_, i) => themes[i] ?? {});
        ctx.broadcast('custom-themes', result);
      },

      'delete-custom-theme': (ctx: HandlerContext, index: number) => {
        const themes = ctx.storage.get<Types.Theme[]>(CUSTOM_THEMES_KEY, []);
        themes.splice(index, 1);
        ctx.storage.set(CUSTOM_THEMES_KEY, themes);
        const result = Array.from({ length: MAX_THEMES }, (_, i) => themes[i] ?? {});
        ctx.broadcast('custom-themes', result);
      },

      'set-current-theme': (ctx: HandlerContext, theme: Types.Theme | null) => {
        ctx.storage.set(CURRENT_THEME_KEY, theme);
        ctx.broadcast('current-theme', theme);
      },
    },
  };
}

/**
 * Language handlers - shared between Electron and Web.
 * Provides language setting management.
 */

import type { HandlerContext, HandlerRegistration } from '@/platform/ipc/types';
import type * as Types from '@/types';

const LANGUAGE_KEY = 'language';
const DEFAULT_LANGUAGE: Types.LanguageKey = 'zh-TW';

/**
 * Create language handlers.
 */
export function createLanguageHandlers(): HandlerRegistration {
  return {
    sync: {
      'get-language': (ctx: HandlerContext): Types.LanguageKey => {
        return ctx.storage.get<Types.LanguageKey>(LANGUAGE_KEY, DEFAULT_LANGUAGE);
      },
    },

    send: {
      'set-language': (ctx: HandlerContext, language: Types.LanguageKey) => {
        ctx.storage.set(LANGUAGE_KEY, language ?? DEFAULT_LANGUAGE);
        ctx.broadcast('language', language);
      },
    },
  };
}

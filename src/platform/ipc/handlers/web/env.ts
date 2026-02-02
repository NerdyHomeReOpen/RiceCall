/**
 * Env handlers - shared between Electron and Web.
 * Provides environment variables access.
 */

import type { HandlerRegistration } from '@/platform/ipc/types';

/**
 * Create env handlers.
 * Note: In Web mode, this returns NEXT_PUBLIC_* env vars.
 * In Electron, this is overridden to return the real env.
 */
export function createEnvHandlers(): HandlerRegistration {
  return {
    sync: {
      'get-env': (): Record<string, string> => {
        // Web mode: return NEXT_PUBLIC_* vars
        return {
          API_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
          WS_URL: process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '',
          CROWDIN_DISTRIBUTION_HASH: process.env.NEXT_PUBLIC_CROWDIN_DISTRIBUTION_HASH || '',
        };
      },
    },
  };
}

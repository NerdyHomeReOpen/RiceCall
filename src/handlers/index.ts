/**
 * All handlers - combines all handler modules.
 */

import type { HandlerRegistration } from '@/platform/ipc/types';
import { createDataHandlers } from './data.handler';
import { createAuthHandlers } from './auth.handler';
import { createAccountsHandlers } from './accounts.handler';
import { createLanguageHandlers } from './language.handler';
import { createThemesHandlers } from './themes.handler';
import { createEnvHandlers } from './env.handler';
import { createElectronOnlyHandlers } from './electron-only.handler';
import { createNetworkHandlers } from './network.handler';

import { WebIpcRouter } from '@/platform/ipc/router';
import { registerSharedSettingsHandlers } from '@/platform/ipc/handlers/shared/settings';
import { SETTINGS_DEFAULTS } from '@/platform/ipc/handlers/shared/defaults';

/**
 * Create settings handlers for Web using shared logic.
 */
function createWebSettingsHandlers(): HandlerRegistration {
  const router = new WebIpcRouter();
  return router.createWebHandlers((ipc, storage, broadcast) => {
    const getSettings = () => {
      // eslint-disable-next-line
      const result : any = {};
      for (const key of Object.keys(SETTINGS_DEFAULTS)) {
        // eslint-disable-next-line
        result[key] = storage.get(key) ?? (SETTINGS_DEFAULTS as any)[key];
      }
      return result;
    };

    registerSharedSettingsHandlers(ipc, storage, broadcast, getSettings);
  });
}

/**
 * Merge multiple HandlerRegistration objects.
 */
function mergeRegistrations(...registrations: HandlerRegistration[]): HandlerRegistration {
  const result: HandlerRegistration = {
    sync: {},
    async: {},
    send: {},
  };

  for (const reg of registrations) {
    if (reg.sync) Object.assign(result.sync!, reg.sync);
    if (reg.async) Object.assign(result.async!, reg.async);
    if (reg.send) Object.assign(result.send!, reg.send);
  }

  return result;
}

/**
 * Create all handlers for Web mode.
 * This includes all shared handlers + Web-specific defaults for Electron-only features.
 */
export function createAllHandlers(): HandlerRegistration {
  return mergeRegistrations(
    createDataHandlers(),
    createAuthHandlers(),
    createWebSettingsHandlers(),
    createAccountsHandlers(),
    createLanguageHandlers(),
    createThemesHandlers(),
    createEnvHandlers(),
    createElectronOnlyHandlers(),
    createNetworkHandlers()
  );
}

// Re-export individual creators for Electron to override specific handlers
export {
  createDataHandlers,
  createAuthHandlers,
  createWebSettingsHandlers as createSettingsHandlers,
  createAccountsHandlers,
  createLanguageHandlers,
  createThemesHandlers,
  createEnvHandlers,
  createElectronOnlyHandlers,
  createNetworkHandlers,
};

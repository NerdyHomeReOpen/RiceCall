/**
 * All handlers - combines all handler modules.
 */

import type { HandlerRegistration } from '@/platform/ipc/types';
import { createAccountsHandlers } from '../shared/accounts';
import { createLanguageHandlers } from '../shared/language';
import { registerSharedThemesHandlers } from '../shared/themes';
import { createEnvHandlers } from './env';
import { createElectronOnlyHandlers } from './electron-only';
import { createNetworkHandlers } from './network';

import { WebIpcRouter } from '@/platform/ipc/router';
import { registerSharedSettingsHandlers } from '../shared/settings';
import { registerSharedDataHandlers } from '../shared/data';
import { registerAuthIpcHandlers } from '../shared/auth';
import { createWebAuthProvider } from './auth';
import { SETTINGS_DEFAULTS } from '../shared/defaults';

/**
 * Create auth handlers for Web using shared logic.
 */
function createWebAuthHandlers(): HandlerRegistration {
  const router = new WebIpcRouter();
  return router.createWebHandlers((ipc, storage) => {
    const provider = createWebAuthProvider(storage);
    registerAuthIpcHandlers(ipc, provider);
  });
}

/**
 * Create data handlers for Web using shared logic.
 */
function createWebDataHandlers(): HandlerRegistration {
  const router = new WebIpcRouter();
  return router.createWebHandlers((ipc) => {
    registerSharedDataHandlers(ipc);
  });
}

/**
 * Create settings handlers for Web using shared logic.
 */
function createWebSettingsHandlers(): HandlerRegistration {
  const router = new WebIpcRouter();
  return router.createWebHandlers((ipc, storage, broadcast) => {
    const getSettings = () => {
      // eslint-disable-next-line
      const result: any = {};
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
 * Create themes handlers for Web using shared logic.
 */
function createWebThemesHandlers(): HandlerRegistration {
  const router = new WebIpcRouter();
  return router.createWebHandlers((ipc, storage, broadcast) => {
    registerSharedThemesHandlers(ipc, storage, broadcast);
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
    createWebDataHandlers(),
    createWebAuthHandlers(),
    createWebSettingsHandlers(),
    createAccountsHandlers(),
    createLanguageHandlers(),
    createWebThemesHandlers(),
    createEnvHandlers(),
    createElectronOnlyHandlers(),
    createNetworkHandlers(),
  );
}

// Re-export individual creators for Electron to override specific handlers
export {
  createWebDataHandlers as createDataHandlers,
  createWebAuthHandlers as createAuthHandlers,
  createWebSettingsHandlers as createSettingsHandlers,
  createAccountsHandlers,
  createLanguageHandlers,
  createWebThemesHandlers as createThemesHandlers,
  createEnvHandlers,
  createElectronOnlyHandlers,
  createNetworkHandlers,
};
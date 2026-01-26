/**
 * All handlers - combines all handler modules.
 */

import type { HandlerRegistration } from '@/platform/ipc/types';
import { createDataHandlers } from './data.handler';
import { createAuthHandlers } from './auth.handler';
import { createSettingsHandlers } from './settings.handler';
import { createAccountsHandlers } from './accounts.handler';
import { createLanguageHandlers } from './language.handler';
import { createThemesHandlers } from './themes.handler';
import { createEnvHandlers } from './env.handler';
import { createElectronOnlyHandlers } from './electron-only.handler';

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
    createSettingsHandlers(),
    createAccountsHandlers(),
    createLanguageHandlers(),
    createThemesHandlers(),
    createEnvHandlers(),
    createElectronOnlyHandlers()
  );
}

// Re-export individual creators for Electron to override specific handlers
export {
  createDataHandlers,
  createAuthHandlers,
  createSettingsHandlers,
  createAccountsHandlers,
  createLanguageHandlers,
  createThemesHandlers,
  createEnvHandlers,
  createElectronOnlyHandlers,
};

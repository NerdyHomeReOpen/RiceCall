/**
 * Electron-only handlers.
 * These are no-ops or return defaults in Web mode.
 */

import type { HandlerRegistration } from '@/platform/ipc/types';

/**
 * Create Electron-only handlers.
 * In Web mode, these return sensible defaults or do nothing.
 */
export function createElectronOnlyHandlers(): HandlerRegistration {
  return {
    sync: {
      // Font list - Electron can get system fonts, Web cannot
      'get-font-list': (): string[] => {
        return [];
      },
    },

    send: {
      // Window controls - no-ops in Web (handled by inAppPopup)
      'window-control-minimize': () => {},
      'window-control-maximize': () => {},
      'window-control-unmaximize': () => {},
      'window-control-close': () => {},
      'resize': () => {},

      // Discord presence - Electron only
      'update-discord-presence': () => {},

      // Tray - Electron only
      'set-tray-title': () => {},

      // Loopback audio - Electron only
      'enable-loopback-audio': () => {},
      'disable-loopback-audio': () => {},

      // Updates - Electron only
      'check-for-updates': () => {},

      // Server change - Electron only (requires restart)
      'change-server': () => {},

      // Record saving - Electron only (needs file system)
      'save-record': () => {},

      // Disclaimer - Electron only
      'dont-show-disclaimer-next-time': () => {},

      // Exit app - Electron only
      'exit': () => {},
    },

    async: {
      // Record path selection - Electron only
      'select-record-save-path': async (): Promise<string | null> => {
        return null;
      },
    },
  };
}

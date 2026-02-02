import type { HandlerRegistration } from '@/platform/ipc/types';

  /**
   * Network diagnosis handlers.
   */
  export function createNetworkHandlers(): HandlerRegistration {
    // In Electron, these are handled by the main process (network.service.ts)
    // We check for window.require to detect Electron renderer environment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isElectron = typeof window !== 'undefined' && typeof (window as any).require === 'function';
  
    if (isElectron) {
      return { async: {}, send: {} };
    }
  
    return {
      async: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        'run-network-diagnosis': async (_context, _params: { domains: string[]; duration?: number }) => {
          return {
            error: 'Network diagnosis is only available in the desktop version.',
          };
        },
    },
    send: {
      'cancel-network-diagnosis': () => {
        // No-op in Web
      },
    }
  };
}

import type { ApiClient } from './types';

// Electron adapter: defer to main-process API via existing IPC (data/auth already abstracted there).
// This exists mainly to keep a consistent type and wiring point.
export function createElectronApiClient(): ApiClient {
  return {
    // There is no generic raw-HTTP ipc in the current codebase; keep these as unsupported
    // and use the typed ipc.auth/ipc.data calls instead.
    async get(): Promise<never> {
      throw new Error('ElectronApiClient.get is not supported; use ipc.data.*');
    },
    async post(): Promise<never> {
      throw new Error('ElectronApiClient.post is not supported; use ipc.auth.* or ipc.data.*');
    },
    async patch(): Promise<never> {
      throw new Error('ElectronApiClient.patch is not supported; use ipc.data.*');
    },
  };
}

import { isElectron } from '../isElectron';

/**
 * FileStorage Abstraction Layer
 * Automatically exports the correct implementation based on the environment.
 */

export const FileStorage = {
  store: async (buffer: ArrayBuffer, directory: string, filenamePrefix: string, extension: string): Promise<string | null> => {
    // If it's Electron and we are in the Node.js environment (Main Process)
    // In Main Process, window is undefined.
    if (isElectron() && typeof window === 'undefined') {
      const { FileStorage: ElectronStorage } = await import('./electron');
      return ElectronStorage.store(buffer, directory, filenamePrefix, extension);
    } else {
      // Web Environment or simulated Web IPC in browser
      const { FileStorage: WebStorage } = await import('./web');
      return WebStorage.store(buffer, directory, filenamePrefix, extension);
    }
  },
};

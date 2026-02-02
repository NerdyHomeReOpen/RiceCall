/**
 * Web DataClient implementation.
 * Uses createDataService() with browser-safe ApiClient for direct HTTP calls.
 * 
 * Web is the secondary platform - it auto-adapts from the DataService interface.
 * When Electron adds new data methods, Web automatically inherits them via Proxy.
 */

import type { DataClient, DataServiceApiClient, DataService } from './types';
import { createDataService } from './dataService';
import { Logger } from '@/utils/logger';

const logger = new Logger('WebDataClient');

/**
 * Wrap an ApiClient with error handling and logging.
 * This mirrors the try/catch pattern from the original ipc.ts web fallbacks.
 */
function wrapWithErrorHandling(api: DataServiceApiClient): DataServiceApiClient {
  return {
    get: async <T>(endpoint: string): Promise<T | null> => {
      try {
        return await api.get<T>(endpoint);
      } catch (e) {
        logger.warn(`GET ${endpoint} failed: ${String(e)}`);
        return null;
      }
    },
    post: async <T>(endpoint: string, data: unknown): Promise<T | null> => {
      try {
        return await api.post<T>(endpoint, data);
      } catch (e) {
        logger.warn(`POST ${endpoint} failed: ${String(e)}`);
        return null;
      }
    },
  };
}

/**
 * Create a Web DataClient that uses HTTP API directly.
 * Uses Proxy to auto-forward any method calls to the underlying DataService,
 * so Web automatically adapts when new methods are added to Electron/DataService.
 * 
 * @param api - The ApiClient to use for HTTP requests (from getApiClient())
 */
export function createWebDataClient(api: DataServiceApiClient): DataClient {
  const wrappedApi = wrapWithErrorHandling(api);
  const dataService = createDataService(wrappedApi);
  
  // Special cases where Web behavior differs from Electron
  const webOverrides: Partial<DataClient> = {
    // In web mode, userHotReload is equivalent to regular user fetch
    userHotReload: dataService.user,
  };

  // Use Proxy to auto-forward all method calls to dataService
  // This means Web automatically inherits new methods without code changes
  return new Proxy(dataService as DataClient, {
    get(target, prop: string) {
      // Check overrides first
      if (prop in webOverrides) {
        return webOverrides[prop as keyof typeof webOverrides];
      }
      // Forward to dataService
      if (prop in target) {
        return target[prop as keyof DataService];
      }
      return undefined;
    },
  });
}

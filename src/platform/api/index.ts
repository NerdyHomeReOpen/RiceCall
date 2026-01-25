import type { ApiClient } from './types';
import { createWebApiClient } from './webApiClient';
import { createElectronApiClient } from './electronApiClient';

function isElectronRenderer(): boolean {
  return typeof window !== 'undefined' && typeof (window as unknown as { require?: unknown }).require === 'function';
}

let singleton: ApiClient | null = null;

export function getApiClient(): ApiClient {
  if (singleton) return singleton;

  if (isElectronRenderer()) {
    singleton = createElectronApiClient();
    return singleton;
  }

  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '').trim();
  if (!baseUrl) {
    // Provide a clear error if someone tries to use the web client without configuration.
    singleton = {
      async get() {
        throw new Error('NEXT_PUBLIC_API_BASE_URL is not set');
      },
      async post() {
        throw new Error('NEXT_PUBLIC_API_BASE_URL is not set');
      },
      async patch() {
        throw new Error('NEXT_PUBLIC_API_BASE_URL is not set');
      },
    };
    return singleton;
  }

  singleton = createWebApiClient({
    baseUrl,
    tokenProvider: () => {
      try {
        return localStorage.getItem('token');
      } catch {
        return null;
      }
    },
  });

  return singleton;
}

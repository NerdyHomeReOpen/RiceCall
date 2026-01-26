/* eslint-disable @typescript-eslint/no-explicit-any */
import { token } from '../main.js';
import { env } from './env.js';
import Logger from './logger.js';

// Node/Electron main shares the same HTTP core implementation as the web renderer.
// This keeps request behavior (retries/envelope parsing/auth header) consistent across platforms.
import { createApiClient, type ApiClient } from './platform/api/universalApiClient';

type RequestOptions = {
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
};

type ApiRequestData = {
  [key: string]: any;
};

// Lazy initialization: client is created on first use, after env is loaded
let client: ApiClient | null = null;
function getClient(): ApiClient {
  if (!client) {
    client = createApiClient({
      baseUrl: env.API_URL,
      tokenProvider: () => token,
      maxRetry: 3,
      onLog: (level, message) => {
        if (level === 'error') new Logger('API').error(message);
        else if (level === 'warn') new Logger('API').warn(message);
        else new Logger('API').info(message);
      },
    });
  }
  return client;
}

// Back-compat: legacy code imports `handleResponse`, but it no longer needs to.
// Keep an export with a clear failure to discourage direct use.
export async function handleResponse(): Promise<any> {
  throw new Error('handleResponse is internal; use get/post/patch (shared ApiClient core) instead');
}

export async function get(endpoint: string, options?: RequestOptions): Promise<any | null> {
  return getClient().get(endpoint, options);
}

export async function post(endpoint: string, data: ApiRequestData | FormData, options?: RequestOptions): Promise<any | null> {
  return getClient().post(endpoint, data, options);
}

export async function patch(endpoint: string, data: Record<string, any>, options?: RequestOptions): Promise<any | null> {
  return getClient().patch(endpoint, data, options);
}

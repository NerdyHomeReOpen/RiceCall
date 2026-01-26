import type { ApiClient, RequestOptions, TokenProvider } from './types';

// Re-export ApiClient type for consumers
export type { ApiClient } from './types';

/**
 * Backend response envelope used by RiceCall backend.
 * Many endpoints respond with `{ message, data }`.
 */
export type ApiEnvelope<T> = {
  message?: string;
  data?: T;
};

export type CreateApiClientParams = {
  baseUrl: string;
  tokenProvider?: TokenProvider;
  /** Defaults to 3 (same as legacy `src/api.service.ts`) */
  maxRetry?: number;
  /** Optional hook for logging. Keep it side-effect free and safe in web builds. */
  onLog?: (level: 'info' | 'warn' | 'error', message: string) => void;
};

async function parseJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function handleResponse<T>(response: Response, method: 'GET' | 'POST' | 'PATCH', onLog?: CreateApiClientParams['onLog']): Promise<T> {
  const result = (await parseJsonSafe(response)) as ApiEnvelope<T> | null;

  const asRecord = (v: unknown): Record<string, unknown> | null => {
    if (!v || typeof v !== 'object') return null;
    return v as Record<string, unknown>;
  };

  const resultRecord = asRecord(result);
  const messageFrom = (v: unknown): string | undefined => {
    const r = asRecord(v);
    const m = r?.message;
    return typeof m === 'string' ? m : undefined;
  };

  if (!response.ok) {
    const message = messageFrom(result) || `HTTP ${method} ${response.url} failed`;
    onLog?.('error', `HTTP ${method} ${response.url} [${response.status}]: ${message}`);
    throw new Error(message);
  }

  const message = messageFrom(result);
  if (message) onLog?.('info', `HTTP ${method} ${response.url} [${response.status}]: ${message}`);

  // Most endpoints return envelope { data, message }.
  // Some may return a bare object; accept both.
  const data = resultRecord?.data;
  return ((data ?? result) as T) ?? (null as T);
}

export function createApiClient(params: CreateApiClientParams): ApiClient {
  const baseUrl = (params.baseUrl ?? '').trim();
  const tokenProvider = params.tokenProvider;
  const maxRetry = params.maxRetry ?? 3;
  const onLog = params.onLog;

  const withAuthHeaders = (options?: RequestOptions, extra?: Record<string, string>): Headers => {
    const token = tokenProvider?.();
    return new Headers({
      ...(options?.headers || {}),
      ...(extra || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
  };

  async function requestWithRetry<T>(
    method: 'GET' | 'POST' | 'PATCH',
    endpoint: string,
    init: Omit<RequestInit, 'method'>,
    retryCount = 0,
  ): Promise<T> {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...init,
        method,
      });
      return await handleResponse<T>(response, method, onLog);
    } catch (err) {
      if (retryCount < maxRetry) {
        onLog?.('warn', `Retrying(#${retryCount}) HTTP ${method} ${endpoint}: ${String(err)}`);
        return requestWithRetry<T>(method, endpoint, init, retryCount + 1);
      }
      throw err;
    }
  }

  return {
    get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
      return requestWithRetry<T>('GET', endpoint, {
        headers: withAuthHeaders(options),
        credentials: options?.credentials,
      });
    },

    post<T>(endpoint: string, data: unknown, options?: RequestOptions): Promise<T> {
      const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
      const headers = withAuthHeaders(options, isFormData ? {} : { 'Content-Type': 'application/json' });

      return requestWithRetry<T>('POST', endpoint, {
        headers,
        credentials: options?.credentials ?? 'omit',
        body: isFormData ? (data as FormData) : JSON.stringify(data),
      });
    },

    patch<T>(endpoint: string, data: unknown, options?: RequestOptions): Promise<T> {
      const headers = withAuthHeaders(options, { 'Content-Type': 'application/json' });

      return requestWithRetry<T>('PATCH', endpoint, {
        headers,
        credentials: options?.credentials,
        body: JSON.stringify(data),
      });
    },
  };
}

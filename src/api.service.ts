import { getEnv } from '@/env';
import { getToken } from '@/auth.token';
import Logger from '@/logger';

type RequestOptions = {
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
};

type ApiRequestData = Record<string, unknown>;

export async function handleResponse<T>(response: Response, method: 'GET' | 'POST' | 'PATCH'): Promise<T> {
  const result = await response.json();
  if (!response.ok) {
    new Logger('API').error(`HTTP ${method} ${response.url} [${response.status}]: ${result.message}`);
    throw new Error(result.message);
  } else {
    new Logger('API').info(`HTTP ${method} ${response.url} [${response.status}]: ${result.message}`);
    if (result.data) result.data.message = result.message || '';
    return result.data;
  }
}

export async function get<T>(endpoint: string, options?: RequestOptions, maxRetry = 3, retryCount = 0): Promise<T | null> {
  try {
    const response = await fetch(`${getEnv().API_URL}${endpoint}`, {
      headers: {
        ...(options?.headers || {}),
        Authorization: `Bearer ${getToken()}`,
      },
    });

    return await handleResponse<T>(response, 'GET');
  } catch (e) {
    if (retryCount < maxRetry) {
      return await get(endpoint, options, maxRetry, retryCount + 1);
    }
    throw e;
  }
}

export async function post<T>(endpoint: string, data: ApiRequestData | FormData, options?: RequestOptions, maxRetry = 3, retryCount = 0): Promise<T | null> {
  try {
    const isFormData = data instanceof FormData;

    const headers = new Headers({
      ...(options?.headers || {}),
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      Authorization: `Bearer ${getToken()}`,
    });

    const response = await fetch(`${getEnv().API_URL}${endpoint}`, {
      method: 'POST',
      headers: headers,
      credentials: options?.credentials || 'omit',
      body: isFormData ? data : JSON.stringify(data),
    });

    return await handleResponse<T>(response, 'POST');
  } catch (e) {
    if (retryCount < maxRetry) {
      return await post(endpoint, data, options, maxRetry, retryCount + 1);
    }
    throw e;
  }
}

export async function patch<T>(endpoint: string, data: Record<string, unknown>, options?: RequestOptions, maxRetry = 3, retryCount = 0): Promise<T | null> {
  try {
    const headers = new Headers({
      ...(options?.headers || {}),
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
    });

    const response = await fetch(`${getEnv().API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify(data),
    });

    return await handleResponse<T>(response, 'PATCH');
  } catch (e) {
    if (retryCount < maxRetry) {
      return await patch(endpoint, data, options, maxRetry, retryCount + 1);
    }
    throw e;
  }
}

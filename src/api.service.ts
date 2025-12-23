/* eslint-disable @typescript-eslint/no-explicit-any */
import { token } from '../main.js';
import { env } from './env.js';
import Logger from './logger.js';

type RequestOptions = {
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
};

type ApiRequestData = {
  [key: string]: any;
};

export async function handleResponse(response: Response, method: 'GET' | 'POST' | 'PATCH'): Promise<any> {
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

export async function get(endpoint: string, options?: RequestOptions, maxRetry = 3, retryCount = 0): Promise<any | null> {
  try {
    const response = await fetch(`${env.API_URL}${endpoint}`, {
      headers: {
        ...(options?.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

    return await handleResponse(response, 'GET');
  } catch (error: any) {
    if (retryCount < maxRetry) {
      return await get(endpoint, options, maxRetry, retryCount + 1);
    }
    throw error;
  }
}

export async function post(endpoint: string, data: ApiRequestData | FormData, options?: RequestOptions, maxRetry = 3, retryCount = 0): Promise<any | null> {
  try {
    const isFormData = data instanceof FormData;

    const headers = new Headers({
      ...(options?.headers || {}),
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      Authorization: `Bearer ${token}`,
    });

    const response = await fetch(`${env.API_URL}${endpoint}`, {
      method: 'POST',
      headers: headers,
      credentials: options?.credentials || 'omit',
      body: isFormData ? data : JSON.stringify(data),
    });

    return await handleResponse(response, 'POST');
  } catch (error: any) {
    if (retryCount < maxRetry) {
      return await post(endpoint, data, options, maxRetry, retryCount + 1);
    }
    throw error;
  }
}

export async function patch(endpoint: string, data: Record<string, any>, options?: RequestOptions, maxRetry = 3, retryCount = 0): Promise<any | null> {
  try {
    const headers = new Headers({
      ...(options?.headers || {}),
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    });

    const response = await fetch(`${env.API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify(data),
    });

    return await handleResponse(response, 'PATCH');
  } catch (error: any) {
    if (retryCount < maxRetry) {
      return await patch(endpoint, data, options, maxRetry, retryCount + 1);
    }
    throw error;
  }
}

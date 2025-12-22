/* eslint-disable @typescript-eslint/no-explicit-any */
import { token } from '../../main.js';
import { env } from './env.js';

type RequestOptions = {
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
};

type ApiRequestData = {
  [key: string]: any;
};

const handleResponse = async (response: Response, method: 'GET' | 'POST' | 'PATCH'): Promise<any> => {
  const result = await response.json();
  if (!response.ok) {
    console.error(`${new Date().toLocaleString()} | HTTP ${method} ${response.url} [${response.status}]: ${result.message}`);
    throw new Error(result.message);
  } else {
    console.log(`${new Date().toLocaleString()} | HTTP ${method} ${response.url} [${response.status}]: ${result.message}`);
    if (result.data) result.data.message = result.message || '';
    return result.data;
  }
};

const apiService = {
  // GET request
  get: async (endpoint: string, options?: RequestOptions, retry = true, retryCount = 0): Promise<any | null> => {
    try {
      const response = await fetch(`${env.API_URL}${endpoint}`, {
        headers: {
          ...(options?.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      });

      return await handleResponse(response, 'GET');
    } catch (error: any) {
      if (retry && retryCount < 3) {
        return await apiService.get(endpoint, options, false, retryCount + 1);
      }
      throw error;
    }
  },

  // POST request
  post: async (endpoint: string, data: ApiRequestData | FormData, options?: RequestOptions, retry = true, retryCount = 0): Promise<any | null> => {
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
      if (retry && retryCount < 3) {
        return await apiService.post(endpoint, data, options, false, retryCount + 1);
      }
      throw error;
    }
  },

  // PATCH request
  patch: async (endpoint: string, data: Record<string, any>, options?: RequestOptions, retry = true, retryCount = 0): Promise<any | null> => {
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
      if (retry && retryCount < 3) {
        return await apiService.patch(endpoint, data, options, false, retryCount + 1);
      }
      throw error;
    }
  },
};

export default apiService;

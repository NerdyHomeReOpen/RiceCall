/* eslint-disable @typescript-eslint/no-explicit-any */
import StandardizedError, { errorHandler } from '@/utils/errorHandler';

const API_URL = process.env.NEXT_PUBLIC_SERVER_URL;

type RequestOptions = {
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
};

type ApiRequestData = {
  [key: string]: any;
};

const handleResponse = async (response: Response): Promise<any> => {
  try {
    const data = await response.json();
    if (!response.ok) {
      new errorHandler(data.error).show();
    }
    return data;
  } catch (error: Error | any) {
    if (!(error instanceof StandardizedError)) {
      error = new StandardizedError({
        name: 'ServerError',
        message: `請求失敗: ${error.message}`,
        part: 'RESPONSE',
        tag: 'EXCEPTION_ERROR',
        statusCode: 500,
      });
    }
    new errorHandler(error).show();
    return null;
  }
};

const apiService = {
  // GET request
  get: async (endpoint: string): Promise<any | null> => {
    try {
      // Fetch
      const response = await fetch(`${API_URL}${endpoint}`);
      // Handle response
      const result = await handleResponse(response);
      return result;
    } catch (error: Error | any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `獲取資料時發生預期外的錯誤: ${error.message}`,
          part: 'GET',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }
      new errorHandler(error).show();
      return null;
    }
  },

  // POST request
  post: async (
    endpoint: string,
    data: ApiRequestData | FormData,
    options?: RequestOptions,
  ): Promise<any | null> => {
    try {
      const headers = new Headers({
        ...(data instanceof FormData
          ? {}
          : { 'Content-Type': 'application/json' }),
        ...(options?.headers || {}),
      });

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: headers,
        credentials: options?.credentials || 'omit',
        body: data instanceof FormData ? data : JSON.stringify(data),
      });
      // Handle response
      const result = await handleResponse(response);
      return result;
    } catch (error: Error | any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `提交資料時發生預期外的錯誤: ${error.message}`,
          part: 'POST',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }
      new errorHandler(error).show();
      return null;
    }
  },

  // PATCH request
  patch: async (
    endpoint: string,
    data: Record<string, any>,
  ): Promise<any | null> => {
    try {
      // Fetch
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      // Handle response
      const result = await handleResponse(response);
      return result;
    } catch (error: Error | any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `更新資料時發生預期外的錯誤: ${error.message}`,
          part: 'PATCH',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }
      new errorHandler(error).show();
      return null;
    }
  },
};

export default apiService;

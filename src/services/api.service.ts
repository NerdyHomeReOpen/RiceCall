/* eslint-disable @typescript-eslint/no-explicit-any */
// Safe reference to electron's ipcRenderer
let ipcRenderer: any = null;

// Initialize ipcRenderer only in client-side and Electron environment
if (typeof window !== 'undefined' && window.require) {
  try {
    const electron = window.require('electron');
    ipcRenderer = electron.ipcRenderer;
  } catch (error) {
    console.warn('Not in Electron environment:', error);
  }
}

const getAPIURL = () => ipcRenderer?.sendSync('get-env')?.API_URL || '';

const getToken = () => ipcRenderer?.sendSync('get-token') || '';

type RequestOptions = {
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
};

type ApiRequestData = {
  [key: string]: any;
};

const handleResponse = async (response: Response): Promise<any> => {
  const result = await response.json();
  if (!response.ok) throw new Error(result.message);
  result.data.message = result.message || '';
  return result.data;
};

const apiService = {
  // GET request
  get: async (endpoint: string, options?: RequestOptions, retry = true, retryCount = 0): Promise<any | null> => {
    try {
      const response = await fetch(`${getAPIURL()}${endpoint}`, {
        headers: {
          ...(options?.headers || {}),
          Authorization: `Bearer ${getToken()}`,
        },
      });

      return await handleResponse(response);
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
      const headers = new Headers({
        ...(data instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(options?.headers || {}),
        Authorization: `Bearer ${getToken()}`,
      });

      const response = await fetch(`${getAPIURL()}${endpoint}`, {
        method: 'POST',
        headers: headers,
        credentials: options?.credentials || 'omit',
        body: data instanceof FormData ? data : JSON.stringify(data),
      });

      return await handleResponse(response);
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
        'Authorization': `Bearer ${getToken()}`,
      });

      const response = await fetch(`${getAPIURL()}${endpoint}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify(data),
      });

      return await handleResponse(response);
    } catch (error: any) {
      if (retry && retryCount < 3) {
        return await apiService.patch(endpoint, data, options, false, retryCount + 1);
      }
      throw error;
    }
  },
};

export default apiService;

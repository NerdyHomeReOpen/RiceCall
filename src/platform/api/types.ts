export type TokenProvider = () => string | null | undefined;

export type RequestOptions = {
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
};

export type ApiClient = {
  get: <T = unknown>(endpoint: string, options?: RequestOptions) => Promise<T>;
  post: <T = unknown>(endpoint: string, data: unknown, options?: RequestOptions) => Promise<T>;
  patch: <T = unknown>(endpoint: string, data: unknown, options?: RequestOptions) => Promise<T>;
};

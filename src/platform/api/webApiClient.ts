import type { ApiClient, TokenProvider } from './types';
import { createApiClient } from './universalApiClient';

export function createWebApiClient(params: { baseUrl: string; tokenProvider?: TokenProvider }): ApiClient {
  const { baseUrl, tokenProvider } = params;
  return createApiClient({
    baseUrl,
    tokenProvider,
  });
}

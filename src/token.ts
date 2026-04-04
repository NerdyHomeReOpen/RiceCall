/**
 * Platform-agnostic token storage.
 * Used to share authentication tokens between services without depending on Electron's main.ts.
 */

let _token: string | null = null;

export function getToken(): string | null {
  return _token;
}

export function setToken(token: string): void {
  _token = token;
}

export function removeToken(): void {
  _token = null;
}

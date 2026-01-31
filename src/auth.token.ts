/**
 * Platform-agnostic token storage.
 * Used to share authentication tokens between services without depending on Electron's main.ts.
 */

let _token: string = '';

export function getToken(): string {
  return _token;
}

export function setToken(token: string): void {
  _token = token;
}

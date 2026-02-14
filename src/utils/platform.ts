/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Determine if the current environment is Electron main process.
 * Strictly: must have process and type must be 'browser'.
 */
export function isMain(): boolean {
  return typeof process !== 'undefined' && !!(process.versions && process.versions.electron) && (process as any).type === 'browser';
}

/**
 * Determine if the current environment is Electron renderer process.
 * Strictly: must be in browser environment and UserAgent must contain Electron.
 */
export function isRenderer(): boolean {
  return typeof window !== 'undefined' && typeof navigator === 'object' && /Electron/i.test(navigator.userAgent);
}

/**
 * Determine if the current environment is Electron.
 */
export function isElectron(): boolean {
  return isMain() || isRenderer();
}

/**
 * Determine if the current environment is a regular browser.
 * Strictly: must be in browser environment and UserAgent must not contain Electron.
 */
export function isWebsite(): boolean {
  return typeof window !== 'undefined' && !isRenderer() && !(window as any).electron && !(window as any).process?.versions?.electron;
}

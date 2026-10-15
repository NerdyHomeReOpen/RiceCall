/* eslint-disable @typescript-eslint/no-explicit-any */

export function isMain(): boolean {
  return typeof process !== 'undefined' && !!(process.versions && process.versions.electron) && (process as any).type === 'browser';
}

export function isRenderer(): boolean {
  return typeof window !== 'undefined' && typeof navigator === 'object' && /Electron/i.test(navigator.userAgent);
}

export function isElectron(): boolean {
  return isMain() || isRenderer();
}

export function isWebsite(): boolean {
  return typeof window !== 'undefined' && !isRenderer() && !(window as any).electron && !(window as any).process?.versions?.electron;
}

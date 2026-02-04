/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Centralized platform check utility.
 * Split from other modules to avoid circular dependencies.
 */

export function isElectron() {
  const isRenderer = typeof window !== 'undefined' && typeof window.process === 'object' && (window.process as any).type === 'renderer';
  if (isRenderer) return true;

  const isMain = typeof process !== 'undefined' && !!(process.versions && process.versions.electron);
  if (isMain) return true;

  if (typeof navigator === 'object' && navigator.userAgent.includes('Electron')) {
    return true;
  }

  return false;
}

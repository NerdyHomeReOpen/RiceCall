/**
 * Platform-agnostic Storage utilities.
 * Handles the difference between Electron (multi-window) and Web (single-window)
 * regarding Storage events.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

function isElectron(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).require === 'function';
}

export const platformStorage = {
  /**
   * Set a localStorage item and ensure 'storage' event fires.
   * 
   * - In Electron: localStorage changes in one window automatically fire 'storage' in others.
   * - In Web (Single Page): localStorage changes DO NOT fire 'storage' in the same window.
   *   So we manually dispatch the event to simulate Electron-like behavior for in-app popups.
   */
  setItem: (key: string, value: string) => {
    window.localStorage.setItem(key, value);

    if (!isElectron()) {
      // Polyfill for same-window storage event
      window.dispatchEvent(
        new StorageEvent('storage', {
          key,
          newValue: value,
          storageArea: window.localStorage,
          url: window.location.href,
        })
      );
    }
  },

  getItem: (key: string): string | null => {
    return window.localStorage.getItem(key);
  },

  removeItem: (key: string) => {
    window.localStorage.removeItem(key);
    
    if (!isElectron()) {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key,
          newValue: null,
          storageArea: window.localStorage,
          url: window.location.href,
        })
      );
    }
  }
};

/**
 * Platform-agnostic System Settings
 * 
 * Abstracts the system settings storage:
 * - Electron: uses electron-store (in main process)
 * - Web: uses localStorage
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import type * as Types from '@/types';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Check if we're in Electron renderer process
const isElectronRenderer = isBrowser && !!(window as any).electronAPI;

/**
 * Get system settings
 * - In Electron renderer: calls IPC to main process
 * - In Web: reads from localStorage
 */
export function getSystemSettings(): Partial<Types.SystemSettings> {
  if (isElectronRenderer) {
    // In Electron, we need to get settings via IPC
    // But this is sync, so we use a cached version that was sent during init
    // This is populated by the main process on window load
    const cached = (window as any).__SYSTEM_SETTINGS__;
    if (cached) return cached;
    
    // Fallback to defaults
    return getDefaultSettings();
  }
  
  // Web mode: read from localStorage
  if (isBrowser) {
    try {
      const stored = localStorage.getItem('ricecall:systemSettings');
      if (stored) {
        return { ...getDefaultSettings(), ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('[SystemSettings] Failed to read from localStorage:', e);
    }
  }
  
  return getDefaultSettings();
}

/**
 * Save system settings (Web mode only)
 * In Electron, settings are saved via IPC to main process
 */
export function saveSystemSettings(settings: Partial<Types.SystemSettings>): void {
  if (isBrowser && !isElectronRenderer) {
    try {
      const current = getSystemSettings();
      const merged = { ...current, ...settings };
      localStorage.setItem('ricecall:systemSettings', JSON.stringify(merged));
    } catch (e) {
      console.warn('[SystemSettings] Failed to save to localStorage:', e);
    }
  }
}

/**
 * Default system settings
 */
export function getDefaultSettings(): Partial<Types.SystemSettings> {
  return {
    autoLogin: false,
    autoLaunch: false,
    alwaysOnTop: false,
    statusAutoIdle: false,
    statusAutoIdleMinutes: 10,
    statusAutoDnd: false,
    channelUIMode: 'classic',
    closeToTray: true,
    font: 'Microsoft JhengHei',
    fontSize: 14,
    inputAudioDevice: '',
    outputAudioDevice: '',
    recordFormat: 'wav',
    recordSavePath: '',
  };
}

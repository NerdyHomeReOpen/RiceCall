/**
 * Web Popup Loader
 * 
 * This is the web-mode entry point for loading popup data.
 * It imports the unified popupLoader and initializes it with web-specific dependencies.
 * 
 * Now both Electron and Web share the same loader logic!
 */

import type * as Types from '@/types';
import { loaders, initPopupLoader } from '@/popupLoader';
import { getSystemSettings } from '@/platform/settings';
import ipc from '@/ipc';

// Initialize the popup loader with web dependencies
// ipc.data provides the same interface as DataService
initPopupLoader({
  data: ipc.data,
  getSystemSettings,
});

/**
 * Hydrate popup initialData for web mode.
 * This is the main entry point called by web.ts popup controller.
 */
export async function hydratePopupData(
  type: Types.PopupType,
  initialData: Record<string, unknown> | null | undefined
): Promise<Record<string, unknown> | null> {
  if (!initialData) return null;

  const loader = loaders[type as keyof typeof loaders];
  if (!loader) {
    // No loader defined, return input as-is
    return initialData;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (loader as any)(initialData);
  } catch (error) {
    console.error(`[WebPopupLoader] Failed to load data for ${type}:`, error);
    return null;
  }
}

/**
 * Check if a popup type needs hydration (has a loader)
 */
export function needsHydration(type: Types.PopupType): boolean {
  return type in loaders;
}

// Re-export loaders for direct access if needed
export { loaders };

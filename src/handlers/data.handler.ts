/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Data handlers - shared between Electron and Web.
 * Automatically generates IPC handlers by wrapping all functions in DataService.
 */

import type { HandlerRegistration } from '@/platform/ipc/types';
import * as DataService from '@/data.service';

/**
 * Create data handlers by dynamically traversing DataService exports.
 */
export function createDataHandlers(): HandlerRegistration {
  const asyncHandlers: Record<string, any> = {};

  // 1. Automatically map all functions from DataService to "data-{name}" channels
  Object.entries(DataService).forEach(([name, fn]) => {
    if (typeof fn === 'function') {
      const channel = `data-${name}`;
      asyncHandlers[channel] = async (_ctx: any, params: any) => (fn as any)(params);
    }
  });

  // 2. Add specific aliases or overrides that don't follow the standard naming
  // In this project, data-user-hot-reload is an alias for DataService.user
  asyncHandlers['data-user-hot-reload'] = asyncHandlers['data-user'];

  return {
    async: asyncHandlers,
  };
}

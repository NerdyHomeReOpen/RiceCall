import { ipcMain } from 'electron';

import type * as Types from '@/types';

import { broadcast } from '@/main/electron';

import { objDiff } from '@/utils/objDiff';

let cache: Types.StoreStateSnapshot | null = null;

export function registerStoreStateHandlers() {
  ipcMain.on('sync-store-state', (_, state: Types.StoreStateSnapshot) => {
    const diff = objDiff(state, cache || {});
    if (Object.keys(diff).length === 0) return;
    broadcast('store-state', diff);
    cache = state;
  });

  ipcMain.on('get-store-state', (event) => {
    event.returnValue = cache;
  });
}

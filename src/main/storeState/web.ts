import type * as Types from '@/types';

import { eventEmitter } from '@/main/web';

import { objDiff } from '@/utils';

let cache: Types.StoreStateSnapshot | null = null;

export function getStoreState(): Types.StoreStateSnapshot | null {
  return cache;
}

export function syncStoreState(state: Types.StoreStateSnapshot): void {
  const diff = objDiff(state, cache || {});
  if (Object.keys(diff).length === 0) return;
  cache = state;
  eventEmitter.emit('store-state', diff);
}

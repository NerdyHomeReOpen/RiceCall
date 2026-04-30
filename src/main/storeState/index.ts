import type * as Types from '@/types';

import { modules } from '@/main/modules';

export const storeState = {
  sync: (state: Types.StoreStateSnapshot): void => {
    modules.default.syncStoreState(state)
  },
  get: (): Types.StoreStateSnapshot | null => {
    return modules.default.getStoreState();
  },
  onUpdate: (callback: (state: Types.StoreStateSnapshot) => void): (() => void) => {
    return modules.default.listen('store-state', callback);
  },
};

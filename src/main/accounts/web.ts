import type * as Types from '@/types';

import { store, eventEmitter } from '@/main/web';

export function getAccounts(): Types.StoreType['accounts'] {
  return store.get('accounts');
}

export function addAccount(account: string, data: { isAutoLoginEnabled: boolean; rememberAccount: boolean; password: string }): void {
  const accounts = store.get('accounts');
  accounts[account] = data;
  store.set('accounts', accounts);
  eventEmitter.emit('accounts', accounts);
}

export function deleteAccount(account: string): void {
  const accounts = store.get('accounts');
  delete accounts[account];
  store.set('accounts', accounts);
  eventEmitter.emit('accounts', accounts);
}

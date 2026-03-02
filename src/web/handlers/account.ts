import { store, eventEmitter } from '@/web/main';

export function getAccounts() {
  return store.get('accounts');
}

export function addAccount(account: string, data: { autoLogin: boolean; rememberAccount: boolean; password: string }) {
  const accounts = store.get('accounts');
  accounts[account] = data;
  store.set('accounts', accounts);
  eventEmitter.emit('accounts', accounts);
}

export function deleteAccount(account: string) {
  const accounts = store.get('accounts');
  delete accounts[account];
  store.set('accounts', accounts);
  eventEmitter.emit('accounts', accounts);
}

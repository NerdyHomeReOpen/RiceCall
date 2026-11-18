import { ipcMain } from 'electron';

import { store, broadcast } from '@/main/electron';

export function registerAccountHandlers(): void {
  ipcMain.on('get-accounts', (event) => {
    event.returnValue = store.get('accounts');
  });

  ipcMain.on('add-account', (_, account: string, data: { isAutoLoginEnabled: boolean; rememberAccount: boolean; password: string }) => {
    const accounts = store.get('accounts');
    accounts[account] = data;
    store.set('accounts', accounts);
    broadcast('accounts', accounts);
  });

  ipcMain.on('delete-account', (_, account: string) => {
    const accounts = store.get('accounts');
    delete accounts[account];
    store.set('accounts', accounts);
    broadcast('accounts', accounts);
  });
}

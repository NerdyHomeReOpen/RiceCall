import Store from 'electron-store';
import * as Types from "@/types";
  
  
export default function registerAccountHandlers(ipcMain: Electron.IpcMain, store: Store<Types.StoreType>, broadcast: (channel: string, data: any) => void) {
  ipcMain.on('get-accounts', (event) => {
    event.returnValue = store.get('accounts');
  });

  ipcMain.on('add-account', (_, account: string, data: { autoLogin: boolean; rememberAccount: boolean; password: string }) => {
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
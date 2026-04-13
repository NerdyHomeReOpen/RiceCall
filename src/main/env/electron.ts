import { ipcMain } from 'electron';

import Env from '@/env';

import { broadcast, store } from '@/main/electron';

export function registerEnvHandlers() {
  ipcMain.on('change-env', (_, enviroment: 'prod' | 'dev') => {
    store.set('env', enviroment);
    Env.load(enviroment);
    broadcast('env', enviroment);
  });
}

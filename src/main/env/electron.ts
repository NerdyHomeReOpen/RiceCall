import { ipcMain } from 'electron';

import { loadEnv } from '@/env';

import { broadcast, store } from '@/main/electron';

export function registerEnvHandlers() {
  ipcMain.on('change-env', (_, env: 'prod' | 'dev') => {
    store.set('env', env);
    loadEnv(env);
    broadcast('env', env);
  });
}

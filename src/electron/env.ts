import { ipcMain } from 'electron';

import { broadcast, store } from '@/electron/main';

import { loadEnv } from '@/env';

export function registerEnvHandlers() {
  ipcMain.on('change-env', (_, env: 'prod' | 'dev') => {
    store.set('env', env);
    loadEnv(env);
    broadcast('env', env);
  });
}

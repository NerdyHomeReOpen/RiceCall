import { store, eventEmitter } from '@/web/main';

import { loadEnv } from '@/env';

export function changeEnv(env: 'prod' | 'dev') {
  store.set('env', env);
  loadEnv(env);
  eventEmitter.emit('env', env);
}

import { store, eventEmitter } from '@/main/web';

import { loadEnv } from '@/env';

export function changeEnv(env: 'prod' | 'dev') {
  store.set('env', env);
  loadEnv(env);
  eventEmitter.emit('env', env);
}

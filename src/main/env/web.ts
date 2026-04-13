import { store, eventEmitter } from '@/main/web';

import Env from '@/env';

export function changeEnv(enviroment: 'prod' | 'dev') {
  store.set('env', enviroment);
  Env.load(enviroment);
  eventEmitter.emit('env', enviroment);
}

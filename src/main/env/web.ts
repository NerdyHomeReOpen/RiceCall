import { store, eventEmitter } from '@/main/web';

import Env from '@/utils/env';

export function changeEnv(enviroment: 'prod' | 'dev') {
  store.set('env', enviroment);
  Env.load(enviroment);
  eventEmitter.emit('env', enviroment);
}

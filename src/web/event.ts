import { EventEmitter } from 'events';

export const webEventEmitter = new EventEmitter();
webEventEmitter.setMaxListeners(9999);

import { EventEmitter } from 'events';

export const eventEmitter = new EventEmitter();
eventEmitter.setMaxListeners(9999);

import { eventEmitter } from '@/main/web';

export function windowMinimize(popupId?: string) {
  eventEmitter.emit('minimize-popup', popupId);
}

export function windowMaximize() {
  eventEmitter.emit('maximize-popup');
}

export function windowUnmaximize() {
  eventEmitter.emit('unmaximize-popup');
}

export function windowClose() {
  eventEmitter.emit('close-popup');
}

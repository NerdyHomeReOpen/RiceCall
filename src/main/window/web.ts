import { eventEmitter } from '@/main/web';

export function windowMinimize(popupId?: string): void {
  eventEmitter.emit('minimize-popup', popupId);
}

export function windowMaximize(): void {
  eventEmitter.emit('maximize-popup');
}

export function windowUnmaximize(): void {
  eventEmitter.emit('unmaximize-popup');
}

export function windowClose(): void {
  eventEmitter.emit('close-popup');
}

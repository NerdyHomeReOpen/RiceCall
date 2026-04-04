import { store, eventEmitter, getRegion } from '@/main/web';

export function getLanguage() {
  return store.get('language');
}

export function setLanguage(language: string = getRegion()) {
  store.set('language', language);
  eventEmitter.emit('language', language);
}

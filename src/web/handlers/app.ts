import { eventEmitter, store } from '@/web/main';

import Logger from '@/logger';

export function dontShowDisclaimerNextTime(enable: boolean = false) {
  store.set('dontShowDisclaimer', enable);
}

export function serverSelect(data: { serverDisplayId: string; serverId: string; timestamp: number }) {
  eventEmitter.emit('server-select', data);
}

export async function checkForUpdates() {
  new Logger('System').info(`Check for updates only available in desktop version`);
}

import { eventEmitter, store } from '@/main/web';

import Logger from '@/utils/logger';

export function hideDisclaimerNextTime(enable: boolean = false): void {
  store.set('isDisclaimerHidden', enable);
}

export function serverSelect(data: { serverDisplayId: string; serverId: string; timestamp: number }): void {
  eventEmitter.emit('server-select', data);
}

export async function checkForUpdates(): Promise<void> {
  new Logger('SYSTEM').info(`Check for updates only available in desktop version`);
}

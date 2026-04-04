import Logger from '@/logger';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function setTrayTitle(_title: string) {
  new Logger('System').info(`Set tray title only available in desktop version`);
}

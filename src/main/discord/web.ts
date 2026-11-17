import Logger from '@/utils/logger';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function updateDiscordPresence(_presence: unknown): void {
  new Logger('SYSTEM').info(`Update presence only available in desktop version`);
}

import Logger from '@/logger';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function updateDiscordPresence(_presence: unknown) {
  new Logger('System').info(`Update presence only available in desktop version`);
}

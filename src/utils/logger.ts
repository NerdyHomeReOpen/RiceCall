import { isMain, isRenderer } from '@/utils/platform';

type LoggerType = {
  info: (...messages: string[]) => void;
  warn: (...messages: string[]) => void;
  error: (...messages: string[]) => void;
};

let logger: LoggerType | null = null;

async function loadLogger() {
  logger = console;

  if (isMain()) {
    const createdRequire = await import(/* webpackIgnore: true */ 'module').then((module) => module.createRequire).then((createRequire) => createRequire(import.meta.url));
    logger = createdRequire('electron-log').default;
  } else if (isRenderer()) {
    logger = window.electronLog ?? console;
  }
}

loadLogger();

/**
 * Logger class
 * @param origin - The origin of the log
 * @example
 * const logger = new Logger('MyLogger')
 * logger.info('Hello, world!')
 * logger.warn('Warning!')
 * logger.error('Error!')
 * logger.command('Command!')
 * logger.success('Success!')
 */
export default class Logger {
  private origin: string;

  constructor(origin: string) {
    this.origin = origin;
  }

  static async load() {
    loadLogger();
  }

  info(...messages: string[]) {
    if (!logger) return;
    logger.info(`[${this.origin}] ${messages.join(' ')}`);
  }

  command(...messages: string[]) {
    if (!logger) return;
    logger.info(`[${this.origin}] ${messages.join(' ')}`);
  }

  success(...messages: string[]) {
    if (!logger) return;
    logger.info(`[${this.origin}] ${messages.join(' ')}`);
  }

  warn(...messages: string[]) {
    if (!logger) return;
    logger.warn(`[${this.origin}] ${messages.join(' ')}`);
  }

  error(...messages: string[]) {
    if (!logger) return;
    logger.error(`[${this.origin}] ${messages.join(' ')}`);
  }
}

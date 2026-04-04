import { isMain, isRenderer } from '@/utils/platform';

type LoggerType = {
  info: (...messages: string[]) => void;
  warn: (...messages: string[]) => void;
  error: (...messages: string[]) => void;
};

let logger: LoggerType | null = null;

async function loadLogger() {
  if (isMain()) {
    const createdRequire = await import(/* webpackIgnore: true */ 'module').then((module) => module.createRequire).then((createRequire) => createRequire(import.meta.url));
    logger = createdRequire('electron-log').default;
  } else if (isRenderer()) {
    logger = window.electronLog ?? console;
  } else {
    logger = console;
  }
}

loadLogger();

/**
 * Logger class
 * @param origin - The origin of the log
 */
export class Logger {
  private origin: string;

  constructor(origin: string) {
    this.origin = origin;
  }

  info(...messages: string[]) {
    logger?.info(`[${this.origin}] ${messages.join(' ')}`);
  }

  command(...messages: string[]) {
    logger?.info(`[${this.origin}] ${messages.join(' ')}`);
  }

  success(...messages: string[]) {
    logger?.info(`[${this.origin}] ${messages.join(' ')}`);
  }

  warn(...messages: string[]) {
    logger?.warn(`[${this.origin}] ${messages.join(' ')}`);
  }

  error(...messages: string[]) {
    logger?.error(`[${this.origin}] ${messages.join(' ')}`);
  }
}

export default Logger;

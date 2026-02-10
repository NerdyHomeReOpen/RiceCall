import { isMain, isRenderer } from '@/platform/isElectron';

type LoggerType = {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

let logger: LoggerType | null = null;

if (isMain()) {
  const createdRequire = await import(/* webpackIgnore: true */ 'module').then((module) => module.createRequire).then((createRequire) => createRequire(import.meta.url));
  logger = createdRequire('electron-log').default;
} else if (isRenderer()) {
  logger = window.require('electron-log/renderer');
} else {
  logger = console;
}

/**
 * Logger class
 * @param origin - The origin of the log
 */
export class Logger {
  private origin: string;

  constructor(origin: string) {
    this.origin = origin;
  }

  /**
   * Log an info message
   * @param message - The message to log
   */
  info(message: string) {
    logger?.info(`[${this.origin}] ${message}`);
  }

  /**
   * Log a command message
   * @param message - The message to log
   */
  command(message: string) {
    logger?.info(`[${this.origin}] ${message}`);
  }

  /**
   * Log a success message
   * @param message - The message to log
   */
  success(message: string) {
    logger?.info(`[${this.origin}] ${message}`);
  }

  /**
   * Log a warning message
   * @param message - The message to log
   */
  warn(message: string) {
    logger?.warn(`[${this.origin}] ${message}`);
  }

  /**
   * Log an error message
   * @param message - The message to log
   */
  error(message: string) {
    logger?.error(`[${this.origin}] ${message}`);
  }
}

export default Logger;

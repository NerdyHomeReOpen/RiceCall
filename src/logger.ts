/* eslint-disable @typescript-eslint/no-explicit-any */
import { isMain, isRenderer } from '@/platform/isElectron';

let logger: any = null;

if (isMain()) {
  import(/* webpackIgnore: true */ 'module')
    .then((module) => module.createRequire)
    .then((createRequire) => {
      const require = createRequire(import.meta.url);
      logger = require('electron-log').default;
    });
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
    logger.info(`[${this.origin}] ${message}`);
  }

  /**
   * Log a command message
   * @param message - The message to log
   */
  command(message: string) {
    logger.info(`[${this.origin}] ${message}`);
  }

  /**
   * Log a success message
   * @param message - The message to log
   */
  success(message: string) {
    logger.info(`[${this.origin}] ${message}`);
  }

  /**
   * Log a warning message
   * @param message - The message to log
   */
  warn(message: string) {
    logger.warn(`[${this.origin}] ${message}`);
  }

  /**
   * Log an error message
   * @param message - The message to log
   */
  error(message: string) {
    logger.error(`[${this.origin}] ${message}`);
  }
}

export default Logger;

import log from 'electron-log';

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
    log.info(`[${this.origin}] ${message}`);
  }

  /**
   * Log a command message
   * @param message - The message to log
   */
  command(message: string) {
    log.info(`[${this.origin}] ${message}`);
  }

  /**
   * Log a success message
   * @param message - The message to log
   */
  success(message: string) {
    log.info(`[${this.origin}] ${message}`);
  }

  /**
   * Log a warning message
   * @param message - The message to log
   */
  warn(message: string) {
    log.warn(`[${this.origin}] ${message}`);
  }

  /**
   * Log an error message
   * @param message - The message to log
   */
  error(message: string) {
    log.error(`[${this.origin}] ${message}`);
  }
}

export default Logger;

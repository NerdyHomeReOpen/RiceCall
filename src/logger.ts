/* eslint-disable @typescript-eslint/no-explicit-any */
import { isElectron } from '@/platform/isElectron';

// Lazy-load electron-log to avoid bundling fs/path in web builds
let electronLog: any = null;

if (isElectron()) {
  try {
    electronLog = (window as any).require('electron-log');
  } catch {}
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

  private get log() {
    return electronLog || console;
  }

  /**
   * Log an info message
   * @param message - The message to log
   */
  info(message: string) {
    this.log.info(`[${this.origin}] ${message}`);
  }

  /**
   * Log a command message
   * @param message - The message to log
   */
  command(message: string) {
    this.log.info(`[${this.origin}] ${message}`);
  }

  /**
   * Log a success message
   * @param message - The message to log
   */
  success(message: string) {
    this.log.info(`[${this.origin}] ${message}`);
  }

  /**
   * Log a warning message
   * @param message - The message to log
   */
  warn(message: string) {
    this.log.warn(`[${this.origin}] ${message}`);
  }

  /**
   * Log an error message
   * @param message - The message to log
   */
  error(message: string) {
    this.log.error(`[${this.origin}] ${message}`);
  }
}

export default Logger;

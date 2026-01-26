import chalk from 'chalk';

type ElectronLogLike = {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

const isElectronRenderer = typeof window !== 'undefined' && typeof (window as unknown as { require?: unknown }).require === 'function';

let log: ElectronLogLike = {
  info: () => {},
  warn: () => {},
  error: () => {},
};

if (isElectronRenderer) {
  try {
    // Use Electron's `window.require` so this module never gets bundled into the pure-web build.
    log = (window as unknown as { require: (id: string) => unknown }).require('electron-log/renderer') as ElectronLogLike;
  } catch {
    // ignore
  }
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
    log.info(`[${this.origin}] ${message}`);
    if (process.env.NODE_ENV === 'development') console.log(`${chalk.gray(new Date().toLocaleString())} ${chalk.cyan(`[${this.origin}]`)} ${message}`);
  }

  /**
   * Log a command message
   * @param message - The message to log
   */
  command(message: string) {
    log.info(`[${this.origin}] ${message}`);
    if (process.env.NODE_ENV === 'development') console.log(`${chalk.gray(new Date().toLocaleString())} ${chalk.hex('#F3CCF3')(`[${this.origin}]`)} ${message}`);
  }

  /**
   * Log a success message
   * @param message - The message to log
   */
  success(message: string) {
    log.info(`[${this.origin}] ${message}`);
    if (process.env.NODE_ENV === 'development') console.log(`${chalk.gray(new Date().toLocaleString())} ${chalk.green(`[${this.origin}]`)} ${message}`);
  }

  /**
   * Log a warning message
   * @param message - The message to log
   */
  warn(message: string) {
    log.warn(`[${this.origin}] ${message}`);
    if (process.env.NODE_ENV === 'development') console.warn(`${chalk.gray(new Date().toLocaleString())} ${chalk.yellow(`[${this.origin}]`)} ${message}`);
  }

  /**
   * Log an error message
   * @param message - The message to log
   */
  error(message: string) {
    log.error(`[${this.origin}] ${message}`);
    if (process.env.NODE_ENV === 'development') console.error(`${chalk.gray(new Date().toLocaleString())} ${chalk.red(`[${this.origin}]`)} ${message}`);
  }
}

export default Logger;

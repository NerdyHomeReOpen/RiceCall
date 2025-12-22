import chalk from 'chalk';

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
    if (process.env.NODE_ENV === 'development') console.log(`${chalk.gray(new Date().toLocaleString())} ${chalk.cyan(`[${this.origin}]`)} ${message}`);
  }

  /**
   * Log a command message
   * @param message - The message to log
   */
  command(message: string) {
    if (process.env.NODE_ENV === 'development') console.log(`${chalk.gray(new Date().toLocaleString())} ${chalk.hex('#F3CCF3')(`[${this.origin}]`)} ${message}`);
  }

  /**
   * Log a success message
   * @param message - The message to log
   */
  success(message: string) {
    if (process.env.NODE_ENV === 'development') console.log(`${chalk.gray(new Date().toLocaleString())} ${chalk.green(`[${this.origin}]`)} ${message}`);
  }

  /**
   * Log a warning message
   * @param message - The message to log
   */
  warn(message: string) {
    if (process.env.NODE_ENV === 'development') console.warn(`${chalk.gray(new Date().toLocaleString())} ${chalk.yellow(`[${this.origin}]`)} ${message}`);
  }

  /**
   * Log an error message
   * @param message - The message to log
   */
  error(message: string) {
    if (process.env.NODE_ENV === 'development') console.error(`${chalk.gray(new Date().toLocaleString())} ${chalk.red(`[${this.origin}]`)} ${message}`);
  }
}

export default Logger;

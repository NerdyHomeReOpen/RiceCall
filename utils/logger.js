/* eslint-disable @typescript-eslint/no-require-imports */
const chalk = require('chalk');

// Logger
module.exports = class Logger {
  constructor(origin) {
    this.origin = origin;
  }

  info(message) {
    console.log(
      `${chalk.gray(new Date().toLocaleString())} ${chalk.cyan(
        `[${this.origin}]`,
      )}${chalk.magenta(`(${getCallerFile()})`)} ${message}`,
    );
  }

  command(message) {
    console.log(
      `${chalk.gray(new Date().toLocaleString())} ${chalk.hex('#F3CCF3')(
        `[${this.origin}]`,
      )}${chalk.magenta(`(${getCallerFile()})`)} ${message}`,
    );
  }

  success(message) {
    console.log(
      `${chalk.gray(new Date().toLocaleString())} ${chalk.green(
        `[${this.origin}]`,
      )}${chalk.magenta(`(${getCallerFile()})`)} ${message}`,
    );
  }

  warn(message) {
    console.warn(
      `${chalk.gray(new Date().toLocaleString())} ${chalk.yellow(
        `[${this.origin}]`,
      )}${chalk.magenta(`(${getCallerFile()})`)} ${message}`,
    );
  }

  error(message) {
    console.error(
      `${chalk.gray(new Date().toLocaleString())} ${chalk.red(
        `[${this.origin}]`,
      )}${chalk.magenta(`(${getCallerFile()}:${getCallerLine()})`)} ${message}`,
    );
  }
};

const getCallerFile = () => {
  const originalFunc = Error.prepareStackTrace;
  let callerfile;
  try {
    const err = new Error();
    let currentfile;
    Error.prepareStackTrace = function (err, stack) {
      return stack;
    };
    const stack = err.stack;
    currentfile = stack.shift().getFileName().replace(process.cwd(), '');
    while (stack.length) {
      callerfile = stack.shift().getFileName().replace(process.cwd(), '');
      if (currentfile !== callerfile) break;
    }
  } catch (e) {}
  Error.prepareStackTrace = originalFunc;
  return callerfile;
};

const getCallerLine = () => {
  const originalFunc = Error.prepareStackTrace;
  let callerline;
  try {
    const err = new Error();
    let currentline;
    Error.prepareStackTrace = function (err, stack) {
      return stack;
    };
    const stack = err.stack;
    currentline = stack.shift().getLineNumber();
    while (stack.length) {
      callerline = stack.shift().getLineNumber();
      if (currentline !== callerline) break;
    }
  } catch (e) {}
  Error.prepareStackTrace = originalFunc;
  return callerline;
};

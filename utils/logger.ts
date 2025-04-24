import chalk from 'chalk';

// Logger
export default class Logger {
  private origin: string;

  constructor(origin: string) {
    this.origin = origin;
  }

  info(message: string) {
    console.log(
      `${chalk.gray(new Date().toLocaleString())} ${chalk.cyan(
        `[${this.origin}]`,
      )}${chalk.magenta(`(${getCallerFile()})`)} ${message}`,
    );
  }

  command(message: string) {
    console.log(
      `${chalk.gray(new Date().toLocaleString())} ${chalk.hex('#F3CCF3')(
        `[${this.origin}]`,
      )}${chalk.magenta(`(${getCallerFile()})`)} ${message}`,
    );
  }

  success(message: string) {
    console.log(
      `${chalk.gray(new Date().toLocaleString())} ${chalk.green(
        `[${this.origin}]`,
      )}${chalk.magenta(`(${getCallerFile()})`)} ${message}`,
    );
  }

  warn(message: string) {
    console.warn(
      `${chalk.gray(new Date().toLocaleString())} ${chalk.yellow(
        `[${this.origin}]`,
      )}${chalk.magenta(`(${getCallerFile()})`)} ${message}`,
    );
  }

  error(message: string) {
    console.error(
      `${chalk.gray(new Date().toLocaleString())} ${chalk.red(
        `[${this.origin}]`,
      )}${chalk.magenta(`(${getCallerFile()}:${getCallerLine()})`)} ${message}`,
    );
  }
}

const getCallerFile = () => {
  const originalFunc = Error.prepareStackTrace;

  try {
    const err = new Error();

    Error.prepareStackTrace = function (
      _: Error,
      stackTraces: NodeJS.CallSite[],
    ) {
      return stackTraces;
    };

    const stack = err.stack as unknown as NodeJS.CallSite[];
    const currentfile = stack?.[0]?.getFileName()?.replace(process.cwd(), '');

    for (let i = 1; i < stack.length; i++) {
      const callerfile = stack[i]?.getFileName()?.replace(process.cwd(), '');
      if (callerfile && callerfile !== currentfile) return callerfile;
    }
  } catch (e) {
    console.log(e);
  } finally {
    Error.prepareStackTrace = originalFunc;
  }

  return undefined;
};

const getCallerLine = () => {
  const originalFunc = Error.prepareStackTrace;
  try {
    const err = new Error();

    Error.prepareStackTrace = function (
      _: Error,
      stackTraces: NodeJS.CallSite[],
    ) {
      return stackTraces;
    };

    const stack = err.stack as unknown as NodeJS.CallSite[];
    const currentline = stack?.[0]?.getLineNumber();

    for (let i = 1; i < stack.length; i++) {
      const callerline = stack[i]?.getLineNumber();
      if (callerline && callerline !== currentline) return callerline;
    }
  } catch (e) {
    console.log(e);
  } finally {
    Error.prepareStackTrace = originalFunc;
  }

  return undefined;
};

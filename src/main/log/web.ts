import Logger from '@/logger';

export function logInfo(...args: string[]) {
  new Logger('System').info(args.join(' '));
}

export function logWarn(...args: string[]) {
  new Logger('System').warn(args.join(' '));
}

export function logError(...args: string[]) {
  new Logger('System').error(args.join(' '));
}

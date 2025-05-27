import StandardizedError from '@/error';

export default class TooManyFailedAttemptsError extends StandardizedError {
  constructor(part: string) {
    super({
      name: 'TooManyFailedAttemptsError',
      message: '嘗試次數過多，請重新請求重設連結',
      part: part,
      tag: 'TOO_MANY_FAILED_ATTEMPTS',
      statusCode: 429,
    });
  }
}

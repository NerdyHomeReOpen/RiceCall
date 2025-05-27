import StandardizedError from '@/error';

export default class InvalidOrExpiredResetTokenError extends StandardizedError {
  constructor(part: string) {
    super({
      name: 'InvalidOrExpiredResetTokenError',
      message: '無效或已過期的重設令牌',
      part: part,
      tag: 'INVALID_OR_EXPIRED_RESET_TOKEN',
      statusCode: 400,
    });
  }
}

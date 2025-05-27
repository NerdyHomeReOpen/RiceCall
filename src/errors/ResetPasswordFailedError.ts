import StandardizedError from '@/error';

export default class ResetPasswordFailedError extends StandardizedError {
  constructor(message: string = '重設密碼失敗，請稍後再試') {
    super({
      name: 'ServerError',
      message: message,
      part: 'RESET_PASSWORD',
      tag: 'SERVER_ERROR',
      statusCode: 500,
    });
  }
}

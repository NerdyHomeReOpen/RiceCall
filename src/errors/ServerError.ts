import StandardizedError from '@/error';

export default class ServerError extends StandardizedError {
  constructor(part: string, message: string = '伺服器錯誤，請稍後再試') {
    super({
      name: 'ServerError',
      message: message,
      part: part,
      tag: 'SERVER_ERROR',
      statusCode: 500,
    });
  }
}

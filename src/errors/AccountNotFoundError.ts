import StandardizedError from '@/error';

export default class AccountNotFoundError extends StandardizedError {
  constructor(part: string) {
    super({
      name: 'AccountNotFoundError',
      message: '帳號不存在',
      part: part,
      tag: 'ACCOUNT_NOT_FOUND',
      statusCode: 404,
    });
  }
}

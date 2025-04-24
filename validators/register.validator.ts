// Error
import StandardizedError from '@/error';

// Database
import Database from '@/database';

export default class RegisterValidator {
  constructor(
    private account: string,
    private password: string,
    private username: string,
  ) {
    this.account = account;
    this.password = password;
    this.username = username;
  }

  async validate() {
    try {
      if (!this.account || !this.password) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '無效的帳號或密碼',
          part: 'REGISTER',
          tag: 'INVALID_ACCOUNT_OR_PASSWORD',
          statusCode: 401,
        });
      }

      if (!this.username) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '無效的用戶名稱',
          part: 'REGISTER',
          tag: 'INVALID_USERNAME',
          statusCode: 401,
        });
      }

      if (this.account.length < 4) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '帳號長度不能小於4個字符',
          part: 'REGISTER',
          tag: 'ACCOUNT_TOO_SHORT',
          statusCode: 401,
        });
      }

      if (this.account.length > 16) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '帳號長度不能超過16個字符',
          part: 'REGISTER',
          tag: 'ACCOUNT_TOO_LONG',
          statusCode: 401,
        });
      }

      if (!/^[a-zA-Z0-9]+$/.test(this.account)) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '帳號只能包含英文字母和數字',
          part: 'REGISTER',
          tag: 'ACCOUNT_INVALID',
          statusCode: 401,
        });
      }

      if (this.password.length < 8) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '密碼長度不能小於8個字符',
          part: 'REGISTER',
          tag: 'PASSWORD_TOO_SHORT',
          statusCode: 401,
        });
      }

      if (this.password.length > 20) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '密碼長度不能超過20個字符',
          part: 'REGISTER',
          tag: 'PASSWORD_TOO_LONG',
          statusCode: 401,
        });
      }

      if (!/^[a-zA-Z0-9@$!%*#?&]+$/.test(this.password)) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '密碼只能包含英文字母、數字和特殊字符(@$!%*#?&)',
          part: 'REGISTER',
          tag: 'PASSWORD_INVALID',
          statusCode: 401,
        });
      }

      if (this.username.length < 1) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '暱稱不可為空',
          part: 'REGISTER',
          tag: 'NICKNAME_MISSING',
          statusCode: 401,
        });
      }

      if (this.username.length > 32) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '暱稱不能超過32個字符',
          part: 'REGISTER',
          tag: 'NICKNAME_TOO_LONG',
          statusCode: 401,
        });
      }

      if (!/^[A-Za-z0-9\u4e00-\u9fa5]+$/.test(this.username)) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '暱稱只能包含英文字母、數字和中文',
          part: 'REGISTER',
          tag: 'NICKNAME_INVALID',
          statusCode: 401,
        });
      }

      const data = await Database.get.account(this.account);
      if (data) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '帳號已存在',
          part: 'REGISTER',
          tag: 'ACCOUNT_ALREADY_EXISTS',
          statusCode: 401,
        });
      }
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `驗證註冊資料時發生預期外的錯誤: ${error.message}`,
        part: 'REGISTER',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}

import bcrypt from 'bcrypt';

// Error
import StandardizedError from '@/error';

// Database
import Database from '@/database';

export default class LoginValidator {
  constructor(private account: string, private password: string) {
    this.account = account;
    this.password = password;
  }

  async validate() {
    try {
      if (!this.account || !this.password) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '無效的帳號或密碼',
          part: 'LOGIN',
          tag: 'INVALID_ACCOUNT_OR_PASSWORD',
          statusCode: 401,
        });
      }

      const data = await Database.get.account(this.account);
      if (!data) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '帳號或密碼錯誤',
          part: 'LOGIN',
          tag: 'INVALID_ACCOUNT_OR_PASSWORD',
          statusCode: 401,
        });
      }

      const isPasswordVerified = await bcrypt.compare(
        this.password,
        data.password,
      );
      if (!isPasswordVerified) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '帳號或密碼錯誤',
          part: 'LOGIN',
          tag: 'INVALID_ACCOUNT_OR_PASSWORD',
          statusCode: 401,
        });
      }

      const user = await Database.get.user(data.userId);
      if (!user) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '用戶不存在',
          part: 'LOGIN',
          tag: 'USER_NOT_FOUND',
          statusCode: 404,
        });
      }

      return {
        userId: user.userId,
      };
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `驗證登入資料時發生預期外的錯誤: ${error.message}`,
        part: 'LOGIN',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}

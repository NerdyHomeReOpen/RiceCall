import { z } from 'zod';
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
      const loginSchema = z
        .object({
          account: z.string(),
          password: z.string(),
        })
        .strict();

      const result = loginSchema.safeParse({
        account: this.account,
        password: this.password,
      });

      if (!result.success) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: `驗證資料失敗: ${result.error.message}`,
          part: 'LOGIN',
          tag: 'INVALID_DATA',
          statusCode: 401,
        });
      }

      const data = await Database.get.account(result.data.account);
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
        result.data.password,
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
          message: '帳號或密碼錯誤',
          part: 'LOGIN',
          tag: 'INVALID_ACCOUNT_OR_PASSWORD',
          statusCode: 401,
        });
      }

      return user.userId;
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

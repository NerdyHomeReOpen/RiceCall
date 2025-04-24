import { z } from 'zod';

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
      const registerSchema = z
        .object({
          account: z.string().min(4).max(16),
          password: z
            .string()
            .min(8)
            .max(20)
            .regex(/^[a-zA-Z0-9@$!%*#?&]+$/),
          username: z
            .string()
            .min(1)
            .max(32)
            .regex(/^[A-Za-z0-9\u4e00-\u9fa5]+$/),
        })
        .strict();

      const result = registerSchema.safeParse({
        account: this.account,
        password: this.password,
        username: this.username,
      });

      if (!result.success) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: `驗證資料失敗: ${result.error.message}`,
          part: 'REGISTER',
          tag: 'INVALID_DATA',
          statusCode: 401,
        });
      }

      const exist = await Database.get.account(result.data.account);
      if (exist) {
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

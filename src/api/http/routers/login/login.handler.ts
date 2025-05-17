import bcrypt from 'bcrypt';

// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';
import { generateJWT } from '@/utils/jwt';

// Http
import { ResponseType } from '@/api/http';
import { RequestHandler } from '@/handler';

// Database
import { database } from '@/index';

// Schemas
import { LoginSchema } from '@/api/http/routers/login/login.schema';

// Middleware
import { DataValidator } from '@/middleware/data.validator';

export const LoginHandler: RequestHandler = {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { account, password } = await DataValidator.validate(
        LoginSchema,
        data,
        'LOGIN',
      );

      const accountData = await database.get.account(account);
      if (!accountData) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '帳號或密碼錯誤',
          part: 'LOGIN',
          tag: 'INVALID_ACCOUNT_OR_PASSWORD',
          statusCode: 401,
        });
      }

      const isPasswordVerified = await bcrypt.compare(
        password,
        accountData.password,
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

      const user = await database.get.user(accountData.userId);
      if (!user) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '帳號或密碼錯誤',
          part: 'LOGIN',
          tag: 'INVALID_ACCOUNT_OR_PASSWORD',
          statusCode: 401,
        });
      }

      await database.set.user(accountData.userId, {
        lastActiveAt: Date.now(),
      });

      const token = generateJWT({ userId: accountData.userId });

      return {
        statusCode: 200,
        message: 'success',
        data: {
          token,
        },
      };
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('Login').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `登入失敗，請稍後再試`,
          part: 'LOGIN',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      return {
        statusCode: error.statusCode,
        message: 'error',
        data: { error },
      };
    }
  },
};

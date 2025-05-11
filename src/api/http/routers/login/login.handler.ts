import bcrypt from 'bcrypt';

// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';
import { generateJWT } from '@/utils/jwt';

// Types
import { ResponseType } from '@/api/http';

// Schemas
import { LoginSchema } from '@/api/http/routers/login/login.schema';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Database
import { database } from '@/index';

export const LoginHandler = {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { account, password } = await new DataValidator(
        LoginSchema,
        'LOGIN',
      ).validate(data);

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
        error = new StandardizedError({
          name: 'ServerError',
          message: `登入時發生預期外的錯誤: ${error.message}`,
          part: 'LOGIN',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      new Logger('Login').error(error.message);
      return {
        statusCode: error.statusCode,
        message: 'error',
        data: { error },
      };
    }
  },
};

import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Types
import { ResponseType } from '@/api/http';

// Schemas
import { RegisterSchema } from '@/api/http/routers/register/register.schema';

// Middleware
import { DataValidator } from '@/middleware/data.validator';

// Database
import { database } from '@/index';

// Config
import { serverConfig } from '@/config';

export const RegisterHandler = {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { account, password, username } = await DataValidator.validate(
        RegisterSchema,
        data,
        'REGISTER',
      );

      // Check if account already exists
      const accountExists = await database.get.account(account);
      if (accountExists) {
        throw new StandardizedError({
          name: 'ServerError',
          message: '帳號已存在',
          part: 'REGISTER',
          tag: 'ACCOUNT_EXISTS',
          statusCode: 400,
        });
      }

      // Create user data
      const userId = uuidv4();
      await database.set.user(userId, {
        name: username,
        avatar: userId,
        avatarUrl: `${serverConfig.url}:${serverConfig.port}/images/userAvatars/`,
        createdAt: Date.now(),
      });

      // Create account password list
      const hashedPassword = await bcrypt.hash(password, 10);
      await database.set.account(account, {
        password: hashedPassword,
        userId: userId,
      });

      return {
        statusCode: 200,
        message: 'success',
        data: { account },
      };
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `註冊時發生預期外的錯誤: ${error.message}`,
          part: 'REGISTER',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      new Logger('Register').error(error.message);
      return {
        statusCode: error.statusCode,
        message: 'error',
        data: { error },
      };
    }
  },
};

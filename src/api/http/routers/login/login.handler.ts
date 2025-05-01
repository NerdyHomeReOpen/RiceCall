// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Types
import { ResponseType } from '@/api/http';

// Handler
import { HttpHandler } from '@/api/http/base.handler';

// Schemas
import { LoginSchema } from '@/api/http/routers/login/login.schema';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Services
import LoginService from '@/api/http/routers/login/login.service';

export class LoginHandler extends HttpHandler {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { account, password } = await new DataValidator(
        LoginSchema,
        'LOGIN',
      ).validate(data);

      const result = await new LoginService(account, password).use();

      return {
        statusCode: 200,
        message: 'success',
        data: result,
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
  }
}

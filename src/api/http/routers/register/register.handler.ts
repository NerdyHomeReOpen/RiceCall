// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Types
import { ResponseType } from '@/api/http';

// Handler
import { HttpHandler } from '@/api/http/base.handler';

// Schemas
import { RegisterSchema } from '@/api/http/routers/register/register.schema';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Services
import RegisterService from '@/api/http/routers/register/register.service';

export class RegisterHandler extends HttpHandler {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { account, password, username } = await new DataValidator(
        RegisterSchema,
        'REGISTER',
      ).validate(data);

      const result = await new RegisterService(
        account,
        password,
        username,
      ).use();

      return {
        statusCode: 200,
        message: 'success',
        data: result,
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
  }
}

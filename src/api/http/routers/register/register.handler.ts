// Error
import StandardizedError from '@/error';

// Http
import { HttpHandler, ResponseType } from '@/api/http';

// Schemas
import { RegisterSchema } from '@/api/http/routers/register/register.schema';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Services
import RegisterService from '@/api/http/routers/register/register.service';

export class RegisterHandler extends HttpHandler {
  async handle(): Promise<ResponseType | null> {
    let body = '';

    this.req.on('data', (chunk) => {
      body += chunk.toString();
    });

    this.req.on('end', async () => {
      try {
        const data = JSON.parse(body);

        const validated = await new DataValidator(
          RegisterSchema,
          'REGISTER',
        ).validate(data);

        const result = await new RegisterService(
          validated.account,
          validated.password,
          validated.username,
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

        return {
          statusCode: error.statusCode,
          message: 'error',
          data: { error: error.message },
        };
      }
    });
    return null;
  }
}

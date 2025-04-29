// Error
import StandardizedError from '@/error';

// Types
import { HttpHandler, ResponseType } from '@/api/http';

// Validaters
import LoginValidator from './login.validator';

// Services
import LoginService from './login.service';

export class LoginHandler extends HttpHandler {
  async handle(): Promise<ResponseType | null> {
    let body = '';

    this.req.on('data', (chunk) => {
      body += chunk.toString();
    });

    this.req.on('end', async () => {
      try {
        const data = JSON.parse(body);

        const validated = await new LoginValidator(data).validate();

        const result = await new LoginService(validated.account).use();

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

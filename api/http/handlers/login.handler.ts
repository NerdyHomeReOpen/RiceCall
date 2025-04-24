import { IncomingMessage } from 'http';

// Error
import StandardizedError from '@/error';

// Types
import { ResponseType } from '@/api/http';

// Validaters
import LoginValidator from '@/validators/login.validator';

// Services
import LoginService from '@/services/login.service';

export default class LoginHandler {
  constructor(private req: IncomingMessage) {
    this.req = req;
  }

  async handle(): Promise<ResponseType | null> {
    let body = '';
    this.req.on('data', (chunk) => {
      body += chunk.toString();
    });
    this.req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const { account, password } = data;

        const { userId } = await new LoginValidator(
          account,
          password,
        ).validate();

        const { token } = await new LoginService(userId).use();

        return {
          statusCode: 200,
          message: '登入成功',
          data: { token: token },
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
          message: '登入失敗',
          data: { error: error.message },
        };
      }
    });
    return null;
  }
}

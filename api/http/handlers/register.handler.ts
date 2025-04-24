import { IncomingMessage } from 'http';

// Error
import StandardizedError from '@/error';

// Types
import { ResponseType } from '@/api/http';

// Validaters
import RegisterValidator from '@/validators/register.validator';

// Services
import RegisterService from '@/services/register.service';

export default class RegisterHandler {
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
        const { account, password, username } = data;

        await new RegisterValidator(account, password, username).validate();

        await new RegisterService(account, password, username).use();

        return {
          statusCode: 200,
          message: '註冊成功',
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

        return {
          statusCode: error.statusCode,
          message: '註冊失敗',
          data: { error: error.message },
        };
      }
    });
    return null;
  }
}

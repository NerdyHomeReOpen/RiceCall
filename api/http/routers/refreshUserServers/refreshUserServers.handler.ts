// Error
import StandardizedError from '@/error';

// Types
import { HttpHandler, ResponseType } from '@/api/http';

// Validators
import RefreshUserServersValidator from './refreshUserServers.validator';

// Services
import RefreshUserServersService from './refreshUserServers.service';

export class RefreshUserServersHandler extends HttpHandler {
  async handle(): Promise<ResponseType | null> {
    let body = '';

    this.req.on('data', (chunk) => {
      body += chunk.toString();
    });

    this.req.on('end', async () => {
      try {
        const data = JSON.parse(body);

        const validated = await new RefreshUserServersValidator(
          data,
        ).validate();

        const result = await new RefreshUserServersService(
          validated.userId,
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
            message: `刷新用戶伺服器資料時發生預期外的錯誤: ${error.message}`,
            part: 'REFRESHUSERSERVERS',
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

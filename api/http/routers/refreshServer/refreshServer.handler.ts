// Error
import StandardizedError from '@/error';

// Types
import { HttpHandler, ResponseType } from '@/api/http';

// Validators
import RefreshServerValidator from './refreshServer.validator';

// Services
import RefreshServerService from './refreshServer.service';

export class RefreshServerHandler extends HttpHandler {
  async handle(): Promise<ResponseType | null> {
    let body = '';

    this.req.on('data', (chunk) => {
      body += chunk.toString();
    });

    this.req.on('end', async () => {
      try {
        const data = JSON.parse(body);

        const validated = await new RefreshServerValidator(data).validate();

        const result = await new RefreshServerService(validated.serverId).use();

        return {
          statusCode: 200,
          message: 'success',
          data: result,
        };
      } catch (error: any) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError({
            name: 'ServerError',
            message: `刷新群組資料時發生預期外的錯誤: ${error.message}`,
            part: 'REFRESHSERVER',
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

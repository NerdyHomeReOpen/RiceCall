import { IncomingMessage } from 'http';

// Error
import StandardizedError from '@/error';

// Types
import { ResponseType } from '@/api/http';

// Validators
import RefreshServerValidator from './refreshServer.validator';

// Services
import RefreshServerService from './refreshServer.service';

export default class RefreshServerHandler {
  constructor(private req: IncomingMessage) {
    this.req = req;
  }

  async refreshServer(): Promise<ResponseType | null> {
    let body = '';
    this.req.on('data', (chunk) => {
      body += chunk.toString();
    });
    this.req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const { serverId } = data;

        await new RefreshServerValidator(serverId).validate();

        const result = await new RefreshServerService(serverId).use();

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

import { IncomingMessage } from 'http';

// Error
import StandardizedError from '@/error';

// Types
import { ResponseType } from '@/api/http';

// Validators
import RefreshServerMembersValidator from './refreshServerMembers.validator';

// Services
import RefreshServerMembersService from './refreshServerMembers.service';

export default class RefreshServerMembersHandler {
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

        const validated = await new RefreshServerMembersValidator(
          data,
        ).validate();

        const result = await new RefreshServerMembersService(
          validated.serverId,
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
            message: `刷新伺服器成員資料時發生預期外的錯誤: ${error.message}`,
            part: 'REFRESHSERVERMEMBERS',
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

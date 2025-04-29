// Error
import StandardizedError from '@/error';

// Types
import { ResponseType } from '@/api/http';

// Handler
import { HttpHandler } from '@/api/http/base.handler';

// Schemas
import { RefreshServerMembersSchema } from '@/api/http/routers/refreshServerMembers/refreshServerMembers.schema';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Services
import RefreshServerMembersService from '@/api/http/routers/refreshServerMembers/refreshServerMembers.service';

export class RefreshServerMembersHandler extends HttpHandler {
  async handle(): Promise<ResponseType | null> {
    let body = '';

    this.req.on('data', (chunk) => {
      body += chunk.toString();
    });

    this.req.on('end', async () => {
      try {
        const data = JSON.parse(body);

        const validated = await new DataValidator(
          RefreshServerMembersSchema,
          'REFRESHSERVERMEMBERS',
        ).validate(data);

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

// Error
import StandardizedError from '@/error';

// Http
import { HttpHandler, ResponseType } from '@/api/http';

// Schemas
import { RefreshMemberSchema } from './refreshMember.schema';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Services
import RefreshMemberService from './refreshMember.service';

export class RefreshMemberHandler extends HttpHandler {
  async handle(): Promise<ResponseType | null> {
    let body = '';

    this.req.on('data', (chunk) => {
      body += chunk.toString();
    });

    this.req.on('end', async () => {
      try {
        const data = JSON.parse(body);

        const validated = await new DataValidator(
          RefreshMemberSchema,
          'REFRESHMEMBER',
        ).validate(data);

        const result = await new RefreshMemberService(
          validated.userId,
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
            message: `刷新成員資料時發生預期外的錯誤: ${error.message}`,
            part: 'REFRESHMEMBER',
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

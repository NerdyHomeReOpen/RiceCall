// Error
import StandardizedError from '@/error';

// Http
import { HttpHandler, ResponseType } from '@/api/http';

// Schemas
import { RefreshUserFriendGroupsSchema } from './refreshUserFriendGroups.schema';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Services
import RefreshUserFriendGroupsService from './refreshUserFriendGroups.service';

export class RefreshUserFriendGroupsHandler extends HttpHandler {
  async handle(): Promise<ResponseType | null> {
    let body = '';

    this.req.on('data', (chunk) => {
      body += chunk.toString();
    });

    this.req.on('end', async () => {
      try {
        const data = JSON.parse(body);

        const validated = await new DataValidator(
          RefreshUserFriendGroupsSchema,
          'REFRESHUSERFRIENDGROUPS',
        ).validate(data);

        const result = await new RefreshUserFriendGroupsService(
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
            message: `刷新用戶好友群組資料時發生預期外的錯誤: ${error.message}`,
            part: 'REFRESHUSERFRIENDGROUPS',
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

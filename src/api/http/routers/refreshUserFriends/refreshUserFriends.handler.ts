// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Types
import { ResponseType } from '@/api/http';

// Handler
import { HttpHandler } from '@/api/http/base.handler';

// Schemas
import { RefreshUserFriendsSchema } from '@/api/http/routers/refreshUserFriends/refreshUserFriends.schema';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Services
import RefreshUserFriendsService from '@/api/http/routers/refreshUserFriends/refreshUserFriends.service';

export class RefreshUserFriendsHandler extends HttpHandler {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { userId } = await new DataValidator(
        RefreshUserFriendsSchema,
        'REFRESHUSERFRIENDS',
      ).validate(data);

      const result = await new RefreshUserFriendsService(userId).use();

      return {
        statusCode: 200,
        message: 'success',
        data: result,
      };
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `刷新使用者好友資料時發生預期外的錯誤: ${error.message}`,
          part: 'REFRESHUSERFRIENDS',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      new Logger('RefreshUserFriends').error(error);
      return {
        statusCode: error.statusCode,
        message: 'error',
        data: { error },
      };
    }
  }
}

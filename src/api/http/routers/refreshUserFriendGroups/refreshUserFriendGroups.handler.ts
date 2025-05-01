// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Types
import { ResponseType } from '@/api/http';

// Handler
import { HttpHandler } from '@/api/http/base.handler';

// Schemas
import { RefreshUserFriendGroupsSchema } from '@/api/http/routers/refreshUserFriendGroups/refreshUserFriendGroups.schema';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Services
import RefreshUserFriendGroupsService from '@/api/http/routers/refreshUserFriendGroups/refreshUserFriendGroups.service';

export class RefreshUserFriendGroupsHandler extends HttpHandler {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { userId } = await new DataValidator(
        RefreshUserFriendGroupsSchema,
        'REFRESHUSERFRIENDGROUPS',
      ).validate(data);

      const result = await new RefreshUserFriendGroupsService(userId).use();

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

      new Logger('RefreshUserFriendGroups').error(error);
      return {
        statusCode: error.statusCode,
        message: 'error',
        data: { error },
      };
    }
  }
}

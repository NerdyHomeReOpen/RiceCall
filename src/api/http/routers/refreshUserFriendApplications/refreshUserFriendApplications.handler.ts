// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Types
import { ResponseType } from '@/api/http';

// Handler
import { HttpHandler } from '@/api/http/base.handler';

// Schemas
import { RefreshUserFriendApplicationsSchema } from '@/api/http/routers/refreshUserFriendApplications/refreshUserFriendApplications.schema';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Services
import RefreshUserFriendApplicationsService from '@/api/http/routers/refreshUserFriendApplications/refreshUserFriendApplications.service';

export class RefreshUserFriendApplicationsHandler extends HttpHandler {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { userId } = await new DataValidator(
        RefreshUserFriendApplicationsSchema,
        'REFRESHUSERFRIENDAPPLICATIONS',
      ).validate(data);

      const result = await new RefreshUserFriendApplicationsService(
        userId,
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
          message: `刷新用戶好友申請資料時發生預期外的錯誤: ${error.message}`,
          part: 'REFRESHUSERFRIENDAPPLICATIONS',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      new Logger('RefreshUserFriendApplications').error(error);
      return {
        statusCode: error.statusCode,
        message: 'error',
        data: { error },
      };
    }
  }
}

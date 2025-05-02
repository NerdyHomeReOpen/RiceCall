// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Types
import { ResponseType } from '@/api/http';

// Handler
import { HttpHandler } from '@/api/http/base.handler';

// Schemas
import { RefreshFriendSchema } from './refreshFriend.schema';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Services
import { RefreshFriendService } from './refreshFriend.service';

export class RefreshFriendHandler extends HttpHandler {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { userId, targetId } = await new DataValidator(
        RefreshFriendSchema,
        'REFRESHFRIEND',
      ).validate(data);

      const result = await new RefreshFriendService(userId, targetId).use();

      return {
        statusCode: 200,
        message: 'success',
        data: result,
      };
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `刷新好友資料時發生預期外的錯誤: ${error.message}`,
          part: 'REFRESHFRIEND',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      new Logger('RefreshFriend').error(error.message);
      return {
        statusCode: error.statusCode,
        message: 'error',
        data: { error },
      };
    }
  }
}

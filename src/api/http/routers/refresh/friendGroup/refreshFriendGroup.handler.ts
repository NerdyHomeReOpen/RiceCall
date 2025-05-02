// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Types
import { ResponseType } from '@/api/http';

// Handler
import { HttpHandler } from '@/api/http/base.handler';

// Schemas
import { RefreshFriendGroupSchema } from './refreshFriendGroup.schema';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Services
import { RefreshFriendGroupService } from './refreshFriendGroup.service';

export class RefreshFriendGroupHandler extends HttpHandler {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { friendGroupId } = await new DataValidator(
        RefreshFriendGroupSchema,
        'REFRESHFRIENDGROUP',
      ).validate(data);

      const result = await new RefreshFriendGroupService(friendGroupId).use();

      return {
        statusCode: 200,
        message: 'success',
        data: result,
      };
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `刷新好友群組資料時發生預期外的錯誤: ${error.message}`,
          part: 'REFRESHFRIENDGROUP',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      new Logger('RefreshFriendGroup').error(error.message);
      return {
        statusCode: error.statusCode,
        message: 'error',
        data: { error },
      };
    }
  }
}

// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Http
import { ResponseType } from '@/api/http';
import { RequestHandler } from '@/handler';

// Database
import { database } from '@/index';

// Schemas
import { RefreshFriendGroupSchema } from './refreshFriendGroup.schema';

// Middleware
import { DataValidator } from '@/middleware/data.validator';

export const RefreshFriendGroupHandler: RequestHandler = {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { friendGroupId } = await DataValidator.validate(
        RefreshFriendGroupSchema,
        data,
        'REFRESHFRIENDGROUP',
      );

      const friendGroup = await database.get.friendGroup(friendGroupId);

      return {
        statusCode: 200,
        message: 'success',
        data: friendGroup,
      };
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('RefreshFriendGroup').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `刷新好友群組資料失敗，請稍後再試`,
          part: 'REFRESHFRIENDGROUP',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      return {
        statusCode: error.statusCode,
        message: 'error',
        data: { error },
      };
    }
  },
};

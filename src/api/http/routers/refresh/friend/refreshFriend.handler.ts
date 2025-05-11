// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Types
import { ResponseType } from '@/api/http';

// Schemas
import { RefreshFriendSchema } from './refreshFriend.schema';

// Middleware
import { DataValidator } from '@/middleware/data.validator';

// Database
import { database } from '@/index';

export const RefreshFriendHandler = {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { userId, targetId } = await DataValidator.validate(
        RefreshFriendSchema,
        data,
        'REFRESHFRIEND',
      );

      const friend = await database.get.friend(userId, targetId);

      return {
        statusCode: 200,
        message: 'success',
        data: friend,
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
  },
};

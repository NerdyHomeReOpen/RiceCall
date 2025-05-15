// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Types
import { ResponseType } from '@/api/http';

// Schemas
import { RefreshFriendGroupSchema } from './refreshFriendGroup.schema';

// Middleware
import { DataValidator } from '@/middleware/data.validator';

// Database
import { database } from '@/index';

export const RefreshFriendGroupHandler = {
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
        error = new StandardizedError({
          name: 'ServerError',
          message: `刷新好友群組資料時發生預期外的錯誤，請稍後再試`,
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
  },
};

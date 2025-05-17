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
import { RefreshFriendApplicationSchema } from './refreshFriendApplication.schema';

// Middleware
import { DataValidator } from '@/middleware/data.validator';

export const RefreshFriendApplicationHandler: RequestHandler = {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { senderId, receiverId } = await DataValidator.validate(
        RefreshFriendApplicationSchema,
        data,
        'REFRESHFRIENDAPPLICATION',
      );

      const friendApplication = await database.get.friendApplication(
        senderId,
        receiverId,
      );

      return {
        statusCode: 200,
        message: 'success',
        data: friendApplication,
      };
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('RefreshFriendApplication').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `刷新好友申請資料失敗，請稍後再試`,
          part: 'REFRESHFRIENDAPPLICATION',
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

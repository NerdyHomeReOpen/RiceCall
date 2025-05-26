// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Socket
import SocketServer from '@/api/socket';

// Http
import { ResponseType } from '@/api/http';
import { RequestHandler } from '@/handler';

// Database
import { database } from '@/index';

// Schemas
import { RefreshFriendSchema } from './refreshFriend.schema';

// Middleware
import { DataValidator } from '@/middleware/data.validator';

export const RefreshFriendHandler: RequestHandler = {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { userId, targetId } = await DataValidator.validate(
        RefreshFriendSchema,
        data,
        'REFRESHFRIEND',
      );

      const friend = {
        ...(await database.get.friend(userId, targetId)),
        online: SocketServer.hasSocket(targetId),
      };

      return {
        statusCode: 200,
        message: 'success',
        data: friend,
      };
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('RefreshFriend').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `刷新好友資料失敗，請稍後再試`,
          part: 'REFRESHFRIEND',
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

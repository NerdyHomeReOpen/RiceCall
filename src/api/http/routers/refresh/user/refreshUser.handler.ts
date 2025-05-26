// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Socket
import SocketServer from '@/api/socket';

// Http
import { RequestHandler } from '@/handler';
import { ResponseType } from '@/api/http';

// Database
import { database } from '@/index';

// Schemas
import { RefreshUserSchema } from './refreshUser.schema';

// Middleware
import { DataValidator } from '@/middleware/data.validator';

export const RefreshUserHandler: RequestHandler = {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { userId } = await DataValidator.validate(
        RefreshUserSchema,
        data,
        'REFRESHUSER',
      );

      const user = await database.get.user(userId);

      return {
        statusCode: 200,
        message: 'success',
        data: user,
      };
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('RefreshUser').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `刷新使用者資料失敗，請稍後再試`,
          part: 'REFRESHUSER',
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

export const RefreshUserFriendApplicationsHandler: RequestHandler = {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { userId } = await DataValidator.validate(
        RefreshUserSchema,
        data,
        'REFRESHUSERFRIENDAPPLICATIONS',
      );

      const userFriendApplications = await database.get.userFriendApplications(
        userId,
      );

      return {
        statusCode: 200,
        message: 'success',
        data: userFriendApplications,
      };
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('RefreshUserFriendApplications').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `刷新用戶好友申請資料失敗，請稍後再試`,
          part: 'REFRESHUSERFRIENDAPPLICATIONS',
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

export const RefreshUserFriendGroupsHandler: RequestHandler = {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { userId } = await DataValidator.validate(
        RefreshUserSchema,
        data,
        'REFRESHUSERFRIENDGROUPS',
      );

      const userFriendGroups = await database.get.userFriendGroups(userId);

      return {
        statusCode: 200,
        message: 'success',
        data: userFriendGroups,
      };
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('RefreshUserFriendGroups').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `刷新用戶好友群組資料失敗，請稍後再試`,
          part: 'REFRESHUSERFRIENDGROUPS',
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

export const RefreshUserFriendsHandler: RequestHandler = {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { userId } = await DataValidator.validate(
        RefreshUserSchema,
        data,
        'REFRESHUSERFRIENDS',
      );

      const userFriends = (await database.get.userFriends(userId)).map((friend) => {
        const isFriendOnline = SocketServer.hasSocket(friend.userId);
        return {
          ...friend,
          online: isFriendOnline,
        }
      });

      return {
        statusCode: 200,
        message: 'success',
        data: userFriends,
      };
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('RefreshUserFriends').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `刷新使用者好友資料失敗，請稍後再試`,
          part: 'REFRESHUSERFRIENDS',
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

export const RefreshUserServersHandler: RequestHandler = {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { userId } = await DataValidator.validate(
        RefreshUserSchema,
        data,
        'REFRESHUSERSERVERS',
      );

      const userServers = await database.get.userServers(userId);

      return {
        statusCode: 200,
        message: 'success',
        data: userServers,
      };
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('RefreshUserServers').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `刷新用戶伺服器資料失敗，請稍後再試`,
          part: 'REFRESHUSERSERVERS',
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

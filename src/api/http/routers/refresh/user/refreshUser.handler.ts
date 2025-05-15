// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Types
import { ResponseType } from '@/api/http';

// Schemas
import { RefreshUserSchema } from './refreshUser.schema';

// Middleware
import { DataValidator } from '@/middleware/data.validator';

// Database
import { database } from '@/index';
import { Handler } from '@/handler';

export const RefreshUserHandler : Handler = {
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
        error = new StandardizedError({
          name: 'ServerError',
          message: `刷新使用者資料時發生預期外的錯誤: ${error.message}`,
          part: 'REFRESHUSER',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      new Logger('RefreshUser').error(error.message);
      return {
        statusCode: error.statusCode,
        message: 'error',
        data: { error },
      };
    }
  },
};

export const RefreshUserFriendApplicationsHandler : Handler = {
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
        error = new StandardizedError({
          name: 'ServerError',
          message: `刷新用戶好友申請資料時發生預期外的錯誤: ${error.message}`,
          part: 'REFRESHUSERFRIENDAPPLICATIONS',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      new Logger('RefreshUserFriendApplications').error(error.message);
      return {
        statusCode: error.statusCode,
        message: 'error',
        data: { error },
      };
    }
  },
};

export const RefreshUserFriendGroupsHandler : Handler = {
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
        error = new StandardizedError({
          name: 'ServerError',
          message: `刷新用戶好友群組資料時發生預期外的錯誤: ${error.message}`,
          part: 'REFRESHUSERFRIENDGROUPS',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      new Logger('RefreshUserFriendGroups').error(error.message);
      return {
        statusCode: error.statusCode,
        message: 'error',
        data: { error },
      };
    }
  },
};

export const RefreshUserFriendsHandler : Handler = {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { userId } = await DataValidator.validate(
        RefreshUserSchema,
        data,
        'REFRESHUSERFRIENDS',
      );

      const userFriends = await database.get.userFriends(userId);

      return {
        statusCode: 200,
        message: 'success',
        data: userFriends,
      };
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `刷新使用者好友資料時發生預期外的錯誤: ${error.message}`,
          part: 'REFRESHUSERFRIENDS',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      new Logger('RefreshUserFriends').error(error.message);
      return {
        statusCode: error.statusCode,
        message: 'error',
        data: { error },
      };
    }
  },
};

export const RefreshUserServersHandler : Handler = {
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
        error = new StandardizedError({
          name: 'ServerError',
          message: `刷新用戶伺服器資料時發生預期外的錯誤: ${error.message}`,
          part: 'REFRESHUSERSERVERS',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      new Logger('RefreshUserServers').error(error.message);
      return {
        statusCode: error.statusCode,
        message: 'error',
        data: { error },
      };
    }
  },
};

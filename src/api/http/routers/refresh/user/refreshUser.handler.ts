// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Types
import { ResponseType } from '@/api/http';

// Handler
import { HttpHandler } from '@/api/http/base.handler';

// Schemas
import { RefreshUserSchema } from './refreshUser.schema';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Services
import {
  RefreshUserService,
  RefreshUserFriendApplicationsService,
  RefreshUserFriendGroupsService,
  RefreshUserFriendsService,
  RefreshUserServersService,
} from './refreshUser.service';

export class RefreshUserHandler extends HttpHandler {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { userId } = await new DataValidator(
        RefreshUserSchema,
        'REFRESHUSER',
      ).validate(data);

      const result = await new RefreshUserService(userId).use();

      return {
        statusCode: 200,
        message: 'success',
        data: result,
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
  }
}

export class RefreshUserFriendApplicationsHandler extends HttpHandler {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { userId } = await new DataValidator(
        RefreshUserSchema,
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

      new Logger('RefreshUserFriendApplications').error(error.message);
      return {
        statusCode: error.statusCode,
        message: 'error',
        data: { error },
      };
    }
  }
}

export class RefreshUserFriendGroupsHandler extends HttpHandler {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { userId } = await new DataValidator(
        RefreshUserSchema,
        'REFRESHUSERFRIENDGROUPS',
      ).validate(data);

      const result = await new RefreshUserFriendGroupsService(userId).use();

      return {
        statusCode: 200,
        message: 'success',
        data: result,
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
  }
}

export class RefreshUserFriendsHandler extends HttpHandler {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { userId } = await new DataValidator(
        RefreshUserSchema,
        'REFRESHUSERFRIENDS',
      ).validate(data);

      const result = await new RefreshUserFriendsService(userId).use();

      return {
        statusCode: 200,
        message: 'success',
        data: result,
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
  }
}

export class RefreshUserServersHandler extends HttpHandler {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { userId } = await new DataValidator(
        RefreshUserSchema,
        'REFRESHUSERSERVERS',
      ).validate(data);

      const result = await new RefreshUserServersService(userId).use();

      return {
        statusCode: 200,
        message: 'success',
        data: result,
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
  }
}

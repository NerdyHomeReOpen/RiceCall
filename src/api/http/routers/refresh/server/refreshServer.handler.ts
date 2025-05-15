// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Types
import { ResponseType } from '@/api/http';

// Schemas
import { RefreshServerSchema } from './refreshServer.schema';

// Middleware
import { DataValidator } from '@/middleware/data.validator';

// Database
import { database } from '@/index';
import { RequestHandler } from '@/handler';

export const RefreshServerHandler: RequestHandler = {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { serverId } = await DataValidator.validate(
        RefreshServerSchema,
        data,
        'REFRESHSERVER',
      );

      const server = await database.get.server(serverId);

      return {
        statusCode: 200,
        message: 'success',
        data: server,
      };
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('RefreshServer').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `刷新群組資料失敗，請稍後再試`,
          part: 'REFRESHSERVER',
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

export const RefreshServerChannelsHandler: RequestHandler = {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { serverId } = await DataValidator.validate(
        RefreshServerSchema,
        data,
        'REFRESHSERVERCHANNELS',
      );

      const serverChannels = await database.get.serverChannels(serverId);

      return {
        statusCode: 200,
        message: 'success',
        data: serverChannels,
      };
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('RefreshServerChannels').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `刷新伺服器頻道資料失敗，請稍後再試`,
          part: 'REFRESHSERVERCHANNELS',
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

export const RefreshServerMemberApplicationsHandler: RequestHandler = {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { serverId } = await DataValidator.validate(
        RefreshServerSchema,
        data,
        'REFRESHSERVERMEMBERAPPLICATIONS',
      );

      const serverMemberApplications =
        await database.get.serverMemberApplications(serverId);

      return {
        statusCode: 200,
        message: 'success',
        data: serverMemberApplications,
      };
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('RefreshServerMemberApplications').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `刷新伺服器成員申請資料失敗，請稍後再試`,
          part: 'REFRESHSERVERMEMBERAPPLICATIONS',
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

export const RefreshServerMembersHandler: RequestHandler = {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { serverId } = await DataValidator.validate(
        RefreshServerSchema,
        data,
        'REFRESHSERVERMEMBERS',
      );

      const serverMembers = await database.get.serverMembers(serverId);

      return {
        statusCode: 200,
        message: 'success',
        data: serverMembers,
      };
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('RefreshServerMembers').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `刷新伺服器成員資料失敗，請稍後再試`,
          part: 'REFRESHSERVERMEMBERS',
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

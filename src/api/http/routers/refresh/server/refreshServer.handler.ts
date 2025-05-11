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

export const RefreshServerHandler = {
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
        error = new StandardizedError({
          name: 'ServerError',
          message: `刷新群組資料時發生預期外的錯誤: ${error.message}`,
          part: 'REFRESHSERVER',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      new Logger('RefreshServer').error(error.message);
      return {
        statusCode: error.statusCode,
        message: 'error',
        data: { error },
      };
    }
  },
};

export const RefreshServerChannelsHandler = {
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
        error = new StandardizedError({
          name: 'ServerError',
          message: `刷新伺服器頻道資料時發生預期外的錯誤: ${error.message}`,
          part: 'REFRESHSERVERCHANNELS',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      new Logger('RefreshServerChannels').error(error.message);
      return {
        statusCode: error.statusCode,
        message: 'error',
        data: { error },
      };
    }
  },
};

export const RefreshServerMemberApplicationsHandler = {
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
        error = new StandardizedError({
          name: 'ServerError',
          message: `刷新伺服器成員申請資料時發生預期外的錯誤: ${error.message}`,
          part: 'REFRESHSERVERMEMBERAPPLICATIONS',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      new Logger('RefreshServerMemberApplications').error(error.message);
      return {
        statusCode: error.statusCode,
        message: 'error',
        data: { error },
      };
    }
  },
};

export const RefreshServerMembersHandler = {
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
        error = new StandardizedError({
          name: 'ServerError',
          message: `刷新伺服器成員資料時發生預期外的錯誤: ${error.message}`,
          part: 'REFRESHSERVERMEMBERS',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      new Logger('RefreshServerMembers').error(error.message);
      return {
        statusCode: error.statusCode,
        message: 'error',
        data: { error },
      };
    }
  },
};

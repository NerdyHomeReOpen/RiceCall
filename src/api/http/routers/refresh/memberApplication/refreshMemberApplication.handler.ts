// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Http
import { RequestHandler } from '@/handler';
import { ResponseType } from '@/api/http';

// Database
import { database } from '@/index';

// Schemas
import { RefreshMemberApplicationSchema } from './refreshMemberApplication.schema';

// Middleware
import { DataValidator } from '@/middleware/data.validator';

export const RefreshMemberApplicationHandler: RequestHandler = {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { userId, serverId } = await DataValidator.validate(
        RefreshMemberApplicationSchema,
        data,
        'REFRESHMEMBERAPPLICATION',
      );

      const memberApplication = await database.get.memberApplication(
        userId,
        serverId,
      );

      return {
        statusCode: 200,
        message: 'success',
        data: memberApplication,
      };
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('RefreshMemberApplication').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `刷新成員申請資料失敗，請稍後再試`,
          part: 'REFRESHMEMBERAPPLICATION',
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

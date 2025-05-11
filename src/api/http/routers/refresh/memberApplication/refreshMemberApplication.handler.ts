// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Types
import { ResponseType } from '@/api/http';

// Schemas
import { RefreshMemberApplicationSchema } from './refreshMemberApplication.schema';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Database
import { database } from '@/index';

export const RefreshMemberApplicationHandler = {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { userId, serverId } = await new DataValidator(
        RefreshMemberApplicationSchema,
        'REFRESHMEMBERAPPLICATION',
      ).validate(data);

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
        error = new StandardizedError({
          name: 'ServerError',
          message: `刷新成員申請資料時發生預期外的錯誤: ${error.message}`,
          part: 'REFRESHMEMBERAPPLICATION',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      new Logger('RefreshMemberApplication').error(error.message);
      return {
        statusCode: error.statusCode,
        message: 'error',
        data: { error },
      };
    }
  },
};

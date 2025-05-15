// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Types
import { ResponseType } from '@/api/http';

// Schemas
import { RefreshMemberSchema } from './refreshMember.schema';

// Middleware
import { DataValidator } from '@/middleware/data.validator';

// Database
import { database } from '@/index';
import { Handler } from '@/handler';

export const RefreshMemberHandler: Handler = {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { userId, serverId } = await DataValidator.validate(
        RefreshMemberSchema,
        data,
        'REFRESHMEMBER',
      );

      const member = await database.get.member(userId, serverId);

      return {
        statusCode: 200,
        message: 'success',
        data: member,
      };
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `刷新成員資料時發生預期外的錯誤，請稍後再試`,
          part: 'REFRESHMEMBER',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      new Logger('RefreshMember').error(error.message);
      return {
        statusCode: error.statusCode,
        message: 'error',
        data: { error },
      };
    }
  },
};

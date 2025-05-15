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
import { RequestHandler } from '@/handler';

export const RefreshMemberHandler: RequestHandler = {
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
        new Logger('RefreshMember').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `刷新成員資料失敗，請稍後再試`,
          part: 'REFRESHMEMBER',
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

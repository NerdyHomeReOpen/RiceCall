// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Types
import { ResponseType } from '@/api/http';

// Handler
import { HttpHandler } from '@/api/http/base.handler';

// Schemas
import { RefreshMemberSchema } from './refreshMember.schema';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Services
import { RefreshMemberService } from './refreshMember.service';

export class RefreshMemberHandler extends HttpHandler {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { userId, serverId } = await new DataValidator(
        RefreshMemberSchema,
        'REFRESHMEMBER',
      ).validate(data);

      const result = await new RefreshMemberService(userId, serverId).use();

      return {
        statusCode: 200,
        message: 'success',
        data: result,
      };
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `刷新成員資料時發生預期外的錯誤: ${error.message}`,
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
  }
}

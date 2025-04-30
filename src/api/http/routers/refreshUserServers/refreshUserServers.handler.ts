// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Types
import { ResponseType } from '@/api/http';

// Handler
import { HttpHandler } from '@/api/http/base.handler';

// Schemas
import { RefreshUserServersSchema } from '@/api/http/routers/refreshUserServers/refreshUserServers.schema';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Services
import RefreshUserServersService from '@/api/http/routers/refreshUserServers/refreshUserServers.service';

export class RefreshUserServersHandler extends HttpHandler {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { userId } = await new DataValidator(
        RefreshUserServersSchema,
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

      new Logger('RefreshUserServers').error(error);
      return {
        statusCode: error.statusCode,
        message: 'error',
        data: { error: error.message },
      };
    }
  }
}

// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Types
import { ResponseType } from '@/api/http';

// Handler
import { HttpHandler } from '@/api/http/base.handler';

// Schemas
import { RefreshServerChannelsSchema } from '@/api/http/routers/refreshServerChannels/refreshServerChannels.schema';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Services
import RefreshServerChannelsService from '@/api/http/routers/refreshServerChannels/refreshServerChannels.service';

export class RefreshServerChannelsHandler extends HttpHandler {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { serverId } = await new DataValidator(
        RefreshServerChannelsSchema,
        'REFRESHSERVERCHANNELS',
      ).validate(data);

      const result = await new RefreshServerChannelsService(serverId).use();

      return {
        statusCode: 200,
        message: 'success',
        data: result,
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

      new Logger('RefreshServerChannels').error(error);
      return {
        statusCode: error.statusCode,
        message: 'error',
        data: { error },
      };
    }
  }
}

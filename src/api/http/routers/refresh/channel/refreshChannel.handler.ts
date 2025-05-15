// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Types
import { ResponseType } from '@/api/http';

// Schemas
import { RefreshChannelSchema } from './refreshChannel.schema';

// Middleware
import { DataValidator } from '@/middleware/data.validator';

// Database
import { database } from '@/index';
import { RequestHandler } from '@/handler';

export const RefreshChannelHandler: RequestHandler = {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { channelId } = await DataValidator.validate(
        RefreshChannelSchema,
        data,
        'REFRESHCHANNEL',
      );

      const channel = await database.get.channel(channelId);

      return {
        statusCode: 200,
        message: 'success',
        data: channel,
      };
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('RefreshChannel').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `刷新頻道資料失敗，請稍後再試`,
          part: 'REFRESHCHANNEL',
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

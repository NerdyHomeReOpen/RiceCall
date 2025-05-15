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
import { Handler } from '@/handler';

export const RefreshChannelHandler : Handler = {
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
        error = new StandardizedError({
          name: 'ServerError',
          message: `刷新頻道資料時發生預期外的錯誤: ${error.message}`,
          part: 'REFRESHCHANNEL',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      new Logger('RefreshChannel').error(error.message);
      return {
        statusCode: error.statusCode,
        message: 'error',
        data: { error },
      };
    }
  },
};

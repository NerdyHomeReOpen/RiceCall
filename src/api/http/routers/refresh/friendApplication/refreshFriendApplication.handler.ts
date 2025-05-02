// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Types
import { ResponseType } from '@/api/http';

// Handler
import { HttpHandler } from '@/api/http/base.handler';

// Schemas
import { RefreshFriendApplicationSchema } from './refreshFriendApplication.schema';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Services
import { RefreshFriendApplicationService } from './refreshFriendApplication.service';

export class RefreshFriendApplicationHandler extends HttpHandler {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { senderId, receiverId } = await new DataValidator(
        RefreshFriendApplicationSchema,
        'REFRESHFRIENDAPPLICATION',
      ).validate(data);

      const result = await new RefreshFriendApplicationService(
        senderId,
        receiverId,
      ).use();

      return {
        statusCode: 200,
        message: 'success',
        data: result,
      };
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `刷新好友申請資料時發生預期外的錯誤: ${error.message}`,
          part: 'REFRESHFRIENDAPPLICATION',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      new Logger('RefreshFriendApplication').error(error.message);
      return {
        statusCode: error.statusCode,
        message: 'error',
        data: { error },
      };
    }
  }
}

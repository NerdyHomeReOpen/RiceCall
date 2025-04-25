import { IncomingMessage } from 'http';

// Error
import StandardizedError from '@/error';

// Types
import { ResponseType } from '@/api/http';

// Validators
import RefreshFriendValidator from './refreshFriend.validator';

// Services
import RefreshFriendService from './refreshFriend.service';

export default class RefreshFriendHandler {
  constructor(private req: IncomingMessage) {
    this.req = req;
  }

  async handle(): Promise<ResponseType | null> {
    let body = '';

    this.req.on('data', (chunk) => {
      body += chunk.toString();
    });

    this.req.on('end', async () => {
      try {
        const data = JSON.parse(body);

        const validated = await new RefreshFriendValidator(data).validate();

        const result = await new RefreshFriendService(
          validated.userId,
          validated.targetId,
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
            message: `刷新好友資料時發生預期外的錯誤: ${error.message}`,
            part: 'REFRESHFRIEND',
            tag: 'SERVER_ERROR',
            statusCode: 500,
          });
        }

        return {
          statusCode: error.statusCode,
          message: 'error',
          data: { error: error.message },
        };
      }
    });
    return null;
  }
}

import { IncomingMessage } from 'http';

// Error
import StandardizedError from '@/error';

// Types
import { ResponseType } from '@/api/http';

// Validators
import RefreshUserFriendApplicationsValidator from './refreshUserFriendApplications.validator';

// Services
import RefreshUserFriendApplicationsService from './refreshUserFriendApplications.service';

export default class RefreshUserFriendApplicationsHandler {
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

        const validated = await new RefreshUserFriendApplicationsValidator(
          data,
        ).validate();

        const result = await new RefreshUserFriendApplicationsService(
          validated.userId,
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
            message: `刷新用戶好友申請資料時發生預期外的錯誤: ${error.message}`,
            part: 'REFRESHUSERFRIENDAPPLICATIONS',
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

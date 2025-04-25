import { IncomingMessage } from 'http';

// Error
import StandardizedError from '@/error';

// Types
import { ResponseType } from '@/api/http';

// Validators
import RefreshUserFriendGroupsValidator from './refreshUserFriendGroups.validator';

// Services
import RefreshUserFriendGroupsService from './refreshUserFriendGroups.service';

export default class RefreshUserFriendGroupsHandler {
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

        const validated = await new RefreshUserFriendGroupsValidator(
          data,
        ).validate();

        const result = await new RefreshUserFriendGroupsService(
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
            message: `刷新用戶好友群組資料時發生預期外的錯誤: ${error.message}`,
            part: 'REFRESHUSERFRIENDGROUPS',
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

import { IncomingMessage } from 'http';

// Error
import StandardizedError from '@/error';

// Types
import { ResponseType } from '@/api/http';

// Services
import UserService from '@/services/user.service';

export default class RefreshHandler {
  constructor(private req: IncomingMessage) {
    this.req = req;
  }

  async refreshUser(): Promise<ResponseType | null> {
    let body = '';
    this.req.on('data', (chunk) => {
      body += chunk.toString();
    });
    this.req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const { userId } = data;
        if (!userId) {
          throw new StandardizedError({
            name: 'ValidationError',
            message: '無效的資料',
            part: 'REFRESHUSER',
            tag: 'DATA_INVALID',
            statusCode: 401,
          });
        }

        const user = await new UserService().getUser(userId);

        return {
          statusCode: 200,
          message: '刷新使用者資料成功',
          data: { user },
        };
      } catch (error: any) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError({
            name: 'ServerError',
            message: `刷新使用者資料時發生預期外的錯誤: ${error.message}`,
            part: 'REFRESHUSER',
            tag: 'SERVER_ERROR',
            statusCode: 500,
          });
        }

        return {
          statusCode: error.statusCode,
          message: '刷新使用者資料失敗',
          data: { error: error.message },
        };
      }
    });
    return null;
  }
}

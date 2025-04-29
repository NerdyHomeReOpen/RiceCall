// Error
import StandardizedError from '@/error';

// Http
import { HttpHandler, ResponseType } from '@/api/http';

// Schemas
import { RefreshFriendGroupSchema } from '@/api/http/routers/refreshFriendGroup/refreshFriendGroup.schema';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Services
import RefreshFriendGroupService from '@/api/http/routers/refreshFriendGroup/refreshFriendGroup.service';

export class RefreshFriendGroupHandler extends HttpHandler {
  async handle(): Promise<ResponseType | null> {
    let body = '';

    this.req.on('data', (chunk) => {
      body += chunk.toString();
    });

    this.req.on('end', async () => {
      try {
        const data = JSON.parse(body);

        const validated = await new DataValidator(
          RefreshFriendGroupSchema,
          'REFRESHFRIENDGROUP',
        ).validate(data);

        const result = await new RefreshFriendGroupService(
          validated.friendGroupId,
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
            message: `刷新好友群組資料時發生預期外的錯誤: ${error.message}`,
            part: 'REFRESHFRIENDGROUP',
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

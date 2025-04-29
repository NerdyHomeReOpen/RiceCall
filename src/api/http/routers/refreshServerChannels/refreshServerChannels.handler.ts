// Error
import StandardizedError from '@/error';

// Http
import { HttpHandler, ResponseType } from '@/api/http';

// Schemas
import { RefreshServerChannelsSchema } from '@/api/http/routers/refreshServerChannels/refreshServerChannels.schema';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Services
import RefreshServerChannelsService from '@/api/http/routers/refreshServerChannels/refreshServerChannels.service';

export class RefreshServerChannelsHandler extends HttpHandler {
  async handle(): Promise<ResponseType | null> {
    let body = '';

    this.req.on('data', (chunk) => {
      body += chunk.toString();
    });

    this.req.on('end', async () => {
      try {
        const data = JSON.parse(body);

        const validated = await new DataValidator(
          RefreshServerChannelsSchema,
          'REFRESHSERVERCHANNELS',
        ).validate(data);

        const result = await new RefreshServerChannelsService(
          validated.serverId,
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
            message: `刷新伺服器頻道資料時發生預期外的錯誤: ${error.message}`,
            part: 'REFRESHSERVERCHANNELS',
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

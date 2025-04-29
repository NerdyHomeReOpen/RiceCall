// Error
import StandardizedError from '@/error';

// Types
import { ResponseType } from '@/api/http';

// Handler
import { HttpHandler } from '@/api/http/base.handler';

// Schemas
import { RefreshServerSchema } from '@/api/http/routers/refreshServer/refreshServer.schema';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Services
import RefreshServerService from '@/api/http/routers/refreshServer/refreshServer.service';

export class RefreshServerHandler extends HttpHandler {
  async handle(): Promise<ResponseType | null> {
    let body = '';

    this.req.on('data', (chunk) => {
      body += chunk.toString();
    });

    this.req.on('end', async () => {
      try {
        const data = JSON.parse(body);

        const validated = await new DataValidator(
          RefreshServerSchema,
          'REFRESHSERVER',
        ).validate(data);

        const result = await new RefreshServerService(validated.serverId).use();

        return {
          statusCode: 200,
          message: 'success',
          data: result,
        };
      } catch (error: any) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError({
            name: 'ServerError',
            message: `刷新群組資料時發生預期外的錯誤: ${error.message}`,
            part: 'REFRESHSERVER',
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

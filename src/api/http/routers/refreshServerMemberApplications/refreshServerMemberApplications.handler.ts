// Error
import StandardizedError from '@/error';

// Types
import { ResponseType } from '@/api/http';

// Handler
import { HttpHandler } from '@/api/http/base.handler';

// Schemas
import { RefreshServerMemberApplicationsSchema } from '@/api/http/routers/refreshServerMemberApplications/refreshServerMemberApplications.schema';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Services
import RefreshServerMemberApplicationsService from '@/api/http/routers/refreshServerMemberApplications/refreshServerMemberApplications.service';

export class RefreshServerMemberApplicationsHandler extends HttpHandler {
  async handle(): Promise<ResponseType | null> {
    let body = '';

    this.req.on('data', (chunk) => {
      body += chunk.toString();
    });

    this.req.on('end', async () => {
      try {
        const data = JSON.parse(body);

        const validated = await new DataValidator(
          RefreshServerMemberApplicationsSchema,
          'REFRESHSERVERMEMBERAPPLICATIONS',
        ).validate(data);

        const result = await new RefreshServerMemberApplicationsService(
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
            message: `刷新伺服器成員申請資料時發生預期外的錯誤: ${error.message}`,
            part: 'REFRESHSERVERMEMBERAPPLICATIONS',
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

// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Types
import { ResponseType } from '@/api/http';

// Handler
import { HttpHandler } from '@/api/http/base.handler';

// Services
import ImagesService from '@/api/http/routers/images/images.service';

export class ImagesHandler extends HttpHandler {
  async handle(data: any): Promise<ResponseType> {
    try {
      const filePath =
        this.req.url?.replace('/images/', '/').split('?')[0].split('/') || [];
      const fileName = filePath.pop() || '__default.png';

      const result = await new ImagesService(filePath, fileName).use();

      return {
        statusCode: 200,
        message: 'success',
        data: result,
      };
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `讀取圖片時發生預期外的錯誤: ${error.message}`,
          part: 'IMAGES',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      new Logger('Images').error(error.message);
      return {
        statusCode: error.statusCode,
        message: 'error',
        data: { error },
      };
    }
  }
}

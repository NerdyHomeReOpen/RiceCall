// Error
import StandardizedError from '@/error';

// Types
import { HttpHandler, ResponseType } from '@/api/http';

// Services
import ImagesService from './images.service';

export class ImagesHandler extends HttpHandler {
  async handle(): Promise<ResponseType | null> {
    this.req.on('end', async () => {
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

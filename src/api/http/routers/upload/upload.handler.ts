// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Types
import { ResponseType } from '@/api/http';

// Handler
import { HttpHandler } from '@/api/http/base.handler';

// Schemas
import { UploadSchema } from '@/api/http/routers/upload/upload.schema';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Services
import UploadService from '@/api/http/routers/upload/upload.service';

export class UploadHandler extends HttpHandler {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { _type, _fileName, _file } = await new DataValidator(
        UploadSchema,
        'UPLOAD',
      ).validate(data);

      const ext = _file.split('.').pop(); // TODO: 修正

      const result = await new UploadService(
        _type,
        _fileName,
        _file,
        ext,
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
          message: `上傳圖片時發生預期外的錯誤: ${error.message}`,
          part: 'UPLOAD',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      new Logger('Upload').error(error.message);
      return {
        statusCode: error.statusCode,
        message: 'error',
        data: { error },
      };
    }
  }
}

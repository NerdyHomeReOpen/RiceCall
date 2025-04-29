import formidable from 'formidable';

// Error
import StandardizedError from '@/error';

// Http
import { HttpHandler, ResponseType } from '@/api/http';

// Schemas
import { UploadSchema } from './upload.schema';

// Middleware
import DataValidator from '@/middleware/data.validator';

// Services
import UploadService from './upload.service';

export class UploadHandler extends HttpHandler {
  async handle(): Promise<ResponseType | null> {
    const form = new formidable.IncomingForm();

    form.parse(this.req, async (err, data) => {
      try {
        if (err) throw new Error(err);

        const validated = await new DataValidator(
          UploadSchema,
          'UPLOAD',
        ).validate(data);

        const result = await new UploadService(
          validated._type,
          validated._fileName,
          validated._file,
          validated.ext,
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

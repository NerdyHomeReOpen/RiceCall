import formidable from 'formidable';

// Error
import StandardizedError from '@/error';

// Types
import { HttpHandler, ResponseType } from '@/api/http';

// Validators
import UploadValidator from './upload.validator';

// Services
import UploadService from './upload.service';

export class UploadHandler extends HttpHandler {
  async handle(): Promise<ResponseType | null> {
    const form = new formidable.IncomingForm();

    form.parse(this.req, async (err, data) => {
      try {
        if (err) throw new Error(err);

        const validated = await new UploadValidator(data).validate();

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

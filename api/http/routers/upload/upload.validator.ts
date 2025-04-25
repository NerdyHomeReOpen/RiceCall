import { z } from 'zod';

// Error
import StandardizedError from '@/error';

// Config
import config from '@/config';

export default class UploadValidator {
  constructor(private data: any) {
    this.data = data;
  }

  async validate() {
    try {
      const uploadSchema = z
        .object({
          _type: z.string(),
          _fileName: z.string(),
          _file: z.string(),
        })
        .strict();

      const result = uploadSchema.safeParse(this.data);

      if (!result.success) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: `驗證資料失敗: ${result.error.message}`,
          part: 'UPLOAD',
          tag: 'INVALID_DATA',
          statusCode: 401,
        });
      }

      const matches = this.data.file.match(/^data:image\/(.*?);base64,/);
      if (!matches) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '無效的檔案',
          part: 'UPLOAD',
          tag: 'INVALID_FILE_TYPE',
          statusCode: 401,
        });
      }

      const ext = matches[1];
      if (!config.mimeTypes[`.${ext}` as keyof typeof config.mimeTypes]) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '無效的檔案類型',
          part: 'UPLOAD',
          tag: 'INVALID_FILE_TYPE',
          statusCode: 401,
        });
      }

      const base64Data = this.data.file.replace(/^data:image\/\w+;base64,/, '');
      const dataBuffer = Buffer.from(base64Data, 'base64');
      if (dataBuffer.length > config.fileSizeLimit) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '檔案大小超過限制 (5MB)',
          part: 'UPLOAD',
          tag: 'FILE_TOO_LARGE',
          statusCode: 401,
        });
      }

      return { ...result.data, ext: ext };
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `驗證資料時發生預期外的錯誤: ${error.message}`,
        part: 'UPLOAD',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}

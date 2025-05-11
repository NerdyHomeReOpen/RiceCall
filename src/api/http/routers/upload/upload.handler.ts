import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Types
import { ResponseType } from '@/api/http';

// Schemas
import { UploadSchema } from '@/api/http/routers/upload/upload.schema';

// Middleware
import { DataValidator } from '@/middleware/data.validator';

// Config
import { appConfig, serverConfig } from '@/config';

export const UploadHandler = {
  async handle(data: any): Promise<ResponseType> {
    try {
      const { _type, _fileName, _file } = await DataValidator.validate(
        UploadSchema,
        data,
        'UPLOAD',
      );

      const { type, fileName, file } = {
        type: _type[0],
        fileName: _fileName[0],
        file: _file[0],
      };

      const directory = (type: string) => {
        switch (type) {
          case 'server':
            return appConfig.serverAvatarDir;
          case 'user':
            return appConfig.userAvatarDir;
          default:
            return appConfig.uploadsDir;
        }
      };

      const matches = file.match(/^data:image\/(.*?);base64,/);
      if (!matches) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '無效的檔案',
          part: 'UPLOAD',
          tag: 'INVALID_FILE_TYPE',
          statusCode: 400,
        });
      }
      const ext = matches[1];
      if (!Object.keys(appConfig.allowedMimeTypes).includes(`.${ext}`)) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '無效的檔案類型',
          part: 'UPLOAD',
          tag: 'INVALID_FILE_TYPE',
          statusCode: 400,
        });
      }
      const fullFileName = `${fileName}.webp`;
      const PrefixFileName = `${appConfig.filePrefix}${fileName}.webp`;
      const filePath = directory(type);
      const fileBase64 = file.split(',')[1];

      const imageBuffer = Buffer.from(fileBase64, 'base64');

      const files = await fs.readdir(filePath);
      const matchingFiles = files.filter(
        (fileName: string) =>
          fileName === fullFileName && !fileName.startsWith('__'),
      );

      await Promise.all(
        matchingFiles.map((fileName) =>
          fs.unlink(path.join(filePath, fileName)).catch((err) => {
            throw new StandardizedError({
              name: 'ServerError',
              message: `刪除圖片失敗: ${err.message}`,
              part: 'UPLOAD',
              tag: 'SERVER_ERROR',
              statusCode: 500,
            });
          }),
        ),
      );

      await sharp(imageBuffer)
        .webp({ quality: 80 })
        .toFile(path.join(filePath, PrefixFileName))
        .catch((err) => {
          throw new StandardizedError({
            name: 'ServerError',
            message: `轉換圖片失敗: ${err.message}`,
            part: 'UPLOAD',
            tag: 'SERVER_ERROR',
            statusCode: 500,
          });
        });

      // Return Image Name Example:
      // "test"

      // Return Image URL Example:
      // 'http://localhost:4500/images/test.jpg'

      return {
        statusCode: 200,
        message: 'success',
        data: {
          avatar: fileName,
          avatarUrl: `${serverConfig.url}/${filePath.replace(
            'uploads',
            'images',
          )}/${fullFileName}`,
        },
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
  },
};

import { IncomingMessage } from 'http';
import path from 'path';
import fs from 'fs/promises';

// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Types
import { ResponseType } from '@/api/http';

// Config
import { appConfig } from '@/config';

const imageCache = new Map<string, Buffer>();

export const ImagesHandler = {
  async handle(req: IncomingMessage): Promise<ResponseType> {
    try {
      const originalPath =
        req.url?.replace('images', 'uploads').split('?')[0].split('/') || [];
      const originalName = originalPath.pop() || '';

      const fileName = originalName
        ? `${appConfig.filePrefix}${originalName}`
        : '__default.webp';

      const filePath = path.join(...originalPath, fileName);

      if (imageCache.has(filePath)) {
        return {
          statusCode: 200,
          message: 'success',
          data: imageCache.get(filePath),
        };
      } else {
        const file = await fs.readFile(filePath).catch((error) => {
          if (error.code === 'ENOENT') {
            throw new StandardizedError({
              name: 'ServerError',
              message: '找不到檔案',
              part: 'GETFILE',
              tag: 'FILE_NOT_FOUND',
              statusCode: 404,
            });
          } else {
            throw new StandardizedError({
              name: 'ServerError',
              message: `讀取檔案失敗: ${error.message}`,
              part: 'GETFILE',
              tag: 'READ_FILE_FAILED',
              statusCode: 500,
            });
          }
        });

        imageCache.set(filePath, file);

        if (imageCache.size > 100) {
          imageCache.delete(imageCache.keys().next().value as string);
        }

        return {
          statusCode: 200,
          message: 'success',
          data: file,
        };
      }
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
  },
};

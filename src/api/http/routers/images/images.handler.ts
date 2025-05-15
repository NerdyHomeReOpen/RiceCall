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
            throw new Error(`Can't find file: ${error.message}`);
          } else {
            throw new Error(`Read file failed: ${error.message}`);
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
          message: `讀取圖片時發生預期外的錯誤，請稍後再試`,
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

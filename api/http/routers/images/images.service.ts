import path from 'path';
import fs from 'fs/promises';

// Error
import StandardizedError from '@/error';

// Systems
import clean from '@/systems/image';

// Config
import config from '@/config';

export default class ImagesService {
  constructor(private filePath: string[], private fileName: string) {
    this.filePath = filePath;
    this.fileName = fileName;
  }

  async use() {
    try {
      const filePath = path.join(
        clean.directory(this.filePath),
        `${config.filePrefix}${this.fileName}`,
      );
      const file = await fs.readFile(filePath);

      return file;
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `讀取圖片時發生預期外的錯誤: ${error.message}`,
        part: 'IMAGES',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}

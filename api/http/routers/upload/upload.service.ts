import fs from 'fs/promises';
import path from 'path';

// Error
import StandardizedError from '@/error';

// Config
import config from '@/config';

// Systems
import clean from '@/systems/image';

export default class UploadService {
  constructor(
    private type: string,
    private fileName: string,
    private file: string,
    private ext: string,
  ) {
    this.type = type;
    this.fileName = fileName;
    this.file = file;
    this.ext = ext;
  }

  async use() {
    try {
      const fullFileName = `${this.fileName}.${this.ext}`;
      const filePath = path.join(
        clean.directory(this.type),
        `${config.filePrefix}${fullFileName}`,
      );

      const files = await fs.readdir(clean.directory(this.type));
      const matchingFiles = files.filter(
        (file: string) =>
          file.startsWith(`${config.filePrefix}${this.fileName}`) &&
          !file.startsWith('__'),
      );

      await Promise.all(
        matchingFiles.map((file) =>
          fs.unlink(path.join(clean.directory(this.type), file)),
        ),
      );

      await fs.writeFile(filePath, this.file);

      // Return Image Example:
      // "test.jpg"

      // Return Image URL Example:
      // 'http://localhost:4500/images/test.jpg'

      return {
        avatar: fullFileName,
        avatarUrl: `${config.serverUrl}/images/${this.type}/${fullFileName}`,
      };
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `上傳圖片時發生預期外的錯誤: ${error.message}`,
        part: 'UPLOAD',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}

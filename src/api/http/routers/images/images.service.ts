import path from 'path';
import fs from 'fs/promises';

// Config
import config from '@/config';

export default class ImagesService {
  constructor(private filePath: string[], private fileName: string) {
    this.filePath = filePath;
    this.fileName = fileName;
  }

  async use() {
    const filePath = path.join(
      __dirname,
      ...this.filePath,
      `${config.filePrefix}${this.fileName}`,
    );
    const file = await fs.readFile(filePath);

    return file;
  }
}

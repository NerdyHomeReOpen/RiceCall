import fs from 'fs/promises';
import path from 'path';

// Config
import config from '@/config';

// Systems
import imageSystem from '@/systems/image';

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
    const fullFileName = `${this.fileName}.${this.ext}`;
    const filePath = path.join(
      imageSystem.directory(this.type),
      `${config.filePrefix}${fullFileName}`,
    );

    const files = await fs.readdir(imageSystem.directory(this.type));
    const matchingFiles = files.filter(
      (file: string) =>
        file.startsWith(`${config.filePrefix}${this.fileName}`) &&
        !file.startsWith('__'),
    );

    await Promise.all(
      matchingFiles.map((file) =>
        fs.unlink(path.join(imageSystem.directory(this.type), file)),
      ),
    );

    await fs.writeFile(filePath, this.file);

    // Return Image Example:
    // "test.jpg"

    // Return Image URL Example:
    // 'http://localhost:4500/images/test.jpg'

    return {
      avatar: fullFileName,
      avatarUrl: `${config.serverUrl}:${config.serverPort}/images/${this.type}/${fullFileName}`,
    };
  }
}

import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import Logger from '../../logger';

export const FileStorage = {
  store: async (buffer: ArrayBuffer, directory: string, filenamePrefix: string, extension: string): Promise<string | null> => {
    try {
      const userDataPath = app.getPath('userData');
      const dirPath = path.join(userDataPath, directory);
      
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      const timestamp = Date.now();
      const fileName = `${filenamePrefix}-${timestamp}.${extension}`;
      const filePath = path.join(dirPath, fileName);
      
      fs.writeFileSync(filePath, Buffer.from(buffer));
      
      // Return local-resource:// URL
      // We only need the relative path from userData, which is directory/fileName
      return `local-resource://${directory}/${fileName}`;
      // eslint-disable-next-line 
    } catch (error: any) {
      new Logger('FileStorage').error(`Electron Storage Error: ${error.message}`);
      return null;
    }
  }
};

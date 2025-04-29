import fs from 'fs/promises';
import path from 'path';

// Config
import globalConfig from '@/config';
import config from './config.json';

// Database
import Database from '@/database';

// Utils
import Logger from '@/utils/logger';

const imageSystem = {
  setup: async () => {
    try {
      // Ensure uploads directory exists
      await fs.mkdir(globalConfig.uploadsDir, { recursive: true });
      await fs.mkdir(globalConfig.serverAvatarDir, { recursive: true });
      await fs.mkdir(globalConfig.userAvatarDir, { recursive: true });
      await fs.mkdir(globalConfig.backupDir, { recursive: true });

      // Set up cleanup interval
      setInterval(() => {
        imageSystem.cleanupServerAvatars().catch((error) => {
          new Logger('ImageSystem').error(
            `Error cleaning up server avatars: ${error.message}`,
          );
        });
        imageSystem.cleanupUserAvatars().catch((error) => {
          new Logger('ImageSystem').error(
            `Error cleaning up user avatars: ${error.message}`,
          );
        });
      }, config.CLEANUP_INTERVAL_MS);

      // Run initial cleanup
      await imageSystem.cleanupServerAvatars();
      await imageSystem.cleanupUserAvatars();

      new Logger('ImageSystem').info(`Cleanup setup complete`);
    } catch (error: any) {
      new Logger('ImageSystem').error(
        `Error setting up cleanup interval: ${error.message}`,
      );
    }
  },

  directory: (type: string) => {
    switch (type) {
      case 'server':
        return path.join(__dirname, globalConfig.serverAvatarDir);
      case 'user':
        return path.join(__dirname, globalConfig.userAvatarDir);
      default:
        return path.join(__dirname, globalConfig.uploadsDir);
    }
  },

  cleanupUserAvatars: async () => {
    try {
      const directory = path.join(__dirname, globalConfig.userAvatarDir);
      const files = await fs.readdir(directory);
      const data = (await Database.get.all('users')) || {};
      const avatarMap: Record<string, boolean> = {};

      Object.values(data).forEach((item: any) => {
        if (item.avatar) {
          avatarMap[`upload-${item.avatar}`] = true;
        }
      });

      const unusedFiles = files.filter((file) => {
        const isValidType = Object.keys(globalConfig.mimeTypes).some((ext) =>
          file.endsWith(ext),
        );
        const isNotReserved = !file.startsWith('__');
        const fileNameWithoutExt = file.split('.')[0];
        const isNotInUse = !avatarMap[fileNameWithoutExt];

        return isValidType && isNotReserved && isNotInUse;
      });

      for (const file of unusedFiles) {
        try {
          await fs.unlink(path.join(directory, file));
          new Logger('ImageSystem').success(
            `Successfully deleted unused user avatar: ${file}`,
          );
        } catch (error: any) {
          new Logger('ImageSystem').error(
            `Error deleting unused user avatar ${file}: ${error.message}`,
          );
        }
      }

      if (unusedFiles.length === 0) {
        new Logger('ImageSystem').info(`No unused user avatars deleted`);
      } else {
        new Logger('ImageSystem').info(
          `Deleted ${unusedFiles.length} unused user avatars`,
        );
      }
    } catch (error: any) {
      new Logger('ImageSystem').error(
        `Avatar cleanup failed: ${error.message}`,
      );
    }
  },

  cleanupServerAvatars: async () => {
    try {
      const directory = path.join(__dirname, globalConfig.serverAvatarDir);
      const files = await fs.readdir(directory);
      const data = (await Database.get.all('servers')) || {};
      const avatarMap: Record<string, boolean> = {};

      Object.values(data).forEach((item: any) => {
        if (item.avatar) {
          avatarMap[`upload-${item.avatar}`] = true;
        }
      });

      const unusedFiles = files.filter((file) => {
        const isValidType = Object.keys(globalConfig.mimeTypes).some((ext) =>
          file.endsWith(ext),
        );
        const isNotReserved = !file.startsWith('__');
        const fileNameWithoutExt = file.split('.')[0];
        const isNotInUse = !avatarMap[fileNameWithoutExt];

        return isValidType && isNotReserved && isNotInUse;
      });

      for (const file of unusedFiles) {
        try {
          await fs.unlink(path.join(directory, file));
          new Logger('ImageSystem').success(
            `Successfully deleted unused server avatar: ${file}`,
          );
        } catch (error: any) {
          new Logger('ImageSystem').error(
            `Error deleting unused server avatar ${file}: ${error.message}`,
          );
        }
      }

      if (unusedFiles.length === 0) {
        new Logger('ImageSystem').info(`No unused server avatars deleted`);
      } else {
        new Logger('ImageSystem').info(
          `Deleted ${unusedFiles.length} unused server avatars`,
        );
      }
    } catch (error: any) {
      new Logger('ImageSystem').error(
        `Avatar cleanup failed: ${error.message}`,
      );
    }
  },
};

export default imageSystem;

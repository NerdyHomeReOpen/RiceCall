/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs').promises;
const path = require('path');

// Config
const config = require('./config.json');

// Database
const DB = require('../../database');

// Utils
const Logger = require('../../utils/logger');

// StandardizedError
const StandardizedError = require('../../error');

const clean = {
  setup: async () => {
    try {
      // Ensure uploads directory exists
      await fs.mkdir(config.UPLOADS_DIR, { recursive: true });
      await fs.mkdir(config.SERVER_AVATAR_DIR, { recursive: true });
      await fs.mkdir(config.USER_AVATAR_DIR, { recursive: true });
      await fs.mkdir(config.BACKUP_DIR, { recursive: true });

      // Set up cleanup interval
      setInterval(async () => {
        clean.cleanupServerAvatars().catch((error) => {
          new Logger('Cleanup').error(
            `Error cleaning up server avatars: ${error.message}`,
          );
        });
        clean.cleanupUserAvatars().catch((error) => {
          new Logger('Cleanup').error(
            `Error cleaning up user avatars: ${error.message}`,
          );
        });
      }, config.CLEANUP_INTERVAL_MS);

      // Run initial cleanup
      await clean.cleanupServerAvatars();
      await clean.cleanupUserAvatars();

      new Logger('Cleanup').info(`Cleanup setup complete`);
    } catch (error) {
      new Logger('Cleanup').error(
        `Error setting up cleanup interval: ${error.message}`,
      );
    }
  },

  directory: (type) => {
    switch (type) {
      case 'server':
        return path.join(__dirname, config.SERVER_AVATAR_DIR);
      case 'user':
        return path.join(__dirname, config.USER_AVATAR_DIR);
      default:
        return path.join(__dirname, config.UPLOADS_DIR);
    }
  },

  cleanupUserAvatars: async () => {
    try {
      const directory = path.join(__dirname, config.USER_AVATAR_DIR);
      const files = await fs.readdir(directory);
      const data = (await DB.get.all('users')) || {};
      const avatarMap = {};

      Object.values(data).forEach((item) => {
        if (item.avatar) {
          avatarMap[`upload-${item.avatar}`] = true;
        }
      });

      const unusedFiles = files.filter((file) => {
        const isValidType = Object.keys(config.MIME_TYPES).some((ext) =>
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
          new Logger('Cleanup').success(
            `Successfully deleted unused user avatar: ${file}`,
          );
        } catch (error) {
          new Logger('Cleanup').error(
            `Error deleting unused user avatar ${file}: ${error.message}`,
          );
        }
      }

      if (unusedFiles.length === 0) {
        new Logger('Cleanup').info(`No unused user avatars deleted`);
      } else {
        new Logger('Cleanup').info(
          `Deleted ${unusedFiles.length} unused user avatars`,
        );
      }
    } catch (error) {
      new Logger('Cleanup').error(`Avatar cleanup failed: ${error.message}`);
    }
  },

  cleanupServerAvatars: async () => {
    try {
      const directory = path.join(__dirname, config.SERVER_AVATAR_DIR);
      const files = await fs.readdir(directory);
      const data = (await DB.get.all('servers')) || {};
      const avatarMap = {};

      Object.values(data).forEach((item) => {
        if (item.avatar) {
          avatarMap[`upload-${item.avatar}`] = true;
        }
      });

      const unusedFiles = files.filter((file) => {
        const isValidType = Object.keys(config.MIME_TYPES).some((ext) =>
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
          new Logger('Cleanup').success(
            `Successfully deleted unused server avatar: ${file}`,
          );
        } catch (error) {
          new Logger('Cleanup').error(
            `Error deleting unused server avatar ${file}: ${error.message}`,
          );
        }
      }

      if (unusedFiles.length === 0) {
        new Logger('Cleanup').info(`No unused server avatars deleted`);
      } else {
        new Logger('Cleanup').info(
          `Deleted ${unusedFiles.length} unused server avatars`,
        );
      }
    } catch (error) {
      new Logger('Cleanup').error(`Avatar cleanup failed: ${error.message}`);
    }
  },
};

module.exports = { ...clean };

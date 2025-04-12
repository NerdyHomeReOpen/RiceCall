/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs').promises;
const path = require('path');

// Constants
const {
  UPLOADS_DIR,
  MIME_TYPES,
  CLEANUP_INTERVAL_MS,
  SERVER_AVATAR_DIR,
  USER_AVATAR_DIR,
} = require('../constant');

// Utils
const Logger = require('./logger');
const DB = require('../db');

const clean = {
  setup: async () => {
    try {
      // Ensure uploads directory exists
      await fs.mkdir(UPLOADS_DIR, { recursive: true });

      // Set up cleanup interval
      setInterval(clean.cleanServerAvatars, CLEANUP_INTERVAL_MS);

      // Run initial cleanup
      await clean.cleanServerAvatars();

      new Logger('Cleanup').info(`Cleanup setup complete`);
    } catch (error) {
      new Logger('Cleanup').error(
        `Error setting up cleanup interval: ${error.message}`,
      );
    }
  },

  cleanServerAvatars: async () => {
    await cleanAvatars('server');
    await cleanAvatars('user');
  },
};

const cleanAvatars = async (TYPE) => {
  try {
    const DIR = TYPE === 'server' ? SERVER_AVATAR_DIR : USER_AVATAR_DIR;
    const files = await fs.readdir(DIR);
    const data =
      TYPE === 'server'
        ? (await DB.get.all('servers')) || {}
        : (await DB.get.all('users')) || {};
    const avatarMap = {};

    Object.values(data).forEach((item) => {
      if (item.avatar) {
        avatarMap[`upload-${item.avatar}`] = true;
      }
    });

    const unusedFiles = files.filter((file) => {
      const isValidType = Object.keys(MIME_TYPES).some((ext) =>
        file.endsWith(ext),
      );
      const isNotReserved = !file.startsWith('__');
      const fileNameWithoutExt = file.split('.')[0];
      const isNotInUse = !avatarMap[fileNameWithoutExt];

      return isValidType && isNotReserved && isNotInUse;
    });

    for (const file of unusedFiles) {
      try {
        await fs.unlink(path.join(DIR, file));
        new Logger('Cleanup').success(
          `Deleted ${
            TYPE === 'server' ? 'server' : 'user'
          } unused avatar: ${file}`,
        );
      } catch (error) {
        new Logger('Cleanup').error(
          `Error deleting ${
            TYPE === 'server' ? 'server' : 'user'
          } unused avatar ${file}: ${error.message}`,
        );
      }
    }

    if (unusedFiles.length === 0) {
      new Logger('Cleanup').info(
        `No ${TYPE === 'server' ? 'server' : 'user'} unused avatars deleted`,
      );
    } else {
      new Logger('Cleanup').info(
        `Deleted ${TYPE === 'server' ? 'server' : 'user'} ${
          unusedFiles.length
        } unused avatars`,
      );
    }
  } catch (error) {
    new Logger('Cleanup').error(`Avatar cleanup failed: ${error.message}`);
  }
};

module.exports = { ...clean };

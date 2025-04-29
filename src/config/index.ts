import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const config = {
  // All
  serverUrl: process.env.SERVER_URL,

  // Upload
  filePrefix: 'upload-',
  fileSizeLimit: 5 * 1024 * 1024,
  uploadsDir: 'uploads',
  serverAvatarDir: 'uploads/serverAvatars',
  userAvatarDir: 'uploads/userAvatars',
  backupDir: 'backups',
  mimeTypes: {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  },
};

export default config;

export const appConfig = {
  filePrefix: 'upload-',
  fileSizeLimit: 5 * 1024 * 1024,
  backupDir: 'backups',
  uploadsDir: 'uploads',
  serverAvatarDir: 'uploads/serverAvatars',
  userAvatarDir: 'uploads/userAvatars',
  allowedMimeTypes: {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  },
};

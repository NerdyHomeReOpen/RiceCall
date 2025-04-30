const config = {
  // All
  serverUrl: process.env.SERVER_URL,
  serverPort: process.env.SERVER_PORT,

  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,

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

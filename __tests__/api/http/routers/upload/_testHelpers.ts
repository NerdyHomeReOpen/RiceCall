// 統一的測試 ID
export const DEFAULT_IDS = {
  fileName: 'test-avatar',
  userId: 'user-123',
  serverId: 'server-456',
} as const;

// 創建上傳測試資料
export const createUploadTestData = () => {
  // 基本的 base64 圖片資料 (1x1 PNG)
  const validBase64Png =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const validBase64Jpg =
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wAP/2Q==';

  return {
    // 有效請求資料
    validRequests: {
      userAvatar: {
        _type: ['user'],
        _fileName: [DEFAULT_IDS.fileName],
        _file: [validBase64Png],
      },
      serverAvatar: {
        _type: ['server'],
        _fileName: [DEFAULT_IDS.fileName],
        _file: [validBase64Jpg],
      },
      defaultUpload: {
        _type: ['other'],
        _fileName: [DEFAULT_IDS.fileName],
        _file: [validBase64Png],
      },
    },

    // 無效請求資料
    invalidRequests: {
      invalidFileFormat: {
        _type: ['user'],
        _fileName: [DEFAULT_IDS.fileName],
        _file: ['not-base64-data'],
      },
      invalidFileType: {
        _type: ['user'],
        _fileName: [DEFAULT_IDS.fileName],
        _file: [
          'data:image/bmp;base64,Qk1GAAAAAAAAADYAAAAoAAAAAQAAAAEAAAABACAAAAAAAAAAAAATCwAAEwsAAAAAAAAAAAAA',
        ],
      },
      nonImageFile: {
        _type: ['user'],
        _fileName: [DEFAULT_IDS.fileName],
        _file: ['data:text/plain;base64,SGVsbG8gV29ybGQ='],
      },
    },

    // Mock 資料
    mockData: {
      base64ImageBuffer: Buffer.from(validBase64Png.split(',')[1], 'base64'),
      existingFiles: ['test-avatar.webp', 'other-file.jpg'],
      expectedPaths: {
        user: 'uploads/userAvatars',
        server: 'uploads/serverAvatars',
        default: 'uploads',
      },
      expectedFileNames: {
        full: 'test-avatar.webp',
        prefixed: 'upload-test-avatar.webp',
      },
    },

    // 預期結果
    expectedResponses: {
      successResponse: {
        avatar: DEFAULT_IDS.fileName,
        avatarUrl: 'http://localhost/images/userAvatars/test-avatar.webp',
      },
      serverUrl: 'http://localhost',
    },
  };
};

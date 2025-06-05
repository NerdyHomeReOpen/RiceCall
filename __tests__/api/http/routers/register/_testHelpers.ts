// 統一的測試 ID
export const DEFAULT_IDS = {
  userId: 'test-user-123',
  account: 'testuser',
  existingAccount: 'existing@test.com',
} as const;

// 創建註冊測試資料
export const createRegisterTestData = () => {
  const currentTime = 1609459200000; // 固定時間戳

  return {
    // 有效請求資料
    validRequests: {
      basic: {
        account: DEFAULT_IDS.account,
        password: 'TestPass123!',
        username: '測試用戶',
      },
      withSpecialChars: {
        account: 'test_user',
        password: 'Test@Pass#123',
        username: 'TestUser123',
      },
    },

    // 無效請求資料
    invalidRequests: {
      existingAccount: {
        account: DEFAULT_IDS.existingAccount,
        password: 'TestPass123!',
        username: '測試用戶',
      },
    },

    // 資料庫資料
    databaseData: {
      existingAccount: {
        userId: 'existing-user-id',
        password: 'hashed-password',
      },
      expectedUser: {
        name: '測試用戶',
        avatar: DEFAULT_IDS.userId,
        avatarUrl: 'http://localhost:3000/images/userAvatars/',
        createdAt: currentTime,
      },
      expectedAccount: {
        password: 'hashed-password-123',
        userId: DEFAULT_IDS.userId,
      },
    },

    // 預期結果
    expectedResponses: {
      currentTime,
      serverUrl: 'http://localhost:3000',
      hashedPassword: 'hashed-password-123',
    },
  };
};

import bcrypt from 'bcrypt';

// 統一的測試 ID
export const DEFAULT_IDS = {
  userId: 'test-user-123',
  account: 'test@example.com',
  nonExistentAccount: 'nonexistent@example.com',
} as const;

// 創建測試資料
export const createLoginTestData = () => {
  const validPassword = 'testPassword123';
  const hashedPassword = bcrypt.hashSync(validPassword, 10);

  return {
    // 有效請求資料
    validRequests: {
      basic: {
        account: DEFAULT_IDS.account,
        password: validPassword,
      },
      withOptionalFields: {
        account: DEFAULT_IDS.account,
        password: validPassword,
        rememberAccount: true,
        autoLogin: false,
      },
    },

    // 無效請求資料
    invalidRequests: {
      wrongPassword: {
        account: DEFAULT_IDS.account,
        password: 'wrongPassword',
      },
      nonExistentAccount: {
        account: DEFAULT_IDS.nonExistentAccount,
        password: validPassword,
      },
      invalidData: {
        account: '',
        password: '',
      },
    },

    // 資料庫資料
    databaseData: {
      validAccount: {
        userId: DEFAULT_IDS.userId,
        password: hashedPassword,
      },
      validUser: {
        userId: DEFAULT_IDS.userId,
        name: '測試用戶',
        avatar: 'avatar.jpg',
        lastActiveAt: 1609459200000, // 固定時間戳
      },
    },

    // 預期結果
    expectedResponses: {
      validToken: 'mock-jwt-token',
      currentTime: 1609459200000,
    },
  };
};

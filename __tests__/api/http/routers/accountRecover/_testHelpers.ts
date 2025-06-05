import {
  AccountData,
  AccountRecoverData,
  MockInstances,
  RequestAccountRecoverInput,
  ResetPasswordInput,
  UserData,
} from './_testTypes';

// 統一的 ID 管理
export const DEFAULT_IDS = {
  userId: 'test-user-id-123',
  resetToken: 'test-reset-token-256-characters-long',
  account: 'testuser',
  hashedPassword: '$2b$10$test.hash.password',
} as const;

export const DEFAULT_TIME = 1640995200000; // 2022-01-01 00:00:00

// 標準化資料建立函數
export const createTestAccountData = (
  account: string = DEFAULT_IDS.account,
  overrides: Partial<AccountData> = {},
): AccountData => ({
  userId: DEFAULT_IDS.userId,
  account,
  password: DEFAULT_IDS.hashedPassword,
  ...overrides,
});

export const createTestUserData = (
  userId: string = DEFAULT_IDS.userId,
  overrides: Partial<UserData> = {},
): UserData => ({
  userId,
  name: `測試用戶-${userId}`,
  lastActiveAt: DEFAULT_TIME,
  ...overrides,
});

export const createTestAccountRecoverData = (
  userId: string = DEFAULT_IDS.userId,
  overrides: Partial<AccountRecoverData> = {},
): AccountRecoverData => ({
  userId,
  resetToken: DEFAULT_IDS.resetToken,
  tried: 0,
  ...overrides,
});

// 測試場景資料生成器
export const createAccountRecoverTestData = () => {
  const accountData = createTestAccountData();
  const userData = createTestUserData();
  const accountRecoverData = createTestAccountRecoverData();

  return {
    accountData,
    userData,
    accountRecoverData,

    // RequestAccountRecover 測試資料
    requestData: {
      valid: { account: DEFAULT_IDS.account } as RequestAccountRecoverInput,
      empty: { account: '' } as RequestAccountRecoverInput,
      tooLong: { account: 'a'.repeat(101) } as RequestAccountRecoverInput,
      nonExistent: { account: 'nonexistent' } as RequestAccountRecoverInput,
    },

    // ResetPassword 測試資料
    resetData: {
      valid: {
        userId: DEFAULT_IDS.userId,
        resetToken: DEFAULT_IDS.resetToken,
        newPassword: 'newpassword123',
      } as ResetPasswordInput,
      invalidToken: {
        userId: DEFAULT_IDS.userId,
        resetToken: 'invalid-token',
        newPassword: 'newpassword123',
      } as ResetPasswordInput,
      weakPassword: {
        userId: DEFAULT_IDS.userId,
        resetToken: DEFAULT_IDS.resetToken,
        newPassword: '123', // 太短
      } as ResetPasswordInput,
      tooManyAttempts: {
        userId: DEFAULT_IDS.userId,
        resetToken: DEFAULT_IDS.resetToken,
        newPassword: 'newpassword123',
      } as ResetPasswordInput,
    },
  };
};

// 統一的 Mock 設置
export const setupAccountRecoverMocks = (
  mockInstances: MockInstances,
  testData: ReturnType<typeof createAccountRecoverTestData>,
) => {
  const {
    mockDatabase,
    mockDataValidator,
    mockBcrypt,
    mockSendEmail,
    mockGenerateRandomString,
  } = mockInstances;

  // 設置 DataValidator mock
  mockDataValidator.validate.mockResolvedValue({});

  // 設置 Database mock
  mockDatabase.get.account.mockImplementation(async (account: string) => {
    if (account === DEFAULT_IDS.account) return testData.accountData;
    if (account === 'nonexistent') return null;
    return testData.accountData;
  });

  mockDatabase.get.accountByUserId.mockImplementation(
    async (userId: string) => {
      if (userId === DEFAULT_IDS.userId) return testData.accountData;
      return null;
    },
  );

  mockDatabase.get.accountRecover.mockImplementation(async (userId: string) => {
    if (userId === DEFAULT_IDS.userId) return testData.accountRecoverData;
    return null;
  });

  mockDatabase.set.accountRecover.mockResolvedValue(true);
  mockDatabase.set.account.mockResolvedValue(true);
  mockDatabase.set.user.mockResolvedValue(true);
  mockDatabase.delete.accountRecover.mockResolvedValue(true);

  // 設置其他 utility mock
  mockBcrypt.hash.mockResolvedValue(DEFAULT_IDS.hashedPassword);
  mockSendEmail.mockResolvedValue(true);
  mockGenerateRandomString.mockReturnValue(DEFAULT_IDS.resetToken);
};

// 錯誤測試輔助函數
export const testDatabaseError = async (
  handler: any,
  data: any,
  mockInstances: MockInstances,
  errorType: 'get' | 'set',
  errorMessage: string,
  expectedErrorName: string,
) => {
  const { mockDatabase, mockDataValidator } = mockInstances;
  const dbError = new Error(errorMessage);

  jest.clearAllMocks();

  // 確保 validator 成功
  mockDataValidator.validate.mockResolvedValue(data);

  if (errorType === 'get') {
    mockDatabase.get.account.mockRejectedValue(dbError);
  } else {
    // 確保前面的 get 操作成功，只有 set 失敗
    setupAccountRecoverMocks(mockInstances, createAccountRecoverTestData());
    mockDatabase.set.accountRecover.mockRejectedValue(dbError);
  }

  const result = await handler.handle(data);

  expect(result.statusCode).toBe(500);
  expect(result.message).toBe('error');
  expect(result.data.error.name).toBe(expectedErrorName);
};

// 驗證錯誤測試輔助函數
export const testValidationError = async (
  handler: any,
  invalidData: any,
  mockInstances: MockInstances,
  validationError: Error,
  expectedErrorName: string,
) => {
  const { mockDataValidator } = mockInstances;

  jest.clearAllMocks();
  mockDataValidator.validate.mockRejectedValue(validationError);

  const result = await handler.handle(invalidData);

  expect(result.statusCode).toBeGreaterThanOrEqual(400);
  expect(result.message).toBe('error');
  expect(result.data.error.name).toBe(expectedErrorName);
};

// 標準化 beforeEach 設置
export const setupBeforeEach = (
  mockInstances: MockInstances,
  testData: ReturnType<typeof createAccountRecoverTestData>,
) => {
  jest.clearAllMocks();
  jest.spyOn(Date, 'now').mockReturnValue(DEFAULT_TIME);

  setupAccountRecoverMocks(mockInstances, testData);
};

// 標準化 afterEach 清理
export const setupAfterEach = () => {
  jest.restoreAllMocks();
};

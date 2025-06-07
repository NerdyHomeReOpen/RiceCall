import { jest } from '@jest/globals';
import {
  createMockSocket,
  mockDatabase,
  mockDataValidator,
  mockSocketServerGetSocket,
} from '../../_testSetup';
import {
  SearchUserQuery,
  UpdateUserData,
  User,
  UserSearchResult,
} from './_testTypes';

// 常用的測試數據ID
export const DEFAULT_IDS = {
  operatorUserId: 'operator-user-id',
  targetUserId: 'target-user-id',
  serverId: 'server-id-123',
  channelId: 'channel-id-123',
  socketId: 'test-socket-id',
} as const;

// 預設時間
export const DEFAULT_TIME = 1640995200000;

// 預設用戶資料創建函數
export const createDefaultUser = (
  userId: string,
  overrides: Partial<User> = {},
): User => ({
  userId,
  name: `測試用戶-${userId}`,
  avatar: 'avatar.jpg',
  status: 'online',
  currentServerId: null,
  currentChannelId: null,
  lastActiveAt: DEFAULT_TIME,
  ...overrides,
});

// 建立多個用戶
export const createUsers = (
  count: number,
  baseOverrides: Partial<User> = {},
): User[] => {
  return Array.from({ length: count }, (_, index) =>
    createDefaultUser(`user-${index + 1}`, {
      ...baseOverrides,
      name: `測試用戶${index + 1}`,
    }),
  );
};

// 建立搜尋結果
export const createSearchResults = (count: number = 2): UserSearchResult[] => {
  return Array.from({ length: count }, (_, index) => ({
    userId: `user-${index + 1}`,
    name: `測試用戶${index + 1}`,
    avatar: `avatar${index + 1}.jpg`,
    status: index % 2 === 0 ? 'online' : ('dnd' as const),
    signature: `這是第${index + 1}個測試用戶`,
  }));
};

// 創建預設測試資料
export const createDefaultTestData = () => {
  const operatorUser = createDefaultUser(DEFAULT_IDS.operatorUserId);
  const targetUser = createDefaultUser(DEFAULT_IDS.targetUserId);

  const userWithServer = createDefaultUser(DEFAULT_IDS.operatorUserId, {
    currentServerId: DEFAULT_IDS.serverId,
    currentChannelId: DEFAULT_IDS.channelId,
  });

  const searchResults = createSearchResults();

  const updateData: UpdateUserData = {
    userId: DEFAULT_IDS.operatorUserId,
    user: {
      name: '更新後的用戶名',
      signature: '更新後的個人簽名',
      status: 'dnd',
    },
  };

  const searchQueries = {
    basic: { query: '測試用戶' },
    empty: { query: '不存在的用戶' },
    special: { query: '特殊字符!@#' },
  };

  // 輔助資料建立函數
  const createSearchData = (query: string): SearchUserQuery => ({ query });

  const createUpdateData = (
    userId: string = DEFAULT_IDS.operatorUserId,
    userUpdates: Partial<User> = {},
  ): UpdateUserData => ({
    userId,
    user: userUpdates,
  });

  return {
    operatorUser,
    targetUser,
    userWithServer,
    searchResults,
    updateData,
    searchQueries,
    // 輔助資料建立函數
    createSearchData,
    createUpdateData,
  };
};

// 設定預設的資料庫 mock
export const setupDefaultDatabaseMocks = (
  testData: ReturnType<typeof createDefaultTestData>,
) => {
  // User mocks
  mockDatabase.get.user.mockImplementation(async (userId: string) => {
    if (userId === DEFAULT_IDS.operatorUserId) return testData.operatorUser;
    if (userId === DEFAULT_IDS.targetUserId) return testData.targetUser;
    return null;
  });

  // Search mocks
  mockDatabase.get.searchUser.mockResolvedValue(testData.searchResults);

  // Set operations
  mockDatabase.set.user.mockResolvedValue(true);

  // Data validator mocks
  mockDataValidator.validate.mockImplementation(
    async (schema, data, part) => data,
  );
};

// 設定 Socket mock
export const setupSocketMocks = (
  testData: ReturnType<typeof createDefaultTestData>,
) => {
  const targetSocket = createMockSocket(
    DEFAULT_IDS.targetUserId,
    'target-socket-id',
  );

  (mockSocketServerGetSocket as any).mockImplementation((userId: string) => {
    if (userId === DEFAULT_IDS.targetUserId) return targetSocket;
    return null;
  });

  return { targetSocket };
};

// Mock Server Handlers (用於 connect/disconnect 測試)
export const createMockServerHandlers = () => ({
  disconnectServer: { handle: jest.fn() },
  connectServer: { handle: jest.fn() },
});

// 用戶變種創建函數
export const createUserVariant = (
  baseUser: User,
  overrides: Partial<User>,
): User => ({
  ...baseUser,
  ...overrides,
});

// 通用的 beforeEach 設定 (for searchUser, updateUser)
export const setupBeforeEach = (
  mockSocketInstance: any,
  mockIoInstance: any,
  testData: ReturnType<typeof createDefaultTestData>,
) => {
  jest.clearAllMocks();

  // Mock Date.now()
  jest.spyOn(Date, 'now').mockReturnValue(DEFAULT_TIME);

  // 設定預設 mocks
  setupDefaultDatabaseMocks(testData);
  setupSocketMocks(testData);
};

// 通用的 afterEach 清理
export const setupAfterEach = () => {
  jest.restoreAllMocks();
};

// Connect/Disconnect 專用的 beforeEach 設定
export const setupConnectDisconnectBeforeEach = (
  mockSocketInstance: any,
  mockIoInstance: any,
  testData: ReturnType<typeof createDefaultTestData>,
  serverHandlers: ReturnType<typeof createMockServerHandlers>,
) => {
  jest.clearAllMocks();

  // Mock Date.now()
  jest.spyOn(Date, 'now').mockReturnValue(DEFAULT_TIME);

  // 預設mock回傳值
  mockDatabase.get.user.mockResolvedValue(testData.operatorUser);
  mockDatabase.set.user.mockResolvedValue(true);

  // 設定 server handlers
  (serverHandlers.disconnectServer.handle as any).mockResolvedValue(undefined);
  (serverHandlers.connectServer.handle as any).mockResolvedValue(undefined);
};

// 統一資料庫錯誤測試輔助函數
export const testDatabaseError = async (
  handler: any,
  mockSocketInstance: any,
  mockIoInstance: any,
  testData: any,
  errorType: 'get' | 'set',
  errorMessage: string,
  expectedErrorMessage: string,
) => {
  const dbError = new Error(errorMessage);

  // 先清除所有 mock 並重新設定
  jest.clearAllMocks();

  if (errorType === 'get') {
    // 讓各種 get 操作失敗
    mockDatabase.get.user.mockRejectedValue(dbError);
    mockDatabase.get.searchUser.mockRejectedValue(dbError);
  } else {
    // 確保前面的 get 操作成功，只有 set 失敗
    if (testData?.operatorUser) {
      mockDatabase.get.user.mockResolvedValue(testData.operatorUser);
    }
    mockDatabase.set.user.mockRejectedValue(dbError);
  }

  // 確保 validator 返回正確的數據
  if (testData) {
    mockDataValidator.validate.mockResolvedValue(testData);
  }

  await handler.handle(mockIoInstance, mockSocketInstance, testData);

  expect(mockSocketInstance.emit).toHaveBeenCalledWith(
    'error',
    expect.objectContaining({
      name: 'ServerError',
      message: expectedErrorMessage,
      tag: 'EXCEPTION_ERROR',
      statusCode: 500,
    }),
  );
};

// 統一驗證錯誤測試輔助函數
export const testValidationError = async (
  handler: any,
  mockSocketInstance: any,
  mockIoInstance: any,
  invalidData: any,
  validationError: Error,
  expectedErrorMessage: string,
) => {
  jest.clearAllMocks();

  mockDataValidator.validate.mockRejectedValue(validationError);

  await handler.handle(mockIoInstance, mockSocketInstance, invalidData);

  expect(mockSocketInstance.emit).toHaveBeenCalledWith(
    'error',
    expect.objectContaining({
      message: expectedErrorMessage,
    }),
  );
};

// 模擬搜尋結果創建函數
export const createMockSearchResults = (
  query: string,
  count: number = 1,
): UserSearchResult[] => {
  return Array.from({ length: count }, (_, index) => ({
    userId: `result-${index + 1}`,
    name: `符合${query}的用戶${index + 1}`,
    avatar: `avatar${index + 1}.jpg`,
    status: 'online' as const,
    signature: '測試用戶',
  }));
};

// 創建標準的 Mock 實例設定
export const createStandardMockInstances = (
  operatorUserId: string = DEFAULT_IDS.operatorUserId,
  socketId: string = DEFAULT_IDS.socketId,
) => {
  const mockSocketInstance = createMockSocket(operatorUserId, socketId);
  const mockIoInstance = require('../../_testSetup').createMockIo();

  mockSocketInstance.data.userId = operatorUserId;

  return { mockSocketInstance, mockIoInstance };
};

// 權限檢查輔助函數 (for updateUser)
export const testUnauthorizedUpdate = async (
  handler: any,
  mockSocketInstance: any,
  mockIoInstance: any,
  unauthorizedData: UpdateUserData,
) => {
  // 先清除所有 mock
  jest.clearAllMocks();

  // 確保 validator 通過驗證
  mockDataValidator.validate.mockResolvedValue(unauthorizedData);

  // 確保 socket 有正確的 userId
  mockSocketInstance.data = { userId: DEFAULT_IDS.operatorUserId };

  await handler.handle(mockIoInstance, mockSocketInstance, unauthorizedData);

  // 當權限檢查失敗時，handler 應該只是 return，不會調用 database.set.user 或 socket.emit
  expect(mockDatabase.set.user).not.toHaveBeenCalled();
  expect(mockSocketInstance.emit).not.toHaveBeenCalledWith(
    'userUpdate',
    expect.anything(),
  );

  // 檢查日誌是否記錄了權限拒絕
  // 注意：實際的實現中它只是 return 而不發送錯誤，這可能是設計問題
};

import { jest } from '@jest/globals';
import {
  createMockSocket,
  mockDatabase,
  mockDataValidator,
  mockSocketServerGetSocket,
} from '../../_testSetup';
import { Friend, FriendApplication, FriendGroup, User } from './_testTypes';

// 常用的測試數據ID
export const DEFAULT_IDS = {
  operatorUserId: 'operator-user-id',
  targetUserId: 'target-user-id',
  anotherUserId: 'another-user-id',
  friendGroupId: 'friend-group-id',
  anotherFriendGroupId: 'another-friend-group-id',
  applicationId: 'application-id',
  socketId: 'test-socket-id',
} as const;

// 預設時間
export const DEFAULT_TIME = 1640995200000;

// 預設用戶資料
export const createDefaultUser = (
  userId: string,
  overrides: Partial<User> = {},
): User => ({
  userId,
  username: `User-${userId}`,
  email: `${userId}@test.com`,
  currentServerId: null,
  currentChannelId: null,
  lastActiveAt: DEFAULT_TIME,
  ...overrides,
});

// 預設好友資料
export const createDefaultFriend = (
  userId: string,
  targetId: string,
  overrides: Partial<Friend> = {},
): Friend => ({
  userId,
  targetId,
  isBlocked: false,
  friendGroupId: null,
  createdAt: DEFAULT_TIME,
  ...overrides,
});

// 預設好友分組資料
export const createDefaultFriendGroup = (
  friendGroupId: string,
  userId: string,
  overrides: Partial<FriendGroup> = {},
): FriendGroup => ({
  friendGroupId,
  userId,
  name: `Group-${friendGroupId}`,
  createdAt: DEFAULT_TIME,
  ...overrides,
});

// 預設好友申請資料
export const createDefaultFriendApplication = (
  senderId: string,
  receiverId: string,
  overrides: Partial<FriendApplication> = {},
): FriendApplication => ({
  applicationId: DEFAULT_IDS.applicationId,
  senderId,
  receiverId,
  message: "Let's be friends!",
  status: 'pending',
  createdAt: DEFAULT_TIME,
  ...overrides,
});

// 創建預設測試資料
export const createDefaultTestData = () => {
  const operatorUser = createDefaultUser(DEFAULT_IDS.operatorUserId);
  const targetUser = createDefaultUser(DEFAULT_IDS.targetUserId);
  const anotherUser = createDefaultUser(DEFAULT_IDS.anotherUserId);

  const friendGroupData = createDefaultFriendGroup(
    DEFAULT_IDS.friendGroupId,
    DEFAULT_IDS.operatorUserId,
  );

  const friendRelation = createDefaultFriend(
    DEFAULT_IDS.operatorUserId,
    DEFAULT_IDS.targetUserId,
  );

  const friendApplication = createDefaultFriendApplication(
    DEFAULT_IDS.operatorUserId,
    DEFAULT_IDS.targetUserId,
  );

  // 常用的測試資料變體創建函數
  const createFriendData = (
    overrides: Partial<{
      userId: string;
      targetId: string;
      friend: any;
    }> = {},
  ) => ({
    userId: DEFAULT_IDS.operatorUserId,
    targetId: DEFAULT_IDS.targetUserId,
    friend: {
      isBlocked: false,
      friendGroupId: null,
      ...overrides.friend,
    },
    ...overrides,
  });

  const createDeleteData = (
    overrides: Partial<{
      userId: string;
      targetId: string;
    }> = {},
  ) => ({
    userId: DEFAULT_IDS.operatorUserId,
    targetId: DEFAULT_IDS.targetUserId,
    ...overrides,
  });

  const createUpdateData = (
    overrides: Partial<{
      userId: string;
      targetId: string;
      friend: any;
    }> = {},
  ) => ({
    userId: DEFAULT_IDS.operatorUserId,
    targetId: DEFAULT_IDS.targetUserId,
    friend: {},
    ...overrides,
  });

  const createApplicationData = (
    overrides: Partial<{
      senderId: string;
      receiverId: string;
      message?: string;
    }> = {},
  ) => ({
    senderId: DEFAULT_IDS.operatorUserId,
    receiverId: DEFAULT_IDS.targetUserId,
    message: "Let's be friends!",
    ...overrides,
  });

  return {
    operatorUser,
    targetUser,
    anotherUser,
    friendGroupData,
    friendRelation,
    friendApplication,
    // 輔助資料建立函數
    createFriendData,
    createDeleteData,
    createUpdateData,
    createApplicationData,
  };
};

// 設定預設的資料庫 mock
export const setupDefaultDatabaseMocks = (
  testData: ReturnType<typeof createDefaultTestData>,
) => {
  // User mocks
  mockDatabase.get.user.mockImplementation(async (userId: string) => {
    if (userId === DEFAULT_IDS.operatorUserId)
      return testData.operatorUser as any;
    if (userId === DEFAULT_IDS.targetUserId) return testData.targetUser as any;
    if (userId === DEFAULT_IDS.anotherUserId)
      return testData.anotherUser as any;
    return null;
  });

  // Friend mocks
  mockDatabase.get.friend.mockResolvedValue(null); // 預設沒有好友關係
  mockDatabase.get.userFriends.mockResolvedValue([]);
  mockDatabase.get.userFriend.mockResolvedValue(testData.friendRelation as any);

  // FriendGroup mocks
  mockDatabase.get.friendGroup.mockResolvedValue(
    testData.friendGroupData as any,
  );
  mockDatabase.get.userFriendGroups.mockResolvedValue([
    testData.friendGroupData,
  ] as any);
  mockDatabase.get.friendGroupFriends.mockResolvedValue([]);

  // FriendApplication mocks
  mockDatabase.get.friendApplication.mockResolvedValue(null);
  mockDatabase.get.userFriendApplications.mockResolvedValue([]);

  // Set operations
  (mockDatabase.set.friend as any).mockResolvedValue(true);
  (mockDatabase.set.friendGroup as any).mockResolvedValue(true);
  (mockDatabase.set.friendApplication as any).mockResolvedValue(true);

  // Delete operations
  (mockDatabase.delete.friend as any).mockResolvedValue(true);
  (mockDatabase.delete.friendGroup as any).mockResolvedValue(true);
  (mockDatabase.delete.friendApplication as any).mockResolvedValue(true);

  // Data validator mock
  mockDataValidator.validate.mockImplementation(
    async (schema, data, part) => data,
  );
};

// 設定 Socket mock
export const setupSocketMocks = (
  testData: ReturnType<typeof createDefaultTestData>,
) => {
  // 預設返回目標用戶的 socket
  const targetSocket = createMockSocket(
    DEFAULT_IDS.targetUserId,
    'target-socket-id',
  );
  const anotherSocket = createMockSocket(
    DEFAULT_IDS.anotherUserId,
    'another-socket-id',
  );

  (mockSocketServerGetSocket as any).mockImplementation((userId: string) => {
    if (userId === DEFAULT_IDS.targetUserId) return targetSocket;
    if (userId === DEFAULT_IDS.anotherUserId) return anotherSocket;
    return null;
  });

  return { targetSocket, anotherSocket };
};

// 創建標準的 Mock 實例設定
export const createStandardMockInstances = () => {
  const mockSocketInstance = createMockSocket(
    DEFAULT_IDS.operatorUserId,
    DEFAULT_IDS.socketId,
  );
  const mockIoInstance = require('../../_testSetup').createMockIo();

  mockSocketInstance.data.userId = DEFAULT_IDS.operatorUserId;

  return { mockSocketInstance, mockIoInstance };
};

// 通用的 beforeEach 設定
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

// 統一錯誤測試輔助函數
export const testDatabaseError = async (
  handler: any,
  mockSocketInstance: any,
  mockIoInstance: any,
  testData: any,
  errorType: 'get' | 'set' | 'delete',
  errorMessage: string,
  expectedErrorMessage: string,
) => {
  const dbError = new Error(errorMessage);

  // 先清除所有 mock 並重新設定
  jest.clearAllMocks();

  if (errorType === 'get') {
    mockDatabase.get.user.mockRejectedValue(dbError);
    mockDatabase.get.friend.mockRejectedValue(dbError);
    mockDatabase.get.friendGroup.mockRejectedValue(dbError);
    mockDatabase.get.friendApplication.mockRejectedValue(dbError);
  } else if (errorType === 'set') {
    // 確保前面的 get 操作成功，只有 set 失敗
    setupDefaultDatabaseMocks({
      operatorUser: testData.operatorUser,
      targetUser: testData.targetUser,
      anotherUser: testData.anotherUser,
      friendGroupData: testData.friendGroupData,
      friendRelation: testData.friendRelation,
      friendApplication: testData.friendApplication,
    } as any);

    (mockDatabase.set.friend as any).mockRejectedValue(dbError);
    (mockDatabase.set.friendGroup as any).mockRejectedValue(dbError);
    (mockDatabase.set.friendApplication as any).mockRejectedValue(dbError);
  } else {
    // delete 錯誤
    setupDefaultDatabaseMocks({
      operatorUser: testData.operatorUser,
      targetUser: testData.targetUser,
      anotherUser: testData.anotherUser,
      friendGroupData: testData.friendGroupData,
      friendRelation: testData.friendRelation,
      friendApplication: testData.friendApplication,
    } as any);

    (mockDatabase.delete.friend as any).mockRejectedValue(dbError);
    (mockDatabase.delete.friendGroup as any).mockRejectedValue(dbError);
    (mockDatabase.delete.friendApplication as any).mockRejectedValue(dbError);
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

// 驗證錯誤測試輔助函數
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

// 權限檢查測試輔助函數
export const testPermissionFailure = async (
  handler: any,
  mockSocketInstance: any,
  mockIoInstance: any,
  testData: any,
  unauthorizedUserId: string,
  logMessage: string,
) => {
  jest.clearAllMocks();

  // 設定未授權的用戶
  mockSocketInstance.data.userId = unauthorizedUserId;

  setupDefaultDatabaseMocks({
    operatorUser: testData.operatorUser,
    targetUser: testData.targetUser,
    anotherUser: testData.anotherUser,
    friendGroupData: testData.friendGroupData,
    friendRelation: testData.friendRelation,
    friendApplication: testData.friendApplication,
  } as any);
  mockDataValidator.validate.mockResolvedValue(testData);

  await handler.handle(mockIoInstance, mockSocketInstance, testData);

  // 檢查權限失敗的行為：不執行核心操作
  expect(mockDatabase.set.friend).not.toHaveBeenCalled();
  expect(mockDatabase.delete.friend).not.toHaveBeenCalled();
  expect(mockDatabase.set.friendGroup).not.toHaveBeenCalled();
  expect(mockDatabase.delete.friendGroup).not.toHaveBeenCalled();

  // 檢查日誌記錄
  const mockWarn = require('../../_testSetup').mockWarn;
  expect(mockWarn).toHaveBeenCalledWith(expect.stringContaining(logMessage));
};

// 好友變種創建函數
export const createFriendVariant = (
  baseFriend: Friend,
  overrides: Partial<Friend>,
): Friend => ({
  ...baseFriend,
  ...overrides,
});

// 好友分組變種創建函數
export const createFriendGroupVariant = (
  baseFriendGroup: FriendGroup,
  overrides: Partial<FriendGroup>,
): FriendGroup => ({
  ...baseFriendGroup,
  ...overrides,
});

// 用戶變種創建函數
export const createUserVariant = (
  baseUser: User,
  overrides: Partial<User>,
): User => ({
  ...baseUser,
  ...overrides,
});

// Mock biDirectionalAsyncOperation 輔助函數
export const setupBiDirectionalMock = () => {
  const mockBiDirectional = jest.fn(async (func: any, args: any[]) => {
    await func(args[0], args[1]);
    await func(args[1], args[0]);
  });

  jest.doMock('@/utils', () => ({
    biDirectionalAsyncOperation: mockBiDirectional,
  }));

  return mockBiDirectional;
};

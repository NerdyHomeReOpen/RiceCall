import { jest } from '@jest/globals';
import {
  createMockIo,
  createMockSocket,
  mockDatabase,
  mockDataValidator,
} from '../../_testSetup';
import { Friend, FriendGroup, FriendGroupFriend, User } from './_testTypes';

// 常用的測試數據ID
export const DEFAULT_IDS = {
  userId: 'user-id-123',
  otherUserId: 'other-user-id',
  friendGroupId: 'friend-group-id-123',
  friendId1: 'friend-id-1',
  friendId2: 'friend-id-2',
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

// 預設好友群組資料
export const createDefaultFriendGroup = (
  userId: string,
  overrides: Partial<FriendGroup> = {},
): FriendGroup => ({
  friendGroupId: DEFAULT_IDS.friendGroupId,
  userId,
  name: '預設群組',
  order: 0,
  createdAt: DEFAULT_TIME,
  ...overrides,
});

// 預設好友關係資料
export const createDefaultFriend = (
  userId: string,
  targetId: string,
  overrides: Partial<Friend> = {},
): Friend => ({
  userId,
  targetId,
  isBlocked: false,
  friendGroupId: DEFAULT_IDS.friendGroupId,
  createdAt: DEFAULT_TIME,
  ...overrides,
});

// 預設群組好友資料
export const createDefaultFriendGroupFriend = (
  userId: string,
  targetId: string,
  friendGroupId: string = DEFAULT_IDS.friendGroupId,
): FriendGroupFriend => ({
  userId,
  targetId,
  friendGroupId,
});

// 創建預設測試資料
export const createDefaultTestData = () => {
  const user = createDefaultUser(DEFAULT_IDS.userId);
  const otherUser = createDefaultUser(DEFAULT_IDS.otherUserId);
  const friend1 = createDefaultUser(DEFAULT_IDS.friendId1);
  const friend2 = createDefaultUser(DEFAULT_IDS.friendId2);

  const friendGroup = createDefaultFriendGroup(DEFAULT_IDS.userId);

  const friendRelation1 = createDefaultFriend(
    DEFAULT_IDS.userId,
    DEFAULT_IDS.friendId1,
  );
  const friendRelation2 = createDefaultFriend(
    DEFAULT_IDS.userId,
    DEFAULT_IDS.friendId2,
  );

  const friendGroupFriends = [
    createDefaultFriendGroupFriend(DEFAULT_IDS.userId, DEFAULT_IDS.friendId1),
    createDefaultFriendGroupFriend(DEFAULT_IDS.userId, DEFAULT_IDS.friendId2),
  ];

  // 常用的測試資料變體創建函數
  const createFriendGroupData = (
    overrides: Partial<{
      userId: string;
      friendGroupId?: string;
      group?: any;
    }> = {},
  ) => ({
    userId: DEFAULT_IDS.userId,
    friendGroupId: DEFAULT_IDS.friendGroupId,
    group: {
      name: '測試群組',
      order: 0,
      ...overrides.group,
    },
    ...overrides,
  });

  const createFriendGroupCreateData = (
    overrides: Partial<{
      userId: string;
      group?: any;
    }> = {},
  ) => ({
    userId: DEFAULT_IDS.userId,
    group: {
      name: '新建群組',
      order: 0,
      ...overrides.group,
    },
    ...overrides,
  });

  const createFriendGroupUpdateData = (
    overrides: Partial<{
      userId: string;
      friendGroupId?: string;
      group?: any;
    }> = {},
  ) => ({
    userId: DEFAULT_IDS.userId,
    friendGroupId: DEFAULT_IDS.friendGroupId,
    group: {
      name: '更新後群組',
      order: 1,
      ...overrides.group,
    },
    ...overrides,
  });

  const createFriendGroupDeleteData = (
    overrides: Partial<{
      userId: string;
      friendGroupId?: string;
    }> = {},
  ) => ({
    userId: DEFAULT_IDS.userId,
    friendGroupId: DEFAULT_IDS.friendGroupId,
    ...overrides,
  });

  return {
    user,
    otherUser,
    friend1,
    friend2,
    friendGroup,
    friendRelation1,
    friendRelation2,
    friendGroupFriends,
    // 輔助資料建立函數
    createFriendGroupData,
    createFriendGroupCreateData,
    createFriendGroupUpdateData,
    createFriendGroupDeleteData,
  };
};

// 設定預設的資料庫 mock
export const setupDefaultDatabaseMocks = (
  testData: ReturnType<typeof createDefaultTestData>,
) => {
  // User mocks
  mockDatabase.get.user.mockImplementation(async (userId: string) => {
    if (userId === DEFAULT_IDS.userId) return testData.user as any;
    if (userId === DEFAULT_IDS.otherUserId) return testData.otherUser as any;
    if (userId === DEFAULT_IDS.friendId1) return testData.friend1 as any;
    if (userId === DEFAULT_IDS.friendId2) return testData.friend2 as any;
    return null;
  });

  // FriendGroup mocks
  mockDatabase.get.friendGroup.mockResolvedValue(testData.friendGroup as any);
  mockDatabase.get.userFriendGroups.mockResolvedValue([
    testData.friendGroup,
  ] as any);
  mockDatabase.get.friendGroupFriends.mockResolvedValue(
    testData.friendGroupFriends as any,
  );

  // Friend mocks
  mockDatabase.get.friend.mockResolvedValue(testData.friendRelation1 as any);
  mockDatabase.get.userFriends.mockResolvedValue([
    testData.friendRelation1,
    testData.friendRelation2,
  ] as any);

  // Set operations
  (mockDatabase.set.friendGroup as any).mockResolvedValue(true);
  (mockDatabase.set.friend as any).mockResolvedValue(true);

  // Delete operations
  (mockDatabase.delete.friendGroup as any).mockResolvedValue(true);
  (mockDatabase.delete.friend as any).mockResolvedValue(true);

  // Data validator mock
  mockDataValidator.validate.mockImplementation(
    async (schema, data, part) => data,
  );
};

// 創建標準的 Mock 實例設定
export const createStandardMockInstances = (
  userId: string = DEFAULT_IDS.userId,
) => {
  const mockSocketInstance = createMockSocket(userId, DEFAULT_IDS.socketId);
  const mockIoInstance = createMockIo();

  mockSocketInstance.data.userId = userId;

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
    mockDatabase.get.friendGroup.mockRejectedValue(dbError);
    mockDatabase.get.friendGroupFriends.mockRejectedValue(dbError);
  } else if (errorType === 'set') {
    // 確保前面的 get 操作成功，只有 set 失敗
    setupDefaultDatabaseMocks({
      user: testData.user,
      otherUser: testData.otherUser,
      friend1: testData.friend1,
      friend2: testData.friend2,
      friendGroup: testData.friendGroup,
      friendRelation1: testData.friendRelation1,
      friendRelation2: testData.friendRelation2,
      friendGroupFriends: testData.friendGroupFriends,
    } as any);

    (mockDatabase.set.friendGroup as any).mockRejectedValue(dbError);
  } else {
    // delete 錯誤
    setupDefaultDatabaseMocks({
      user: testData.user,
      otherUser: testData.otherUser,
      friend1: testData.friend1,
      friend2: testData.friend2,
      friendGroup: testData.friendGroup,
      friendRelation1: testData.friendRelation1,
      friendRelation2: testData.friendRelation2,
      friendGroupFriends: testData.friendGroupFriends,
    } as any);

    (mockDatabase.delete.friendGroup as any).mockRejectedValue(dbError);
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
      message: expect.stringContaining(expectedErrorMessage),
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
    user: testData.user,
    otherUser: testData.otherUser,
    friend1: testData.friend1,
    friend2: testData.friend2,
    friendGroup: testData.friendGroup,
    friendRelation1: testData.friendRelation1,
    friendRelation2: testData.friendRelation2,
    friendGroupFriends: testData.friendGroupFriends,
  } as any);
  mockDataValidator.validate.mockResolvedValue(testData);

  await handler.handle(mockIoInstance, mockSocketInstance, testData);

  // 檢查權限失敗的行為：不執行核心操作
  expect(mockDatabase.set.friendGroup).not.toHaveBeenCalled();
  expect(mockDatabase.delete.friendGroup).not.toHaveBeenCalled();

  // 檢查日誌記錄
  const mockWarnFromSetup = require('../../_testSetup').mockWarn;
  expect(mockWarnFromSetup).toHaveBeenCalledWith(
    expect.stringContaining(logMessage),
  );
};

// Mock UpdateFriendHandler 輔助函數
export const setupUpdateFriendHandlerMock = () => {
  const mockUpdateFriendHandler = {
    handle: jest.fn(),
  };

  jest.doMock('@/api/socket/events/friend/friend.handler', () => ({
    UpdateFriendHandler: mockUpdateFriendHandler,
  }));

  return { mockUpdateFriendHandler };
};

// 好友群組變種創建函數
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

// 好友變種創建函數
export const createFriendVariant = (
  baseFriend: Friend,
  overrides: Partial<Friend>,
): Friend => ({
  ...baseFriend,
  ...overrides,
});

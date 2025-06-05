import { jest } from '@jest/globals';
import {
  createMockIo,
  createMockSocket,
  mockDatabase,
  mockDataValidator,
  mockSocketServerGetSocket,
} from '../../_testSetup';
import { Friend, FriendApplication, User } from './_testTypes';

// 常用的測試數據ID
export const DEFAULT_IDS = {
  senderId: 'sender-user-id',
  receiverId: 'receiver-user-id',
  operatorUserId: 'operator-user-id',
  targetUserId: 'target-user-id',
  otherUserId: 'other-user-id',
  friendGroupId: 'friend-group-id',
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
  description: '想要成為好友',
  status: 'pending',
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
  friendGroupId: null,
  createdAt: DEFAULT_TIME,
  ...overrides,
});

// 創建預設測試資料
export const createDefaultTestData = () => {
  const senderUser = createDefaultUser(DEFAULT_IDS.senderId);
  const receiverUser = createDefaultUser(DEFAULT_IDS.receiverId);
  const operatorUser = createDefaultUser(DEFAULT_IDS.operatorUserId);
  const targetUser = createDefaultUser(DEFAULT_IDS.targetUserId);
  const otherUser = createDefaultUser(DEFAULT_IDS.otherUserId);

  const friendApplication = createDefaultFriendApplication(
    DEFAULT_IDS.senderId,
    DEFAULT_IDS.receiverId,
  );

  const friendRelation = createDefaultFriend(
    DEFAULT_IDS.operatorUserId,
    DEFAULT_IDS.targetUserId,
  );

  // 常用的測試資料變體創建函數
  const createFriendApplicationData = (
    overrides: Partial<{
      senderId: string;
      receiverId: string;
      friendApplication?: any;
      message?: string;
      description?: string;
    }> = {},
  ) => ({
    senderId: DEFAULT_IDS.senderId,
    receiverId: DEFAULT_IDS.receiverId,
    friendApplication: {
      description: '想要成為好友',
      ...overrides.friendApplication,
    },
    message: overrides.message,
    ...overrides,
  });

  const createApprovalData = (
    overrides: Partial<{
      userId: string;
      targetId: string;
      friend?: any;
    }> = {},
  ) => ({
    userId: DEFAULT_IDS.operatorUserId,
    targetId: DEFAULT_IDS.targetUserId,
    friend: {
      friendGroupId: null,
      ...overrides.friend,
    },
    ...overrides,
  });

  const createDeleteData = (
    overrides: Partial<{
      senderId: string;
      receiverId: string;
    }> = {},
  ) => ({
    senderId: DEFAULT_IDS.senderId,
    receiverId: DEFAULT_IDS.receiverId,
    ...overrides,
  });

  const createUpdateData = (
    overrides: Partial<{
      senderId: string;
      receiverId: string;
      friendApplication?: any;
    }> = {},
  ) => ({
    senderId: DEFAULT_IDS.senderId,
    receiverId: DEFAULT_IDS.receiverId,
    friendApplication: {
      description: '更新後的描述',
      ...overrides.friendApplication,
    },
    ...overrides,
  });

  return {
    senderUser,
    receiverUser,
    operatorUser,
    targetUser,
    otherUser,
    friendApplication,
    friendRelation,
    // 輔助資料建立函數
    createFriendApplicationData,
    createApprovalData,
    createDeleteData,
    createUpdateData,
  };
};

// 設定預設的資料庫 mock
export const setupDefaultDatabaseMocks = (
  testData: ReturnType<typeof createDefaultTestData>,
) => {
  // User mocks
  mockDatabase.get.user.mockImplementation(async (userId: string) => {
    if (userId === DEFAULT_IDS.senderId) return testData.senderUser as any;
    if (userId === DEFAULT_IDS.receiverId) return testData.receiverUser as any;
    if (userId === DEFAULT_IDS.operatorUserId)
      return testData.operatorUser as any;
    if (userId === DEFAULT_IDS.targetUserId) return testData.targetUser as any;
    if (userId === DEFAULT_IDS.otherUserId) return testData.otherUser as any;
    return null;
  });

  // FriendApplication mocks
  mockDatabase.get.friendApplication.mockResolvedValue(null); // 預設沒有好友申請，可以被覆蓋

  mockDatabase.get.userFriendApplication.mockResolvedValue(
    testData.friendApplication as any,
  );
  mockDatabase.get.userFriendApplications.mockResolvedValue([
    testData.friendApplication,
  ] as any);

  // Friend mocks
  mockDatabase.get.friend.mockResolvedValue(null); // 預設沒有好友關係
  mockDatabase.get.userFriends.mockResolvedValue([]);
  mockDatabase.get.userFriend.mockResolvedValue(testData.friendRelation as any);

  // Set operations
  (mockDatabase.set.friendApplication as any).mockResolvedValue(true);
  (mockDatabase.set.friend as any).mockResolvedValue(true);

  // Delete operations
  (mockDatabase.delete.friendApplication as any).mockResolvedValue(true);
  (mockDatabase.delete.friend as any).mockResolvedValue(true);

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
  const receiverSocket = createMockSocket(
    DEFAULT_IDS.receiverId,
    'receiver-socket-id',
  );
  const senderSocket = createMockSocket(
    DEFAULT_IDS.senderId,
    'sender-socket-id',
  );
  const targetSocket = createMockSocket(
    DEFAULT_IDS.targetUserId,
    'target-socket-id',
  );

  (mockSocketServerGetSocket as any).mockImplementation((userId: string) => {
    if (userId === DEFAULT_IDS.receiverId) return receiverSocket;
    if (userId === DEFAULT_IDS.senderId) return senderSocket;
    if (userId === DEFAULT_IDS.targetUserId) return targetSocket;
    return null;
  });

  return { receiverSocket, senderSocket, targetSocket };
};

// 創建標準的 Mock 實例設定
export const createStandardMockInstances = (
  userId: string = DEFAULT_IDS.senderId,
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
    mockDatabase.get.friendApplication.mockRejectedValue(dbError);
    mockDatabase.get.friend.mockRejectedValue(dbError);
  } else if (errorType === 'set') {
    // 確保前面的 get 操作成功，只有 set 失敗
    setupDefaultDatabaseMocks({
      senderUser: testData.senderUser,
      receiverUser: testData.receiverUser,
      operatorUser: testData.operatorUser,
      targetUser: testData.targetUser,
      otherUser: testData.otherUser,
      friendApplication: testData.friendApplication,
      friendRelation: testData.friendRelation,
    } as any);

    (mockDatabase.set.friendApplication as any).mockRejectedValue(dbError);
    (mockDatabase.set.friend as any).mockRejectedValue(dbError);
  } else {
    // delete 錯誤
    setupDefaultDatabaseMocks({
      senderUser: testData.senderUser,
      receiverUser: testData.receiverUser,
      operatorUser: testData.operatorUser,
      targetUser: testData.targetUser,
      otherUser: testData.otherUser,
      friendApplication: testData.friendApplication,
      friendRelation: testData.friendRelation,
    } as any);

    (mockDatabase.delete.friendApplication as any).mockRejectedValue(dbError);
    (mockDatabase.delete.friend as any).mockRejectedValue(dbError);
  }

  // 確保 validator 返回正確的數據
  if (testData) {
    mockDataValidator.validate.mockResolvedValue(testData);
  }

  await handler.handle(mockIoInstance, mockSocketInstance, testData);

  // 檢查是否為 ApproveFriendApplicationHandler，根據 handler 物件的名稱來判斷
  // 或者檢查 handler.handle 函數的字串內容是否包含 'FRIENDAPPROVAL'
  const handlerString = handler.handle.toString();
  const isApproveHandler =
    handlerString.includes('FRIENDAPPROVAL') ||
    handlerString.includes('ApproveFriendApplication');
  const expectedTag = isApproveHandler ? 'EXCEPTION_ERROR' : 'SERVER_ERROR';

  expect(mockSocketInstance.emit).toHaveBeenCalledWith(
    'error',
    expect.objectContaining({
      name: 'ServerError',
      message: expectedErrorMessage,
      tag: expectedTag,
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

// 權限檢查測試輔助函數 - 發送者權限
export const testSenderPermissionFailure = async (
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
    senderUser: testData.senderUser,
    receiverUser: testData.receiverUser,
    operatorUser: testData.operatorUser,
    targetUser: testData.targetUser,
    otherUser: testData.otherUser,
    friendApplication: testData.friendApplication,
    friendRelation: testData.friendRelation,
  } as any);
  mockDataValidator.validate.mockResolvedValue(testData);

  await handler.handle(mockIoInstance, mockSocketInstance, testData);

  // 檢查權限失敗的行為：不執行核心操作
  expect(mockDatabase.set.friendApplication).not.toHaveBeenCalled();
  expect(mockDatabase.delete.friendApplication).not.toHaveBeenCalled();

  // 檢查日誌記錄
  const mockWarn = require('../../_testSetup').mockWarn;
  expect(mockWarn).toHaveBeenCalledWith(expect.stringContaining(logMessage));
};

// 權限檢查測試輔助函數 - 接收者/操作者權限
export const testReceiverPermissionFailure = async (
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
    senderUser: testData.senderUser,
    receiverUser: testData.receiverUser,
    operatorUser: testData.operatorUser,
    targetUser: testData.targetUser,
    otherUser: testData.otherUser,
    friendApplication: testData.friendApplication,
    friendRelation: testData.friendRelation,
  } as any);
  mockDataValidator.validate.mockResolvedValue(testData);

  await handler.handle(mockIoInstance, mockSocketInstance, testData);

  // 檢查權限失敗的行為：不執行核心操作
  expect(mockDatabase.set.friendApplication).not.toHaveBeenCalled();
  expect(mockDatabase.delete.friendApplication).not.toHaveBeenCalled();
  expect(mockDatabase.set.friend).not.toHaveBeenCalled();

  // 檢查日誌記錄
  const mockWarn = require('../../_testSetup').mockWarn;
  expect(mockWarn).toHaveBeenCalledWith(expect.stringContaining(logMessage));
};

// Mock FriendHandlerServerSide 輔助函數
export const setupFriendHandlerMock = () => {
  const mockCreateFriend = jest.fn();
  const mockUpdateFriendGroup = jest.fn();

  jest.doMock('@/api/socket/events/friend/friend.handler', () => ({
    FriendHandlerServerSide: {
      createFriend: mockCreateFriend,
      updateFriendGroup: mockUpdateFriendGroup,
    },
  }));

  return { mockCreateFriend, mockUpdateFriendGroup };
};

// 好友申請變種創建函數
export const createFriendApplicationVariant = (
  baseFriendApplication: FriendApplication,
  overrides: Partial<FriendApplication>,
): FriendApplication => ({
  ...baseFriendApplication,
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

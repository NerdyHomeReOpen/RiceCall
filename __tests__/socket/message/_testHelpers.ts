import { jest } from '@jest/globals';
import {
  createMockIo,
  createMockSocket,
  mockDatabase,
  mockDataValidator,
} from '../../_testSetup';
import {
  ActionMessageContent,
  Channel,
  DirectMessageContent,
  Member,
  MessageContent,
  SendActionMessageRequest,
  SendDirectMessageRequest,
  SendMessageRequest,
  ServerChannel,
  ShakeWindowRequest,
  User,
  UserFriend,
} from './_testTypes';

// Mock SocketServer - 需要在jest.mock之前定義
export const mockSocketServer = {
  getSocket: jest.fn(),
};

// 常用的測試數據ID
export const DEFAULT_IDS = {
  operatorUserId: 'operator-user-id',
  targetUserId: 'target-user-id',
  serverId: 'server-id-123',
  channelId: 'channel-id-123',
  categoryId: 'category-id-123',
  socketId: 'test-socket-id',
  targetSocketId: 'target-socket-id',
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
  displayName: `用戶-${userId}`,
  currentServerId: null,
  currentChannelId: null,
  lastActiveAt: DEFAULT_TIME,
  ...overrides,
});

// 預設成員資料
export const createDefaultMember = (
  userId: string,
  serverId: string = DEFAULT_IDS.serverId,
  overrides: Partial<Member> = {},
): Member => ({
  userId,
  serverId,
  permissionLevel: 3, // 一般成員
  nickname: null,
  isBlocked: 0,
  createdAt: DEFAULT_TIME,
  lastMessageTime: DEFAULT_TIME,
  ...overrides,
});

// 預設頻道資料
export const createDefaultChannel = (
  channelId: string = DEFAULT_IDS.channelId,
  serverId: string = DEFAULT_IDS.serverId,
  overrides: Partial<Channel> = {},
): Channel => ({
  channelId,
  serverId,
  categoryId: DEFAULT_IDS.categoryId,
  name: '測試頻道',
  description: '測試用的頻道',
  forbidGuestUrl: false,
  createdAt: DEFAULT_TIME,
  ...overrides,
});

// 預設伺服器頻道資料
export const createDefaultServerChannel = (
  channelId: string,
  serverId: string = DEFAULT_IDS.serverId,
  overrides: Partial<ServerChannel> = {},
): ServerChannel => ({
  channelId,
  serverId,
  categoryId: DEFAULT_IDS.categoryId,
  name: `頻道-${channelId}`,
  description: '伺服器頻道',
  ...overrides,
});

// 預設用戶好友資料
export const createDefaultUserFriend = (
  userId: string,
  friendId: string,
  overrides: Partial<UserFriend> = {},
): UserFriend => ({
  userId,
  friendId,
  friendGroupId: 'default-group',
  displayName: '好友',
  addedAt: DEFAULT_TIME,
  ...overrides,
});

// 訊息變種創建函數
export const createMessageVariant = (
  baseMessage: MessageContent,
  overrides: Partial<MessageContent>,
): MessageContent => ({
  ...baseMessage,
  ...overrides,
});

export const createDirectMessageVariant = (
  baseMessage: DirectMessageContent,
  overrides: Partial<DirectMessageContent>,
): DirectMessageContent => ({
  ...baseMessage,
  ...overrides,
});

export const createActionMessageVariant = (
  baseMessage: ActionMessageContent,
  overrides: Partial<ActionMessageContent>,
): ActionMessageContent => ({
  ...baseMessage,
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

// 成員變種創建函數
export const createMemberVariant = (
  baseMember: Member,
  overrides: Partial<Member>,
): Member => ({
  ...baseMember,
  ...overrides,
});

// 頻道變種創建函數
export const createChannelVariant = (
  baseChannel: Channel,
  overrides: Partial<Channel>,
): Channel => ({
  ...baseChannel,
  ...overrides,
});

// 預設訊息內容
export const createDefaultMessageContent = (
  overrides: Partial<MessageContent> = {},
): MessageContent => ({
  content: '測試訊息內容',
  type: 'general',
  ...overrides,
});

// 預設直接訊息內容
export const createDefaultDirectMessageContent = (
  overrides: Partial<DirectMessageContent> = {},
): DirectMessageContent => ({
  content: '私人訊息內容',
  type: 'dm',
  ...overrides,
});

// 預設動作訊息內容
export const createDefaultActionMessageContent = (
  overrides: Partial<ActionMessageContent> = {},
): ActionMessageContent => ({
  content: '重要警告訊息',
  type: 'alert',
  ...overrides,
});

// 創建預設測試資料
export const createDefaultTestData = () => {
  const operatorUser = createDefaultUser(DEFAULT_IDS.operatorUserId, {
    username: 'testuser',
    displayName: '測試用戶',
  });

  const targetUser = createDefaultUser(DEFAULT_IDS.targetUserId, {
    username: 'targetuser',
    displayName: '目標用戶',
  });

  const operatorMember = createDefaultMember(DEFAULT_IDS.operatorUserId);
  const targetMember = createDefaultMember(DEFAULT_IDS.targetUserId);

  const channel = createDefaultChannel();

  const serverChannels = [
    createDefaultServerChannel('child-channel-1', DEFAULT_IDS.serverId, {
      categoryId: DEFAULT_IDS.categoryId,
      name: '子頻道1',
    }),
    createDefaultServerChannel('child-channel-2', DEFAULT_IDS.serverId, {
      categoryId: DEFAULT_IDS.categoryId,
      name: '子頻道2',
    }),
    createDefaultServerChannel('other-channel', DEFAULT_IDS.serverId, {
      categoryId: 'other-category',
      name: '其他頻道',
    }),
  ];

  const userFriend = createDefaultUserFriend(
    DEFAULT_IDS.targetUserId,
    DEFAULT_IDS.operatorUserId,
  );

  // 常用的測試資料創建函數
  const createSendMessageData = (
    overrides: Partial<SendMessageRequest> = {},
  ): SendMessageRequest => ({
    userId: DEFAULT_IDS.operatorUserId,
    serverId: DEFAULT_IDS.serverId,
    channelId: DEFAULT_IDS.channelId,
    message: createDefaultMessageContent(),
    ...overrides,
  });

  const createSendDirectMessageData = (
    overrides: Partial<SendDirectMessageRequest> = {},
  ): SendDirectMessageRequest => ({
    userId: DEFAULT_IDS.operatorUserId,
    targetId: DEFAULT_IDS.targetUserId,
    directMessage: createDefaultDirectMessageContent(),
    ...overrides,
  });

  const createSendActionMessageData = (
    overrides: Partial<SendActionMessageRequest> = {},
  ): SendActionMessageRequest => ({
    serverId: DEFAULT_IDS.serverId,
    channelId: DEFAULT_IDS.channelId,
    message: createDefaultActionMessageContent(),
    ...overrides,
  });

  const createShakeWindowData = (
    overrides: Partial<ShakeWindowRequest> = {},
  ): ShakeWindowRequest => ({
    userId: DEFAULT_IDS.operatorUserId,
    targetId: DEFAULT_IDS.targetUserId,
    ...overrides,
  });

  return {
    operatorUser,
    targetUser,
    operatorMember,
    targetMember,
    channel,
    serverChannels,
    userFriend,
    // 輔助資料建立函數
    createSendMessageData,
    createSendDirectMessageData,
    createSendActionMessageData,
    createShakeWindowData,
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
    return null;
  });

  // Member mocks - 支援動態 serverId
  mockDatabase.get.member.mockImplementation(
    async (userId: string, serverId: string) => {
      if (userId === DEFAULT_IDS.operatorUserId) {
        if (serverId === DEFAULT_IDS.serverId) {
          return testData.operatorMember as any;
        }
        // 為自定義 serverId 創建成員資料
        return createMemberVariant(testData.operatorMember, {
          serverId: serverId,
        }) as any;
      }
      if (userId === DEFAULT_IDS.targetUserId) {
        if (serverId === DEFAULT_IDS.serverId) {
          return testData.targetMember as any;
        }
        // 為自定義 serverId 創建成員資料
        return createMemberVariant(testData.targetMember, {
          serverId: serverId,
        }) as any;
      }
      return null;
    },
  );

  // Channel mocks - 支援動態 channelId
  mockDatabase.get.channel.mockImplementation(async (channelId: string) => {
    if (channelId === DEFAULT_IDS.channelId) {
      return testData.channel as any;
    }
    // 為自定義 channelId 創建頻道資料
    return createChannelVariant(testData.channel, {
      channelId: channelId,
    }) as any;
  });

  mockDatabase.get.serverChannels.mockResolvedValue(
    testData.serverChannels as any,
  );

  // Friend mocks
  mockDatabase.get.userFriend.mockResolvedValue(testData.userFriend as any);

  // Set operations
  (mockDatabase.set.member as any).mockResolvedValue(true);

  // Data validator mock
  mockDataValidator.validate.mockImplementation(
    async (schema, data, part) => data,
  );
};

// 創建標準的 Mock 實例設定
export const createStandardMockInstances = (
  operatorUserId: string = DEFAULT_IDS.operatorUserId,
) => {
  const mockSocketInstance = createMockSocket(
    operatorUserId,
    DEFAULT_IDS.socketId,
  );
  const mockIoInstance = createMockIo();

  mockSocketInstance.data.userId = operatorUserId;

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

  // 設定 SocketServer mock
  mockSocketServer.getSocket.mockReturnValue(null); // 預設用戶離線
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
  errorType: 'get' | 'set',
  errorMessage: string,
  expectedErrorMessage: string,
) => {
  const dbError = new Error(errorMessage);

  // 先清除所有 mock 並重新設定
  jest.clearAllMocks();

  if (errorType === 'get') {
    mockDatabase.get.user.mockRejectedValue(dbError);
    mockDatabase.get.member.mockRejectedValue(dbError);
    mockDatabase.get.channel.mockRejectedValue(dbError);
    mockDatabase.get.serverChannels.mockRejectedValue(dbError);
    mockDatabase.get.userFriend.mockRejectedValue(dbError);
  } else {
    // 確保前面的 get 操作成功，只有 set 失敗
    setupDefaultDatabaseMocks({
      operatorUser: testData.operatorUser,
      targetUser: testData.targetUser,
      operatorMember: testData.operatorMember,
      targetMember: testData.targetMember,
      channel: testData.channel,
      serverChannels: testData.serverChannels,
      userFriend: testData.userFriend,
    } as any);

    (mockDatabase.set.member as any).mockRejectedValue(dbError);
  }

  // 確保 validator 返回正確的數據
  if (testData) {
    mockDataValidator.validate.mockResolvedValue(testData);
  }

  await handler.handle(mockIoInstance, mockSocketInstance, testData);

  // 檢查錯誤 - 支援不同的錯誤標籤
  expect(mockSocketInstance.emit).toHaveBeenCalledWith(
    'error',
    expect.objectContaining({
      name: 'ServerError',
      message: expectedErrorMessage,
      statusCode: 500,
      tag: expect.stringMatching(/^(SERVER_ERROR)$/),
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

// 權限檢查測試輔助函數 - 權限不足
export const testInsufficientPermission = async (
  handler: any,
  mockSocketInstance: any,
  mockIoInstance: any,
  testData: any,
  operatorPermission: number,
  logMessage: string,
) => {
  jest.clearAllMocks();

  // 設定操作者權限不足
  const modifiedTestData = {
    ...testData,
    operatorMember: {
      ...testData.operatorMember,
      permissionLevel: operatorPermission,
    },
  };

  setupDefaultDatabaseMocks(modifiedTestData);
  mockDataValidator.validate.mockResolvedValue(testData);

  await handler.handle(mockIoInstance, mockSocketInstance, testData);

  // 檢查權限失敗的行為：不執行核心操作
  expect(mockDatabase.set.member).not.toHaveBeenCalled();

  // 檢查日誌記錄 - Message handlers 會記錄 warn 訊息然後 return
  const mockWarnFromSetup = require('../../_testSetup').mockWarn;
  expect(mockWarnFromSetup).toHaveBeenCalledWith(
    expect.stringContaining(logMessage),
  );
};

// 設定目標用戶在線的輔助函數
export const setupTargetUserOnline = (
  targetUserId: string = DEFAULT_IDS.targetUserId,
) => {
  const targetSocket = createMockSocket(
    targetUserId,
    DEFAULT_IDS.targetSocketId,
  );
  mockSocketServer.getSocket.mockReturnValue(targetSocket);
  return targetSocket;
};

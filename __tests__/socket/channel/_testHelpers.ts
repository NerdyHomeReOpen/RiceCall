import { jest } from '@jest/globals';
import {
  createMockSocket,
  mockDatabase,
  mockDataValidator,
  mockSocketServerGetSocket,
} from '../../_testSetup';
import {
  Channel,
  ChannelType,
  ChannelVisibility,
  Member,
  ServerType,
  User,
  VoiceMode,
} from './_testTypes';

// 常用的測試數據ID
export const DEFAULT_IDS = {
  operatorUserId: 'operator-user-id',
  targetUserId: 'target-user-id',
  serverId: 'test-server-id',
  lobbyChannelId: 'lobby-channel-id',
  regularChannelId: 'regular-channel-id',
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
  currentServerId: DEFAULT_IDS.serverId,
  currentChannelId: DEFAULT_IDS.lobbyChannelId,
  lastActiveAt: DEFAULT_TIME,
  ...overrides,
});

// 預設頻道資料創建函數
export const createDefaultChannel = (
  channelId: string,
  overrides: Partial<Channel> = {},
): Channel => ({
  channelId,
  name: `測試頻道-${channelId}`,
  type: ChannelType.TEXT,
  serverId: DEFAULT_IDS.serverId,
  isLobby: false,
  visibility: ChannelVisibility.PUBLIC,
  voiceMode: VoiceMode.FREE,
  userLimit: 0,
  password: null,
  categoryId: null,
  ...overrides,
});

// 預設伺服器資料創建函數
export const createDefaultServer = (
  serverId: string,
  overrides: Partial<ServerType> = {},
): ServerType => ({
  serverId,
  name: `測試伺服器-${serverId}`,
  visibility: 'public',
  lobbyId: DEFAULT_IDS.lobbyChannelId,
  ownerId: 'owner-user-id',
  ...overrides,
});

// 預設成員資料創建函數
export const createDefaultMember = (
  userId: string,
  serverId: string,
  permissionLevel: number = 6,
): Member => ({
  userId,
  serverId,
  permissionLevel,
});

// 創建默認測試數據
export const createDefaultTestData = () => {
  const operatorUser = createDefaultUser(DEFAULT_IDS.operatorUserId);
  const targetUser = createDefaultUser(DEFAULT_IDS.targetUserId, {
    currentChannelId: 'other-channel-id',
  });

  const mockServerData = createDefaultServer(DEFAULT_IDS.serverId);

  const mockLobbyChannelData = createDefaultChannel(
    DEFAULT_IDS.lobbyChannelId,
    {
      name: '大廳',
      isLobby: true,
    },
  );

  const mockRegularChannelData = createDefaultChannel(
    DEFAULT_IDS.regularChannelId,
    {
      name: '一般頻道',
    },
  );

  const mockOperatorMember = createDefaultMember(
    DEFAULT_IDS.operatorUserId,
    DEFAULT_IDS.serverId,
    6,
  );

  const mockTargetMember = createDefaultMember(
    DEFAULT_IDS.targetUserId,
    DEFAULT_IDS.serverId,
    2,
  );

  // 常用的測試資料變體
  const createChannelData = (
    overrides: Partial<{
      serverId: string;
      channel: any;
    }> = {},
  ) => ({
    serverId: DEFAULT_IDS.serverId,
    channel: {
      name: 'Test Channel',
      categoryId: DEFAULT_IDS.regularChannelId,
      type: 'channel',
      ...overrides.channel,
    },
    ...overrides,
  });

  const createConnectData = (
    overrides: Partial<{
      userId: string;
      channelId: string;
      serverId: string;
      password: string | null;
    }> = {},
  ) => ({
    userId: DEFAULT_IDS.operatorUserId,
    channelId: DEFAULT_IDS.regularChannelId,
    serverId: DEFAULT_IDS.serverId,
    password: null,
    ...overrides,
  });

  const createUpdateData = (
    channelId: string = DEFAULT_IDS.regularChannelId,
    updates: Partial<Channel> = {},
  ) => ({
    channelId,
    channel: updates,
  });

  return {
    operatorUser,
    targetUser,
    mockServerData,
    mockLobbyChannelData,
    mockRegularChannelData,
    mockOperatorMember,
    mockTargetMember,
    // 輔助資料建立函數
    createChannelData,
    createConnectData,
    createUpdateData,
  };
};

// 設置默認的 Database Mock
export const setupDefaultDatabaseMocks = (
  testData: ReturnType<typeof createDefaultTestData>,
) => {
  const {
    operatorUser,
    targetUser,
    mockServerData,
    mockLobbyChannelData,
    mockRegularChannelData,
    mockOperatorMember,
    mockTargetMember,
  } = testData;

  // User mocks
  mockDatabase.get.user.mockImplementation(async (userId: string) => {
    if (userId === operatorUser.userId) return operatorUser as any;
    if (userId === targetUser.userId) return targetUser as any;
    return null;
  });

  // Server mocks
  mockDatabase.get.server.mockResolvedValue(mockServerData as any);

  // Channel mocks
  mockDatabase.get.channel.mockImplementation(async (channelId: string) => {
    if (channelId === mockLobbyChannelData.channelId)
      return mockLobbyChannelData as any;
    if (channelId === mockRegularChannelData.channelId)
      return mockRegularChannelData as any;
    return null;
  });

  // Channel users mock
  mockDatabase.get.channelUsers.mockResolvedValue([]);

  // Member mocks
  mockDatabase.get.member.mockImplementation(
    async (userId: string, serverId: string) => {
      if (serverId !== mockServerData.serverId) return null;
      if (userId === operatorUser.userId) return mockOperatorMember as any;
      if (userId === targetUser.userId) return mockTargetMember as any;
      return null;
    },
  );

  // Set operations
  mockDatabase.set.user.mockResolvedValue(true as any);
  mockDatabase.set.member.mockResolvedValue(true as any);
  mockDatabase.set.channel.mockResolvedValue(true as any);
  mockDatabase.delete.channel.mockResolvedValue(true as any);

  // Server channels mock (for createChannel tests)
  mockDatabase.get.serverChannels.mockResolvedValue([]);

  // Data validator mock
  mockDataValidator.validate.mockImplementation(
    async (schema, data, part) => data,
  );
};

// 設置 Socket Mocks
export const setupSocketMocks = (
  testData: ReturnType<typeof createDefaultTestData>,
) => {
  const { targetUser } = testData;

  const targetMockSocket = createMockSocket(
    targetUser.userId,
    'target-socket-id',
  );
  targetMockSocket.data.userId = targetUser.userId;

  mockSocketServerGetSocket.mockImplementation((userIdToGet) => {
    if (userIdToGet === targetUser.userId) return targetMockSocket;
    return undefined;
  });

  return { targetMockSocket };
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
    mockDatabase.get.channel.mockRejectedValue(dbError);
    mockDatabase.get.server.mockRejectedValue(dbError);
    mockDatabase.get.member.mockRejectedValue(dbError);
  } else if (errorType === 'set') {
    // 確保前面的 get 操作成功，只有 set 失敗
    if (testData?.operatorUser) {
      mockDatabase.get.user.mockResolvedValue(testData.operatorUser);
    }
    if (testData?.mockRegularChannelData) {
      mockDatabase.get.channel.mockResolvedValue(
        testData.mockRegularChannelData,
      );
    }
    if (testData?.mockServerData) {
      mockDatabase.get.server.mockResolvedValue(testData.mockServerData);
    }
    if (testData?.mockOperatorMember) {
      mockDatabase.get.member.mockResolvedValue(testData.mockOperatorMember);
    }

    mockDatabase.set.user.mockRejectedValue(dbError);
    mockDatabase.set.channel.mockRejectedValue(dbError);
    mockDatabase.set.member.mockRejectedValue(dbError);
  } else {
    // delete 錯誤
    if (testData?.operatorUser) {
      mockDatabase.get.user.mockResolvedValue(testData.operatorUser);
    }
    if (testData?.mockRegularChannelData) {
      mockDatabase.get.channel.mockResolvedValue(
        testData.mockRegularChannelData,
      );
    }
    mockDatabase.delete.channel.mockRejectedValue(dbError);
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
      tag: 'SERVER_ERROR',
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
  lowPermissionLevel: number,
  logMessage: string,
) => {
  jest.clearAllMocks();

  // 設定低權限成員
  const lowPermMember = createDefaultMember(
    DEFAULT_IDS.operatorUserId,
    DEFAULT_IDS.serverId,
    lowPermissionLevel,
  );

  setupDefaultDatabaseMocks(testData);
  mockDatabase.get.member.mockResolvedValue(lowPermMember as any);
  mockDataValidator.validate.mockResolvedValue(testData);

  await handler.handle(mockIoInstance, mockSocketInstance, testData);

  // 檢查權限失敗的行為：不執行核心操作
  expect(mockDatabase.set.channel).not.toHaveBeenCalled();
  expect(mockDatabase.delete.channel).not.toHaveBeenCalled();

  // 檢查日誌記錄
  const mockWarn = require('../../_testSetup').mockWarn;
  expect(mockWarn).toHaveBeenCalledWith(expect.stringContaining(logMessage));
};

// 創建基本連接數據
export const createConnectData = (
  overrides: Partial<{
    userId: string;
    channelId: string;
    serverId: string;
    password: string | null;
  }> = {},
) => ({
  userId: DEFAULT_IDS.operatorUserId,
  channelId: DEFAULT_IDS.regularChannelId,
  serverId: DEFAULT_IDS.serverId,
  password: null,
  ...overrides,
});

// 權限測試輔助函數
export const createMemberWithPermission = (
  userId: string,
  serverId: string,
  permissionLevel: number,
): Member => ({
  userId,
  serverId,
  permissionLevel,
});

// 頻道變種創建函數
export const createChannelVariant = (
  baseChannel: Channel,
  overrides: Partial<Channel>,
): Channel => ({
  ...baseChannel,
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

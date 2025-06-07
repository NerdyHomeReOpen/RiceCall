import { jest } from '@jest/globals';
import {
  createMockIo,
  createMockSocket,
  mockDataValidator,
  mockDatabase,
} from '../../_testSetup';
import {
  Channel,
  ConnectServerRequest,
  CreateServerRequest,
  DisconnectServerRequest,
  FavoriteServerRequest,
  Member,
  SearchServerRequest,
  Server,
  ServerSearchResult,
  UpdateServerRequest,
  User,
  UserServer,
} from './_testTypes';

// Mock handlers - 需要在 beforeEach 中定義
export const mockCreateMemberHandler = {
  handle: jest.fn() as jest.MockedFunction<any>,
};
export const mockConnectServerHandler = {
  handle: jest.fn() as jest.MockedFunction<any>,
};
export const mockConnectChannelHandler = {
  handle: jest.fn() as jest.MockedFunction<any>,
};
export const mockDisconnectChannelHandler = {
  handle: jest.fn() as jest.MockedFunction<any>,
};
export const mockSocketServer = {
  getSocket: jest.fn() as jest.MockedFunction<any>,
};
export const mockGenerateUniqueDisplayId =
  jest.fn() as jest.MockedFunction<any>;

// 常用的測試數據ID
export const DEFAULT_IDS = {
  operatorUserId: 'operator-user-id',
  targetUserId: 'target-user-id',
  serverId: 'server-id-123',
  lobbyId: 'lobby-id-123',
  receptionLobbyId: 'reception-lobby-id-123',
  channelId: 'channel-id-123',
  socketId: 'test-socket-id',
  displayId: 'DISPLAY123',
} as const;

// 預設時間
export const DEFAULT_TIME = 1640995200000;

// 變種創建函數
export const createUserVariant = (
  baseUser: User,
  overrides: Partial<User>,
): User => ({
  ...baseUser,
  ...overrides,
});

export const createServerVariant = (
  baseServer: Server,
  overrides: Partial<Server>,
): Server => ({
  ...baseServer,
  ...overrides,
});

export const createMemberVariant = (
  baseMember: Member,
  overrides: Partial<Member>,
): Member => ({
  ...baseMember,
  ...overrides,
});

export const createChannelVariant = (
  baseChannel: Channel,
  overrides: Partial<Channel>,
): Channel => ({
  ...baseChannel,
  ...overrides,
});

export const createUserServerVariant = (
  baseUserServer: UserServer,
  overrides: Partial<UserServer>,
): UserServer => ({
  ...baseUserServer,
  ...overrides,
});

// 預設使用者資料
export const createDefaultUser = (
  userId: string = DEFAULT_IDS.operatorUserId,
  overrides: Partial<User> = {},
): User => ({
  userId,
  username: 'testuser',
  displayName: '測試用戶',
  level: 10,
  currentServerId: null,
  currentChannelId: null,
  lastActiveAt: DEFAULT_TIME,
  ...overrides,
});

// 預設伺服器資料
export const createDefaultServer = (
  serverId: string = DEFAULT_IDS.serverId,
  ownerId: string = DEFAULT_IDS.operatorUserId,
  overrides: Partial<Server> = {},
): Server => ({
  serverId,
  name: '測試伺服器',
  description: '這是一個測試伺服器',
  type: 'game',
  visibility: 'public',
  displayId: DEFAULT_IDS.displayId,
  ownerId,
  lobbyId: DEFAULT_IDS.lobbyId,
  receptionLobbyId: DEFAULT_IDS.receptionLobbyId,
  createdAt: DEFAULT_TIME,
  ...overrides,
});

// 預設成員資料
export const createDefaultMember = (
  userId: string = DEFAULT_IDS.operatorUserId,
  serverId: string = DEFAULT_IDS.serverId,
  overrides: Partial<Member> = {},
): Member => ({
  userId,
  serverId,
  permissionLevel: 3,
  nickname: null,
  isBlocked: 0,
  createdAt: DEFAULT_TIME,
  ...overrides,
});

// 預設頻道資料
export const createDefaultChannel = (
  channelId: string = DEFAULT_IDS.lobbyId,
  serverId: string = DEFAULT_IDS.serverId,
  overrides: Partial<Channel> = {},
): Channel => ({
  channelId,
  serverId,
  categoryId: null,
  name: '大廳',
  description: '伺服器大廳',
  isLobby: true,
  createdAt: DEFAULT_TIME,
  ...overrides,
});

// 預設用戶伺服器關係資料
export const createDefaultUserServer = (
  userId: string = DEFAULT_IDS.operatorUserId,
  serverId: string = DEFAULT_IDS.serverId,
  overrides: Partial<UserServer> = {},
): UserServer => ({
  userId,
  serverId,
  owned: false,
  favorite: false,
  recent: true,
  timestamp: DEFAULT_TIME,
  ...overrides,
});

// 創建預設測試資料
export const createDefaultTestData = () => {
  const operatorUser = createDefaultUser(DEFAULT_IDS.operatorUserId);
  const targetUser = createDefaultUser(DEFAULT_IDS.targetUserId, {
    username: 'targetuser',
    displayName: '目標用戶',
  });
  const defaultServer = createDefaultServer();
  const operatorMember = createDefaultMember(DEFAULT_IDS.operatorUserId);
  const targetMember = createDefaultMember(
    DEFAULT_IDS.targetUserId,
    DEFAULT_IDS.serverId,
    {
      permissionLevel: 1,
    },
  );
  const lobbyChannel = createDefaultChannel();
  const operatorUserServer = createDefaultUserServer();

  // 常用的測試資料創建函數
  const createCreateServerData = (
    overrides: Partial<CreateServerRequest> = {},
  ): CreateServerRequest => ({
    server: {
      name: '新伺服器',
      description: '這是一個測試伺服器',
      type: 'game',
      visibility: 'public',
    },
    ...overrides,
  });

  const createConnectServerData = (
    overrides: Partial<ConnectServerRequest> = {},
  ): ConnectServerRequest => ({
    userId: DEFAULT_IDS.operatorUserId,
    serverId: DEFAULT_IDS.serverId,
    ...overrides,
  });

  const createDisconnectServerData = (
    overrides: Partial<DisconnectServerRequest> = {},
  ): DisconnectServerRequest => ({
    userId: DEFAULT_IDS.operatorUserId,
    serverId: DEFAULT_IDS.serverId,
    ...overrides,
  });

  const createUpdateServerData = (
    overrides: Partial<UpdateServerRequest> = {},
  ): UpdateServerRequest => ({
    serverId: DEFAULT_IDS.serverId,
    server: {
      name: '更新的伺服器名稱',
      description: '更新的描述',
    },
    ...overrides,
  });

  const createSearchServerData = (
    overrides: Partial<SearchServerRequest> = {},
  ): SearchServerRequest => ({
    query: '測試伺服器',
    ...overrides,
  });

  const createFavoriteServerData = (
    overrides: Partial<FavoriteServerRequest> = {},
  ): FavoriteServerRequest => ({
    serverId: DEFAULT_IDS.serverId,
    ...overrides,
  });

  return {
    operatorUser,
    targetUser,
    defaultServer,
    operatorMember,
    targetMember,
    lobbyChannel,
    operatorUserServer,
    // 輔助資料建立函數
    createCreateServerData,
    createConnectServerData,
    createDisconnectServerData,
    createUpdateServerData,
    createSearchServerData,
    createFavoriteServerData,
  };
};

// 創建標準的 Mock 實例設定
export const createStandardMockInstances = (
  operatorUserId: string = DEFAULT_IDS.operatorUserId,
  socketId: string = DEFAULT_IDS.socketId,
) => {
  const mockSocketInstance = createMockSocket(operatorUserId, socketId);
  const mockIoInstance = createMockIo();

  mockSocketInstance.data.userId = operatorUserId;

  return { mockSocketInstance, mockIoInstance };
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

  // Server mocks
  mockDatabase.get.server.mockImplementation(async (serverId: string) => {
    if (serverId === DEFAULT_IDS.serverId) return testData.defaultServer as any;
    return null;
  });

  // Member mocks
  mockDatabase.get.member.mockImplementation(
    async (userId: string, serverId: string) => {
      if (
        userId === DEFAULT_IDS.operatorUserId &&
        serverId === DEFAULT_IDS.serverId
      ) {
        return testData.operatorMember as any;
      }
      if (
        userId === DEFAULT_IDS.targetUserId &&
        serverId === DEFAULT_IDS.serverId
      ) {
        return testData.targetMember as any;
      }
      return null;
    },
  );

  // Channel mocks
  mockDatabase.get.channel.mockImplementation(async (channelId: string) => {
    if (channelId === DEFAULT_IDS.lobbyId) return testData.lobbyChannel as any;
    return null;
  });

  // UserServer mocks
  mockDatabase.get.userServer.mockResolvedValue(
    testData.operatorUserServer as any,
  );
  mockDatabase.get.userServers.mockResolvedValue([
    testData.operatorUserServer,
  ] as any);

  // 其他查詢 mocks
  mockDatabase.get.serverChannels.mockResolvedValue([
    testData.lobbyChannel,
  ] as any);
  mockDatabase.get.serverOnlineMembers.mockResolvedValue([
    testData.operatorMember,
  ] as any);
  mockDatabase.get.serverMember.mockResolvedValue(
    testData.operatorMember as any,
  );
  mockDatabase.get.serverMemberApplications.mockResolvedValue([]);
  mockDatabase.get.channelUsers.mockResolvedValue([
    testData.operatorUser,
  ] as any);

  // Set operations - 預設成功
  mockDatabase.set.server.mockResolvedValue(true);
  mockDatabase.set.user.mockResolvedValue(true);
  mockDatabase.set.member.mockResolvedValue(true);
  mockDatabase.set.channel.mockResolvedValue(true);
  mockDatabase.set.userServer.mockResolvedValue(true);

  // Search mocks
  mockDatabase.get.searchServer.mockResolvedValue([]);
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

  // Data validator mock - 設定預設回傳值
  mockDataValidator.validate.mockImplementation(
    async (schema, data, part) => data,
  );

  // 設定預設的資料庫 mock
  setupDefaultDatabaseMocks(testData);

  // Mock handlers
  mockCreateMemberHandler.handle.mockResolvedValue(undefined);
  mockConnectServerHandler.handle.mockResolvedValue(undefined);
  mockConnectChannelHandler.handle.mockResolvedValue(undefined);
  mockDisconnectChannelHandler.handle.mockResolvedValue(undefined);
  mockSocketServer.getSocket.mockReturnValue(mockSocketInstance);
  mockGenerateUniqueDisplayId.mockResolvedValue(DEFAULT_IDS.displayId);
};

// Connect/Disconnect 專用的 beforeEach 設定
export const setupConnectDisconnectBeforeEach = (
  mockSocketInstance: any,
  mockIoInstance: any,
  testData: ReturnType<typeof createDefaultTestData>,
) => {
  jest.clearAllMocks();

  // Mock Date.now()
  jest.spyOn(Date, 'now').mockReturnValue(DEFAULT_TIME);

  // Data validator mock
  mockDataValidator.validate.mockImplementation(
    async (schema, data, part) => data,
  );

  // 設定 connect/disconnect 特有的 mock
  setupDefaultDatabaseMocks(testData);

  // 專用的 handler mocks
  mockConnectChannelHandler.handle.mockResolvedValue(undefined);
  mockDisconnectChannelHandler.handle.mockResolvedValue(undefined);
  mockSocketServer.getSocket.mockReturnValue(mockSocketInstance);
};

// 通用的 afterEach 清理
export const setupAfterEach = () => {
  jest.restoreAllMocks();
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
    mockDatabase.get.server.mockRejectedValue(dbError);
    mockDatabase.get.member.mockRejectedValue(dbError);
    mockDatabase.get.searchServer.mockRejectedValue(dbError);
    mockDatabase.get.userServer.mockRejectedValue(dbError);
    mockDatabase.get.userServers.mockRejectedValue(dbError);
  } else {
    // 確保前面的 get 操作成功，只有 set 失敗
    const {
      operatorUser,
      targetUser,
      defaultServer,
      operatorMember,
      targetMember,
      lobbyChannel,
      operatorUserServer,
    } = testData;

    setupDefaultDatabaseMocks({
      operatorUser,
      targetUser,
      defaultServer,
      operatorMember,
      targetMember,
      lobbyChannel,
      operatorUserServer,
    } as any);

    // 讓 set 操作失敗
    mockDatabase.set.server.mockRejectedValue(dbError);
    mockDatabase.set.user.mockRejectedValue(dbError);
    mockDatabase.set.member.mockRejectedValue(dbError);
    mockDatabase.set.channel.mockRejectedValue(dbError);
    mockDatabase.set.userServer.mockRejectedValue(dbError);
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

// 統一權限不足測試輔助函數
export const testInsufficientPermission = async (
  handler: any,
  mockSocketInstance: any,
  mockIoInstance: any,
  testData: any,
  lowPermissionMember: Member,
  expectationType: 'warning' | 'none' = 'warning',
) => {
  jest.clearAllMocks();

  // 設定 validator 正常運作
  mockDataValidator.validate.mockResolvedValue(testData);

  // 設定低權限成員
  mockDatabase.get.member.mockResolvedValue(lowPermissionMember as any);

  await handler.handle(mockIoInstance, mockSocketInstance, testData);

  if (expectationType === 'warning') {
    // 檢查權限失敗的行為：不執行核心操作
    expect(mockDatabase.set.server).not.toHaveBeenCalled();
    expect(mockDatabase.set.member).not.toHaveBeenCalled();
    expect(mockDatabase.set.channel).not.toHaveBeenCalled();

    // 檢查日誌記錄 - 匹配英文或中文的權限相關訊息
    const mockWarn = require('../../_testSetup').mockWarn;
    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringMatching('Not enough permission'),
    );
  }
  // expectationType === 'none' 表示靜默失敗，不檢查特定行為
};

// 創建搜尋結果資料
export const createSearchResults = (
  count: number = 2,
): ServerSearchResult[] => {
  return Array.from({ length: count }, (_, i) => ({
    serverId: `server-${i + 1}`,
    name: `測試伺服器${i + 1}`,
    description: `這是第${i + 1}個測試伺服器`,
    type: 'game',
    visibility: 'public',
    displayId: `DISPLAY${i + 1}`,
  }));
};

// 創建多個用戶伺服器關係
export const createUserServers = (
  count: number,
  baseUserServer: UserServer,
): UserServer[] => {
  return Array.from({ length: count }, (_, i) => ({
    ...baseUserServer,
    serverId: `server-${i + 1}`,
    owned: i === 0, // 第一個是擁有的
  }));
};

// 創建多個成員
export const createMembers = (
  count: number,
  serverId: string = DEFAULT_IDS.serverId,
): Member[] => {
  return Array.from({ length: count }, (_, i) =>
    createDefaultMember(`user-${i + 1}`, serverId, {
      permissionLevel: i === 0 ? 6 : Math.floor(Math.random() * 5) + 1,
    }),
  );
};

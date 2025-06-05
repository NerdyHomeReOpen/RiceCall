import { jest } from '@jest/globals';
import {
  createMockIo,
  createMockSocket,
  mockDatabase,
  mockDataValidator,
} from '../../_testSetup';
import {
  Member,
  MemberApplication,
  Server,
  ServerMember,
  User,
  UserServer,
} from './_testTypes';

// Mock SocketServer - 需要在jest.mock之前定義
export const mockSocketServer = {
  getSocket: jest.fn(),
  io: {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  },
};

// 常用的測試數據ID
export const DEFAULT_IDS = {
  operatorUserId: 'operator-user-id',
  targetUserId: 'target-user-id',
  serverId: 'server-id-123',
  ownerUserId: 'owner-user-id',
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

// 預設伺服器資料
export const createDefaultServer = (
  serverId: string = DEFAULT_IDS.serverId,
  ownerId: string = DEFAULT_IDS.ownerUserId,
  overrides: Partial<Server> = {},
): Server => ({
  serverId,
  ownerId,
  name: '測試伺服器',
  description: '測試用的伺服器',
  createdAt: DEFAULT_TIME,
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
  permissionLevel: 2,
  nickname: null,
  isBlocked: 0,
  createdAt: DEFAULT_TIME,
  ...overrides,
});

// 預設 UserServer 資料
export const createDefaultUserServer = (
  userId: string,
  serverId: string = DEFAULT_IDS.serverId,
  overrides: Partial<UserServer> = {},
): UserServer => ({
  userId,
  serverId,
  timestamp: DEFAULT_TIME,
  ...overrides,
});

// 預設 ServerMember 資料
export const createDefaultServerMember = (
  userId: string,
  serverId: string = DEFAULT_IDS.serverId,
  overrides: Partial<ServerMember> = {},
): ServerMember => ({
  userId,
  serverId,
  permissionLevel: 2,
  nickname: null,
  isBlocked: 0,
  ...overrides,
});

// 預設成員申請資料
export const createDefaultMemberApplication = (
  userId: string,
  serverId: string = DEFAULT_IDS.serverId,
  overrides: Partial<MemberApplication> = {},
): MemberApplication => ({
  userId,
  serverId,
  message: '請求加入伺服器',
  createdAt: DEFAULT_TIME,
  ...overrides,
});

// 創建預設測試資料
export const createDefaultTestData = () => {
  const operatorUser = createDefaultUser(DEFAULT_IDS.operatorUserId);
  const targetUser = createDefaultUser(DEFAULT_IDS.targetUserId);
  const ownerUser = createDefaultUser(DEFAULT_IDS.ownerUserId);

  const server = createDefaultServer();

  const operatorMember = createDefaultMember(
    DEFAULT_IDS.operatorUserId,
    DEFAULT_IDS.serverId,
    {
      permissionLevel: 5, // 伺服器管理員
    },
  );

  const targetMember = createDefaultMember(
    DEFAULT_IDS.targetUserId,
    DEFAULT_IDS.serverId,
    {
      permissionLevel: 2, // 一般成員
    },
  );

  const ownerMember = createDefaultMember(
    DEFAULT_IDS.ownerUserId,
    DEFAULT_IDS.serverId,
    {
      permissionLevel: 6, // 擁有者
    },
  );

  const userServer = createDefaultUserServer(DEFAULT_IDS.targetUserId);
  const serverMember = createDefaultServerMember(DEFAULT_IDS.targetUserId);

  // 常用的測試資料變體創建函數
  const createMemberCreateData = (
    overrides: Partial<{
      userId: string;
      serverId?: string;
      member?: any;
    }> = {},
  ) => ({
    userId: DEFAULT_IDS.targetUserId,
    serverId: DEFAULT_IDS.serverId,
    member: {
      permissionLevel: 2,
      nickname: null,
      isBlocked: 0,
      ...overrides.member,
    },
    ...overrides,
  });

  const createMemberUpdateData = (
    overrides: Partial<{
      userId: string;
      serverId?: string;
      member?: any;
    }> = {},
  ) => ({
    userId: DEFAULT_IDS.targetUserId,
    serverId: DEFAULT_IDS.serverId,
    member: {
      nickname: '新暱稱',
      permissionLevel: 2,
      ...overrides.member,
    },
    ...overrides,
  });

  const createMemberDeleteData = (
    overrides: Partial<{
      userId: string;
      serverId?: string;
    }> = {},
  ) => ({
    userId: DEFAULT_IDS.targetUserId,
    serverId: DEFAULT_IDS.serverId,
    ...overrides,
  });

  return {
    operatorUser,
    targetUser,
    ownerUser,
    server,
    operatorMember,
    targetMember,
    ownerMember,
    userServer,
    serverMember,
    // 輔助資料建立函數
    createMemberCreateData,
    createMemberUpdateData,
    createMemberDeleteData,
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
    if (userId === DEFAULT_IDS.ownerUserId) return testData.ownerUser as any;
    return null;
  });

  // Server mocks
  mockDatabase.get.server.mockResolvedValue(testData.server as any);

  // Member mocks
  mockDatabase.get.member.mockImplementation(async (userId: string) => {
    if (userId === DEFAULT_IDS.operatorUserId)
      return testData.operatorMember as any;
    if (userId === DEFAULT_IDS.targetUserId)
      return testData.targetMember as any;
    if (userId === DEFAULT_IDS.ownerUserId) return testData.ownerMember as any;
    return null;
  });

  // UserServer and ServerMember mocks
  mockDatabase.get.userServer.mockResolvedValue(testData.userServer as any);
  mockDatabase.get.serverMember.mockResolvedValue(testData.serverMember as any);

  // Set operations
  (mockDatabase.set.member as any).mockResolvedValue(true);
  (mockDatabase.set.userServer as any).mockResolvedValue(true);

  // Delete operations
  (mockDatabase.delete.member as any).mockResolvedValue(true);
  (mockDatabase.delete.memberApplication as any).mockResolvedValue(true);

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
  errorType: 'get' | 'set' | 'delete',
  errorMessage: string,
  expectedErrorMessage: string,
) => {
  const dbError = new Error(errorMessage);

  // 先清除所有 mock 並重新設定
  jest.clearAllMocks();

  if (errorType === 'get') {
    mockDatabase.get.user.mockRejectedValue(dbError);
    mockDatabase.get.server.mockRejectedValue(dbError);
    mockDatabase.get.member.mockRejectedValue(dbError);
  } else if (errorType === 'set') {
    // 確保前面的 get 操作成功，只有 set 失敗
    setupDefaultDatabaseMocks({
      operatorUser: testData.operatorUser,
      targetUser: testData.targetUser,
      ownerUser: testData.ownerUser,
      server: testData.server,
      operatorMember: testData.operatorMember,
      targetMember: testData.targetMember,
      ownerMember: testData.ownerMember,
      userServer: testData.userServer,
      serverMember: testData.serverMember,
    } as any);

    (mockDatabase.set.member as any).mockRejectedValue(dbError);
  } else {
    // delete 錯誤
    setupDefaultDatabaseMocks({
      operatorUser: testData.operatorUser,
      targetUser: testData.targetUser,
      ownerUser: testData.ownerUser,
      server: testData.server,
      operatorMember: testData.operatorMember,
      targetMember: testData.targetMember,
      ownerMember: testData.ownerMember,
      userServer: testData.userServer,
      serverMember: testData.serverMember,
    } as any);

    (mockDatabase.delete.member as any).mockRejectedValue(dbError);
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
  expect(mockDatabase.delete.member).not.toHaveBeenCalled();

  // 檢查日誌記錄 - Member handlers 會記錄 warn 訊息然後 return
  const mockWarnFromSetup = require('../../_testSetup').mockWarn;
  expect(mockWarnFromSetup).toHaveBeenCalledWith(
    expect.stringContaining(logMessage),
  );
};

// 權限檢查測試輔助函數 - 操作者權限低於目標用戶
export const testPermissionLowerThanTarget = async (
  handler: any,
  mockSocketInstance: any,
  mockIoInstance: any,
  testData: any,
  operatorPermission: number,
  targetPermission: number,
  logMessage: string,
) => {
  jest.clearAllMocks();

  // 設定權限：操作者 < 目標用戶
  const modifiedTestData = {
    ...testData,
    operatorMember: {
      ...testData.operatorMember,
      permissionLevel: operatorPermission,
    },
    targetMember: {
      ...testData.targetMember,
      permissionLevel: targetPermission,
    },
  };

  setupDefaultDatabaseMocks(modifiedTestData);
  mockDataValidator.validate.mockResolvedValue(testData);

  await handler.handle(mockIoInstance, mockSocketInstance, testData);

  // 檢查權限失敗的行為：不執行核心操作
  expect(mockDatabase.set.member).not.toHaveBeenCalled();
  expect(mockDatabase.delete.member).not.toHaveBeenCalled();

  // 檢查日誌記錄 - Member handlers 會記錄 warn 訊息然後 return
  const mockWarnFromSetup = require('../../_testSetup').mockWarn;
  expect(mockWarnFromSetup).toHaveBeenCalledWith(
    expect.stringContaining(logMessage),
  );
};

// 權限檢查測試輔助函數 - 不能操作群組創建者
export const testCannotOperateOwner = async (
  handler: any,
  mockSocketInstance: any,
  mockIoInstance: any,
  testData: any,
  logMessage: string,
) => {
  jest.clearAllMocks();

  // 設定目標用戶為群組創建者 (permissionLevel: 6)
  const modifiedTestData = {
    ...testData,
    targetMember: { ...testData.targetMember, permissionLevel: 6 },
  };

  setupDefaultDatabaseMocks(modifiedTestData);
  mockDataValidator.validate.mockResolvedValue(testData);

  await handler.handle(mockIoInstance, mockSocketInstance, testData);

  // 檢查權限失敗的行為：不執行核心操作
  expect(mockDatabase.set.member).not.toHaveBeenCalled();
  expect(mockDatabase.delete.member).not.toHaveBeenCalled();

  // 檢查日誌記錄 - Member handlers 會記錄 warn 訊息然後 return
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

// 成員變種創建函數
export const createMemberVariant = (
  baseMember: Member,
  overrides: Partial<Member>,
): Member => ({
  ...baseMember,
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

// 伺服器變種創建函數
export const createServerVariant = (
  baseServer: Server,
  overrides: Partial<Server>,
): Server => ({
  ...baseServer,
  ...overrides,
});

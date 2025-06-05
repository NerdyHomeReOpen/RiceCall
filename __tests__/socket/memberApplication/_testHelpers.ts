import { jest } from '@jest/globals';
import {
  createMockIo,
  createMockSocket,
  mockDatabase,
  mockDataValidator,
} from '../../_testSetup';
import {
  ActionMessage,
  EventMessage,
  Member,
  MemberApplication,
  Server,
  ServerMemberApplication,
  User,
} from './_testTypes';

// Mock SocketServer - 需要在jest.mock之前定義
export const mockSocketServer = {
  getSocket: jest.fn(),
  io: {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  },
};

// Mock MemberApplicationHandlerServerSide - 需要在jest.mock之前定義
export const mockMemberApplicationHandlerServerSide = {
  deleteMemberApplication: jest.fn(),
};

// Mock MemberHandlerServerSide - 需要在jest.mock之前定義
export const mockMemberHandlerServerSide = {
  updateMember: jest.fn(),
  createMember: jest.fn(),
};

// 常用的測試數據ID
export const DEFAULT_IDS = {
  operatorUserId: 'operator-user-id',
  targetUserId: 'target-user-id',
  serverId: 'server-id-123',
  ownerId: 'owner-user-id',
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
  ownerId: string = DEFAULT_IDS.ownerId,
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

// 預設成員申請資料
export const createDefaultMemberApplication = (
  userId: string,
  serverId: string = DEFAULT_IDS.serverId,
  overrides: Partial<MemberApplication> = {},
): MemberApplication => ({
  userId,
  serverId,
  description: '申請加入伺服器',
  createdAt: DEFAULT_TIME,
  ...overrides,
});

// 預設伺服器成員申請資料
export const createDefaultServerMemberApplication = (
  userId: string,
  serverId: string = DEFAULT_IDS.serverId,
  overrides: Partial<ServerMemberApplication> = {},
): ServerMemberApplication => ({
  userId,
  serverId,
  description: '申請加入伺服器',
  createdAt: DEFAULT_TIME,
  ...overrides,
});

// 創建預設測試資料
export const createDefaultTestData = () => {
  const operatorUser = createDefaultUser(DEFAULT_IDS.operatorUserId);
  const targetUser = createDefaultUser(DEFAULT_IDS.targetUserId);
  const ownerUser = createDefaultUser(DEFAULT_IDS.ownerId);

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
      permissionLevel: 1, // 訪客（可以申請）
    },
  );

  const ownerMember = createDefaultMember(
    DEFAULT_IDS.ownerId,
    DEFAULT_IDS.serverId,
    {
      permissionLevel: 6, // 擁有者
    },
  );

  const memberApplication = createDefaultMemberApplication(
    DEFAULT_IDS.targetUserId,
  );

  const serverMemberApplication = createDefaultServerMemberApplication(
    DEFAULT_IDS.targetUserId,
  );

  // 常用的測試資料變體創建函數
  const createMemberApplicationCreateData = (
    overrides: Partial<{
      userId: string;
      serverId?: string;
      memberApplication?: any;
    }> = {},
  ) => ({
    userId: DEFAULT_IDS.operatorUserId,
    serverId: DEFAULT_IDS.serverId,
    memberApplication: {
      description: '申請加入伺服器',
      ...overrides.memberApplication,
    },
    ...overrides,
  });

  const createMemberApplicationUpdateData = (
    overrides: Partial<{
      userId: string;
      serverId?: string;
      memberApplication?: any;
    }> = {},
  ) => ({
    userId: DEFAULT_IDS.targetUserId,
    serverId: DEFAULT_IDS.serverId,
    memberApplication: {
      description: '更新申請描述',
      ...overrides.memberApplication,
    },
    ...overrides,
  });

  const createMemberApplicationDeleteData = (
    overrides: Partial<{
      userId: string;
      serverId?: string;
    }> = {},
  ) => ({
    userId: DEFAULT_IDS.targetUserId,
    serverId: DEFAULT_IDS.serverId,
    ...overrides,
  });

  const createMemberApplicationApproveData = (
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
      ...overrides.member,
    },
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
    memberApplication,
    serverMemberApplication,
    // 輔助資料建立函數
    createMemberApplicationCreateData,
    createMemberApplicationUpdateData,
    createMemberApplicationDeleteData,
    createMemberApplicationApproveData,
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
    if (userId === DEFAULT_IDS.ownerId) return testData.ownerUser as any;
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
    if (userId === DEFAULT_IDS.ownerId) return testData.ownerMember as any;
    return null;
  });

  // MemberApplication mocks
  mockDatabase.get.memberApplication.mockResolvedValue(
    testData.memberApplication as any,
  );
  mockDatabase.get.serverMemberApplication.mockResolvedValue(
    testData.serverMemberApplication as any,
  );

  // Set operations
  (mockDatabase.set.memberApplication as any).mockResolvedValue(true);

  // Delete operations
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

  // 設定 ServerSide handler mocks
  (
    mockMemberApplicationHandlerServerSide.deleteMemberApplication as any
  ).mockResolvedValue(undefined);
  (mockMemberHandlerServerSide.updateMember as any).mockResolvedValue(
    undefined,
  );
  (mockMemberHandlerServerSide.createMember as any).mockResolvedValue(
    undefined,
  );
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
    mockDatabase.get.memberApplication.mockRejectedValue(dbError);
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
      memberApplication: testData.memberApplication,
      serverMemberApplication: testData.serverMemberApplication,
    } as any);

    (mockDatabase.set.memberApplication as any).mockRejectedValue(dbError);
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
      memberApplication: testData.memberApplication,
      serverMemberApplication: testData.serverMemberApplication,
    } as any);

    (mockDatabase.delete.memberApplication as any).mockRejectedValue(dbError);
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
      // 支援不同的標籤：SERVER_ERROR 或 EXCEPTION_ERROR
      tag: expect.stringMatching(/^(SERVER_ERROR|EXCEPTION_ERROR)$/),
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
  expect(mockDatabase.set.memberApplication).not.toHaveBeenCalled();
  expect(mockDatabase.delete.memberApplication).not.toHaveBeenCalled();

  // 檢查日誌記錄 - MemberApplication handlers 會記錄 warn 訊息然後 return
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

// 成員申請變種創建函數
export const createMemberApplicationVariant = (
  baseMemberApplication: MemberApplication,
  overrides: Partial<MemberApplication>,
): MemberApplication => ({
  ...baseMemberApplication,
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

// 伺服器變種創建函數
export const createServerVariant = (
  baseServer: Server,
  overrides: Partial<Server>,
): Server => ({
  ...baseServer,
  ...overrides,
});

// 建立訊息資料的輔助函數
export const createActionMessage = (
  serverId: string,
  type: 'info' | 'warning' | 'error',
  content: string,
): ActionMessage => ({
  serverId,
  type,
  content,
});

export const createEventMessage = (
  serverId: string,
  content: string,
): EventMessage => ({
  serverId,
  type: 'event',
  content,
});

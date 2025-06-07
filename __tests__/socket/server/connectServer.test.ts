import { jest } from '@jest/globals';
import { mockDatabase, mockDataValidator, mockInfo } from '../../_testSetup';

// Mock所有相依模組
jest.mock('@/index', () => ({
  database: require('../../_testSetup').mockDatabase,
}));
jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockLogger,
}));
jest.mock('@/middleware/data.validator', () => ({
  DataValidator: require('../../_testSetup').mockDataValidator,
}));

// Mock handlers - 需要在 beforeEach 中定義
const mockSocketServer = {
  getSocket: jest.fn(),
};
const mockCreateMemberHandler = {
  handle: jest.fn(),
};
const mockConnectChannelHandler = {
  handle: jest.fn(),
};

jest.mock('@/api/socket', () => ({
  __esModule: true,
  default: mockSocketServer,
}));
jest.mock('@/api/socket/events/member/member.handler', () => ({
  CreateMemberHandler: mockCreateMemberHandler,
}));
jest.mock('@/api/socket/events/channel/channel.handler', () => ({
  ConnectChannelHandler: mockConnectChannelHandler,
}));

// 被測試的模組和測試輔助工具
import { ConnectServerHandler } from '../../../src/api/socket/events/server/server.handler';
import { ConnectServerSchema } from '../../../src/api/socket/events/server/server.schema';
import {
  createDefaultTestData,
  createMemberVariant,
  createServerVariant,
  createStandardMockInstances,
  DEFAULT_IDS,
  setupAfterEach,
  setupBeforeEach,
  testDatabaseError,
  testValidationError,
} from './_testHelpers';

describe('ConnectServerHandler (連接伺服器處理)', () => {
  let mockSocketInstance: any;
  let mockIoInstance: any;
  let testData: ReturnType<typeof createDefaultTestData>;

  beforeEach(() => {
    // 建立測試資料
    testData = createDefaultTestData();

    // 建立 mock 實例
    const mockInstances = createStandardMockInstances();
    mockSocketInstance = mockInstances.mockSocketInstance;
    mockIoInstance = mockInstances.mockIoInstance;

    // 設定通用的 beforeEach
    setupBeforeEach(mockSocketInstance, mockIoInstance, testData);

    // 設定 connect 專用的額外 mock
    (mockCreateMemberHandler.handle as any).mockResolvedValue(undefined);
    (mockConnectChannelHandler.handle as any).mockResolvedValue(undefined);
    mockSocketServer.getSocket.mockReturnValue(mockSocketInstance);

    // 設定預設的伺服器和成員資料
    mockDatabase.get.server.mockResolvedValue(testData.defaultServer as any);
    mockDatabase.get.member.mockResolvedValue(testData.operatorMember as any);
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
  });

  afterEach(() => {
    setupAfterEach();
  });

  it('應成功連接到公開伺服器', async () => {
    const connectData = testData.createConnectServerData();

    await ConnectServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      connectData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      ConnectServerSchema,
      connectData,
      'CONNECTSERVER',
    );

    expect(mockDatabase.get.user).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
    );
    expect(mockDatabase.get.server).toHaveBeenCalledWith(DEFAULT_IDS.serverId);
    expect(mockDatabase.get.member).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      DEFAULT_IDS.serverId,
    );

    expect(mockSocketInstance.join).toHaveBeenCalledWith(
      `server_${DEFAULT_IDS.serverId}`,
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('connected to server'),
    );
  });

  it('應為新用戶建立成員資格', async () => {
    mockDatabase.get.member.mockResolvedValue(null); // 沒有現有成員資格

    const connectData = testData.createConnectServerData();

    await ConnectServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      connectData,
    );

    expect(mockCreateMemberHandler.handle).toHaveBeenCalledWith(
      mockIoInstance,
      mockSocketInstance,
      expect.objectContaining({
        userId: DEFAULT_IDS.operatorUserId,
        serverId: DEFAULT_IDS.serverId,
        member: expect.objectContaining({
          permissionLevel: 1,
          createdAt: expect.any(Number),
        }),
      }),
    );
  });

  it('不可見伺服器應顯示申請成員彈窗（權限不足）', async () => {
    const invisibleServer = createServerVariant(testData.defaultServer, {
      visibility: 'invisible',
    });
    const lowPermissionMember = createMemberVariant(testData.operatorMember, {
      permissionLevel: 1, // 權限不足
    });

    mockDatabase.get.server.mockResolvedValue(invisibleServer as any);
    mockDatabase.get.member.mockResolvedValue(lowPermissionMember as any);

    const connectData = testData.createConnectServerData();

    await ConnectServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      connectData,
    );

    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'openPopup',
      expect.objectContaining({
        type: 'applyMember',
        id: 'applyMember',
        initialData: {
          serverId: DEFAULT_IDS.serverId,
          userId: DEFAULT_IDS.operatorUserId,
        },
      }),
    );
  });

  it('被封鎖的用戶應顯示錯誤彈窗', async () => {
    const blockedMember = createMemberVariant(testData.operatorMember, {
      isBlocked: -1, // 永久封鎖
    });

    mockDatabase.get.member.mockResolvedValue(blockedMember as any);

    const connectData = testData.createConnectServerData();

    await ConnectServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      connectData,
    );

    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'openPopup',
      expect.objectContaining({
        type: 'dialogError',
        id: 'errorDialog',
        initialData: expect.objectContaining({
          title: expect.stringContaining('你已被該語音群封鎖'),
        }),
      }),
    );
  });

  it('不能為其他用戶連接伺服器', async () => {
    const otherUserData = testData.createConnectServerData({
      userId: DEFAULT_IDS.targetUserId,
    });

    await ConnectServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      otherUserData,
    );

    const mockWarn = require('../../_testSetup').mockWarn;
    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining("Cannot move other user's server"),
    );
  });

  it('應連接到接待大廳（私人伺服器）', async () => {
    const privateServer = createServerVariant(testData.defaultServer, {
      visibility: 'private',
    });
    const lowPermissionMember = createMemberVariant(testData.operatorMember, {
      permissionLevel: 1, // 權限較低
    });

    mockDatabase.get.server.mockResolvedValue(privateServer as any);
    mockDatabase.get.member.mockResolvedValue(lowPermissionMember as any);

    const connectData = testData.createConnectServerData();

    await ConnectServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      connectData,
    );

    // 應該連接到lobby和receptionLobby
    expect(mockConnectChannelHandler.handle).toHaveBeenCalledWith(
      mockIoInstance,
      mockSocketInstance,
      expect.objectContaining({
        channelId: DEFAULT_IDS.lobbyId,
        serverId: DEFAULT_IDS.serverId,
        userId: DEFAULT_IDS.operatorUserId,
      }),
    );

    expect(mockConnectChannelHandler.handle).toHaveBeenCalledWith(
      mockIoInstance,
      mockSocketInstance,
      expect.objectContaining({
        channelId: DEFAULT_IDS.receptionLobbyId,
        serverId: DEFAULT_IDS.serverId,
        userId: DEFAULT_IDS.operatorUserId,
      }),
    );
  });

  it('高權限用戶應加入管理群組', async () => {
    const adminMember = createMemberVariant(testData.operatorMember, {
      permissionLevel: 5, // 管理員權限
    });

    mockDatabase.get.member.mockResolvedValue(adminMember as any);

    const connectData = testData.createConnectServerData();

    await ConnectServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      connectData,
    );

    expect(mockSocketInstance.join).toHaveBeenCalledWith(
      `serverManager_${DEFAULT_IDS.serverId}`,
    );

    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'serverMemberApplicationsSet',
      expect.objectContaining({
        count: expect.any(Number),
      }),
    );
  });

  it('應正確呼叫資料驗證器', async () => {
    const connectData = testData.createConnectServerData();

    await ConnectServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      connectData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      ConnectServerSchema,
      connectData,
      'CONNECTSERVER',
    );
  });

  it('資料驗證失敗時應發送錯誤', async () => {
    const invalidData = { userId: '', serverId: '' };
    const validationError = new Error('Invalid data');

    await testValidationError(
      ConnectServerHandler,
      mockSocketInstance,
      mockIoInstance,
      invalidData,
      validationError,
      '連接群組失敗，請稍後再試',
    );
  });

  it('應處理資料庫錯誤', async () => {
    await testDatabaseError(
      ConnectServerHandler,
      mockSocketInstance,
      mockIoInstance,
      testData.createConnectServerData(),
      'get',
      'Database connection failed',
      '連接群組失敗，請稍後再試',
    );
  });
});

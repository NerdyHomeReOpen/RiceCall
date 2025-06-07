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
const mockDisconnectChannelHandler = {
  handle: jest.fn(),
};

jest.mock('@/api/socket', () => ({
  __esModule: true,
  default: mockSocketServer,
}));
jest.mock('@/api/socket/events/channel/channel.handler', () => ({
  DisconnectChannelHandler: mockDisconnectChannelHandler,
}));

// 被測試的模組和測試輔助工具
import { DisconnectServerHandler } from '../../../src/api/socket/events/server/server.handler';
import { DisconnectServerSchema } from '../../../src/api/socket/events/server/server.schema';
import {
  createDefaultTestData,
  createMemberVariant,
  createStandardMockInstances,
  createUserVariant,
  DEFAULT_IDS,
  setupAfterEach,
  setupConnectDisconnectBeforeEach,
  testValidationError,
} from './_testHelpers';

describe('DisconnectServerHandler (斷開伺服器處理)', () => {
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

    // 設定 connect/disconnect 專用的 beforeEach
    setupConnectDisconnectBeforeEach(
      mockSocketInstance,
      mockIoInstance,
      testData,
    );

    // 設定 disconnect 專用的額外 mock
    (mockDisconnectChannelHandler.handle as any).mockResolvedValue(undefined);
    mockSocketServer.getSocket.mockReturnValue(mockSocketInstance);

    // 設定用戶在伺服器中的狀態
    const userInServer = createUserVariant(testData.operatorUser, {
      currentServerId: DEFAULT_IDS.serverId,
      currentChannelId: DEFAULT_IDS.channelId,
    });
    mockDatabase.get.user.mockResolvedValue(userInServer as any);
    mockDatabase.get.member.mockResolvedValue(testData.operatorMember as any);
  });

  afterEach(() => {
    setupAfterEach();
  });

  it('應成功斷開自己的伺服器連接', async () => {
    const disconnectData = testData.createDisconnectServerData();

    await DisconnectServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      disconnectData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      DisconnectServerSchema,
      disconnectData,
      'DISCONNECTSERVER',
    );

    expect(mockDatabase.get.user).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
    );
    expect(mockDatabase.get.member).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      DEFAULT_IDS.serverId,
    );

    expect(mockSocketInstance.leave).toHaveBeenCalledWith(
      `server_${DEFAULT_IDS.serverId}`,
    );
    expect(mockSocketInstance.leave).toHaveBeenCalledWith(
      `serverManager_${DEFAULT_IDS.serverId}`,
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('disconnected from server'),
    );
  });

  it('應在斷開前離開當前頻道', async () => {
    const disconnectData = testData.createDisconnectServerData();

    await DisconnectServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      disconnectData,
    );

    expect(mockDisconnectChannelHandler.handle).toHaveBeenCalledWith(
      mockIoInstance,
      mockSocketInstance,
      expect.objectContaining({
        userId: DEFAULT_IDS.operatorUserId,
        channelId: DEFAULT_IDS.channelId,
        serverId: DEFAULT_IDS.serverId,
      }),
    );
  });

  it('管理員可以踢出其他用戶', async () => {
    const kickData = testData.createDisconnectServerData({
      userId: DEFAULT_IDS.targetUserId,
    });

    // 目標用戶資料
    const targetUserInServer = createUserVariant(testData.targetUser, {
      currentServerId: DEFAULT_IDS.serverId,
      currentChannelId: DEFAULT_IDS.channelId,
    });
    const operatorUserInServer = createUserVariant(testData.operatorUser, {
      currentServerId: DEFAULT_IDS.serverId,
      currentChannelId: DEFAULT_IDS.channelId,
    });

    // 按照實際 handler 的調用順序設定 mock：
    // 1. database.get.user(userId) - target user
    // 2. database.get.member(userId, serverId) - target member
    // 3. database.get.user(operatorId) - operator user
    // 4. database.get.member(operatorId, serverId) - operator member
    mockDatabase.get.user
      .mockResolvedValueOnce(targetUserInServer as any) // target user
      .mockResolvedValueOnce(operatorUserInServer as any); // operator user

    // 操作者是管理員，目標用戶是一般用戶
    const regularMember = createMemberVariant(testData.targetMember, {
      permissionLevel: 3, // 一般用戶權限
    });
    const adminMember = createMemberVariant(testData.operatorMember, {
      permissionLevel: 5, // 管理員權限
    });

    mockDatabase.get.member
      .mockResolvedValueOnce(regularMember as any) // target member
      .mockResolvedValueOnce(adminMember as any); // operator member

    const targetSocket = require('../../_testSetup').createMockSocket(
      DEFAULT_IDS.targetUserId,
      'target-socket-id',
    );

    // 在調用 handler 之前設定 getSocket mock
    mockSocketServer.getSocket.mockReturnValue(targetSocket);

    await DisconnectServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      kickData,
    );

    expect(targetSocket.emit).toHaveBeenCalledWith(
      'openPopup',
      expect.objectContaining({
        type: 'dialogAlert',
        id: 'kick',
        initialData: expect.objectContaining({
          title: '你已被踢出群組',
        }),
      }),
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('disconnected from server'),
    );
  });

  it('權限不足時不能踢出其他用戶', async () => {
    const kickData = testData.createDisconnectServerData({
      userId: DEFAULT_IDS.targetUserId,
    });

    // 操作者權限不足，目標用戶權限更高
    const lowPermissionMember = createMemberVariant(testData.operatorMember, {
      permissionLevel: 3, // 權限不足
    });
    const higherPermissionMember = createMemberVariant(testData.targetMember, {
      permissionLevel: 4, // 目標用戶權限更高
    });

    mockDatabase.get.member
      .mockResolvedValueOnce(lowPermissionMember as any)
      .mockResolvedValueOnce(higherPermissionMember as any);

    await DisconnectServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      kickData,
    );

    const mockWarn = require('../../_testSetup').mockWarn;
    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Not enough permission'),
    );
  });

  it('不能踢出權限相等或更高的用戶', async () => {
    const kickData = testData.createDisconnectServerData({
      userId: DEFAULT_IDS.targetUserId,
    });

    // 兩個用戶權限相等
    const adminMember = createMemberVariant(testData.operatorMember, {
      permissionLevel: 5, // 管理員權限
    });
    const equalPermissionMember = createMemberVariant(testData.targetMember, {
      permissionLevel: 5, // 相同權限
    });

    mockDatabase.get.member
      .mockResolvedValueOnce(adminMember as any)
      .mockResolvedValueOnce(equalPermissionMember as any);

    await DisconnectServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      kickData,
    );

    const mockWarn = require('../../_testSetup').mockWarn;
    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Target has higher or equal permission'),
    );
  });

  it('目標用戶不在伺服器時不能踢出', async () => {
    const kickData = testData.createDisconnectServerData({
      userId: DEFAULT_IDS.targetUserId,
    });

    const targetUserNotInServer = createUserVariant(testData.targetUser, {
      currentServerId: 'other-server-id', // 不在目標伺服器
      currentChannelId: null,
    });

    mockDatabase.get.user.mockResolvedValue(targetUserNotInServer as any);

    const adminMember = createMemberVariant(testData.operatorMember, {
      permissionLevel: 5,
    });
    const regularMember = createMemberVariant(testData.targetMember, {
      permissionLevel: 3,
    });

    mockDatabase.get.member
      .mockResolvedValueOnce(adminMember as any)
      .mockResolvedValueOnce(regularMember as any);

    await DisconnectServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      kickData,
    );

    const mockWarn = require('../../_testSetup').mockWarn;
    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Target not in the server'),
    );
  });

  it('應清空伺服器相關資料', async () => {
    const disconnectData = testData.createDisconnectServerData();

    await DisconnectServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      disconnectData,
    );

    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'serverChannelsSet',
      [],
    );
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'serverOnlineMembersSet',
      [],
    );

    expect(mockSocketInstance.to).toHaveBeenCalledWith(
      `server_${DEFAULT_IDS.serverId}`,
    );
  });

  it('資料驗證失敗時應發送錯誤', async () => {
    const invalidData = { userId: '', serverId: '' };
    const validationError = new Error('Invalid data');

    await testValidationError(
      DisconnectServerHandler,
      mockSocketInstance,
      mockIoInstance,
      invalidData,
      validationError,
      '斷開群組失敗，請稍後再試',
    );
  });

  it('應正確呼叫資料驗證器', async () => {
    const disconnectData = testData.createDisconnectServerData();

    await DisconnectServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      disconnectData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      DisconnectServerSchema,
      disconnectData,
      'DISCONNECTSERVER',
    );
  });
});

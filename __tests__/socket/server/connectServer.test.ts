import { jest } from '@jest/globals';

// Mock SocketServer和CreateMemberHandler - 需要在jest.mock之前定義
const mockSocketServer = {
  getSocket: jest.fn(),
};
const mockCreateMemberHandler = {
  handle: jest.fn(),
};
const mockConnectChannelHandler = {
  handle: jest.fn(),
};

// 被測試的模組
import { ConnectServerHandler } from '../../../src/api/socket/events/server/server.handler';

// 測試設定
import {
  createMockIo,
  createMockSocket,
  mockDataValidator,
  mockDatabase,
  mockError,
  mockInfo,
  mockWarn,
} from '../../_testSetup';

// 錯誤類型和Schema
import { ConnectServerSchema } from '../../../src/api/socket/events/server/server.schema';

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

// 常用的測試ID
const DEFAULT_IDS = {
  operatorUserId: 'operator-user-id',
  targetUserId: 'target-user-id',
  serverId: 'server-id-123',
  lobbyId: 'lobby-id-123',
  receptionLobbyId: 'reception-lobby-id-123',
} as const;

// 測試數據
const defaultConnectData = {
  userId: DEFAULT_IDS.operatorUserId,
  serverId: DEFAULT_IDS.serverId,
};

describe('ConnectServerHandler (連接伺服器處理)', () => {
  let mockSocketInstance: any;
  let mockIoInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // 建立mock socket和io實例
    mockSocketInstance = createMockSocket(
      DEFAULT_IDS.operatorUserId,
      'test-socket-id',
    );
    mockIoInstance = createMockIo();

    // 預設mock回傳值
    mockDataValidator.validate.mockResolvedValue(defaultConnectData);

    mockDatabase.get.user.mockResolvedValue({
      userId: DEFAULT_IDS.operatorUserId,
      username: 'testuser',
      currentServerId: null,
      currentChannelId: null,
    });

    mockDatabase.get.server.mockResolvedValue({
      serverId: DEFAULT_IDS.serverId,
      name: '測試伺服器',
      visibility: 'public',
      lobbyId: DEFAULT_IDS.lobbyId,
      receptionLobbyId: DEFAULT_IDS.receptionLobbyId,
    });

    mockDatabase.get.member.mockResolvedValue({
      userId: DEFAULT_IDS.operatorUserId,
      serverId: DEFAULT_IDS.serverId,
      permissionLevel: 3,
      isBlocked: 0,
    });

    mockDatabase.set.userServer.mockResolvedValue(true);
    mockDatabase.get.serverChannels.mockResolvedValue([]);
    mockDatabase.get.serverOnlineMembers.mockResolvedValue([]);
    mockDatabase.get.serverMember.mockResolvedValue({
      userId: DEFAULT_IDS.operatorUserId,
      serverId: DEFAULT_IDS.serverId,
      permissionLevel: 3,
    });
    mockDatabase.get.serverMemberApplications.mockResolvedValue([]);

    (mockConnectChannelHandler.handle as any).mockResolvedValue(undefined);
  });

  it('應成功連接到公開伺服器', async () => {
    await ConnectServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultConnectData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      ConnectServerSchema,
      defaultConnectData,
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

    await ConnectServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultConnectData,
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
    const testServer = {
      serverId: DEFAULT_IDS.serverId,
      name: '測試伺服器',
      visibility: 'invisible',
      lobbyId: DEFAULT_IDS.lobbyId,
      receptionLobbyId: DEFAULT_IDS.receptionLobbyId,
    };
    mockDatabase.get.server.mockResolvedValue(testServer);

    mockDatabase.get.member.mockResolvedValue({
      userId: DEFAULT_IDS.operatorUserId,
      serverId: DEFAULT_IDS.serverId,
      permissionLevel: 1, // 權限不足
      isBlocked: 0,
    });

    await ConnectServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultConnectData,
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
    mockDatabase.get.member.mockResolvedValue({
      userId: DEFAULT_IDS.operatorUserId,
      serverId: DEFAULT_IDS.serverId,
      permissionLevel: 3,
      isBlocked: -1, // 永久封鎖
    });

    await ConnectServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultConnectData,
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
    const otherUserData = {
      userId: DEFAULT_IDS.targetUserId,
      serverId: DEFAULT_IDS.serverId,
    };
    mockDataValidator.validate.mockResolvedValue(otherUserData);

    await ConnectServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      otherUserData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining("Cannot move other user's server"),
    );
  });

  it('應連接到接待大廳（私人伺服器）', async () => {
    mockDatabase.get.server.mockResolvedValue({
      serverId: DEFAULT_IDS.serverId,
      name: '測試伺服器',
      visibility: 'private',
      lobbyId: DEFAULT_IDS.lobbyId,
      receptionLobbyId: DEFAULT_IDS.receptionLobbyId,
    });

    mockDatabase.get.member.mockResolvedValue({
      userId: DEFAULT_IDS.operatorUserId,
      serverId: DEFAULT_IDS.serverId,
      permissionLevel: 1, // 權限較低
      isBlocked: 0,
    });

    await ConnectServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultConnectData,
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
    mockDatabase.get.member.mockResolvedValue({
      userId: DEFAULT_IDS.operatorUserId,
      serverId: DEFAULT_IDS.serverId,
      permissionLevel: 5, // 管理員權限
      isBlocked: 0,
    });

    await ConnectServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultConnectData,
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
    await ConnectServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultConnectData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      ConnectServerSchema,
      defaultConnectData,
      'CONNECTSERVER',
    );
  });

  it('資料驗證失敗時應發送錯誤', async () => {
    const validationError = new Error('Invalid data');
    mockDataValidator.validate.mockRejectedValue(validationError);

    await ConnectServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultConnectData,
    );

    expect(mockError).toHaveBeenCalledWith(validationError.message);
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        name: 'ServerError',
        message: '連接群組失敗，請稍後再試',
        part: 'CONNECTSERVER',
        tag: 'EXCEPTION_ERROR',
        statusCode: 500,
      }),
    );
  });
});

import { jest } from '@jest/globals';

// Mock SocketServer和DisconnectChannelHandler - 需要在jest.mock之前定義
const mockSocketServer = {
  getSocket: jest.fn(),
};
const mockDisconnectChannelHandler = {
  handle: jest.fn(),
};

// 被測試的模組
import { DisconnectServerHandler } from '../../../src/api/socket/events/server/server.handler';

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
import { DisconnectServerSchema } from '../../../src/api/socket/events/server/server.schema';

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
jest.mock('@/api/socket/events/channel/channel.handler', () => ({
  DisconnectChannelHandler: mockDisconnectChannelHandler,
}));

// 常用的測試ID
const DEFAULT_IDS = {
  operatorUserId: 'operator-user-id',
  targetUserId: 'target-user-id',
  serverId: 'server-id-123',
  channelId: 'channel-id-123',
} as const;

// 測試數據
const defaultDisconnectData = {
  userId: DEFAULT_IDS.operatorUserId,
  serverId: DEFAULT_IDS.serverId,
};

describe('DisconnectServerHandler (斷開伺服器處理)', () => {
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
    mockDataValidator.validate.mockResolvedValue(defaultDisconnectData);

    mockDatabase.get.user.mockResolvedValue({
      userId: DEFAULT_IDS.operatorUserId,
      username: 'testuser',
      currentServerId: DEFAULT_IDS.serverId,
      currentChannelId: DEFAULT_IDS.channelId,
    });

    mockDatabase.get.member.mockResolvedValue({
      userId: DEFAULT_IDS.operatorUserId,
      serverId: DEFAULT_IDS.serverId,
      permissionLevel: 3,
      isBlocked: 0,
    });

    (mockDisconnectChannelHandler.handle as any).mockResolvedValue(undefined);
  });

  it('應成功斷開自己的伺服器連接', async () => {
    await DisconnectServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultDisconnectData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      DisconnectServerSchema,
      defaultDisconnectData,
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
    await DisconnectServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultDisconnectData,
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
    const kickData = {
      userId: DEFAULT_IDS.targetUserId,
      serverId: DEFAULT_IDS.serverId,
    };
    mockDataValidator.validate.mockResolvedValue(kickData);

    // 目標用戶資料
    mockDatabase.get.user
      .mockResolvedValueOnce({
        userId: DEFAULT_IDS.operatorUserId,
        username: 'operator',
        currentServerId: DEFAULT_IDS.serverId,
        currentChannelId: DEFAULT_IDS.channelId,
      })
      .mockResolvedValueOnce({
        userId: DEFAULT_IDS.targetUserId,
        username: 'targetuser',
        currentServerId: DEFAULT_IDS.serverId,
        currentChannelId: DEFAULT_IDS.channelId,
      });

    // 操作者是管理員
    mockDatabase.get.member
      .mockResolvedValueOnce({
        userId: DEFAULT_IDS.targetUserId,
        serverId: DEFAULT_IDS.serverId,
        permissionLevel: 3, // 一般用戶權限
        isBlocked: 0,
      })
      .mockResolvedValueOnce({
        userId: DEFAULT_IDS.operatorUserId,
        serverId: DEFAULT_IDS.serverId,
        permissionLevel: 5, // 管理員權限
        isBlocked: 0,
      });

    const targetSocket = createMockSocket(
      DEFAULT_IDS.targetUserId,
      'target-socket-id',
    );
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
    const kickData = {
      userId: DEFAULT_IDS.targetUserId,
      serverId: DEFAULT_IDS.serverId,
    };
    mockDataValidator.validate.mockResolvedValue(kickData);

    // 操作者權限不足（權限低且目標用戶權限更高）
    mockDatabase.get.member
      .mockResolvedValueOnce({
        userId: DEFAULT_IDS.operatorUserId,
        serverId: DEFAULT_IDS.serverId,
        permissionLevel: 3, // 權限不足
        isBlocked: 0,
      })
      .mockResolvedValueOnce({
        userId: DEFAULT_IDS.targetUserId,
        serverId: DEFAULT_IDS.serverId,
        permissionLevel: 4, // 目標用戶權限更高
        isBlocked: 0,
      });

    await DisconnectServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      kickData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Not enough permission'),
    );
  });

  it('不能踢出權限相等或更高的用戶', async () => {
    const kickData = {
      userId: DEFAULT_IDS.targetUserId,
      serverId: DEFAULT_IDS.serverId,
    };
    mockDataValidator.validate.mockResolvedValue(kickData);

    // 目標用戶權限相等
    mockDatabase.get.member
      .mockResolvedValueOnce({
        userId: DEFAULT_IDS.operatorUserId,
        serverId: DEFAULT_IDS.serverId,
        permissionLevel: 5, // 管理員權限
        isBlocked: 0,
      })
      .mockResolvedValueOnce({
        userId: DEFAULT_IDS.targetUserId,
        serverId: DEFAULT_IDS.serverId,
        permissionLevel: 5, // 相同權限
        isBlocked: 0,
      });

    await DisconnectServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      kickData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Target has higher or equal permission'),
    );
  });

  it('目標用戶不在伺服器時不能踢出', async () => {
    const kickData = {
      userId: DEFAULT_IDS.targetUserId,
      serverId: DEFAULT_IDS.serverId,
    };
    mockDataValidator.validate.mockResolvedValue(kickData);

    mockDatabase.get.user.mockResolvedValue({
      userId: DEFAULT_IDS.targetUserId,
      username: 'targetuser',
      currentServerId: 'other-server-id', // 不在目標伺服器
      currentChannelId: null,
    });

    mockDatabase.get.member
      .mockResolvedValueOnce({
        userId: DEFAULT_IDS.operatorUserId,
        serverId: DEFAULT_IDS.serverId,
        permissionLevel: 5,
        isBlocked: 0,
      })
      .mockResolvedValueOnce({
        userId: DEFAULT_IDS.targetUserId,
        serverId: DEFAULT_IDS.serverId,
        permissionLevel: 3,
        isBlocked: 0,
      });

    await DisconnectServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      kickData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Target not in the server'),
    );
  });

  it('應清空伺服器相關資料', async () => {
    await DisconnectServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultDisconnectData,
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
    const validationError = new Error('Invalid data');
    mockDataValidator.validate.mockRejectedValue(validationError);

    await DisconnectServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultDisconnectData,
    );

    expect(mockError).toHaveBeenCalledWith(validationError.message);
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        name: 'ServerError',
        message: '斷開群組失敗，請稍後再試',
        part: 'DISCONNECTSERVER',
        tag: 'EXCEPTION_ERROR',
        statusCode: 500,
      }),
    );
  });

  it('應正確呼叫資料驗證器', async () => {
    await DisconnectServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultDisconnectData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      DisconnectServerSchema,
      defaultDisconnectData,
      'DISCONNECTSERVER',
    );
  });
});

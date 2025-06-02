import { jest } from '@jest/globals';
import { Server, Socket } from 'socket.io';

// Handler to test
import { DisconnectChannelHandler } from '../../../src/api/socket/events/channel/channel.handler';
import { DisconnectChannelSchema } from '../../../src/api/socket/events/channel/channel.schema';

// Test utilities
import {
  createMockIo,
  createMockSocket,
  mockDatabase,
  mockDataValidator,
  mockError,
  mockInfo,
  mockWarn,
} from '../../_testSetup';

import {
  createDefaultTestData,
  createMemberWithPermission,
  DEFAULT_IDS,
  setupDefaultDatabaseMocks,
  setupSocketMocks,
} from './_testHelpers';

// Mock external dependencies
jest.mock('@/index', () => ({
  database: require('../../_testSetup').mockDatabase,
}));
jest.mock('@/middleware/data.validator', () => ({
  DataValidator: require('../../_testSetup').mockDataValidator,
}));
jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockLogger,
}));
jest.mock('@/error', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockStandardizedError,
}));
jest.mock('@/api/socket', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ setup: jest.fn() })),
  SocketServer: {
    getSocket: require('../../_testSetup').mockSocketServerGetSocket,
    io: { sockets: { sockets: new Map() } } as any,
    userSocketMap: new Map(),
    hasSocket: jest.fn().mockReturnValue(true),
  },
}));
jest.mock('../../../src/systems/xp/index', () => ({
  __esModule: true,
  default: {
    create: jest.fn().mockReturnValue(Promise.resolve(undefined)),
    delete: jest.fn().mockReturnValue(Promise.resolve(undefined)),
  },
}));

describe('DisconnectChannelHandler (頻道離開處理)', () => {
  let mockIoInstance: jest.Mocked<Server>;
  let mockSocketInstance: jest.Mocked<Socket>;
  let testData: ReturnType<typeof createDefaultTestData>;

  // Helper function for disconnect data
  const createDisconnectData = (
    overrides: Partial<{
      userId: string;
      channelId: string;
      serverId: string;
    }> = {},
  ) => ({
    userId: DEFAULT_IDS.operatorUserId,
    channelId: DEFAULT_IDS.regularChannelId,
    serverId: DEFAULT_IDS.serverId,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockIoInstance = createMockIo();
    mockSocketInstance = createMockSocket(
      DEFAULT_IDS.operatorUserId,
      'operator-socket-id',
    );
    mockSocketInstance.data.userId = DEFAULT_IDS.operatorUserId;

    testData = createDefaultTestData();

    // Setup user to be in a channel initially
    testData.operatorUser.currentChannelId = DEFAULT_IDS.regularChannelId;
    testData.targetUser.currentChannelId = DEFAULT_IDS.regularChannelId;

    setupDefaultDatabaseMocks(testData);
    setupSocketMocks(testData);

    mockDataValidator.validate.mockImplementation(
      async (schema, data, part) => data,
    );
  });

  it('應在符合所有條件時成功讓使用者離開頻道 (自己主動離開)', async () => {
    const xpSystemModule = jest.requireMock(
      '../../../src/systems/xp/index',
    ) as {
      default: {
        delete: jest.MockedFunction<(userId: string) => Promise<void>>;
      };
    };
    const data = createDisconnectData(); // userId === operatorId

    await DisconnectChannelHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      data,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      DisconnectChannelSchema,
      data,
      'DISCONNECTCHANNEL',
    );

    // 核心業務邏輯：清理 XP 系統
    expect(xpSystemModule.default.delete).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
    );

    // 核心業務邏輯：更新用戶狀態
    expect(mockDatabase.set.user).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      expect.objectContaining({
        currentChannelId: null,
        currentServerId: null,
        lastActiveAt: expect.any(Number),
      }),
    );

    // Socket 事件 (自己離開，使用 socket 而非 getSocket)
    expect(mockSocketInstance.leave).toHaveBeenCalledWith(
      `channel_${DEFAULT_IDS.regularChannelId}`,
    );
    expect(mockSocketInstance.emit).toHaveBeenCalledWith('playSound', 'leave');

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('disconnected from channel'),
    );
  });

  describe('權限檢查 (操作者移動其他使用者)', () => {
    it('操作者權限 < 3 時，應阻止移動其他使用者', async () => {
      const lowPermOperator = createMemberWithPermission(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
        2,
      );
      // 關鍵：目標權限要更低，這樣第二個條件 (operatorMember.permissionLevel <= userMember.permissionLevel)
      // 就不會觸發，最終 reason 會保持為 'Not enough permission'
      const veryLowPermTarget = createMemberWithPermission(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
        0,
      );

      mockDatabase.get.member.mockImplementation(async (userId) => {
        if (userId === DEFAULT_IDS.operatorUserId)
          return lowPermOperator as any;
        if (userId === DEFAULT_IDS.targetUserId)
          return veryLowPermTarget as any;
        return null;
      });

      const data = createDisconnectData({ userId: DEFAULT_IDS.targetUserId });
      await DisconnectChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Not enough permission'),
      );
      expect(mockDatabase.set.user).not.toHaveBeenCalled();
    });

    it('操作者權限 <= 目標權限時，應阻止移動', async () => {
      const operatorPerm3 = createMemberWithPermission(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
        3,
      );
      const targetPerm3 = createMemberWithPermission(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
        3,
      );

      mockDatabase.get.member.mockImplementation(async (userId) => {
        if (userId === DEFAULT_IDS.operatorUserId) return operatorPerm3 as any;
        if (userId === DEFAULT_IDS.targetUserId) return targetPerm3 as any;
        return null;
      });

      const data = createDisconnectData({ userId: DEFAULT_IDS.targetUserId });
      await DisconnectChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 注意：DisconnectChannel 使用 <= 而不是 <，這是與 ConnectChannel 的重要差異
      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Permission lower than the target'),
      );
      expect(mockDatabase.set.user).not.toHaveBeenCalled();
    });

    it('目標使用者不在指定頻道時，應阻止移動', async () => {
      const targetInDifferentChannel = {
        ...testData.targetUser,
        currentChannelId: 'other-channel-id',
      };
      mockDatabase.get.user.mockImplementation(async (userId) => {
        if (userId === DEFAULT_IDS.operatorUserId)
          return testData.operatorUser as any;
        if (userId === DEFAULT_IDS.targetUserId)
          return targetInDifferentChannel as any;
        return null;
      });

      const data = createDisconnectData({ userId: DEFAULT_IDS.targetUserId });
      await DisconnectChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Target is not in the channel'),
      );
      expect(mockDatabase.set.user).not.toHaveBeenCalled();
    });

    it('目標使用者不在同一伺服器時，應阻止移動', async () => {
      const targetInDifferentServer = {
        ...testData.targetUser,
        currentServerId: 'different-server-id',
      };
      mockDatabase.get.user.mockImplementation(async (userId) => {
        if (userId === DEFAULT_IDS.operatorUserId)
          return testData.operatorUser as any;
        if (userId === DEFAULT_IDS.targetUserId)
          return targetInDifferentServer as any;
        return null;
      });

      const data = createDisconnectData({ userId: DEFAULT_IDS.targetUserId });
      await DisconnectChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Target is not in the server'),
      );
      expect(mockDatabase.set.user).not.toHaveBeenCalled();
    });
  });

  describe('關鍵邊界情況', () => {
    it('操作者權限 > 目標權限時，應允許移動', async () => {
      const operatorPerm4 = createMemberWithPermission(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
        5,
      );
      const targetPerm3 = createMemberWithPermission(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
        4,
      );

      mockDatabase.get.member.mockImplementation(async (userId) => {
        if (userId === DEFAULT_IDS.operatorUserId) return operatorPerm4 as any;
        if (userId === DEFAULT_IDS.targetUserId) return targetPerm3 as any;
        return null;
      });

      const data = createDisconnectData({ userId: DEFAULT_IDS.targetUserId });
      await DisconnectChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 條件是 <= ，所以 4 > 3 應該成功
      expect(mockWarn).not.toHaveBeenCalledWith(
        expect.stringContaining('Permission lower than the target'),
      );
      expect(mockDatabase.set.user).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
        expect.anything(),
      );
    });
  });

  it('發生非預期錯誤時應發出 StandardizedError', async () => {
    const errorMessage = 'Database connection failed';
    mockDatabase.get.user.mockRejectedValueOnce(new Error(errorMessage));

    await DisconnectChannelHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      createDisconnectData(),
    );

    expect(mockError).toHaveBeenCalledWith(errorMessage);
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        name: 'ServerError',
        message: '離開頻道失敗，請稍後再試',
      }),
    );
  });
});

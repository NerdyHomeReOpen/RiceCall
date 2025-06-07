import { jest } from '@jest/globals';
import { Server, Socket } from 'socket.io';

// Handler to test
import { ConnectChannelHandler } from '../../../src/api/socket/events/channel/channel.handler';
import { ConnectChannelSchema } from '../../../src/api/socket/events/channel/channel.schema';

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
  createChannelVariant,
  createConnectData,
  createDefaultTestData,
  createMemberWithPermission,
  DEFAULT_IDS,
  setupDefaultDatabaseMocks,
  setupSocketMocks,
} from './_testHelpers';

import { ChannelVisibility, User } from './_testTypes';

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

describe('ConnectChannelHandler (頻道連接處理)', () => {
  let mockIoInstance: jest.Mocked<Server>;
  let mockSocketInstance: jest.Mocked<Socket>;
  let testData: ReturnType<typeof createDefaultTestData>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockIoInstance = createMockIo();
    mockSocketInstance = createMockSocket(
      DEFAULT_IDS.operatorUserId,
      'operator-socket-id',
    );
    mockSocketInstance.data.userId = DEFAULT_IDS.operatorUserId;

    testData = createDefaultTestData();
    setupDefaultDatabaseMocks(testData);
    setupSocketMocks(testData);

    mockDataValidator.validate.mockImplementation(
      async (schema, data, part) => data,
    );
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('應在符合所有條件時成功將使用者連接到頻道', async () => {
    const data = createConnectData();
    const userInPreviousChannel = {
      ...testData.operatorUser,
      currentChannelId: 'some-other-channel-id',
    };
    mockDatabase.get.user.mockResolvedValueOnce(userInPreviousChannel as any);

    await ConnectChannelHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      data,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      ConnectChannelSchema,
      data,
      'CONNECTCHANNEL',
    );
    expect(mockDatabase.set.user).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      expect.objectContaining({
        currentChannelId: DEFAULT_IDS.regularChannelId,
        currentServerId: DEFAULT_IDS.serverId,
        lastActiveAt: expect.any(Number),
      }),
    );
    expect(mockSocketInstance.join).toHaveBeenCalledWith(
      `channel_${DEFAULT_IDS.regularChannelId}`,
    );
    expect(mockSocketInstance.emit).toHaveBeenCalledWith('playSound', 'join');

    jest.runAllTimers();
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'onMessage',
      expect.objectContaining({
        channelId: DEFAULT_IDS.regularChannelId,
        content: 'voiceChangeToFreeSpeech',
      }),
    );
    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('connected to channel'),
    );
  });

  it('應防止連接到唯讀頻道', async () => {
    const readonlyChannel = createChannelVariant(
      testData.mockRegularChannelData,
      {
        visibility: ChannelVisibility.READONLY,
      },
    );
    mockDatabase.get.channel.mockResolvedValueOnce(readonlyChannel as any);

    await ConnectChannelHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      createConnectData(),
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Read-only channel'),
    );
    expect(mockDatabase.set.user).not.toHaveBeenCalled();
  });

  it('若使用者先前在某頻道，應正確離開該頻道', async () => {
    const previousChannelId = 'previous-channel-id';
    const userInPreviousChannel = {
      ...testData.operatorUser,
      currentChannelId: previousChannelId,
    };
    mockDatabase.get.user.mockResolvedValueOnce(userInPreviousChannel as any);

    await ConnectChannelHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      createConnectData(),
    );

    expect(mockSocketInstance.leave).toHaveBeenCalledWith(
      `channel_${previousChannelId}`,
    );
    expect(
      mockSocketInstance.to(`channel_${previousChannelId}`).emit,
    ).toHaveBeenCalledWith('playSound', 'leave');
  });

  it('若使用者先前不在任何頻道，應呼叫 xpSystem.create', async () => {
    const userNotInChannel = {
      ...testData.operatorUser,
      currentChannelId: null,
    };
    mockDatabase.get.user.mockResolvedValueOnce(userNotInChannel as any);
    const xpSystemModule = jest.requireMock(
      '../../../src/systems/xp/index',
    ) as {
      default: {
        create: jest.MockedFunction<(userId: string) => Promise<void>>;
      };
    };

    await ConnectChannelHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      createConnectData(),
    );

    expect(xpSystemModule.default.create).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
    );
  });

  describe('密碼保護測試', () => {
    const setupPasswordTest = (permissionLevel: number) => {
      const channelWithPassword = createChannelVariant(
        testData.mockRegularChannelData,
        { password: 'secret' },
      );
      const lowPermOperator = createMemberWithPermission(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
        permissionLevel,
      );

      mockDatabase.get.channel.mockResolvedValueOnce(
        channelWithPassword as any,
      );
      mockDatabase.get.member.mockImplementation(async (userId) => {
        if (userId === DEFAULT_IDS.operatorUserId)
          return lowPermOperator as any;
        return null;
      });

      return channelWithPassword;
    };

    it('若頻道需要密碼且低權限使用者提供錯誤密碼，應阻止連接', async () => {
      setupPasswordTest(2);
      const data = createConnectData({ password: 'wrong-password' });

      await ConnectChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Wrong password'),
      );
      expect(mockDatabase.set.user).not.toHaveBeenCalled();
    });

    it('若頻道需要密碼且提供正確密碼，應允許連接', async () => {
      setupPasswordTest(2);
      const data = createConnectData({ password: 'secret' });

      await ConnectChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockWarn).not.toHaveBeenCalledWith(
        expect.stringContaining('Wrong password'),
      );
      expect(mockDatabase.set.user).toHaveBeenCalled();
    });

    it('應允許高權限使用者無需密碼連接到受密碼保護的頻道', async () => {
      setupPasswordTest(6); // High permission
      const data = createConnectData({ password: null });

      await ConnectChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockWarn).not.toHaveBeenCalledWith(
        expect.stringContaining('Wrong password'),
      );
      expect(mockDatabase.set.user).toHaveBeenCalled();
    });
  });

  describe('頻道限制測試', () => {
    it('若頻道已滿且使用者權限不足，應阻止連接', async () => {
      const fullChannel = createChannelVariant(
        testData.mockRegularChannelData,
        { userLimit: 1 },
      );
      const lowPermOperator = createMemberWithPermission(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
        4,
      );

      mockDatabase.get.channel.mockResolvedValueOnce(fullChannel as any);
      mockDatabase.get.channelUsers.mockResolvedValueOnce([
        { userId: 'another-user-id' } as User,
      ]);
      mockDatabase.get.member.mockImplementation(async (userId) => {
        if (userId === DEFAULT_IDS.operatorUserId)
          return lowPermOperator as any;
        return null;
      });

      await ConnectChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        createConnectData(),
      );

      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Channel is full'),
      );
      expect(mockDatabase.set.user).not.toHaveBeenCalled();
    });

    it('若頻道已滿但使用者權限足夠 (perm >= 5)', async () => {
      const fullChannel = createChannelVariant(
        testData.mockRegularChannelData,
        { userLimit: 1 },
      );
      mockDatabase.get.channel.mockResolvedValueOnce(fullChannel as any);
      mockDatabase.get.channelUsers.mockResolvedValueOnce([
        { userId: 'another-user-id' } as User,
      ]);

      await ConnectChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        createConnectData(),
      );

      expect(mockWarn).not.toHaveBeenCalledWith(
        expect.stringContaining('Channel is full'),
      );
      expect(mockDatabase.set.user).toHaveBeenCalled();
    });
  });

  describe('權限與可見性測試', () => {
    it('若使用者權限 < 2，應阻止連接到私人伺服器的非大廳頻道', async () => {
      const privateServer = {
        ...testData.mockServerData,
        visibility: 'private' as const,
      };
      const regularChannel = createChannelVariant(
        testData.mockRegularChannelData,
        { isLobby: false },
      );
      const lowPermOperator = createMemberWithPermission(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
        1,
      );

      mockDatabase.get.server.mockResolvedValueOnce(privateServer as any);
      mockDatabase.get.channel.mockResolvedValueOnce(regularChannel as any);
      mockDatabase.get.member.mockImplementation(async (userId) => {
        if (userId === DEFAULT_IDS.operatorUserId)
          return lowPermOperator as any;
        return null;
      });

      await ConnectChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        createConnectData(),
      );

      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Blocked by server visibility'),
      );
      expect(mockDatabase.set.user).not.toHaveBeenCalled();
    });

    it('若使用者權限 < 2，應阻止連接到會員專屬頻道', async () => {
      const memberChannel = createChannelVariant(
        testData.mockRegularChannelData,
        {
          visibility: ChannelVisibility.MEMBER,
        },
      );
      const lowPermOperator = createMemberWithPermission(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
        1,
      );

      mockDatabase.get.channel.mockResolvedValueOnce(memberChannel as any);
      mockDatabase.get.member.mockImplementation(async (userId) => {
        if (userId === DEFAULT_IDS.operatorUserId)
          return lowPermOperator as any;
        return null;
      });

      await ConnectChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        createConnectData(),
      );

      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Blocked by channel visibility'),
      );
      expect(mockDatabase.set.user).not.toHaveBeenCalled();
    });
  });

  describe('操作者移動其他使用者', () => {
    const createOperatorMovingTargetData = () =>
      createConnectData({ userId: DEFAULT_IDS.targetUserId });

    it('操作者：若操作者權限等級 < 5，移動其他使用者應失敗', async () => {
      const lowPermOperator = createMemberWithPermission(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
        4,
      );
      mockDatabase.get.member.mockImplementation(async (userId) => {
        if (userId === DEFAULT_IDS.operatorUserId)
          return lowPermOperator as any;
        if (userId === DEFAULT_IDS.targetUserId)
          return testData.mockTargetMember as any;
        return null;
      });

      await ConnectChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        createOperatorMovingTargetData(),
      );

      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Not enough permission'),
      );
      expect(mockDatabase.set.user).not.toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
        expect.anything(),
      );
    });

    it('操作者：若目標使用者不在同一個伺服器，應失敗', async () => {
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

      await ConnectChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        createOperatorMovingTargetData(),
      );

      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Target is not in the server'),
      );
      expect(mockDatabase.set.user).not.toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
        expect.anything(),
      );
    });

    it('操作者：若目標使用者已在目標頻道，應失敗', async () => {
      const targetInTargetChannel = {
        ...testData.targetUser,
        currentChannelId: DEFAULT_IDS.regularChannelId,
      };
      mockDatabase.get.user.mockImplementation(async (userId) => {
        if (userId === DEFAULT_IDS.operatorUserId)
          return testData.operatorUser as any;
        if (userId === DEFAULT_IDS.targetUserId)
          return targetInTargetChannel as any;
        return null;
      });

      await ConnectChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        createOperatorMovingTargetData(),
      );

      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Target is already in the channel'),
      );
      expect(mockDatabase.set.user).not.toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
        expect.anything(),
      );
    });

    it('操作者：若操作者權限 < 目標權限 (且目標非擁有者，權限等級 != 6)，應失敗', async () => {
      const lowPermOperator = createMemberWithPermission(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
        3,
      );
      const highPermTarget = createMemberWithPermission(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
        4,
      );

      mockDatabase.get.member.mockImplementation(async (userId) => {
        if (userId === DEFAULT_IDS.operatorUserId)
          return lowPermOperator as any;
        if (userId === DEFAULT_IDS.targetUserId) return highPermTarget as any;
        return null;
      });

      await ConnectChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        createOperatorMovingTargetData(),
      );

      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Permission lower than the target'),
      );
      expect(mockDatabase.set.user).not.toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
        expect.anything(),
      );
    });
  });

  describe('關鍵邊界情況', () => {
    it('操作者權限等於目標權限時，應允許移動 (非擁有者)', async () => {
      // 操作者必須 >= 5 才能移動其他用戶，且權限等於目標權限
      const operatorPerm5 = createMemberWithPermission(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
        5,
      );
      const targetPerm5 = createMemberWithPermission(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
        5,
      );

      mockDatabase.get.member.mockImplementation(async (userId) => {
        if (userId === DEFAULT_IDS.operatorUserId) return operatorPerm5 as any;
        if (userId === DEFAULT_IDS.targetUserId) return targetPerm5 as any;
        return null;
      });

      const data = createConnectData({ userId: DEFAULT_IDS.targetUserId });
      await ConnectChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 權限相等且都非擁有者，應該成功（因為條件是 < 不是 <=）
      expect(mockWarn).not.toHaveBeenCalledWith(
        expect.stringContaining('Permission lower than the target'),
      );
      expect(mockDatabase.set.user).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
        expect.anything(),
      );
    });

    it('私人伺服器的大廳頻道應允許低權限用戶連接', async () => {
      const privateServer = {
        ...testData.mockServerData,
        visibility: 'private' as const,
      };
      const lobbyChannel = createChannelVariant(testData.mockLobbyChannelData, {
        isLobby: true,
        serverId: DEFAULT_IDS.serverId,
      });
      const lowPermOperator = createMemberWithPermission(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
        1,
      );

      mockDatabase.get.server.mockResolvedValueOnce(privateServer as any);
      mockDatabase.get.channel.mockResolvedValueOnce(lobbyChannel as any);
      mockDatabase.get.member.mockImplementation(async (userId) => {
        if (userId === DEFAULT_IDS.operatorUserId)
          return lowPermOperator as any;
        return null;
      });

      const data = createConnectData({ channelId: DEFAULT_IDS.lobbyChannelId });
      await ConnectChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 大廳頻道不受私人伺服器可見性限制
      expect(mockWarn).not.toHaveBeenCalledWith(
        expect.stringContaining('Blocked by server visibility'),
      );
      expect(mockDatabase.set.user).toHaveBeenCalled();
    });
  });

  it('發生非預期錯誤時應發出 StandardizedError', async () => {
    const errorMessage = 'Database unavailable';
    mockDatabase.get.user.mockRejectedValueOnce(new Error(errorMessage));

    await ConnectChannelHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      createConnectData(),
    );

    expect(mockError).toHaveBeenCalledWith(errorMessage);
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        name: 'ServerError',
        message: '連接頻道失敗，請稍後再試',
      }),
    );
  });
});

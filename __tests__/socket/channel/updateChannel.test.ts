import { jest } from '@jest/globals';
import { Server, Socket } from 'socket.io';

// Handler to test
import { UpdateChannelHandler } from '../../../src/api/socket/events/channel/channel.handler';
import { UpdateChannelSchema } from '../../../src/api/socket/events/channel/channel.schema';

// Test utilities
import {
  createMockIo,
  createMockSocket,
  mockDatabase,
  mockDataValidator,
  mockError,
  mockInfo,
  mockIoRoomEmit,
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

describe('UpdateChannelHandler (頻道更新處理)', () => {
  let mockIoInstance: jest.Mocked<Server>;
  let mockSocketInstance: jest.Mocked<Socket>;
  let testData: ReturnType<typeof createDefaultTestData>;

  // Helper function for update channel data
  const createUpdateData = (
    overrides: Partial<{
      channelId: string;
      serverId: string;
      channel: any;
    }> = {},
  ) => ({
    channelId: DEFAULT_IDS.regularChannelId,
    serverId: DEFAULT_IDS.serverId,
    channel: {
      name: 'Updated Channel',
      voiceMode: 'free',
      ...overrides.channel,
    },
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
    setupDefaultDatabaseMocks(testData);
    setupSocketMocks(testData);

    mockDataValidator.validate.mockImplementation(
      async (schema, data, part) => data,
    );
  });

  it('應在符合所有條件時成功更新頻道', async () => {
    const highPermOperator = createMemberWithPermission(
      DEFAULT_IDS.operatorUserId,
      DEFAULT_IDS.serverId,
      5,
    );
    const mockChannel = {
      channelId: DEFAULT_IDS.regularChannelId,
      isLobby: false,
      voiceMode: 'queue',
      forbidText: false,
    };

    mockDatabase.get.member.mockResolvedValueOnce(highPermOperator as any);
    mockDatabase.get.channel.mockResolvedValueOnce(mockChannel as any);

    const updateData = createUpdateData({
      channel: { voiceMode: 'free', forbidText: true },
    });

    await UpdateChannelHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      updateData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      UpdateChannelSchema,
      updateData,
      'UPDATECHANNEL',
    );

    // 核心業務邏輯：更新頻道
    expect(mockDatabase.set.channel).toHaveBeenCalledWith(
      DEFAULT_IDS.regularChannelId,
      expect.objectContaining({
        voiceMode: 'free',
        forbidText: true,
      }),
    );

    // Socket 事件發送
    expect(mockIoInstance.to).toHaveBeenCalledWith(
      `server_${DEFAULT_IDS.serverId}`,
    );
    expect(mockIoRoomEmit).toHaveBeenCalledWith(
      'serverChannelUpdate',
      DEFAULT_IDS.regularChannelId,
      expect.objectContaining({
        voiceMode: 'free',
        forbidText: true,
      }),
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('updated channel'),
    );
  });

  describe('權限檢查', () => {
    it('操作者權限 < 5 時，應阻止更新頻道', async () => {
      const lowPermOperator = createMemberWithPermission(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
        4,
      );
      mockDatabase.get.member.mockResolvedValueOnce(lowPermOperator as any);

      const updateData = createUpdateData();
      await UpdateChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        updateData,
      );

      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Not enough permission'),
      );
      expect(mockDatabase.set.channel).not.toHaveBeenCalled();
    });
  });

  describe('大廳頻道特殊規則', () => {
    it('大廳頻道不能設置用戶限制（非零值）', async () => {
      const highPermOperator = createMemberWithPermission(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
        5,
      );
      const lobbyChannel = {
        channelId: DEFAULT_IDS.lobbyChannelId,
        isLobby: true,
        userLimit: 0,
      };

      mockDatabase.get.member.mockResolvedValueOnce(highPermOperator as any);
      mockDatabase.get.channel.mockResolvedValueOnce(lobbyChannel as any);

      const updateData = createUpdateData({
        channelId: DEFAULT_IDS.lobbyChannelId,
        channel: { userLimit: 10 },
      });

      await UpdateChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        updateData,
      );

      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Lobby channel cannot set user limit'),
      );
      expect(mockDatabase.set.channel).not.toHaveBeenCalled();
    });

    it('大廳頻道不能設置非公開可見性', async () => {
      const highPermOperator = createMemberWithPermission(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
        5,
      );
      const lobbyChannel = {
        channelId: DEFAULT_IDS.lobbyChannelId,
        isLobby: true,
        visibility: 'public',
      };

      mockDatabase.get.member.mockResolvedValueOnce(highPermOperator as any);
      mockDatabase.get.channel.mockResolvedValueOnce(lobbyChannel as any);

      const updateData = createUpdateData({
        channelId: DEFAULT_IDS.lobbyChannelId,
        channel: { visibility: 'member' },
      });

      await UpdateChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        updateData,
      );

      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Lobby channel cannot set visibility'),
      );
      expect(mockDatabase.set.channel).not.toHaveBeenCalled();
    });

    it('大廳頻道可以設置用戶限制為 0', async () => {
      const highPermOperator = createMemberWithPermission(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
        5,
      );
      const lobbyChannel = {
        channelId: DEFAULT_IDS.lobbyChannelId,
        isLobby: true,
        userLimit: 10,
      };

      mockDatabase.get.member.mockResolvedValueOnce(highPermOperator as any);
      mockDatabase.get.channel.mockResolvedValueOnce(lobbyChannel as any);

      const updateData = createUpdateData({
        channelId: DEFAULT_IDS.lobbyChannelId,
        channel: { userLimit: 0 },
      });

      await UpdateChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        updateData,
      );

      // 應該成功更新
      expect(mockDatabase.set.channel).toHaveBeenCalledWith(
        DEFAULT_IDS.lobbyChannelId,
        expect.objectContaining({
          userLimit: 0,
        }),
      );
      expect(mockWarn).not.toHaveBeenCalled();
    });
  });

  describe('消息生成邏輯', () => {
    it('語音模式變更時應生成相應消息', async () => {
      const highPermOperator = createMemberWithPermission(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
        5,
      );
      const mockChannel = {
        channelId: DEFAULT_IDS.regularChannelId,
        isLobby: false,
        voiceMode: 'queue', // 原本模式
      };

      mockDatabase.get.member.mockResolvedValueOnce(highPermOperator as any);
      mockDatabase.get.channel.mockResolvedValueOnce(mockChannel as any);

      const updateData = createUpdateData({
        channel: { voiceMode: 'free' }, // 變更為 free
      });

      await UpdateChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        updateData,
      );

      // 檢查是否發送了消息
      expect(mockIoInstance.to).toHaveBeenCalledWith(
        `channel_${DEFAULT_IDS.regularChannelId}`,
      );
      expect(mockIoRoomEmit).toHaveBeenCalledWith(
        'onMessage',
        expect.objectContaining({
          content: 'VOICE_CHANGE_TO_FREE_SPEECH',
          type: 'info',
          sender: highPermOperator,
        }),
      );
    });

    it('文字權限變更時應生成相應消息', async () => {
      const highPermOperator = createMemberWithPermission(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
        5,
      );
      const mockChannel = {
        channelId: DEFAULT_IDS.regularChannelId,
        isLobby: false,
        forbidText: false, // 原本允許文字
      };

      mockDatabase.get.member.mockResolvedValueOnce(highPermOperator as any);
      mockDatabase.get.channel.mockResolvedValueOnce(mockChannel as any);

      const updateData = createUpdateData({
        channel: { forbidText: true }, // 變更為禁止文字
      });

      await UpdateChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        updateData,
      );

      // 檢查是否發送了消息
      expect(mockIoInstance.to).toHaveBeenCalledWith(
        `channel_${DEFAULT_IDS.regularChannelId}`,
      );
      expect(mockIoRoomEmit).toHaveBeenCalledWith(
        'onMessage',
        expect.objectContaining({
          content: 'TEXT_CHANGE_TO_FORBIDDEN_SPEECH',
          type: 'info',
          sender: highPermOperator,
        }),
      );
    });
  });

  describe('邊界情況', () => {
    it('沒有實際變更時不應生成消息', async () => {
      const highPermOperator = createMemberWithPermission(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
        5,
      );
      const mockChannel = {
        channelId: DEFAULT_IDS.regularChannelId,
        isLobby: false,
        voiceMode: 'free', // 與更新值相同
        forbidText: false, // 與更新值相同
      };

      mockDatabase.get.member.mockResolvedValueOnce(highPermOperator as any);
      mockDatabase.get.channel.mockResolvedValueOnce(mockChannel as any);

      const updateData = createUpdateData({
        channel: { voiceMode: 'free', forbidText: false }, // 相同值
      });

      await UpdateChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        updateData,
      );

      // 仍然應該更新頻道
      expect(mockDatabase.set.channel).toHaveBeenCalled();

      // 應該發送 serverChannelUpdate 事件
      expect(mockIoInstance.to).toHaveBeenCalledWith(
        `server_${DEFAULT_IDS.serverId}`,
      );
      expect(mockIoRoomEmit).toHaveBeenCalledWith(
        'serverChannelUpdate',
        DEFAULT_IDS.regularChannelId,
        expect.objectContaining({
          voiceMode: 'free',
          forbidText: false,
        }),
      );

      // 但不應該發送消息事件（因為沒有實際變更）
      expect(mockIoInstance.to).not.toHaveBeenCalledWith(
        `channel_${DEFAULT_IDS.regularChannelId}`,
      );
    });
  });

  it('發生非預期錯誤時應發出 StandardizedError', async () => {
    const errorMessage = 'Database connection failed';
    mockDatabase.get.member.mockRejectedValueOnce(new Error(errorMessage));

    await UpdateChannelHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      createUpdateData(),
    );

    expect(mockError).toHaveBeenCalledWith(errorMessage);
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        name: 'ServerError',
        message: '更新頻道失敗，請稍後再試',
      }),
    );
  });
});

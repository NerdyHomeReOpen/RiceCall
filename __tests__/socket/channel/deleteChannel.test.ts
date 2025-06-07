import { jest } from '@jest/globals';
import { Server, Socket } from 'socket.io';

// Handler to test
import { DeleteChannelHandler } from '../../../src/api/socket/events/channel/channel.handler';
import { DeleteChannelSchema } from '../../../src/api/socket/events/channel/channel.schema';

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

// Import other handlers for mocking
import * as ChannelHandlers from '../../../src/api/socket/events/channel/channel.handler';

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

describe('DeleteChannelHandler (頻道刪除處理)', () => {
  let mockIoInstance: jest.Mocked<Server>;
  let mockSocketInstance: jest.Mocked<Socket>;
  let testData: ReturnType<typeof createDefaultTestData>;
  let mockUpdateChannelHandle: any;
  let mockConnectChannelHandle: any;

  // Helper function for delete channel data
  const createDeleteData = (
    overrides: Partial<{
      channelId: string;
      serverId: string;
    }> = {},
  ) => ({
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
    setupDefaultDatabaseMocks(testData);
    setupSocketMocks(testData);

    mockDataValidator.validate.mockImplementation(
      async (schema, data, part) => data,
    );

    // Spy on other handlers to avoid actual recursive calls
    mockUpdateChannelHandle = jest.spyOn(
      ChannelHandlers.UpdateChannelHandler,
      'handle',
    );
    mockUpdateChannelHandle.mockResolvedValue(undefined);

    mockConnectChannelHandle = jest.spyOn(
      ChannelHandlers.ConnectChannelHandler,
      'handle',
    );
    mockConnectChannelHandle.mockResolvedValue(undefined);

    // Mock setTimeout to avoid actual delays
    jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
      if (typeof callback === 'function') {
        callback();
      }
      return 123 as any;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('應成功刪除普通頻道', async () => {
    const highPermOperator = createMemberWithPermission(
      DEFAULT_IDS.operatorUserId,
      DEFAULT_IDS.serverId,
      5,
    );

    const regularChannel = {
      channelId: DEFAULT_IDS.regularChannelId,
      isLobby: false,
      categoryId: null,
    };

    const server = {
      serverId: DEFAULT_IDS.serverId,
      lobbyId: DEFAULT_IDS.lobbyChannelId,
    };

    mockDatabase.get.member.mockResolvedValueOnce(highPermOperator as any);
    mockDatabase.get.channel.mockResolvedValueOnce(regularChannel as any);
    mockDatabase.get.channelUsers.mockResolvedValueOnce([]); // 沒有用戶在頻道內
    mockDatabase.get.serverChannels.mockResolvedValueOnce([]); // 沒有子頻道
    mockDatabase.get.server.mockResolvedValueOnce(server as any);

    const deleteData = createDeleteData();

    await DeleteChannelHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      deleteData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      DeleteChannelSchema,
      deleteData,
      'DELETECHANNEL',
    );

    // 核心業務邏輯：刪除頻道
    expect(mockDatabase.delete.channel).toHaveBeenCalledWith(
      DEFAULT_IDS.regularChannelId,
    );

    // Socket 事件發送
    expect(mockIoInstance.to).toHaveBeenCalledWith(
      `server_${DEFAULT_IDS.serverId}`,
    );
    expect(mockIoRoomEmit).toHaveBeenCalledWith(
      'serverChannelDelete',
      DEFAULT_IDS.regularChannelId,
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('deleted channel'),
    );
  });

  describe('權限檢查', () => {
    it('操作者權限 < 5 時，應阻止刪除頻道', async () => {
      const lowPermOperator = createMemberWithPermission(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
        4,
      );
      mockDatabase.get.member.mockResolvedValueOnce(lowPermOperator as any);

      const deleteData = createDeleteData();
      await DeleteChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        deleteData,
      );

      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Not enough permission'),
      );
      expect(mockDatabase.delete.channel).not.toHaveBeenCalled();
    });
  });

  describe('大廳頻道保護', () => {
    it('不能刪除大廳頻道', async () => {
      const highPermOperator = createMemberWithPermission(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
        5,
      );
      const lobbyChannel = {
        channelId: DEFAULT_IDS.lobbyChannelId,
        isLobby: true,
      };

      mockDatabase.get.member.mockResolvedValueOnce(highPermOperator as any);
      mockDatabase.get.channel.mockResolvedValueOnce(lobbyChannel as any);

      const deleteData = createDeleteData({
        channelId: DEFAULT_IDS.lobbyChannelId,
      });

      await DeleteChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        deleteData,
      );

      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Cannot delete lobby channel'),
      );
      expect(mockDatabase.delete.channel).not.toHaveBeenCalled();
    });
  });

  describe('用戶移動邏輯', () => {
    it('應將頻道內的用戶移動到大廳', async () => {
      const highPermOperator = createMemberWithPermission(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
        5,
      );

      const regularChannel = {
        channelId: DEFAULT_IDS.regularChannelId,
        isLobby: false,
        categoryId: null,
      };

      const channelUsers = [{ userId: 'user1' }, { userId: 'user2' }];

      const server = {
        serverId: DEFAULT_IDS.serverId,
        lobbyId: DEFAULT_IDS.lobbyChannelId,
      };

      mockDatabase.get.member.mockResolvedValueOnce(highPermOperator as any);
      mockDatabase.get.channel.mockResolvedValueOnce(regularChannel as any);
      mockDatabase.get.channelUsers.mockResolvedValueOnce(channelUsers as any);
      mockDatabase.get.serverChannels.mockResolvedValueOnce([]);
      mockDatabase.get.server.mockResolvedValueOnce(server as any);

      const deleteData = createDeleteData();

      await DeleteChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        deleteData,
      );

      // 檢查是否對每個用戶都調用了 ConnectChannelHandler
      expect(mockConnectChannelHandle).toHaveBeenCalledTimes(2);

      expect(mockConnectChannelHandle).toHaveBeenNthCalledWith(
        1,
        mockIoInstance,
        mockSocketInstance,
        {
          userId: 'user1',
          serverId: DEFAULT_IDS.serverId,
          channelId: DEFAULT_IDS.lobbyChannelId,
        },
      );

      expect(mockConnectChannelHandle).toHaveBeenNthCalledWith(
        2,
        mockIoInstance,
        mockSocketInstance,
        {
          userId: 'user2',
          serverId: DEFAULT_IDS.serverId,
          channelId: DEFAULT_IDS.lobbyChannelId,
        },
      );

      // 最終應該刪除頻道
      expect(mockDatabase.delete.channel).toHaveBeenCalledWith(
        DEFAULT_IDS.regularChannelId,
      );
    });
  });

  describe('分類頻道處理', () => {
    it('當刪除分類下最後一個子頻道時，應將分類轉為普通頻道', async () => {
      const highPermOperator = createMemberWithPermission(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
        5,
      );

      const childChannel = {
        channelId: DEFAULT_IDS.regularChannelId,
        isLobby: false,
        categoryId: 'parent-category-id',
      };

      const serverChannels = [
        // 這是要刪除的頻道，是分類下唯一的子頻道
        {
          channelId: DEFAULT_IDS.regularChannelId,
          categoryId: 'parent-category-id',
        },
      ];

      const server = {
        serverId: DEFAULT_IDS.serverId,
        lobbyId: DEFAULT_IDS.lobbyChannelId,
      };

      mockDatabase.get.member.mockResolvedValueOnce(highPermOperator as any);
      mockDatabase.get.channel.mockResolvedValueOnce(childChannel as any);
      mockDatabase.get.channelUsers.mockResolvedValueOnce([]);
      mockDatabase.get.serverChannels.mockResolvedValueOnce(
        serverChannels as any,
      );
      mockDatabase.get.server.mockResolvedValueOnce(server as any);

      const deleteData = createDeleteData();

      await DeleteChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        deleteData,
      );

      // 檢查是否調用了 UpdateChannelHandler 來轉換分類
      expect(mockUpdateChannelHandle).toHaveBeenCalledWith(
        mockIoInstance,
        mockSocketInstance,
        {
          serverId: DEFAULT_IDS.serverId,
          channelId: 'parent-category-id',
          channel: { type: 'channel' },
        },
      );

      // 最終應該刪除頻道
      expect(mockDatabase.delete.channel).toHaveBeenCalledWith(
        DEFAULT_IDS.regularChannelId,
      );
    });
  });

  describe('子頻道處理', () => {
    it('當有子頻道時應進行處理（簡化測試）', async () => {
      const highPermOperator = createMemberWithPermission(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
        5,
      );

      const parentChannel = {
        channelId: DEFAULT_IDS.regularChannelId,
        isLobby: false,
        categoryId: null,
      };

      const serverChannels = [
        // 子頻道
        { channelId: 'child1', categoryId: DEFAULT_IDS.regularChannelId },
        { channelId: 'child2', categoryId: DEFAULT_IDS.regularChannelId },
        // 其他不相關的頻道
        { channelId: 'other', categoryId: 'other-parent' },
      ];

      const server = {
        serverId: DEFAULT_IDS.serverId,
        lobbyId: DEFAULT_IDS.lobbyChannelId,
      };

      mockDatabase.get.member.mockResolvedValueOnce(highPermOperator as any);
      mockDatabase.get.channel.mockResolvedValueOnce(parentChannel as any);
      mockDatabase.get.channelUsers.mockResolvedValueOnce([]);
      mockDatabase.get.serverChannels.mockResolvedValueOnce(
        serverChannels as any,
      );
      mockDatabase.get.server.mockResolvedValueOnce(server as any);

      const deleteData = createDeleteData();

      await DeleteChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        deleteData,
      );

      // 核心驗證：最終應該刪除主頻道
      expect(mockDatabase.delete.channel).toHaveBeenCalledWith(
        DEFAULT_IDS.regularChannelId,
      );

      // 驗證成功日誌
      expect(mockInfo).toHaveBeenCalledWith(
        expect.stringContaining('deleted channel'),
      );
    });
  });

  describe('邊界情況', () => {
    it('當沒有用戶在頻道內時，不應調用 ConnectChannelHandler', async () => {
      const highPermOperator = createMemberWithPermission(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
        5,
      );

      const regularChannel = {
        channelId: DEFAULT_IDS.regularChannelId,
        isLobby: false,
        categoryId: null,
      };

      const server = {
        serverId: DEFAULT_IDS.serverId,
        lobbyId: DEFAULT_IDS.lobbyChannelId,
      };

      mockDatabase.get.member.mockResolvedValueOnce(highPermOperator as any);
      mockDatabase.get.channel.mockResolvedValueOnce(regularChannel as any);
      mockDatabase.get.channelUsers.mockResolvedValueOnce([]); // 沒有用戶
      mockDatabase.get.serverChannels.mockResolvedValueOnce([]);
      mockDatabase.get.server.mockResolvedValueOnce(server as any);

      const deleteData = createDeleteData();

      await DeleteChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        deleteData,
      );

      // 不應該調用 ConnectChannelHandler
      expect(mockConnectChannelHandle).not.toHaveBeenCalled();

      // 但應該刪除頻道
      expect(mockDatabase.delete.channel).toHaveBeenCalledWith(
        DEFAULT_IDS.regularChannelId,
      );
    });
  });

  it('發生非預期錯誤時應發出 StandardizedError', async () => {
    const errorMessage = 'Database connection failed';
    mockDatabase.get.member.mockRejectedValueOnce(new Error(errorMessage));

    await DeleteChannelHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      createDeleteData(),
    );

    expect(mockError).toHaveBeenCalledWith(errorMessage);
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        name: 'ServerError',
        message: '刪除頻道失敗，請稍後再試',
      }),
    );
  });
});

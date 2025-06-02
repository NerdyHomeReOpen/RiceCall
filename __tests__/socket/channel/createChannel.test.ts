import { jest } from '@jest/globals';
import { Server, Socket } from 'socket.io';

// Handler to test
import { CreateChannelHandler } from '../../../src/api/socket/events/channel/channel.handler';
import { CreateChannelSchema } from '../../../src/api/socket/events/channel/channel.schema';

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
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('CreateChannelHandler (頻道創建處理)', () => {
  let mockIoInstance: jest.Mocked<Server>;
  let mockSocketInstance: jest.Mocked<Socket>;
  let testData: ReturnType<typeof createDefaultTestData>;

  // Helper function for create channel data
  const createChannelData = (
    overrides: Partial<{
      serverId: string;
      channel: any;
    }> = {},
  ) => ({
    serverId: DEFAULT_IDS.serverId,
    channel: {
      name: 'Test Channel',
      categoryId: DEFAULT_IDS.regularChannelId,
      type: 'channel',
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

  it('應在符合所有條件時成功創建頻道', async () => {
    const highPermOperator = createMemberWithPermission(
      DEFAULT_IDS.operatorUserId,
      DEFAULT_IDS.serverId,
      5,
    );
    const mockCategory = {
      channelId: DEFAULT_IDS.regularChannelId,
      categoryId: null, // 不是子頻道
      type: 'channel',
    };

    mockDatabase.get.member.mockResolvedValueOnce(highPermOperator as any);
    mockDatabase.get.channel.mockResolvedValueOnce(mockCategory as any);
    mockDatabase.get.serverChannels.mockResolvedValueOnce([
      { categoryId: DEFAULT_IDS.regularChannelId, order: 0 },
      { categoryId: DEFAULT_IDS.regularChannelId, order: 1 },
    ] as any);

    const data = createChannelData();
    await CreateChannelHandler.handle(mockIoInstance, mockSocketInstance, data);

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      CreateChannelSchema,
      data,
      'CREATECHANNEL',
    );

    // 核心業務邏輯：創建頻道
    expect(mockDatabase.set.channel).toHaveBeenCalledWith(
      expect.any(String), // UUID
      expect.objectContaining({
        name: 'Test Channel',
        serverId: DEFAULT_IDS.serverId,
        order: 1, // Math.max(2 - 1, 0) = 1
        createdAt: expect.any(Number),
      }),
    );

    // Socket 事件發送
    expect(mockIoInstance.to).toHaveBeenCalledWith(
      `server_${DEFAULT_IDS.serverId}`,
    );
    expect(mockIoRoomEmit).toHaveBeenCalledWith(
      'serverChannelAdd',
      expect.any(Object),
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('created channel'),
    );
  });

  describe('權限檢查', () => {
    it('操作者權限 < 5 時，應阻止創建頻道', async () => {
      const lowPermOperator = createMemberWithPermission(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
        4,
      );
      mockDatabase.get.member.mockResolvedValueOnce(lowPermOperator as any);

      const data = createChannelData();
      await CreateChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Not enough permission'),
      );
      expect(mockDatabase.set.channel).not.toHaveBeenCalled();
    });
  });

  describe('業務規則檢查', () => {
    it('當 category 是子頻道時，應阻止創建頻道', async () => {
      const highPermOperator = createMemberWithPermission(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
        5,
      );
      const subChannelCategory = {
        channelId: DEFAULT_IDS.regularChannelId,
        categoryId: 'parent-category-id', // 這是子頻道
        type: 'channel',
      };

      mockDatabase.get.member.mockResolvedValueOnce(highPermOperator as any);
      mockDatabase.get.channel.mockResolvedValueOnce(subChannelCategory as any);

      const data = createChannelData();
      await CreateChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Cannot create channel under sub-channel'),
      );
      expect(mockDatabase.set.channel).not.toHaveBeenCalled();
    });

    it('當 category 存在但不是子頻道時，應成功創建頻道', async () => {
      const highPermOperator = createMemberWithPermission(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
        5,
      );
      const regularChannelAsCategory = {
        channelId: DEFAULT_IDS.regularChannelId,
        categoryId: null, // 不是子頻道
        type: 'channel',
      };

      mockDatabase.get.member.mockResolvedValueOnce(highPermOperator as any);
      mockDatabase.get.channel.mockResolvedValueOnce(
        regularChannelAsCategory as any,
      );
      mockDatabase.get.serverChannels.mockResolvedValueOnce([]);

      const data = createChannelData();
      await CreateChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 核心業務邏輯：創建頻道應該成功
      expect(mockDatabase.set.channel).toHaveBeenCalledWith(
        'mock-uuid-1234',
        expect.objectContaining({
          name: 'Test Channel',
          serverId: DEFAULT_IDS.serverId,
          order: 0,
          createdAt: expect.any(Number),
        }),
      );

      // Socket 事件發送
      expect(mockIoInstance.to).toHaveBeenCalledWith(
        `server_${DEFAULT_IDS.serverId}`,
      );
      expect(mockIoRoomEmit).toHaveBeenCalledWith(
        'serverChannelAdd',
        expect.any(Object),
      );

      expect(mockInfo).toHaveBeenCalledWith(
        expect.stringContaining('created channel'),
      );
    });
  });

  describe('關鍵邊界情況', () => {
    it('當 categoryChannels 為空時，order 應該為 0', async () => {
      const highPermOperator = createMemberWithPermission(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
        5,
      );

      mockDatabase.get.member.mockResolvedValueOnce(highPermOperator as any);
      mockDatabase.get.channel.mockResolvedValueOnce(null); // 沒有 category
      mockDatabase.get.serverChannels.mockResolvedValueOnce([]); // 空的 categoryChannels

      const data = createChannelData();
      await CreateChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.set.channel).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          order: 0, // Math.max(0 - 1, 0) = 0
        }),
      );
    });
  });

  it('發生非預期錯誤時應發出 StandardizedError', async () => {
    const errorMessage = 'Database connection failed';
    mockDatabase.get.member.mockRejectedValueOnce(new Error(errorMessage));

    await CreateChannelHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      createChannelData(),
    );

    expect(mockError).toHaveBeenCalledWith(errorMessage);
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        name: 'ServerError',
        message: '建立頻道失敗，請稍後再試',
      }),
    );
  });
});

import { jest } from '@jest/globals';
import { Server, Socket } from 'socket.io';

// Handler to test
import { UpdateChannelsHandler } from '../../../src/api/socket/events/channel/channel.handler';
import { UpdateChannelsSchema } from '../../../src/api/socket/events/channel/channel.schema';

// Test utilities
import {
  createMockIo,
  createMockSocket,
  mockDataValidator,
  mockError,
} from '../../_testSetup';

import {
  createDefaultTestData,
  DEFAULT_IDS,
  setupDefaultDatabaseMocks,
  setupSocketMocks,
} from './_testHelpers';

// Import UpdateChannelHandler for manual mocking
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

describe('UpdateChannelsHandler (批量頻道更新處理)', () => {
  let mockIoInstance: jest.Mocked<Server>;
  let mockSocketInstance: jest.Mocked<Socket>;
  let testData: ReturnType<typeof createDefaultTestData>;
  let mockUpdateChannelHandle: any;

  // Helper function for update channels data
  const createUpdateChannelsData = (
    overrides: Partial<{
      serverId: string;
      channels: any[];
    }> = {},
  ) => ({
    serverId: DEFAULT_IDS.serverId,
    channels: [
      {
        channelId: DEFAULT_IDS.regularChannelId,
        name: 'Updated Channel 1',
        voiceMode: 'free',
      },
      {
        channelId: 'channel-2',
        name: 'Updated Channel 2',
        visibility: 'member',
      },
    ],
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

    // Spy on UpdateChannelHandler.handle and mock it
    mockUpdateChannelHandle = jest.spyOn(
      ChannelHandlers.UpdateChannelHandler,
      'handle',
    );
    mockUpdateChannelHandle.mockResolvedValue(undefined);

    // Mock setTimeout to avoid actual delays
    jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
      if (typeof callback === 'function') {
        callback();
      }
      return 123 as any; // Return a dummy timer ID
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('應成功批量更新多個頻道', async () => {
    const updateData = createUpdateChannelsData();

    await UpdateChannelsHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      updateData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      UpdateChannelsSchema,
      updateData,
      'UPDATECHANNELS',
    );

    // 檢查是否對每個頻道都調用了 UpdateChannelHandler
    expect(mockUpdateChannelHandle).toHaveBeenCalledTimes(2);

    expect(mockUpdateChannelHandle).toHaveBeenNthCalledWith(
      1,
      mockIoInstance,
      mockSocketInstance,
      {
        serverId: DEFAULT_IDS.serverId,
        channelId: DEFAULT_IDS.regularChannelId,
        channel: {
          channelId: DEFAULT_IDS.regularChannelId,
          name: 'Updated Channel 1',
          voiceMode: 'free',
        },
      },
    );

    expect(mockUpdateChannelHandle).toHaveBeenNthCalledWith(
      2,
      mockIoInstance,
      mockSocketInstance,
      {
        serverId: DEFAULT_IDS.serverId,
        channelId: 'channel-2',
        channel: {
          channelId: 'channel-2',
          name: 'Updated Channel 2',
          visibility: 'member',
        },
      },
    );

    // 檢查是否有延遲調用
    expect(global.setTimeout).toHaveBeenCalledTimes(2);
  });

  describe('邊界情況', () => {
    it('應處理空頻道陣列', async () => {
      const updateData = createUpdateChannelsData({
        channels: [],
      });

      await UpdateChannelsHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        updateData,
      );

      expect(mockDataValidator.validate).toHaveBeenCalledWith(
        UpdateChannelsSchema,
        updateData,
        'UPDATECHANNELS',
      );

      // 不應該調用 UpdateChannelHandler
      expect(mockUpdateChannelHandle).not.toHaveBeenCalled();

      // 不應該有延遲調用
      expect(global.setTimeout).not.toHaveBeenCalled();
    });

    it('應處理單一頻道更新', async () => {
      const updateData = createUpdateChannelsData({
        channels: [
          {
            channelId: DEFAULT_IDS.regularChannelId,
            name: 'Single Channel',
            voiceMode: 'queue',
          },
        ],
      });

      await UpdateChannelsHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        updateData,
      );

      // 應該只調用一次 UpdateChannelHandler
      expect(mockUpdateChannelHandle).toHaveBeenCalledTimes(1);
      expect(mockUpdateChannelHandle).toHaveBeenCalledWith(
        mockIoInstance,
        mockSocketInstance,
        {
          serverId: DEFAULT_IDS.serverId,
          channelId: DEFAULT_IDS.regularChannelId,
          channel: {
            channelId: DEFAULT_IDS.regularChannelId,
            name: 'Single Channel',
            voiceMode: 'queue',
          },
        },
      );

      // 應該有一次延遲調用
      expect(global.setTimeout).toHaveBeenCalledTimes(1);
    });
  });

  describe('錯誤處理', () => {
    it('當 UpdateChannelHandler 拋出錯誤時應正確處理', async () => {
      const errorMessage = 'Channel update failed';
      mockUpdateChannelHandle.mockRejectedValueOnce(new Error(errorMessage));

      const updateData = createUpdateChannelsData();

      await UpdateChannelsHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        updateData,
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

    it('當數據驗證失敗時應正確處理', async () => {
      const validationError = new Error('Invalid data format');
      mockDataValidator.validate.mockRejectedValueOnce(validationError);

      await UpdateChannelsHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        createUpdateChannelsData(),
      );

      expect(mockError).toHaveBeenCalledWith('Invalid data format');
      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({
          name: 'ServerError',
          message: '更新頻道失敗，請稍後再試',
        }),
      );
    });
  });

  it('當第一個頻道更新失敗時應停止處理並拋出錯誤', async () => {
    const errorMessage = 'First channel failed';
    mockUpdateChannelHandle.mockRejectedValueOnce(new Error(errorMessage));

    const updateData = createUpdateChannelsData();

    await UpdateChannelsHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      updateData,
    );

    // 由於第一個調用就失敗了，整個 handler 就會中止並拋出錯誤
    expect(mockUpdateChannelHandle).toHaveBeenCalledTimes(1);
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

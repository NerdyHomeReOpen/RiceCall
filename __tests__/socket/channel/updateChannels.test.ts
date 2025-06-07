import { jest } from '@jest/globals';

// 使用本地的測試輔助工具
import {
  createDefaultTestData,
  createStandardMockInstances,
  DEFAULT_IDS,
  setupAfterEach,
  setupBeforeEach,
  testValidationError,
} from './_testHelpers';

// 測試設定
import { mockDatabase, mockDataValidator } from '../../_testSetup';

// 創建 Mock UpdateChannelHandler
const mockUpdateChannelHandler = jest.fn<any>();

// Mock 核心模組
jest.mock('@/index', () => ({
  database: mockDatabase,
}));

jest.mock('@/middleware/data.validator', () => ({
  DataValidator: mockDataValidator,
}));

jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockLogger,
}));

jest.mock('@/error', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockStandardizedError,
}));

// Mock UpdateChannelHandler
jest.mock('../../../src/api/socket/events/channel/channel.handler', () => {
  const actual = jest.requireActual(
    '../../../src/api/socket/events/channel/channel.handler',
  ) as any;
  return {
    ...(actual || {}),
    UpdateChannelHandler: { handle: mockUpdateChannelHandler },
  };
});

// 被測試的模組
import { UpdateChannelsHandler } from '../../../src/api/socket/events/channel/channel.handler';
import { UpdateChannelsSchema } from '../../../src/api/socket/events/channel/channel.schema';

describe('UpdateChannelsHandler (批量頻道更新處理)', () => {
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

    // 重置 UpdateChannelHandler mock
    mockUpdateChannelHandler.mockClear();
    mockUpdateChannelHandler.mockResolvedValue(undefined);
  });

  afterEach(() => {
    setupAfterEach();
  });

  it('應成功批量更新多個頻道', async () => {
    const channelsData = {
      serverId: DEFAULT_IDS.serverId,
      channels: [
        testData.createUpdateData(DEFAULT_IDS.regularChannelId, {
          name: '更新頻道1',
        }),
        testData.createUpdateData(DEFAULT_IDS.lobbyChannelId, {
          name: '更新頻道2',
        }),
      ],
    };

    await UpdateChannelsHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      channelsData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      UpdateChannelsSchema,
      channelsData,
      'UPDATECHANNELS',
    );

    // 應該為每個頻道調用 UpdateChannelHandler
    expect(mockUpdateChannelHandler).toHaveBeenCalledTimes(2);

    // 檢查調用參數是否正確
    expect(mockUpdateChannelHandler).toHaveBeenNthCalledWith(
      1,
      mockIoInstance,
      mockSocketInstance,
      {
        serverId: DEFAULT_IDS.serverId,
        channelId: DEFAULT_IDS.regularChannelId,
        channel: { name: '更新頻道1' },
      },
    );

    expect(mockUpdateChannelHandler).toHaveBeenNthCalledWith(
      2,
      mockIoInstance,
      mockSocketInstance,
      {
        serverId: DEFAULT_IDS.serverId,
        channelId: DEFAULT_IDS.lobbyChannelId,
        channel: { name: '更新頻道2' },
      },
    );
  });

  it('當第一個頻道更新失敗時應停止處理並拋出錯誤', async () => {
    const channelsData = {
      serverId: DEFAULT_IDS.serverId,
      channels: [
        testData.createUpdateData(DEFAULT_IDS.regularChannelId, {
          name: '會失敗的頻道',
        }),
        testData.createUpdateData(DEFAULT_IDS.lobbyChannelId, {
          name: '不會被處理的頻道',
        }),
      ],
    };

    const updateError = new Error('Update failed');
    mockUpdateChannelHandler.mockRejectedValueOnce(updateError);

    await UpdateChannelsHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      channelsData,
    );

    // 應該只調用一次，因為第一次失敗就停止了
    expect(mockUpdateChannelHandler).toHaveBeenCalledTimes(1);

    // 檢查錯誤處理
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        message: '更新頻道失敗，請稍後再試',
        tag: 'SERVER_ERROR',
      }),
    );
  });

  it('應處理資料驗證錯誤', async () => {
    const invalidData = { serverId: '', channels: [] };
    const validationError = new Error('頻道資料不正確');

    await testValidationError(
      UpdateChannelsHandler,
      mockSocketInstance,
      mockIoInstance,
      invalidData,
      validationError,
      '更新頻道失敗，請稍後再試', // 實際錯誤訊息
    );
  });

  describe('邊界情況', () => {
    it('應處理空頻道陣列', async () => {
      const emptyChannelsData = {
        serverId: DEFAULT_IDS.serverId,
        channels: [],
      };

      await UpdateChannelsHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        emptyChannelsData,
      );

      expect(mockUpdateChannelHandler).not.toHaveBeenCalled();
    });

    it('應處理單一頻道更新', async () => {
      const singleChannelData = {
        serverId: DEFAULT_IDS.serverId,
        channels: [
          testData.createUpdateData(DEFAULT_IDS.regularChannelId, {
            name: '單一頻道',
          }),
        ],
      };

      await UpdateChannelsHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        singleChannelData,
      );

      expect(mockUpdateChannelHandler).toHaveBeenCalledTimes(1);
      expect(mockUpdateChannelHandler).toHaveBeenCalledWith(
        mockIoInstance,
        mockSocketInstance,
        {
          serverId: DEFAULT_IDS.serverId,
          channelId: DEFAULT_IDS.regularChannelId,
          channel: { name: '單一頻道' },
        },
      );
    });
  });

  describe('錯誤處理', () => {
    it('當 UpdateChannelHandler 拋出錯誤時應正確處理', async () => {
      const channelsData = {
        serverId: DEFAULT_IDS.serverId,
        channels: [
          testData.createUpdateData(DEFAULT_IDS.regularChannelId, {
            name: '測試頻道',
          }),
        ],
      };

      const handlerError = new Error('Handler specific error');
      mockUpdateChannelHandler.mockRejectedValueOnce(handlerError);

      await UpdateChannelsHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        channelsData,
      );

      // 檢查是否有適當的錯誤處理
      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({
          message: '更新頻道失敗，請稍後再試',
          tag: 'SERVER_ERROR',
        }),
      );
    });
  });
});

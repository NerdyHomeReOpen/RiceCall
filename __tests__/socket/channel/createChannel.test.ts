import { jest } from '@jest/globals';

// 使用本地的測試輔助工具
import {
  createDefaultTestData,
  createMemberWithPermission,
  createStandardMockInstances,
  DEFAULT_IDS,
  setupAfterEach,
  setupBeforeEach,
  testDatabaseError,
  testValidationError,
} from './_testHelpers';

// 測試設定
import {
  mockDatabase,
  mockDataValidator,
  mockInfo,
  mockIoRoomEmit,
} from '../../_testSetup';

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

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234'),
}));

// 被測試的模組
import { CreateChannelHandler } from '../../../src/api/socket/events/channel/channel.handler';
import { CreateChannelSchema } from '../../../src/api/socket/events/channel/channel.schema';

describe('CreateChannelHandler (頻道創建處理)', () => {
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
  });

  afterEach(() => {
    setupAfterEach();
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

    const data = testData.createChannelData();
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

  it('應處理資料驗證錯誤', async () => {
    const invalidData = { serverId: '', channel: {} };
    const validationError = new Error('頻道名稱不能為空');

    await testValidationError(
      CreateChannelHandler,
      mockSocketInstance,
      mockIoInstance,
      invalidData,
      validationError,
      '建立頻道失敗，請稍後再試',
    );
  });

  it('應處理資料庫錯誤', async () => {
    await testDatabaseError(
      CreateChannelHandler,
      mockSocketInstance,
      mockIoInstance,
      testData.createChannelData(),
      'set',
      'Database connection failed',
      '建立頻道失敗，請稍後再試',
    );
  });

  describe('權限檢查', () => {
    it('操作者權限 < 5 時，應阻止創建頻道', async () => {
      const lowPermOperator = createMemberWithPermission(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
        4, // 低權限
      );

      mockDatabase.get.member.mockResolvedValueOnce(lowPermOperator as any);

      const data = testData.createChannelData();
      await CreateChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 權限不足時應該不執行創建操作
      expect(mockDatabase.set.channel).not.toHaveBeenCalled();

      // 檢查日誌記錄
      const mockWarn = require('../../_testSetup').mockWarn;
      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Not enough permission'),
      );
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

      const data = testData.createChannelData();
      await CreateChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      const mockWarn = require('../../_testSetup').mockWarn;
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
      mockDatabase.get.serverChannels.mockResolvedValueOnce([] as any);

      const data = testData.createChannelData();
      await CreateChannelHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.set.channel).toHaveBeenCalled();
    });
  });

  describe('關鍵邊界情況', () => {
    it('當 categoryChannels 為空時，order 應該為 0', async () => {
      const highPermOperator = createMemberWithPermission(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
        5,
      );
      const mockCategory = {
        channelId: DEFAULT_IDS.regularChannelId,
        categoryId: null,
        type: 'channel',
      };

      mockDatabase.get.member.mockResolvedValueOnce(highPermOperator as any);
      mockDatabase.get.channel.mockResolvedValueOnce(mockCategory as any);
      mockDatabase.get.serverChannels.mockResolvedValueOnce([] as any); // 空陣列

      const data = testData.createChannelData();
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
});

import { jest } from '@jest/globals';

// 使用本地的測試輔助工具
import {
  createDefaultTestData,
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
  mockWarn,
} from '../../_testSetup';

// Mock 核心模組
jest.mock('@/index', () => ({
  database: mockDatabase,
}));

jest.mock('@/middleware/data.validator', () => ({
  DataValidator: mockDataValidator,
}));

jest.mock('@/api/socket', () => ({
  __esModule: true,
  default: { getSocket: require('../../_testSetup').mockSocketServerGetSocket },
}));

jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockLogger,
}));

jest.mock('@/error', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockStandardizedError,
}));

// 被測試的模組
import { UpdateFriendApplicationHandler } from '../../../src/api/socket/events/friendApplication/friendApplication.handler';
import { UpdateFriendApplicationSchema } from '../../../src/api/socket/events/friendApplication/friendApplication.schema';

describe('UpdateFriendApplicationHandler (好友申請更新處理)', () => {
  let mockSocketInstance: any;
  let mockIoInstance: any;
  let testData: ReturnType<typeof createDefaultTestData>;

  beforeEach(() => {
    // 建立測試資料
    testData = createDefaultTestData();

    // 建立 mock 實例（操作者ID設為senderId）
    const mockInstances = createStandardMockInstances(DEFAULT_IDS.senderId);
    mockSocketInstance = mockInstances.mockSocketInstance;
    mockIoInstance = mockInstances.mockIoInstance;

    // 設定通用的 beforeEach
    setupBeforeEach(mockSocketInstance, mockIoInstance, testData);
  });

  afterEach(() => {
    setupAfterEach();
  });

  it('應成功更新好友申請', async () => {
    const data = testData.createUpdateData();
    await UpdateFriendApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      data,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      UpdateFriendApplicationSchema,
      data,
      'UPDATEFRIENDAPPLICATION',
    );

    // 核心業務邏輯：更新好友申請
    expect(mockDatabase.set.friendApplication).toHaveBeenCalled();

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('updated friend application'),
    );
  });

  it('應處理資料驗證錯誤', async () => {
    const invalidData = { senderId: '', receiverId: '', friendApplication: {} };
    const validationError = new Error('好友申請資料不正確');

    await testValidationError(
      UpdateFriendApplicationHandler,
      mockSocketInstance,
      mockIoInstance,
      invalidData,
      validationError,
      '更新好友申請失敗，請稍後再試',
    );
  });

  it('應處理資料庫錯誤', async () => {
    await testDatabaseError(
      UpdateFriendApplicationHandler,
      mockSocketInstance,
      mockIoInstance,
      testData.createUpdateData(),
      'set',
      'Database connection failed',
      '更新好友申請失敗，請稍後再試',
    );
  });

  describe('權限檢查', () => {
    it('發送者可以修改自己的好友申請', async () => {
      mockSocketInstance.data.userId = DEFAULT_IDS.senderId;

      const data = testData.createUpdateData();
      await UpdateFriendApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.set.friendApplication).toHaveBeenCalled();
      expect(mockInfo).toHaveBeenCalledWith(
        expect.stringContaining('updated friend application'),
      );
    });

    it('接收者可以修改好友申請', async () => {
      mockSocketInstance.data.userId = DEFAULT_IDS.receiverId;

      const data = testData.createUpdateData();
      await UpdateFriendApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.set.friendApplication).toHaveBeenCalled();
      expect(mockInfo).toHaveBeenCalledWith(
        expect.stringContaining('updated friend application'),
      );
    });

    it('操作者不能修改非自己相關的好友申請', async () => {
      mockSocketInstance.data.userId = DEFAULT_IDS.otherUserId;

      const data = testData.createUpdateData();
      await UpdateFriendApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Cannot modify non-self friend applications'),
      );
      expect(mockDatabase.set.friendApplication).not.toHaveBeenCalled();
    });
  });

  describe('好友申請內容更新', () => {
    it('應正確處理描述更新', async () => {
      const data = testData.createUpdateData({
        friendApplication: {
          description: '自定義的更新描述',
        },
      });

      await UpdateFriendApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.set.friendApplication).toHaveBeenCalled();
      expect(mockInfo).toHaveBeenCalledWith(
        expect.stringContaining('updated friend application'),
      );
    });

    it('應正確處理不同的發送者和接收者組合', async () => {
      const data = testData.createUpdateData({
        senderId: 'custom-sender-id',
        receiverId: 'custom-receiver-id',
        friendApplication: {
          description: '自定義更新',
        },
      });

      // 設定操作者為發送者
      mockSocketInstance.data.userId = 'custom-sender-id';

      await UpdateFriendApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.set.friendApplication).toHaveBeenCalled();
    });

    it('應在執行更新前進行適當的驗證', async () => {
      const data = testData.createUpdateData();
      await UpdateFriendApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDataValidator.validate).toHaveBeenCalledWith(
        UpdateFriendApplicationSchema,
        data,
        'UPDATEFRIENDAPPLICATION',
      );
    });
  });

  describe('業務邏輯檢查', () => {
    it('應正確處理更新操作的參數', async () => {
      const data = testData.createUpdateData();
      await UpdateFriendApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.set.friendApplication).toHaveBeenCalled();
    });

    it('應能處理空的friendApplication物件', async () => {
      const data = testData.createUpdateData({
        friendApplication: {},
      });

      await UpdateFriendApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.set.friendApplication).toHaveBeenCalled();
    });

    it('應能處理多個欄位的更新', async () => {
      const data = testData.createUpdateData({
        friendApplication: {
          description: '新的描述',
          message: '新的訊息',
        },
      });

      await UpdateFriendApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.set.friendApplication).toHaveBeenCalled();
    });
  });
});

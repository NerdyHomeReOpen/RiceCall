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
import { DeleteFriendApplicationHandler } from '../../../src/api/socket/events/friendApplication/friendApplication.handler';
import { DeleteFriendApplicationSchema } from '../../../src/api/socket/events/friendApplication/friendApplication.schema';

describe('DeleteFriendApplicationHandler (好友申請刪除處理)', () => {
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

  it('應成功刪除好友申請', async () => {
    const data = testData.createDeleteData();
    await DeleteFriendApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      data,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      DeleteFriendApplicationSchema,
      data,
      'DELETEFRIENDAPPLICATION',
    );

    // 核心業務邏輯：刪除好友申請
    expect(mockDatabase.delete.friendApplication).toHaveBeenCalledWith(
      DEFAULT_IDS.senderId,
      DEFAULT_IDS.receiverId,
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('deleted friend application'),
    );
  });

  it('應處理資料驗證錯誤', async () => {
    const invalidData = { senderId: '', receiverId: '' };
    const validationError = new Error('好友申請資料不正確');

    await testValidationError(
      DeleteFriendApplicationHandler,
      mockSocketInstance,
      mockIoInstance,
      invalidData,
      validationError,
      '刪除好友申請失敗，請稍後再試',
    );
  });

  it('應處理資料庫錯誤', async () => {
    await testDatabaseError(
      DeleteFriendApplicationHandler,
      mockSocketInstance,
      mockIoInstance,
      testData.createDeleteData(),
      'delete',
      'Database connection failed',
      '刪除好友申請失敗，請稍後再試',
    );
  });

  describe('權限檢查', () => {
    it('發送者可以刪除自己的好友申請', async () => {
      mockSocketInstance.data.userId = DEFAULT_IDS.senderId;

      const data = testData.createDeleteData();
      await DeleteFriendApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.delete.friendApplication).toHaveBeenCalledWith(
        DEFAULT_IDS.senderId,
        DEFAULT_IDS.receiverId,
      );
      expect(mockInfo).toHaveBeenCalledWith(
        expect.stringContaining('deleted friend application'),
      );
    });

    it('接收者可以刪除好友申請', async () => {
      mockSocketInstance.data.userId = DEFAULT_IDS.receiverId;

      const data = testData.createDeleteData();
      await DeleteFriendApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.delete.friendApplication).toHaveBeenCalledWith(
        DEFAULT_IDS.senderId,
        DEFAULT_IDS.receiverId,
      );
      expect(mockInfo).toHaveBeenCalledWith(
        expect.stringContaining('deleted friend application'),
      );
    });

    it('操作者不能刪除非自己相關的好友申請', async () => {
      mockSocketInstance.data.userId = DEFAULT_IDS.otherUserId;

      const data = testData.createDeleteData();
      await DeleteFriendApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Cannot delete non-self friend applications'),
      );
      expect(mockDatabase.delete.friendApplication).not.toHaveBeenCalled();
    });
  });

  describe('業務邏輯檢查', () => {
    it('應正確處理刪除操作的參數', async () => {
      const data = testData.createDeleteData();
      await DeleteFriendApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.delete.friendApplication).toHaveBeenCalledWith(
        DEFAULT_IDS.senderId,
        DEFAULT_IDS.receiverId,
      );
    });

    it('應正確處理不同的發送者和接收者組合', async () => {
      const data = testData.createDeleteData({
        senderId: 'custom-sender-id',
        receiverId: 'custom-receiver-id',
      });

      // 設定操作者為發送者
      mockSocketInstance.data.userId = 'custom-sender-id';

      await DeleteFriendApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.delete.friendApplication).toHaveBeenCalledWith(
        'custom-sender-id',
        'custom-receiver-id',
      );
    });

    it('應在執行刪除前進行適當的驗證', async () => {
      const data = testData.createDeleteData();
      await DeleteFriendApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDataValidator.validate).toHaveBeenCalledWith(
        DeleteFriendApplicationSchema,
        data,
        'DELETEFRIENDAPPLICATION',
      );
    });
  });
});

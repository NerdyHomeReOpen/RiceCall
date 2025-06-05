import { jest } from '@jest/globals';
import { mockDatabase, mockDataValidator, mockInfo } from '../../_testSetup';

// Mock Database
jest.mock('@/index', () => ({
  database: require('../../_testSetup').mockDatabase,
}));

// Mock DataValidator
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

// 被測試的模組和測試輔助工具
import { UpdateFriendGroupHandler } from '../../../src/api/socket/events/friendGroup/friendGroup.handler';
import { UpdateFriendGroupSchema } from '../../../src/api/socket/events/friendGroup/friendGroup.schema';
import {
  createDefaultTestData,
  createStandardMockInstances,
  DEFAULT_IDS,
  setupAfterEach,
  setupBeforeEach,
  testDatabaseError,
  testPermissionFailure,
  testValidationError,
} from './_testHelpers';

describe('UpdateFriendGroupHandler (好友群組更新處理)', () => {
  let mockSocketInstance: any;
  let mockIoInstance: any;
  let testData: ReturnType<typeof createDefaultTestData>;

  beforeEach(() => {
    // 建立測試資料
    testData = createDefaultTestData();

    // 建立 mock 實例
    const mockInstances = createStandardMockInstances(DEFAULT_IDS.userId);
    mockSocketInstance = mockInstances.mockSocketInstance;
    mockIoInstance = mockInstances.mockIoInstance;

    // 設定通用的 beforeEach
    setupBeforeEach(mockSocketInstance, mockIoInstance, testData);
  });

  afterEach(() => {
    setupAfterEach();
  });

  it('應成功更新好友群組', async () => {
    const data = testData.createFriendGroupUpdateData();
    await UpdateFriendGroupHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      data,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      UpdateFriendGroupSchema,
      data,
      'UPDATEFRIENDGROUP',
    );

    expect(mockDatabase.set.friendGroup).toHaveBeenCalledWith(
      DEFAULT_IDS.friendGroupId,
      data.group,
    );

    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'friendGroupUpdate',
      DEFAULT_IDS.friendGroupId,
      data.group,
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('updated friend group'),
    );
  });

  it('應處理資料驗證錯誤', async () => {
    const invalidData = { userId: '', friendGroupId: '', group: {} };
    const validationError = new Error('好友群組資料不正確');

    await testValidationError(
      UpdateFriendGroupHandler,
      mockSocketInstance,
      mockIoInstance,
      invalidData,
      validationError,
      '更新好友群組失敗，請稍後再試',
    );
  });

  it('應處理資料庫錯誤', async () => {
    await testDatabaseError(
      UpdateFriendGroupHandler,
      mockSocketInstance,
      mockIoInstance,
      testData.createFriendGroupUpdateData(),
      'set',
      'Database connection failed',
      '更新好友群組失敗，請稍後再試',
    );
  });

  describe('權限檢查', () => {
    it('操作者不能更新非自己的好友群組', async () => {
      await testPermissionFailure(
        UpdateFriendGroupHandler,
        mockSocketInstance,
        mockIoInstance,
        testData.createFriendGroupUpdateData(),
        DEFAULT_IDS.otherUserId,
        'Cannot update non-self friend groups',
      );
    });
  });

  describe('好友群組更新處理', () => {
    it('應能只更新部分屬性', async () => {
      const data = testData.createFriendGroupUpdateData({
        group: {
          name: '只更新名稱',
        },
      });

      await UpdateFriendGroupHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.set.friendGroup).toHaveBeenCalledWith(
        DEFAULT_IDS.friendGroupId,
        { name: '只更新名稱' },
      );

      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'friendGroupUpdate',
        DEFAULT_IDS.friendGroupId,
        { name: '只更新名稱' },
      );
    });

    it('應能更新群組順序', async () => {
      const data = testData.createFriendGroupUpdateData({
        group: {
          order: 5,
        },
      });

      await UpdateFriendGroupHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.set.friendGroup).toHaveBeenCalledWith(
        DEFAULT_IDS.friendGroupId,
        { order: 5 },
      );

      expect(mockInfo).toHaveBeenCalledWith(
        expect.stringContaining('updated friend group'),
      );
    });

    it('應正確處理同時更新名稱和順序', async () => {
      const data = testData.createFriendGroupUpdateData({
        group: {
          name: '新的群組名稱',
          order: 8,
        },
      });

      await UpdateFriendGroupHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.set.friendGroup).toHaveBeenCalledWith(
        DEFAULT_IDS.friendGroupId,
        {
          name: '新的群組名稱',
          order: 8,
        },
      );
    });

    it('應正確處理不同的friendGroupId', async () => {
      const customGroupId = 'custom-friend-group-id';
      const data = testData.createFriendGroupUpdateData({
        friendGroupId: customGroupId,
        group: {
          name: '自定義群組',
        },
      });

      await UpdateFriendGroupHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.set.friendGroup).toHaveBeenCalledWith(
        customGroupId,
        expect.objectContaining({
          name: '自定義群組',
        }),
      );

      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'friendGroupUpdate',
        customGroupId,
        expect.objectContaining({
          name: '自定義群組',
        }),
      );
    });

    it('應能處理空的更新資料', async () => {
      const data = testData.createFriendGroupUpdateData({
        group: {},
      });

      await UpdateFriendGroupHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.set.friendGroup).toHaveBeenCalledWith(
        DEFAULT_IDS.friendGroupId,
        {},
      );
    });
  });

  describe('Socket事件處理', () => {
    it('更新成功後應發送friendGroupUpdate事件', async () => {
      const data = testData.createFriendGroupUpdateData();
      await UpdateFriendGroupHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'friendGroupUpdate',
        DEFAULT_IDS.friendGroupId,
        data.group,
      );
    });

    it('應在socket事件中包含正確的群組ID和更新資料', async () => {
      const updateData = {
        name: '測試更新事件',
        order: 7,
      };
      const data = testData.createFriendGroupUpdateData({
        group: updateData,
      });

      await UpdateFriendGroupHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'friendGroupUpdate',
        DEFAULT_IDS.friendGroupId,
        updateData,
      );
    });
  });

  describe('業務邏輯檢查', () => {
    it('應正確處理更新操作的參數', async () => {
      const data = testData.createFriendGroupUpdateData({
        group: {
          name: '參數測試群組',
          order: 99,
        },
      });

      await UpdateFriendGroupHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDataValidator.validate).toHaveBeenCalledWith(
        UpdateFriendGroupSchema,
        data,
        'UPDATEFRIENDGROUP',
      );

      expect(mockDatabase.set.friendGroup).toHaveBeenCalledTimes(1);
      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'friendGroupUpdate',
        expect.any(String),
        expect.any(Object),
      );
    });

    it('應在執行更新前進行適當的驗證', async () => {
      const data = testData.createFriendGroupUpdateData();
      await UpdateFriendGroupHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 檢查驗證和資料庫操作都被執行
      expect(mockDataValidator.validate).toHaveBeenCalledWith(
        UpdateFriendGroupSchema,
        data,
        'UPDATEFRIENDGROUP',
      );
      expect(mockDatabase.set.friendGroup).toHaveBeenCalledTimes(1);
    });
  });
});

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
import { CreateFriendGroupHandler } from '../../../src/api/socket/events/friendGroup/friendGroup.handler';
import { CreateFriendGroupSchema } from '../../../src/api/socket/events/friendGroup/friendGroup.schema';
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

describe('CreateFriendGroupHandler (好友群組創建處理)', () => {
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

  it('應成功創建好友群組', async () => {
    const data = testData.createFriendGroupCreateData();
    await CreateFriendGroupHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      data,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      CreateFriendGroupSchema,
      data,
      'CREATEFRIENDGROUP',
    );

    expect(mockDatabase.set.friendGroup).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        name: '新建群組',
        order: 0,
        userId: DEFAULT_IDS.userId,
        createdAt: expect.any(Number),
      }),
    );

    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'friendGroupAdd',
      expect.any(Object),
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('created friend group'),
    );
  });

  it('應處理資料驗證錯誤', async () => {
    const invalidData = { userId: '', group: {} };
    const validationError = new Error('好友群組資料不正確');

    await testValidationError(
      CreateFriendGroupHandler,
      mockSocketInstance,
      mockIoInstance,
      invalidData,
      validationError,
      '建立好友群組失敗，請稍後再試',
    );
  });

  it('應處理資料庫錯誤', async () => {
    await testDatabaseError(
      CreateFriendGroupHandler,
      mockSocketInstance,
      mockIoInstance,
      testData.createFriendGroupCreateData(),
      'set',
      'Database connection failed',
      '建立好友群組失敗，請稍後再試',
    );
  });

  describe('權限檢查', () => {
    it('操作者不能創建非自己的好友群組', async () => {
      await testPermissionFailure(
        CreateFriendGroupHandler,
        mockSocketInstance,
        mockIoInstance,
        testData.createFriendGroupCreateData(),
        DEFAULT_IDS.otherUserId,
        'Cannot create non-self friend groups',
      );
    });
  });

  describe('好友群組創建處理', () => {
    it('應生成UUID作為friendGroupId', async () => {
      const data = testData.createFriendGroupCreateData();
      await CreateFriendGroupHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      const setFriendGroupCall = mockDatabase.set.friendGroup.mock.calls[0];
      const friendGroupId = setFriendGroupCall[0];

      // 檢查UUID格式 (36字符，包含連字符)
      expect(friendGroupId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('應包含創建時間戳', async () => {
      const data = testData.createFriendGroupCreateData();
      await CreateFriendGroupHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      const setFriendGroupCall = mockDatabase.set.friendGroup.mock.calls[0];
      const friendGroupData = setFriendGroupCall[1];

      expect(friendGroupData.createdAt).toBeGreaterThan(0);
      expect(typeof friendGroupData.createdAt).toBe('number');
    });

    it('應正確處理自定義群組名稱', async () => {
      const data = testData.createFriendGroupCreateData({
        group: {
          name: '自定義群組名稱',
          order: 5,
        },
      });

      await CreateFriendGroupHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.set.friendGroup).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          name: '自定義群組名稱',
          order: 5,
          userId: DEFAULT_IDS.userId,
        }),
      );
    });

    it('應正確處理群組順序', async () => {
      const data = testData.createFriendGroupCreateData({
        group: {
          name: '測試群組',
          order: 10,
        },
      });

      await CreateFriendGroupHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.set.friendGroup).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          order: 10,
        }),
      );
    });

    it('應正確處理不同的用戶ID', async () => {
      const customUserId = 'custom-user-id';
      const customMockInstances = createStandardMockInstances(customUserId);
      const customSocketInstance = customMockInstances.mockSocketInstance;

      const data = testData.createFriendGroupCreateData({
        userId: customUserId,
      });

      await CreateFriendGroupHandler.handle(
        mockIoInstance,
        customSocketInstance,
        data,
      );

      expect(mockDatabase.set.friendGroup).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          userId: customUserId,
        }),
      );
    });
  });

  describe('Socket事件處理', () => {
    it('創建成功後應發送friendGroupAdd事件', async () => {
      const data = testData.createFriendGroupCreateData();
      await CreateFriendGroupHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'friendGroupAdd',
        expect.any(Object),
      );
    });

    it('應在socket事件中包含正確的群組資料', async () => {
      const data = testData.createFriendGroupCreateData({
        group: {
          name: '測試群組事件',
          order: 3,
        },
      });

      await CreateFriendGroupHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 檢查emit被調用時的第二個參數
      const emitCall = mockSocketInstance.emit.mock.calls.find(
        (call: any[]) => call[0] === 'friendGroupAdd',
      );
      expect(emitCall).toBeDefined();
      expect(emitCall[1]).toBeDefined();
    });
  });
});

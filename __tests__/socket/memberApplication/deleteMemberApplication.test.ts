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
import { DeleteMemberApplicationHandler } from '../../../src/api/socket/events/memberApplication/memberApplication.handler';
import { DeleteMemberApplicationSchema } from '../../../src/api/socket/events/memberApplication/memberApplication.schema';
import {
  createDefaultTestData,
  createStandardMockInstances,
  DEFAULT_IDS,
  setupAfterEach,
  setupBeforeEach,
  testDatabaseError,
  testInsufficientPermission,
  testValidationError,
} from './_testHelpers';

describe('DeleteMemberApplicationHandler (成員申請刪除處理)', () => {
  let mockSocketInstance: any;
  let mockIoInstance: any;
  let testData: ReturnType<typeof createDefaultTestData>;

  beforeEach(() => {
    // 建立測試資料
    testData = createDefaultTestData();

    // 建立 mock 實例
    const mockInstances = createStandardMockInstances(
      DEFAULT_IDS.operatorUserId,
    );
    mockSocketInstance = mockInstances.mockSocketInstance;
    mockIoInstance = mockInstances.mockIoInstance;

    // 設定通用的 beforeEach
    setupBeforeEach(mockSocketInstance, mockIoInstance, testData);
  });

  afterEach(() => {
    setupAfterEach();
  });

  it('應成功刪除其他用戶的成員申請', async () => {
    const data = testData.createMemberApplicationDeleteData();

    await DeleteMemberApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      data,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      DeleteMemberApplicationSchema,
      data,
      'DELETEMEMBERAPPLICATION',
    );

    expect(mockDatabase.delete.memberApplication).toHaveBeenCalledWith(
      DEFAULT_IDS.targetUserId,
      DEFAULT_IDS.serverId,
    );

    const mockIoRoomEmit = require('../../_testSetup').mockIoRoomEmit;
    expect(mockIoRoomEmit).toHaveBeenCalledWith(
      'serverMemberApplicationDelete',
      DEFAULT_IDS.targetUserId,
      DEFAULT_IDS.serverId,
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('deleted member application'),
    );
  });

  it('應成功刪除自己的成員申請', async () => {
    const selfDeleteData = testData.createMemberApplicationDeleteData({
      userId: DEFAULT_IDS.operatorUserId,
    });
    mockDataValidator.validate.mockResolvedValue(selfDeleteData);

    mockSocketInstance.data.userId = DEFAULT_IDS.operatorUserId;

    await DeleteMemberApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      selfDeleteData,
    );

    expect(mockDatabase.delete.memberApplication).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      DEFAULT_IDS.serverId,
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('deleted member application'),
    );
  });

  it('應處理資料驗證錯誤', async () => {
    const invalidData = { userId: '', serverId: '' };
    const validationError = new Error('成員申請資料不正確');

    await testValidationError(
      DeleteMemberApplicationHandler,
      mockSocketInstance,
      mockIoInstance,
      invalidData,
      validationError,
      '刪除成員申請失敗，請稍後再試',
    );
  });

  it('應處理資料庫錯誤', async () => {
    await testDatabaseError(
      DeleteMemberApplicationHandler,
      mockSocketInstance,
      mockIoInstance,
      testData.createMemberApplicationDeleteData(),
      'delete',
      'Database connection failed',
      '刪除成員申請失敗，請稍後再試',
    );
  });

  describe('權限檢查', () => {
    it('操作者權限不足時應拒絕（權限 < 5）', async () => {
      await testInsufficientPermission(
        DeleteMemberApplicationHandler,
        mockSocketInstance,
        mockIoInstance,
        testData.createMemberApplicationDeleteData(),
        3, // 權限不足
        'Not enough permission',
      );
    });

    it('應允許操作者刪除自己的申請（不需要權限檢查）', async () => {
      // 設定操作者權限不足但刪除自己的申請
      testData.operatorMember.permissionLevel = 1;
      const selfDeleteData = testData.createMemberApplicationDeleteData({
        userId: DEFAULT_IDS.operatorUserId,
      });
      mockDataValidator.validate.mockResolvedValue(selfDeleteData);
      mockSocketInstance.data.userId = DEFAULT_IDS.operatorUserId;

      await DeleteMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        selfDeleteData,
      );

      expect(mockDatabase.delete.memberApplication).toHaveBeenCalledWith(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
      );

      expect(mockInfo).toHaveBeenCalledWith(
        expect.stringContaining('deleted member application'),
      );
    });
  });

  describe('成員申請刪除處理', () => {
    it('應正確處理不同的用戶ID和伺服器ID', async () => {
      const customUserId = 'custom-user-id';
      const customServerId = 'custom-server-id';

      const data = testData.createMemberApplicationDeleteData({
        userId: customUserId,
        serverId: customServerId,
      });

      await DeleteMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.delete.memberApplication).toHaveBeenCalledWith(
        customUserId,
        customServerId,
      );
    });

    it('應在刪除前檢查操作者權限', async () => {
      const data = testData.createMemberApplicationDeleteData();
      await DeleteMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 檢查是否查詢了操作者的成員資格
      expect(mockDatabase.get.member).toHaveBeenCalledWith(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
      );
    });
  });

  describe('Socket事件處理', () => {
    it('刪除成功後應發送正確的房間事件', async () => {
      const data = testData.createMemberApplicationDeleteData();

      await DeleteMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      const mockIoRoomEmit = require('../../_testSetup').mockIoRoomEmit;
      expect(mockIoRoomEmit).toHaveBeenCalledWith(
        'serverMemberApplicationDelete',
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
      );
    });

    it('應在socket事件中包含正確的用戶ID和伺服器ID', async () => {
      const customUserId = 'socket-test-user-id';
      const customServerId = 'socket-test-server-id';
      const data = testData.createMemberApplicationDeleteData({
        userId: customUserId,
        serverId: customServerId,
      });

      await DeleteMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      const mockIoRoomEmit = require('../../_testSetup').mockIoRoomEmit;
      expect(mockIoRoomEmit).toHaveBeenCalledWith(
        'serverMemberApplicationDelete',
        customUserId,
        customServerId,
      );
    });
  });

  describe('業務邏輯檢查', () => {
    it('應按正確順序執行刪除流程', async () => {
      const data = testData.createMemberApplicationDeleteData();
      await DeleteMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 檢查所有操作都被執行
      expect(mockDataValidator.validate).toHaveBeenCalledWith(
        DeleteMemberApplicationSchema,
        data,
        'DELETEMEMBERAPPLICATION',
      );
      expect(mockDatabase.get.member).toHaveBeenCalledTimes(1); // 操作者權限檢查
      expect(mockDatabase.delete.memberApplication).toHaveBeenCalledTimes(1);
    });

    it('應正確處理刪除操作的參數', async () => {
      const data = testData.createMemberApplicationDeleteData();
      await DeleteMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDataValidator.validate).toHaveBeenCalledWith(
        DeleteMemberApplicationSchema,
        data,
        'DELETEMEMBERAPPLICATION',
      );

      expect(mockDatabase.delete.memberApplication).toHaveBeenCalledTimes(1);
    });

    it('應在執行刪除前進行適當的驗證', async () => {
      const data = testData.createMemberApplicationDeleteData();
      await DeleteMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 檢查驗證和資料庫操作都被執行
      expect(mockDataValidator.validate).toHaveBeenCalledWith(
        DeleteMemberApplicationSchema,
        data,
        'DELETEMEMBERAPPLICATION',
      );
      expect(mockDatabase.delete.memberApplication).toHaveBeenCalledTimes(1);
    });
  });
});

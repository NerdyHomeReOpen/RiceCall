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
import { UpdateMemberApplicationHandler } from '../../../src/api/socket/events/memberApplication/memberApplication.handler';
import { UpdateMemberApplicationSchema } from '../../../src/api/socket/events/memberApplication/memberApplication.schema';
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

describe('UpdateMemberApplicationHandler (成員申請更新處理)', () => {
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

  it('應成功更新其他用戶的成員申請', async () => {
    const data = testData.createMemberApplicationUpdateData();

    await UpdateMemberApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      data,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      UpdateMemberApplicationSchema,
      data,
      'UPDATEMEMBERAPPLICATION',
    );

    expect(mockDatabase.set.memberApplication).toHaveBeenCalledWith(
      DEFAULT_IDS.targetUserId,
      DEFAULT_IDS.serverId,
      data.memberApplication,
    );

    const mockIoRoomEmit = require('../../_testSetup').mockIoRoomEmit;
    expect(mockIoRoomEmit).toHaveBeenCalledWith(
      'serverMemberApplicationUpdate',
      DEFAULT_IDS.targetUserId,
      DEFAULT_IDS.serverId,
      data.memberApplication,
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('updated member application'),
    );
  });

  it('應成功更新自己的成員申請', async () => {
    const selfUpdateData = testData.createMemberApplicationUpdateData({
      userId: DEFAULT_IDS.operatorUserId,
    });
    mockDataValidator.validate.mockResolvedValue(selfUpdateData);

    mockSocketInstance.data.userId = DEFAULT_IDS.operatorUserId;

    await UpdateMemberApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      selfUpdateData,
    );

    expect(mockDatabase.set.memberApplication).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      DEFAULT_IDS.serverId,
      selfUpdateData.memberApplication,
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('updated member application'),
    );
  });

  it('應處理資料驗證錯誤', async () => {
    const invalidData = { userId: '', serverId: '', memberApplication: {} };
    const validationError = new Error('成員申請資料不正確');

    await testValidationError(
      UpdateMemberApplicationHandler,
      mockSocketInstance,
      mockIoInstance,
      invalidData,
      validationError,
      '更新成員申請失敗，請稍後再試',
    );
  });

  it('應處理資料庫錯誤', async () => {
    await testDatabaseError(
      UpdateMemberApplicationHandler,
      mockSocketInstance,
      mockIoInstance,
      testData.createMemberApplicationUpdateData(),
      'set',
      'Database connection failed',
      '更新成員申請失敗，請稍後再試',
    );
  });

  describe('權限檢查', () => {
    it('操作者權限不足時應拒絕（權限 < 5）', async () => {
      await testInsufficientPermission(
        UpdateMemberApplicationHandler,
        mockSocketInstance,
        mockIoInstance,
        testData.createMemberApplicationUpdateData(),
        3, // 權限不足
        'Not enough permission',
      );
    });

    it('應允許操作者更新自己的申請（不需要權限檢查）', async () => {
      // 設定操作者權限不足但更新自己的申請
      testData.operatorMember.permissionLevel = 1;
      const selfUpdateData = testData.createMemberApplicationUpdateData({
        userId: DEFAULT_IDS.operatorUserId,
      });
      mockDataValidator.validate.mockResolvedValue(selfUpdateData);
      mockSocketInstance.data.userId = DEFAULT_IDS.operatorUserId;

      await UpdateMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        selfUpdateData,
      );

      expect(mockDatabase.set.memberApplication).toHaveBeenCalledWith(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
        selfUpdateData.memberApplication,
      );

      expect(mockInfo).toHaveBeenCalledWith(
        expect.stringContaining('updated member application'),
      );
    });
  });

  describe('成員申請更新處理', () => {
    it('應能部分更新申請資料', async () => {
      const partialUpdateData = testData.createMemberApplicationUpdateData({
        memberApplication: {
          description: '只更新描述',
        },
      });
      mockDataValidator.validate.mockResolvedValue(partialUpdateData);

      await UpdateMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        partialUpdateData,
      );

      expect(mockDatabase.set.memberApplication).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
        { description: '只更新描述' },
      );

      expect(mockInfo).toHaveBeenCalledWith(
        expect.stringContaining('updated member application'),
      );
    });

    it('應正確處理不同的用戶ID和伺服器ID', async () => {
      const customUserId = 'custom-user-id';
      const customServerId = 'custom-server-id';

      const data = testData.createMemberApplicationUpdateData({
        userId: customUserId,
        serverId: customServerId,
        memberApplication: {
          description: '自定義申請',
        },
      });

      await UpdateMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.set.memberApplication).toHaveBeenCalledWith(
        customUserId,
        customServerId,
        expect.objectContaining({
          description: '自定義申請',
        }),
      );
    });

    it('應能處理空的更新資料', async () => {
      const emptyUpdateData = testData.createMemberApplicationUpdateData({
        memberApplication: {},
      });

      await UpdateMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        emptyUpdateData,
      );

      expect(mockDatabase.set.memberApplication).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
        {},
      );
    });
  });

  describe('Socket事件處理', () => {
    it('更新成功後應發送正確的房間事件', async () => {
      const data = testData.createMemberApplicationUpdateData();

      await UpdateMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      const mockIoRoomEmit = require('../../_testSetup').mockIoRoomEmit;
      expect(mockIoRoomEmit).toHaveBeenCalledWith(
        'serverMemberApplicationUpdate',
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
        data.memberApplication,
      );
    });

    it('應在socket事件中包含正確的更新資料', async () => {
      const updateData = {
        description: '測試更新事件',
      };
      const data = testData.createMemberApplicationUpdateData({
        memberApplication: updateData,
      });

      await UpdateMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      const mockIoRoomEmit = require('../../_testSetup').mockIoRoomEmit;
      expect(mockIoRoomEmit).toHaveBeenCalledWith(
        'serverMemberApplicationUpdate',
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
        updateData,
      );
    });
  });

  describe('業務邏輯檢查', () => {
    it('應正確處理更新操作的參數', async () => {
      const data = testData.createMemberApplicationUpdateData({
        memberApplication: {
          description: '參數測試',
        },
      });

      await UpdateMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDataValidator.validate).toHaveBeenCalledWith(
        UpdateMemberApplicationSchema,
        data,
        'UPDATEMEMBERAPPLICATION',
      );

      expect(mockDatabase.set.memberApplication).toHaveBeenCalledTimes(1);
    });

    it('應在執行更新前進行適當的驗證', async () => {
      const data = testData.createMemberApplicationUpdateData();
      await UpdateMemberApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 檢查驗證和資料庫操作都被執行
      expect(mockDataValidator.validate).toHaveBeenCalledWith(
        UpdateMemberApplicationSchema,
        data,
        'UPDATEMEMBERAPPLICATION',
      );
      expect(mockDatabase.set.memberApplication).toHaveBeenCalledTimes(1);
    });

    it('應正確檢查操作者的成員資格', async () => {
      const data = testData.createMemberApplicationUpdateData();
      await UpdateMemberApplicationHandler.handle(
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
});

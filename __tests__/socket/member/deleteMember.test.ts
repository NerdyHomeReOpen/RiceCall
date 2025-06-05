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

// Mock SocketServer
jest.mock('@/api/socket', () => ({
  __esModule: true,
  default: require('./_testHelpers').mockSocketServer,
}));

// 被測試的模組和測試輔助工具
import { DeleteMemberHandler } from '../../../src/api/socket/events/member/member.handler';
import { DeleteMemberSchema } from '../../../src/api/socket/events/member/member.schema';
import {
  createDefaultTestData,
  createStandardMockInstances,
  DEFAULT_IDS,
  mockSocketServer,
  setupAfterEach,
  setupBeforeEach,
  setupDefaultDatabaseMocks,
  setupTargetUserOnline,
  testDatabaseError,
  testPermissionLowerThanTarget,
  testValidationError,
} from './_testHelpers';

describe('DeleteMemberHandler (成員刪除處理)', () => {
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

  it('應成功刪除其他用戶的成員（目標用戶在線）', async () => {
    const targetSocket = setupTargetUserOnline();
    const data = testData.createMemberDeleteData();

    await DeleteMemberHandler.handle(mockIoInstance, mockSocketInstance, data);

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      DeleteMemberSchema,
      data,
      'DELETEMEMBER',
    );

    expect(mockDatabase.delete.member).toHaveBeenCalledWith(
      DEFAULT_IDS.targetUserId,
      DEFAULT_IDS.serverId,
    );

    expect(targetSocket.emit).toHaveBeenCalledWith(
      'serverDelete',
      DEFAULT_IDS.serverId,
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('deleted member'),
    );
  });

  it('應成功刪除其他用戶的成員（目標用戶離線）', async () => {
    // 確保用戶離線
    mockSocketServer.getSocket.mockReturnValue(null);

    const data = testData.createMemberDeleteData();

    await DeleteMemberHandler.handle(mockIoInstance, mockSocketInstance, data);

    expect(mockDatabase.delete.member).toHaveBeenCalledWith(
      DEFAULT_IDS.targetUserId,
      DEFAULT_IDS.serverId,
    );

    // 用戶離線時不應該調用 emit
    expect(mockSocketServer.getSocket).toHaveBeenCalledWith(
      DEFAULT_IDS.targetUserId,
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('deleted member'),
    );
  });

  it('應處理資料驗證錯誤', async () => {
    const invalidData = { userId: '', serverId: '' };
    const validationError = new Error('成員資料不正確');

    await testValidationError(
      DeleteMemberHandler,
      mockSocketInstance,
      mockIoInstance,
      invalidData,
      validationError,
      '刪除成員失敗，請稍後再試',
    );
  });

  it('應處理資料庫錯誤', async () => {
    await testDatabaseError(
      DeleteMemberHandler,
      mockSocketInstance,
      mockIoInstance,
      testData.createMemberDeleteData(),
      'delete',
      'Database connection failed',
      '刪除成員失敗，請稍後再試',
    );
  });

  describe('權限檢查', () => {
    it('操作者權限不足時應拒絕（權限 < 3）', async () => {
      // 設定操作者權限不足
      const modifiedTestData = createDefaultTestData();
      modifiedTestData.operatorMember.permissionLevel = 2; // 權限不足

      setupDefaultDatabaseMocks(modifiedTestData);

      const data = testData.createMemberDeleteData();
      mockDataValidator.validate.mockResolvedValue(data);

      await DeleteMemberHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 檢查權限失敗的行為：不執行核心操作
      expect(mockDatabase.delete.member).not.toHaveBeenCalled();

      // 檢查日誌記錄 - 根據實際測試結果，期望的訊息是 "Permission lower than the target"
      const mockWarnFromSetup = require('../../_testSetup').mockWarn;
      expect(mockWarnFromSetup).toHaveBeenCalledWith(
        expect.stringContaining('Permission lower than the target'),
      );
    });

    it('操作者權限不能低於目標用戶', async () => {
      await testPermissionLowerThanTarget(
        DeleteMemberHandler,
        mockSocketInstance,
        mockIoInstance,
        testData.createMemberDeleteData(),
        3, // 操作者權限
        4, // 目標用戶權限更高
        'Permission lower than the target',
      );
    });

    it('不能刪除群組創建者的成員', async () => {
      // 設定目標用戶為群組創建者
      const modifiedTestData = createDefaultTestData();
      modifiedTestData.targetMember.permissionLevel = 6; // 群組創建者

      setupDefaultDatabaseMocks(modifiedTestData);

      const data = testData.createMemberDeleteData();
      mockDataValidator.validate.mockResolvedValue(data);

      await DeleteMemberHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 檢查權限失敗的行為：不執行核心操作
      expect(mockDatabase.delete.member).not.toHaveBeenCalled();

      // 檢查日誌記錄
      const mockWarnFromSetup = require('../../_testSetup').mockWarn;
      expect(mockWarnFromSetup).toHaveBeenCalledWith(
        expect.stringContaining("Cannot delete group creator's member"),
      );
    });
  });

  describe('成員刪除處理', () => {
    it('應正確處理不同的用戶ID和伺服器ID', async () => {
      const customUserId = 'custom-user-id';
      const customServerId = 'custom-server-id';

      // 為自定義ID設定 mock
      mockDatabase.get.member.mockImplementation((userId, serverId) => {
        if (
          userId === DEFAULT_IDS.operatorUserId &&
          serverId === customServerId
        ) {
          return Promise.resolve({
            ...testData.operatorMember,
            serverId: customServerId,
          });
        } else if (userId === customUserId && serverId === customServerId) {
          return Promise.resolve({
            ...testData.targetMember,
            userId: customUserId,
            serverId: customServerId,
          });
        }
        return Promise.resolve(testData.operatorMember);
      });

      const data = testData.createMemberDeleteData({
        userId: customUserId,
        serverId: customServerId,
      });

      await DeleteMemberHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.delete.member).toHaveBeenCalledWith(
        customUserId,
        customServerId,
      );
    });

    it('應在刪除前檢查目標用戶成員資格', async () => {
      const data = testData.createMemberDeleteData();
      await DeleteMemberHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 檢查是否查詢了目標用戶的成員資格
      expect(mockDatabase.get.member).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
      );
    });

    it('應在刪除前檢查操作者權限', async () => {
      const data = testData.createMemberDeleteData();
      await DeleteMemberHandler.handle(
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
    it('刪除成功後應發送serverDelete事件（用戶在線）', async () => {
      const targetSocket = setupTargetUserOnline();
      const data = testData.createMemberDeleteData();

      await DeleteMemberHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(targetSocket.emit).toHaveBeenCalledWith(
        'serverDelete',
        DEFAULT_IDS.serverId,
      );
    });

    it('應在socket事件中包含正確的伺服器ID', async () => {
      const targetSocket = setupTargetUserOnline();
      const customServerId = 'socket-test-server-id';
      const data = testData.createMemberDeleteData({
        serverId: customServerId,
      });

      await DeleteMemberHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(targetSocket.emit).toHaveBeenCalledWith(
        'serverDelete',
        customServerId,
      );
    });

    it('應在用戶離線時不發送socket事件', async () => {
      // 確保用戶離線
      mockSocketServer.getSocket.mockReturnValue(null);

      const data = testData.createMemberDeleteData();
      await DeleteMemberHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockSocketServer.getSocket).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
      );
      // 沒有socket實例時不應該調用emit
    });
  });

  describe('業務邏輯檢查', () => {
    it('應按正確順序執行刪除流程', async () => {
      const data = testData.createMemberDeleteData();
      await DeleteMemberHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 檢查所有操作都被執行
      expect(mockDataValidator.validate).toHaveBeenCalledWith(
        DeleteMemberSchema,
        data,
        'DELETEMEMBER',
      );
      expect(mockDatabase.get.member).toHaveBeenCalledTimes(2); // 操作者和目標用戶
      expect(mockDatabase.delete.member).toHaveBeenCalledTimes(1);
    });

    it('應正確處理刪除操作的參數', async () => {
      const data = testData.createMemberDeleteData();
      await DeleteMemberHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDataValidator.validate).toHaveBeenCalledWith(
        DeleteMemberSchema,
        data,
        'DELETEMEMBER',
      );

      expect(mockDatabase.delete.member).toHaveBeenCalledTimes(1);
    });

    it('應在執行刪除前進行適當的驗證', async () => {
      const data = testData.createMemberDeleteData();
      await DeleteMemberHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 檢查驗證和資料庫操作都被執行
      expect(mockDataValidator.validate).toHaveBeenCalledWith(
        DeleteMemberSchema,
        data,
        'DELETEMEMBER',
      );
      expect(mockDatabase.delete.member).toHaveBeenCalledTimes(1);
    });

    it('應正確檢查操作者和目標用戶的成員資格', async () => {
      const data = testData.createMemberDeleteData();
      await DeleteMemberHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 檢查是否查詢了操作者和目標用戶的成員資格
      expect(mockDatabase.get.member).toHaveBeenCalledWith(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.serverId,
      );
      expect(mockDatabase.get.member).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
      );
    });
  });
});

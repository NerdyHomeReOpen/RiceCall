import { jest } from '@jest/globals';

// 使用本地的測試輔助工具
import {
  createDefaultTestData,
  createStandardMockInstances,
  DEFAULT_IDS,
  setupAfterEach,
  setupBeforeEach,
  setupBiDirectionalMock,
  testDatabaseError,
  testPermissionFailure,
  testValidationError,
} from './_testHelpers';

// 測試設定
import {
  mockDatabase,
  mockDataValidator,
  mockInfo,
  mockSocketServerGetSocket,
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
  default: { getSocket: mockSocketServerGetSocket },
}));

jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockLogger,
}));

jest.mock('@/error', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockStandardizedError,
}));

// Mock biDirectionalAsyncOperation
const mockBiDirectional = setupBiDirectionalMock();

// 被測試的模組
import { DeleteFriendHandler } from '../../../src/api/socket/events/friend/friend.handler';
import { DeleteFriendSchema } from '../../../src/api/socket/events/friend/friend.schema';

describe('DeleteFriendHandler (好友刪除處理)', () => {
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

    // 重設 biDirectional mock
    mockBiDirectional.mockClear();
  });

  afterEach(() => {
    setupAfterEach();
  });

  it('應成功刪除好友關係', async () => {
    const targetSocket = require('../../_testSetup').createMockSocket(
      DEFAULT_IDS.targetUserId,
      'target-socket-id',
    );
    mockSocketServerGetSocket.mockReturnValue(targetSocket);

    const deleteData = testData.createDeleteData();

    await DeleteFriendHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      deleteData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      DeleteFriendSchema,
      deleteData,
      'DELETEFRIEND',
    );

    // 核心業務邏輯：刪除雙向好友關係
    expect(mockBiDirectional).toHaveBeenCalledWith(expect.any(Function), [
      DEFAULT_IDS.operatorUserId,
      DEFAULT_IDS.targetUserId,
    ]);

    // Socket 事件發送
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'friendDelete',
      DEFAULT_IDS.operatorUserId,
      DEFAULT_IDS.targetUserId,
    );
    expect(targetSocket.emit).toHaveBeenCalledWith(
      'friendDelete',
      DEFAULT_IDS.targetUserId,
      DEFAULT_IDS.operatorUserId,
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('deleted friend'),
    );
  });

  it('應處理資料驗證錯誤', async () => {
    const invalidData = { userId: '', targetId: '' };
    const validationError = new Error('好友資料不正確');

    await testValidationError(
      DeleteFriendHandler,
      mockSocketInstance,
      mockIoInstance,
      invalidData,
      validationError,
      '刪除好友失敗，請稍後再試',
    );
  });

  it('應處理資料庫錯誤', async () => {
    await testDatabaseError(
      DeleteFriendHandler,
      mockSocketInstance,
      mockIoInstance,
      testData.createDeleteData(),
      'delete',
      'Database connection failed',
      '刪除好友失敗，請稍後再試',
    );
  });

  describe('權限檢查', () => {
    it('操作者不能刪除非自己的好友', async () => {
      await testPermissionFailure(
        DeleteFriendHandler,
        mockSocketInstance,
        mockIoInstance,
        testData.createDeleteData(),
        'different-user-id',
        'Cannot delete non-self friends',
      );
    });
  });

  describe('Socket事件處理', () => {
    it('當目標用戶離線時，只發送給操作者', async () => {
      mockSocketServerGetSocket.mockReturnValue(null); // 目標用戶離線

      const deleteData = testData.createDeleteData();
      await DeleteFriendHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        deleteData,
      );

      // 發送給操作者
      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'friendDelete',
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.targetUserId,
      );

      // 檢查是否嘗試取得目標socket
      expect(mockSocketServerGetSocket).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
      );

      // 應該執行刪除操作
      expect(mockBiDirectional).toHaveBeenCalled();
    });

    it('當目標用戶線上時，應發送給雙方', async () => {
      const targetSocket = require('../../_testSetup').createMockSocket(
        DEFAULT_IDS.targetUserId,
        'target-socket-id',
      );
      mockSocketServerGetSocket.mockReturnValue(targetSocket);

      const deleteData = testData.createDeleteData();
      await DeleteFriendHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        deleteData,
      );

      // 發送給操作者
      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'friendDelete',
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.targetUserId,
      );

      // 發送給目標用戶
      expect(targetSocket.emit).toHaveBeenCalledWith(
        'friendDelete',
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.operatorUserId,
      );

      // 應該執行刪除操作
      expect(mockBiDirectional).toHaveBeenCalled();
    });
  });

  describe('業務邏輯檢查', () => {
    it('應正確處理刪除操作的參數', async () => {
      const deleteData = testData.createDeleteData();
      await DeleteFriendHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        deleteData,
      );

      expect(mockBiDirectional).toHaveBeenCalledWith(expect.any(Function), [
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.targetUserId,
      ]);
    });

    it('應在執行刪除前進行適當的驗證', async () => {
      const deleteData = testData.createDeleteData();
      await DeleteFriendHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        deleteData,
      );

      expect(mockDataValidator.validate).toHaveBeenCalledWith(
        DeleteFriendSchema,
        deleteData,
        'DELETEFRIEND',
      );
    });
  });
});

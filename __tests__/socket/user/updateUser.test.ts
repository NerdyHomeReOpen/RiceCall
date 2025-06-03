import { jest } from '@jest/globals';

// 使用本地的測試輔助工具
import {
  DEFAULT_IDS,
  createDefaultTestData,
  createStandardMockInstances,
  createUpdateData,
  setupAfterEach,
  setupBeforeEach,
  testDatabaseError,
  testUnauthorizedUpdate,
  testValidationError,
} from './_testHelpers';

// 測試設定
import { mockDataValidator, mockDatabase, mockInfo } from '../../_testSetup';

// Mock 核心模組
jest.mock('@/index', () => ({
  database: mockDatabase,
}));

jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    info: mockInfo,
    warn: require('../../_testSetup').mockWarn,
    error: require('../../_testSetup').mockError,
  })),
}));

jest.mock('@/middleware/data.validator', () => ({
  DataValidator: mockDataValidator,
}));

// 被測試的模組
import { UpdateUserHandler } from '../../../src/api/socket/events/user/user.handler';
import { UpdateUserSchema } from '../../../src/api/socket/events/user/user.schema';

describe('UpdateUserHandler (更新用戶處理)', () => {
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

  it('應成功更新自己的用戶資料', async () => {
    const updateData = testData.updateData;

    mockDataValidator.validate.mockResolvedValue(updateData);

    await UpdateUserHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      updateData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      UpdateUserSchema,
      updateData,
      'UPDATEUSER',
    );

    expect(mockDatabase.set.user).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      updateData.user,
    );

    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'userUpdate',
      updateData.user,
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining(`User(${DEFAULT_IDS.operatorUserId}) updated`),
    );
  });

  it('應處理部分更新', async () => {
    const partialUpdateData = createUpdateData(DEFAULT_IDS.operatorUserId, {
      name: '僅更新名稱',
    });

    mockDataValidator.validate.mockResolvedValue(partialUpdateData);

    await UpdateUserHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      partialUpdateData,
    );

    expect(mockDatabase.set.user).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      partialUpdateData.user,
    );
  });

  it('應拒絕更新其他用戶的資料', async () => {
    const otherUserUpdateData = createUpdateData(DEFAULT_IDS.targetUserId, {
      name: '嘗試更新其他用戶',
    });

    await testUnauthorizedUpdate(
      UpdateUserHandler,
      mockSocketInstance,
      mockIoInstance,
      otherUserUpdateData,
    );
  });

  it('應處理不同類型的欄位更新', async () => {
    const fieldUpdateData = createUpdateData(DEFAULT_IDS.operatorUserId, {
      name: '新名稱',
      signature: '新簽名',
      status: 'dnd' as const,
    });

    mockDataValidator.validate.mockResolvedValue(fieldUpdateData);

    await UpdateUserHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      fieldUpdateData,
    );

    expect(mockDatabase.set.user).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      fieldUpdateData.user,
    );
  });

  it('應處理資料驗證錯誤', async () => {
    const invalidData = { userId: '', user: {} };
    const validationError = new Error('用戶ID不能為空');

    await testValidationError(
      UpdateUserHandler,
      mockSocketInstance,
      mockIoInstance,
      invalidData,
      validationError,
      '更新使用者失敗，請稍後再試',
    );
  });

  it('應處理資料庫更新錯誤', async () => {
    await testDatabaseError(
      UpdateUserHandler,
      mockSocketInstance,
      mockIoInstance,
      testData.updateData,
      'set',
      'Database update failed',
      '更新使用者失敗，請稍後再試',
    );
  });

  it('應處理無效的狀態值', async () => {
    const invalidStatusData = createUpdateData(DEFAULT_IDS.operatorUserId, {
      status: 'invalid_status' as any,
    });

    const validationError = new Error('Invalid status value');

    await testValidationError(
      UpdateUserHandler,
      mockSocketInstance,
      mockIoInstance,
      invalidStatusData,
      validationError,
      '更新使用者失敗，請稍後再試',
    );
  });

  it('應處理空的更新資料', async () => {
    const emptyUpdateData = createUpdateData(DEFAULT_IDS.operatorUserId, {});

    mockDataValidator.validate.mockResolvedValue(emptyUpdateData);

    await UpdateUserHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      emptyUpdateData,
    );

    expect(mockDatabase.set.user).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      {},
    );
  });
});

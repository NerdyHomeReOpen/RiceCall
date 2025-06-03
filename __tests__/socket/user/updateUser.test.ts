import { jest } from '@jest/globals';

// 被測試的模組
import { UpdateUserHandler } from '../../../src/api/socket/events/user/user.handler';

// 測試設定
import {
  createMockIo,
  createMockSocket,
  mockDataValidator,
  mockDatabase,
  mockError,
  mockInfo,
  mockWarn,
} from '../../_testSetup';

// 錯誤類型和Schema
import { UpdateUserSchema } from '../../../src/api/socket/events/user/user.schema';

// Mock所有相依模組
jest.mock('@/index', () => ({
  database: require('../../_testSetup').mockDatabase,
}));
jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockLogger,
}));
jest.mock('@/middleware/data.validator', () => ({
  DataValidator: require('../../_testSetup').mockDataValidator,
}));

// 常用的測試ID
const DEFAULT_IDS = {
  operatorUserId: 'operator-user-id',
  targetUserId: 'target-user-id',
} as const;

// 測試數據
const defaultUpdateData = {
  userId: DEFAULT_IDS.operatorUserId,
  user: {
    name: '更新後的用戶名',
    signature: '更新後的個人簽名',
    status: 'dnd' as const,
  },
};

describe('UpdateUserHandler (更新用戶處理)', () => {
  let mockSocketInstance: any;
  let mockIoInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // 建立mock socket和io實例
    mockSocketInstance = createMockSocket(
      DEFAULT_IDS.operatorUserId,
      'test-socket-id',
    );
    mockIoInstance = createMockIo();

    // 預設mock回傳值
    mockDataValidator.validate.mockResolvedValue(defaultUpdateData);
    mockDatabase.set.user.mockResolvedValue(true);
  });

  it('應成功更新自己的用戶資料', async () => {
    await UpdateUserHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultUpdateData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      UpdateUserSchema,
      defaultUpdateData,
      'UPDATEUSER',
    );

    expect(mockDatabase.set.user).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      defaultUpdateData.user,
    );

    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'userUpdate',
      defaultUpdateData.user,
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining(`User(${DEFAULT_IDS.operatorUserId}) updated`),
    );
  });

  it('應處理部分更新', async () => {
    const partialUpdateData = {
      userId: DEFAULT_IDS.operatorUserId,
      user: {
        status: 'idle' as const,
      },
    };
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

    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'userUpdate',
      partialUpdateData.user,
    );
  });

  it('不能更新其他用戶的資料', async () => {
    const otherUserUpdateData = {
      userId: DEFAULT_IDS.targetUserId,
      user: {
        name: '嘗試更新其他用戶',
      },
    };
    mockDataValidator.validate.mockResolvedValue(otherUserUpdateData);

    await UpdateUserHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      otherUserUpdateData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Cannot update other user data'),
    );

    // 不應更新資料庫
    expect(mockDatabase.set.user).not.toHaveBeenCalled();
    expect(mockSocketInstance.emit).not.toHaveBeenCalledWith(
      'userUpdate',
      expect.anything(),
    );
  });

  it('應處理不同類型的更新欄位', async () => {
    const complexUpdateData = {
      userId: DEFAULT_IDS.operatorUserId,
      user: {
        avatar: 'new-avatar.jpg',
        avatarUrl: 'https://example.com/avatar.jpg',
        country: '台灣',
        birthYear: 1990,
        birthMonth: 5,
        birthDay: 15,
        gender: 'Female' as const,
      },
    };
    mockDataValidator.validate.mockResolvedValue(complexUpdateData);

    await UpdateUserHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      complexUpdateData,
    );

    expect(mockDatabase.set.user).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      complexUpdateData.user,
    );
  });

  it('應處理狀態更新', async () => {
    const statusUpdateData = {
      userId: DEFAULT_IDS.operatorUserId,
      user: {
        status: 'gn' as const,
      },
    };
    mockDataValidator.validate.mockResolvedValue(statusUpdateData);

    await UpdateUserHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      statusUpdateData,
    );

    expect(mockDatabase.set.user).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      { status: 'gn' },
    );
  });

  it('資料驗證失敗時應發送錯誤', async () => {
    const validationError = new Error('Invalid user data');
    mockDataValidator.validate.mockRejectedValue(validationError);

    await UpdateUserHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultUpdateData,
    );

    expect(mockError).toHaveBeenCalledWith(validationError.message);
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        name: 'ServerError',
        message: '更新使用者失敗，請稍後再試',
        part: 'UPDATEUSER',
        tag: 'EXCEPTION_ERROR',
        statusCode: 500,
      }),
    );
  });

  it('資料庫更新失敗時應發送錯誤', async () => {
    const dbError = new Error('Database update failed');
    mockDatabase.set.user.mockRejectedValue(dbError);

    await UpdateUserHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultUpdateData,
    );

    expect(mockError).toHaveBeenCalledWith(dbError.message);
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        name: 'ServerError',
        message: '更新使用者失敗，請稍後再試',
        part: 'UPDATEUSER',
        tag: 'EXCEPTION_ERROR',
        statusCode: 500,
      }),
    );
  });

  it('應正確呼叫資料驗證器', async () => {
    await UpdateUserHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultUpdateData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      UpdateUserSchema,
      defaultUpdateData,
      'UPDATEUSER',
    );
  });
});

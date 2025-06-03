import { jest } from '@jest/globals';

// 被測試的模組
import { SearchUserHandler } from '../../../src/api/socket/events/user/user.handler';

// 測試設定
import {
  createMockIo,
  createMockSocket,
  mockDataValidator,
  mockDatabase,
  mockError,
} from '../../_testSetup';

// 錯誤類型和Schema
import { SearchUserSchema } from '../../../src/api/socket/events/user/user.schema';

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
} as const;

// 測試數據
const defaultSearchData = {
  query: '測試用戶',
};

const mockSearchResults = [
  {
    userId: 'user-1',
    name: '測試用戶1',
    avatar: 'avatar1.jpg',
    status: 'online',
    signature: '這是第一個測試用戶',
  },
  {
    userId: 'user-2',
    name: '測試用戶2',
    avatar: 'avatar2.jpg',
    status: 'dnd',
    signature: '這是第二個測試用戶',
  },
];

describe('SearchUserHandler (搜尋用戶處理)', () => {
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
    mockDataValidator.validate.mockResolvedValue(defaultSearchData);
    mockDatabase.get.searchUser.mockResolvedValue(mockSearchResults);
  });

  it('應成功搜尋用戶', async () => {
    await SearchUserHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultSearchData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      SearchUserSchema,
      defaultSearchData,
      'SEARCHUSER',
    );

    expect(mockDatabase.get.searchUser).toHaveBeenCalledWith('測試用戶');

    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'userSearch',
      mockSearchResults,
    );
  });

  it('應處理空的搜尋結果', async () => {
    mockDatabase.get.searchUser.mockResolvedValue([]);

    await SearchUserHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultSearchData,
    );

    expect(mockSocketInstance.emit).toHaveBeenCalledWith('userSearch', []);
  });

  it('應處理不同的搜尋查詢', async () => {
    const customSearchData = { query: '管理員' };
    mockDataValidator.validate.mockResolvedValue(customSearchData);

    await SearchUserHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      customSearchData,
    );

    expect(mockDatabase.get.searchUser).toHaveBeenCalledWith('管理員');
  });

  it('資料驗證失敗時應發送錯誤', async () => {
    const validationError = new Error('Invalid query');
    mockDataValidator.validate.mockRejectedValue(validationError);

    await SearchUserHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultSearchData,
    );

    expect(mockError).toHaveBeenCalledWith(validationError.message);
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        name: 'ServerError',
        message: '搜尋使用者失敗，請稍後再試',
        part: 'SEARCHUSER',
        tag: 'EXCEPTION_ERROR',
        statusCode: 500,
      }),
    );
  });

  it('資料庫查詢失敗時應發送錯誤', async () => {
    const dbError = new Error('Database error');
    mockDatabase.get.searchUser.mockRejectedValue(dbError);

    await SearchUserHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultSearchData,
    );

    expect(mockError).toHaveBeenCalledWith(dbError.message);
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        name: 'ServerError',
        message: '搜尋使用者失敗，請稍後再試',
        part: 'SEARCHUSER',
        tag: 'EXCEPTION_ERROR',
        statusCode: 500,
      }),
    );
  });

  it('應正確呼叫資料驗證器', async () => {
    await SearchUserHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultSearchData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      SearchUserSchema,
      defaultSearchData,
      'SEARCHUSER',
    );
  });
});

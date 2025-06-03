import { jest } from '@jest/globals';

// 使用本地的測試輔助工具
import {
  createDefaultTestData,
  createMockSearchResults,
  createSearchData,
  createStandardMockInstances,
  setupAfterEach,
  setupBeforeEach,
  testDatabaseError,
  testValidationError,
} from './_testHelpers';

// 測試設定
import { mockDataValidator, mockDatabase } from '../../_testSetup';

// Mock 核心模組
jest.mock('@/index', () => ({
  database: mockDatabase,
}));

jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    info: require('../../_testSetup').mockInfo,
    warn: require('../../_testSetup').mockWarn,
    error: require('../../_testSetup').mockError,
  })),
}));

jest.mock('@/middleware/data.validator', () => ({
  DataValidator: mockDataValidator,
}));

// 被測試的模組
import { SearchUserHandler } from '../../../src/api/socket/events/user/user.handler';
import { SearchUserSchema } from '../../../src/api/socket/events/user/user.schema';

describe('SearchUserHandler (搜尋用戶處理)', () => {
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

  it('應成功搜尋用戶', async () => {
    const searchData = createSearchData('測試用戶');

    mockDataValidator.validate.mockResolvedValue(searchData);
    mockDatabase.get.searchUser.mockResolvedValue(testData.searchResults);

    await SearchUserHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      searchData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      SearchUserSchema,
      searchData,
      'SEARCHUSER',
    );

    expect(mockDatabase.get.searchUser).toHaveBeenCalledWith('測試用戶');

    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'userSearch',
      testData.searchResults,
    );
  });

  it('應處理空的搜尋結果', async () => {
    const searchData = testData.searchQueries.empty;

    mockDataValidator.validate.mockResolvedValue(searchData);
    mockDatabase.get.searchUser.mockResolvedValue([]);

    await SearchUserHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      searchData,
    );

    expect(mockDatabase.get.searchUser).toHaveBeenCalledWith('不存在的用戶');
    expect(mockSocketInstance.emit).toHaveBeenCalledWith('userSearch', []);
  });

  it('應處理不同的搜尋條件', async () => {
    const queries = ['管理員', 'user123', '特殊字符!@#'];

    for (const query of queries) {
      jest.clearAllMocks();
      setupBeforeEach(mockSocketInstance, mockIoInstance, testData);

      const searchData = createSearchData(query);
      const mockResults = createMockSearchResults(query);

      mockDataValidator.validate.mockResolvedValue(searchData);
      mockDatabase.get.searchUser.mockResolvedValue(mockResults);

      await SearchUserHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        searchData,
      );

      expect(mockDatabase.get.searchUser).toHaveBeenCalledWith(query);
      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'userSearch',
        mockResults,
      );
    }
  });

  it('應處理搜尋錯誤', async () => {
    await testDatabaseError(
      SearchUserHandler,
      mockSocketInstance,
      mockIoInstance,
      testData.searchQueries.basic,
      'get',
      '搜尋服務暫時無法使用',
      '搜尋使用者失敗，請稍後再試',
    );
  });

  it('應處理資料驗證錯誤', async () => {
    const invalidData = { query: '' };
    const validationError = new Error('搜尋關鍵字不能為空');

    await testValidationError(
      SearchUserHandler,
      mockSocketInstance,
      mockIoInstance,
      invalidData,
      validationError,
      '搜尋使用者失敗，請稍後再試',
    );
  });

  it('應處理資料庫錯誤', async () => {
    await testDatabaseError(
      SearchUserHandler,
      mockSocketInstance,
      mockIoInstance,
      testData.searchQueries.basic,
      'get',
      'Database connection failed',
      '搜尋使用者失敗，請稍後再試',
    );
  });
});

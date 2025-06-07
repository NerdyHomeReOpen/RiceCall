import { jest } from '@jest/globals';
import { mockDataValidator, mockDatabase } from '../../_testSetup';

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

// 被測試的模組和測試輔助工具
import { SearchServerHandler } from '../../../src/api/socket/events/server/server.handler';
import { SearchServerSchema } from '../../../src/api/socket/events/server/server.schema';
import {
  createDefaultTestData,
  createSearchResults,
  createStandardMockInstances,
  setupAfterEach,
  setupBeforeEach,
  testDatabaseError,
  testValidationError,
} from './_testHelpers';

describe('SearchServerHandler (搜尋伺服器處理)', () => {
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

  it('應成功搜尋伺服器', async () => {
    const searchResults = createSearchResults(2);
    const data = testData.createSearchServerData();

    mockDatabase.get.searchServer.mockResolvedValue(searchResults);

    await SearchServerHandler.handle(mockIoInstance, mockSocketInstance, data);

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      SearchServerSchema,
      data,
      'SEARCHSERVER',
    );

    expect(mockDatabase.get.searchServer).toHaveBeenCalledWith('測試伺服器');

    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'serverSearch',
      searchResults,
    );
  });

  it('應處理空的搜尋結果', async () => {
    const data = testData.createSearchServerData();

    mockDatabase.get.searchServer.mockResolvedValue([]);

    await SearchServerHandler.handle(mockIoInstance, mockSocketInstance, data);

    expect(mockSocketInstance.emit).toHaveBeenCalledWith('serverSearch', []);
  });

  it('應處理不同的搜尋查詢', async () => {
    const customSearchData = testData.createSearchServerData({
      query: '遊戲伺服器',
    });
    const searchResults = createSearchResults(1);

    mockDataValidator.validate.mockResolvedValue(customSearchData);
    mockDatabase.get.searchServer.mockResolvedValue(searchResults);

    await SearchServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      customSearchData,
    );

    expect(mockDatabase.get.searchServer).toHaveBeenCalledWith('遊戲伺服器');
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'serverSearch',
      searchResults,
    );
  });

  it('應處理多種搜尋結果', async () => {
    const searchResults = createSearchResults(5);
    const data = testData.createSearchServerData();

    mockDatabase.get.searchServer.mockResolvedValue(searchResults);

    await SearchServerHandler.handle(mockIoInstance, mockSocketInstance, data);

    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'serverSearch',
      searchResults,
    );
    expect(searchResults).toHaveLength(5);
  });

  it('應處理資料驗證錯誤', async () => {
    const invalidData = { query: '' };
    const validationError = new Error('搜尋關鍵字不能為空');

    await testValidationError(
      SearchServerHandler,
      mockSocketInstance,
      mockIoInstance,
      invalidData,
      validationError,
      '搜尋群組失敗，請稍後再試',
    );
  });

  it('應處理資料庫錯誤', async () => {
    await testDatabaseError(
      SearchServerHandler,
      mockSocketInstance,
      mockIoInstance,
      testData.createSearchServerData(),
      'get',
      'Database connection failed',
      '搜尋群組失敗，請稍後再試',
    );
  });

  describe('業務邏輯檢查', () => {
    it('應正確呼叫資料驗證器', async () => {
      const data = testData.createSearchServerData();

      await SearchServerHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDataValidator.validate).toHaveBeenCalledWith(
        SearchServerSchema,
        data,
        'SEARCHSERVER',
      );
    });

    it('應按正確順序執行搜尋流程', async () => {
      const data = testData.createSearchServerData();

      await SearchServerHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 檢查所有操作都被執行
      expect(mockDataValidator.validate).toHaveBeenCalledTimes(1);
      expect(mockDatabase.get.searchServer).toHaveBeenCalledTimes(1);
      expect(mockSocketInstance.emit).toHaveBeenCalledTimes(1);
    });
  });
});

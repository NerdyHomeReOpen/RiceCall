import { jest } from '@jest/globals';

// 被測試的模組
import { SearchServerHandler } from '../../../src/api/socket/events/server/server.handler';

// 測試設定
import {
  createMockIo,
  createMockSocket,
  mockDataValidator,
  mockDatabase,
  mockError,
} from '../../_testSetup';

// 錯誤類型和Schema
import { SearchServerSchema } from '../../../src/api/socket/events/server/server.schema';

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
  query: '測試伺服器',
};

const mockSearchResults = [
  {
    serverId: 'server-1',
    name: '測試伺服器1',
    description: '這是第一個測試伺服器',
    type: 'game',
    visibility: 'public',
  },
  {
    serverId: 'server-2',
    name: '測試伺服器2',
    description: '這是第二個測試伺服器',
    type: 'entertainment',
    visibility: 'public',
  },
];

describe('SearchServerHandler (搜尋伺服器處理)', () => {
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
    mockDatabase.get.searchServer.mockResolvedValue(mockSearchResults);
  });

  it('應成功搜尋伺服器', async () => {
    await SearchServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultSearchData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      SearchServerSchema,
      defaultSearchData,
      'SEARCHSERVER',
    );

    expect(mockDatabase.get.searchServer).toHaveBeenCalledWith('測試伺服器');

    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'serverSearch',
      mockSearchResults,
    );
  });

  it('應處理空的搜尋結果', async () => {
    mockDatabase.get.searchServer.mockResolvedValue([]);

    await SearchServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultSearchData,
    );

    expect(mockSocketInstance.emit).toHaveBeenCalledWith('serverSearch', []);
  });

  it('應處理不同的搜尋查詢', async () => {
    const customSearchData = { query: '遊戲伺服器' };
    mockDataValidator.validate.mockResolvedValue(customSearchData);

    await SearchServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      customSearchData,
    );

    expect(mockDatabase.get.searchServer).toHaveBeenCalledWith('遊戲伺服器');
  });

  it('資料驗證失敗時應發送錯誤', async () => {
    const validationError = new Error('Invalid query');
    mockDataValidator.validate.mockRejectedValue(validationError);

    await SearchServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultSearchData,
    );

    expect(mockError).toHaveBeenCalledWith(validationError.message);
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        name: 'ServerError',
        message: '搜尋群組失敗，請稍後再試',
        part: 'SEARCHSERVER',
        tag: 'EXCEPTION_ERROR',
        statusCode: 500,
      }),
    );
  });

  it('資料庫查詢失敗時應發送錯誤', async () => {
    const dbError = new Error('Database error');
    mockDatabase.get.searchServer.mockRejectedValue(dbError);

    await SearchServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultSearchData,
    );

    expect(mockError).toHaveBeenCalledWith(dbError.message);
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        name: 'ServerError',
        message: '搜尋群組失敗，請稍後再試',
        part: 'SEARCHSERVER',
        tag: 'EXCEPTION_ERROR',
        statusCode: 500,
      }),
    );
  });

  it('應正確呼叫資料驗證器', async () => {
    await SearchServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultSearchData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      SearchServerSchema,
      defaultSearchData,
      'SEARCHSERVER',
    );
  });
});

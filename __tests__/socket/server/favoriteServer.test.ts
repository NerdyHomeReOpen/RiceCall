import { jest } from '@jest/globals';

// 被測試的模組
import { FavoriteServerHandler } from '../../../src/api/socket/events/server/server.handler';

// 測試設定
import {
  createMockIo,
  createMockSocket,
  mockDataValidator,
  mockDatabase,
  mockError,
  mockInfo,
} from '../../_testSetup';

// 錯誤類型和Schema
import { FavoriteServerSchema } from '../../../src/api/socket/events/server/server.schema';

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
  serverId: 'server-id-123',
} as const;

// 測試數據
const defaultFavoriteData = {
  serverId: DEFAULT_IDS.serverId,
};

describe('FavoriteServerHandler (收藏伺服器處理)', () => {
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
    mockDataValidator.validate.mockResolvedValue(defaultFavoriteData);

    mockDatabase.get.userServer.mockResolvedValue({
      userId: DEFAULT_IDS.operatorUserId,
      serverId: DEFAULT_IDS.serverId,
      favorite: false, // 預設未收藏
      recent: true,
    });

    mockDatabase.set.userServer.mockResolvedValue(true);
  });

  it('應成功收藏伺服器', async () => {
    await FavoriteServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultFavoriteData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      FavoriteServerSchema,
      defaultFavoriteData,
      'FAVORITESERVER',
    );

    expect(mockDatabase.get.userServer).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      DEFAULT_IDS.serverId,
    );

    expect(mockDatabase.set.userServer).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      DEFAULT_IDS.serverId,
      expect.objectContaining({
        favorite: true, // 切換為收藏
      }),
    );

    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'serverUpdate',
      DEFAULT_IDS.serverId,
      expect.objectContaining({
        favorite: true,
      }),
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('favorited server'),
    );
  });

  it('應成功取消收藏伺服器', async () => {
    // 模擬伺服器已收藏的狀態
    mockDatabase.get.userServer.mockResolvedValue({
      userId: DEFAULT_IDS.operatorUserId,
      serverId: DEFAULT_IDS.serverId,
      favorite: true, // 已收藏
      recent: true,
    });

    await FavoriteServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultFavoriteData,
    );

    expect(mockDatabase.set.userServer).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      DEFAULT_IDS.serverId,
      expect.objectContaining({
        favorite: false, // 切換為取消收藏
      }),
    );

    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'serverUpdate',
      DEFAULT_IDS.serverId,
      expect.objectContaining({
        favorite: false,
      }),
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('unfavorited server'),
    );
  });

  it('應正確切換收藏狀態', async () => {
    // 測試從未收藏到收藏
    await FavoriteServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultFavoriteData,
    );

    const firstCallArgs = mockDatabase.set.userServer.mock.calls[0];
    expect(firstCallArgs[2]).toEqual({ favorite: true });

    // 重新設定為已收藏狀態
    jest.clearAllMocks();
    mockDataValidator.validate.mockResolvedValue(defaultFavoriteData);
    mockDatabase.get.userServer.mockResolvedValue({
      userId: DEFAULT_IDS.operatorUserId,
      serverId: DEFAULT_IDS.serverId,
      favorite: true, // 現在已收藏
      recent: true,
    });
    mockDatabase.set.userServer.mockResolvedValue(true);

    // 測試從收藏到取消收藏
    await FavoriteServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultFavoriteData,
    );

    const secondCallArgs = mockDatabase.set.userServer.mock.calls[0];
    expect(secondCallArgs[2]).toEqual({ favorite: false });
  });

  it('應向用戶發送更新事件', async () => {
    await FavoriteServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultFavoriteData,
    );

    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'serverUpdate',
      DEFAULT_IDS.serverId,
      expect.objectContaining({
        favorite: expect.any(Boolean),
      }),
    );
  });

  it('應處理不同的伺服器ID', async () => {
    const differentServerData = {
      serverId: 'different-server-id',
    };
    mockDataValidator.validate.mockResolvedValue(differentServerData);

    mockDatabase.get.userServer.mockResolvedValue({
      userId: DEFAULT_IDS.operatorUserId,
      serverId: 'different-server-id',
      favorite: false,
      recent: true,
    });

    await FavoriteServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      differentServerData,
    );

    expect(mockDatabase.get.userServer).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      'different-server-id',
    );

    expect(mockDatabase.set.userServer).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      'different-server-id',
      expect.objectContaining({
        favorite: true,
      }),
    );
  });

  it('資料驗證失敗時應發送錯誤', async () => {
    const validationError = new Error('Invalid server ID');
    mockDataValidator.validate.mockRejectedValue(validationError);

    await FavoriteServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultFavoriteData,
    );

    expect(mockError).toHaveBeenCalledWith(validationError.message);
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        name: 'ServerError',
        message: '收藏群組失敗，請稍後再試',
        part: 'FAVORITESERVER',
        tag: 'EXCEPTION_ERROR',
        statusCode: 500,
      }),
    );
  });

  it('資料庫查詢失敗時應發送錯誤', async () => {
    const dbError = new Error('Database query failed');
    mockDatabase.get.userServer.mockRejectedValue(dbError);

    await FavoriteServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultFavoriteData,
    );

    expect(mockError).toHaveBeenCalledWith(dbError.message);
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        name: 'ServerError',
        message: '收藏群組失敗，請稍後再試',
        part: 'FAVORITESERVER',
        tag: 'EXCEPTION_ERROR',
        statusCode: 500,
      }),
    );
  });

  it('資料庫更新失敗時應發送錯誤', async () => {
    const dbError = new Error('Database update failed');
    mockDatabase.set.userServer.mockRejectedValue(dbError);

    await FavoriteServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultFavoriteData,
    );

    expect(mockError).toHaveBeenCalledWith(dbError.message);
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        name: 'ServerError',
        message: '收藏群組失敗，請稍後再試',
        part: 'FAVORITESERVER',
        tag: 'EXCEPTION_ERROR',
        statusCode: 500,
      }),
    );
  });

  it('應正確呼叫資料驗證器', async () => {
    await FavoriteServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultFavoriteData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      FavoriteServerSchema,
      defaultFavoriteData,
      'FAVORITESERVER',
    );
  });
});

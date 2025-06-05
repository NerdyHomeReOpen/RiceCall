import { jest } from '@jest/globals';
import { mockDatabase, mockDataValidator, mockInfo } from '../../_testSetup';

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
import { FavoriteServerHandler } from '../../../src/api/socket/events/server/server.handler';
import { FavoriteServerSchema } from '../../../src/api/socket/events/server/server.schema';
import {
  createDefaultTestData,
  createStandardMockInstances,
  createUserServerVariant,
  DEFAULT_IDS,
  setupAfterEach,
  setupBeforeEach,
  testDatabaseError,
  testValidationError,
} from './_testHelpers';

describe('FavoriteServerHandler (收藏伺服器處理)', () => {
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

  it('應成功收藏伺服器', async () => {
    const data = testData.createFavoriteServerData();
    const unfavoritedUserServer = createUserServerVariant(
      testData.operatorUserServer,
      {
        favorite: false,
      },
    );

    mockDatabase.get.userServer.mockResolvedValue(unfavoritedUserServer as any);

    await FavoriteServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      data,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      FavoriteServerSchema,
      data,
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
    const data = testData.createFavoriteServerData();
    const favoritedUserServer = createUserServerVariant(
      testData.operatorUserServer,
      {
        favorite: true,
      },
    );

    mockDatabase.get.userServer.mockResolvedValue(favoritedUserServer as any);

    await FavoriteServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      data,
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
    const data = testData.createFavoriteServerData();
    const unfavoritedUserServer = createUserServerVariant(
      testData.operatorUserServer,
      {
        favorite: false,
      },
    );

    mockDatabase.get.userServer.mockResolvedValue(unfavoritedUserServer as any);

    // 測試從未收藏到收藏
    await FavoriteServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      data,
    );

    const firstCallArgs = mockDatabase.set.userServer.mock.calls[0];
    expect(firstCallArgs[2]).toEqual({ favorite: true });

    // 重新設定為已收藏狀態
    jest.clearAllMocks();
    setupBeforeEach(mockSocketInstance, mockIoInstance, testData);

    const favoritedUserServer = createUserServerVariant(
      testData.operatorUserServer,
      {
        favorite: true,
      },
    );
    mockDatabase.get.userServer.mockResolvedValue(favoritedUserServer as any);

    // 測試從收藏到取消收藏
    await FavoriteServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      data,
    );

    const secondCallArgs = mockDatabase.set.userServer.mock.calls[0];
    expect(secondCallArgs[2]).toEqual({ favorite: false });
  });

  it('應向用戶發送更新事件', async () => {
    const data = testData.createFavoriteServerData();

    await FavoriteServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      data,
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
    const customServerId = 'different-server-id';
    const data = testData.createFavoriteServerData({
      serverId: customServerId,
    });
    const customUserServer = createUserServerVariant(
      testData.operatorUserServer,
      {
        serverId: customServerId,
        favorite: false,
      },
    );

    mockDataValidator.validate.mockResolvedValue(data);
    mockDatabase.get.userServer.mockResolvedValue(customUserServer as any);

    await FavoriteServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      data,
    );

    expect(mockDatabase.get.userServer).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      customServerId,
    );

    expect(mockDatabase.set.userServer).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      customServerId,
      expect.objectContaining({
        favorite: true,
      }),
    );
  });

  it('應處理顯式的收藏狀態設定', async () => {
    const data = testData.createFavoriteServerData({
      favorite: false, // 明確設定為不收藏
    });

    await FavoriteServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      data,
    );

    expect(mockDatabase.set.userServer).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      DEFAULT_IDS.serverId,
      expect.objectContaining({
        favorite: false,
      }),
    );
  });

  it('資料驗證失敗時應發送錯誤', async () => {
    const invalidData = { serverId: '' };
    const validationError = new Error('伺服器ID不能為空');

    await testValidationError(
      FavoriteServerHandler,
      mockSocketInstance,
      mockIoInstance,
      invalidData,
      validationError,
      '收藏群組失敗，請稍後再試',
    );
  });

  it('應處理資料庫查詢錯誤', async () => {
    await testDatabaseError(
      FavoriteServerHandler,
      mockSocketInstance,
      mockIoInstance,
      testData.createFavoriteServerData(),
      'get',
      'Database query error',
      '收藏群組失敗，請稍後再試',
    );
  });

  it('應處理資料庫更新錯誤', async () => {
    await testDatabaseError(
      FavoriteServerHandler,
      mockSocketInstance,
      mockIoInstance,
      testData.createFavoriteServerData(),
      'set',
      'Database update error',
      '收藏群組失敗，請稍後再試',
    );
  });

  describe('業務邏輯檢查', () => {
    it('應正確呼叫資料驗證器', async () => {
      const data = testData.createFavoriteServerData();

      await FavoriteServerHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDataValidator.validate).toHaveBeenCalledWith(
        FavoriteServerSchema,
        data,
        'FAVORITESERVER',
      );
    });

    it('應按正確順序執行收藏流程', async () => {
      const data = testData.createFavoriteServerData();

      await FavoriteServerHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 檢查所有操作都被執行
      expect(mockDataValidator.validate).toHaveBeenCalledTimes(1);
      expect(mockDatabase.get.userServer).toHaveBeenCalledTimes(1);
      expect(mockDatabase.set.userServer).toHaveBeenCalledTimes(1);
      expect(mockSocketInstance.emit).toHaveBeenCalledTimes(1);
    });
  });
});

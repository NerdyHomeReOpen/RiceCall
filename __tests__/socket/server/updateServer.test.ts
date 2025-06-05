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
import { UpdateServerHandler } from '../../../src/api/socket/events/server/server.handler';
import { UpdateServerSchema } from '../../../src/api/socket/events/server/server.schema';
import {
  createDefaultTestData,
  createMemberVariant,
  createStandardMockInstances,
  DEFAULT_IDS,
  setupAfterEach,
  setupBeforeEach,
  testDatabaseError,
  testInsufficientPermission,
  testValidationError,
} from './_testHelpers';

describe('UpdateServerHandler (更新伺服器處理)', () => {
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

    // 設定管理員權限（預設為可更新）
    mockDatabase.get.member.mockResolvedValue({
      ...testData.operatorMember,
      permissionLevel: 5, // 管理員權限
    } as any);
  });

  afterEach(() => {
    setupAfterEach();
  });

  it('應成功更新伺服器', async () => {
    const updateData = testData.createUpdateServerData();

    await UpdateServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      updateData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      UpdateServerSchema,
      updateData,
      'UPDATESERVER',
    );

    expect(mockDatabase.get.member).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      DEFAULT_IDS.serverId,
    );

    expect(mockDatabase.set.server).toHaveBeenCalledWith(
      DEFAULT_IDS.serverId,
      updateData.server,
    );

    const mockIoRoomEmit = require('../../_testSetup').mockIoRoomEmit;
    expect(mockIoRoomEmit).toHaveBeenCalledWith(
      'serverUpdate',
      DEFAULT_IDS.serverId,
      updateData.server,
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('updated server'),
    );
  });

  it('應處理部分更新', async () => {
    const partialUpdateData = testData.createUpdateServerData({
      server: {
        name: '只更新名稱',
      },
    });

    await UpdateServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      partialUpdateData,
    );

    expect(mockDatabase.set.server).toHaveBeenCalledWith(
      DEFAULT_IDS.serverId,
      partialUpdateData.server,
    );

    const mockIoRoomEmit = require('../../_testSetup').mockIoRoomEmit;
    expect(mockIoRoomEmit).toHaveBeenCalledWith(
      'serverUpdate',
      DEFAULT_IDS.serverId,
      partialUpdateData.server,
    );
  });

  it('應處理不同類型的更新欄位', async () => {
    const complexUpdateData = testData.createUpdateServerData({
      server: {
        visibility: 'private' as const,
        type: 'entertainment' as const,
        description: '更新為娛樂伺服器',
      },
    });

    await UpdateServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      complexUpdateData,
    );

    expect(mockDatabase.set.server).toHaveBeenCalledWith(
      DEFAULT_IDS.serverId,
      complexUpdateData.server,
    );
  });

  it('應向伺服器房間廣播更新', async () => {
    const updateData = testData.createUpdateServerData();

    await UpdateServerHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      updateData,
    );

    expect(mockIoInstance.to).toHaveBeenCalledWith(
      `server_${DEFAULT_IDS.serverId}`,
    );
  });

  it('應處理資料驗證錯誤', async () => {
    const invalidData = { serverId: '', server: {} };
    const validationError = new Error('伺服器ID不能為空');

    await testValidationError(
      UpdateServerHandler,
      mockSocketInstance,
      mockIoInstance,
      invalidData,
      validationError,
      '更新群組失敗，請稍後再試',
    );
  });

  it('應處理資料庫錯誤', async () => {
    await testDatabaseError(
      UpdateServerHandler,
      mockSocketInstance,
      mockIoInstance,
      testData.createUpdateServerData(),
      'set',
      'Database update failed',
      '更新群組失敗，請稍後再試',
    );
  });

  describe('權限檢查', () => {
    it('權限不足時應拒絕更新', async () => {
      const lowPermissionMember = createMemberVariant(testData.operatorMember, {
        permissionLevel: 3, // 權限不足
      });

      await testInsufficientPermission(
        UpdateServerHandler,
        mockSocketInstance,
        mockIoInstance,
        testData.createUpdateServerData(),
        lowPermissionMember,
        'warning',
      );
    });

    it('邊界權限等級（權限等級4）應拒絕更新', async () => {
      const borderlineMember = createMemberVariant(testData.operatorMember, {
        permissionLevel: 4, // 邊界權限，不足以更新
      });

      await testInsufficientPermission(
        UpdateServerHandler,
        mockSocketInstance,
        mockIoInstance,
        testData.createUpdateServerData(),
        borderlineMember,
        'warning',
      );
    });

    it('權限等級5應允許更新', async () => {
      const sufficientMember = createMemberVariant(testData.operatorMember, {
        permissionLevel: 5, // 足夠權限
      });

      mockDatabase.get.member.mockResolvedValue(sufficientMember as any);

      const updateData = testData.createUpdateServerData();
      await UpdateServerHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        updateData,
      );

      expect(mockDatabase.set.server).toHaveBeenCalledWith(
        DEFAULT_IDS.serverId,
        updateData.server,
      );
    });
  });
});

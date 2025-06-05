import { jest } from '@jest/globals';
import { mockDatabase, mockInfo } from '../../_testSetup';

// Mock Database
jest.mock('@/index', () => ({
  database: require('../../_testSetup').mockDatabase,
}));

jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockLogger,
}));

jest.mock('@/error', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockStandardizedError,
}));

// Mock SocketServer
jest.mock('@/api/socket', () => ({
  __esModule: true,
  default: require('./_testHelpers').mockSocketServer,
}));

// 被測試的模組和測試輔助工具
import { MemberApplicationHandlerServerSide } from '../../../src/api/socket/events/memberApplication/memberApplicationHandlerServerSide';
import {
  createDefaultTestData,
  createStandardMockInstances,
  DEFAULT_IDS,
  setupAfterEach,
} from './_testHelpers';

describe('MemberApplicationHandlerServerSide (成員申請伺服器端處理)', () => {
  let testData: ReturnType<typeof createDefaultTestData>;

  beforeEach(() => {
    // 建立測試資料
    testData = createDefaultTestData();

    // 建立 mock 實例（即使不直接使用，也確保一致性）
    const mockInstances = createStandardMockInstances();

    // 設定通用的 beforeEach（簡化版）
    jest.clearAllMocks();

    // Mock Date.now()
    jest.spyOn(Date, 'now').mockReturnValue(1640995200000);

    // 設定預設 mocks
    (mockDatabase.delete.memberApplication as any).mockResolvedValue(true);
  });

  afterEach(() => {
    setupAfterEach();
  });

  describe('deleteMemberApplication', () => {
    it('應成功刪除成員申請', async () => {
      await MemberApplicationHandlerServerSide.deleteMemberApplication(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
      );

      expect(mockDatabase.delete.memberApplication).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
      );

      expect(mockInfo).toHaveBeenCalledWith(
        expect.stringContaining('deleted member application'),
      );
    });

    it('應正確處理不同的用戶ID和伺服器ID', async () => {
      const customUserId = 'custom-user-id';
      const customServerId = 'custom-server-id';

      await MemberApplicationHandlerServerSide.deleteMemberApplication(
        customUserId,
        customServerId,
      );

      expect(mockDatabase.delete.memberApplication).toHaveBeenCalledWith(
        customUserId,
        customServerId,
      );

      expect(mockInfo).toHaveBeenCalledWith(
        expect.stringContaining('deleted member application'),
      );
    });

    it('應處理資料庫錯誤', async () => {
      const dbError = new Error('Database connection failed');
      (mockDatabase.delete.memberApplication as any).mockRejectedValue(dbError);

      await expect(
        MemberApplicationHandlerServerSide.deleteMemberApplication(
          DEFAULT_IDS.targetUserId,
          DEFAULT_IDS.serverId,
        ),
      ).rejects.toThrow('Database connection failed');

      expect(mockDatabase.delete.memberApplication).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
      );
    });

    it('應使用正確的參數格式', async () => {
      await MemberApplicationHandlerServerSide.deleteMemberApplication(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
      );

      // 檢查調用次數和參數
      expect(mockDatabase.delete.memberApplication).toHaveBeenCalledTimes(1);
      expect(mockDatabase.delete.memberApplication).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
      );
    });
  });

  describe('業務邏輯檢查', () => {
    it('應按正確順序執行刪除流程', async () => {
      await MemberApplicationHandlerServerSide.deleteMemberApplication(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
      );

      // 檢查資料庫操作和日誌記錄都被執行
      expect(mockDatabase.delete.memberApplication).toHaveBeenCalledTimes(1);
      expect(mockInfo).toHaveBeenCalledTimes(1);
    });

    it('應正確處理刪除操作的參數', async () => {
      const userId = 'parameter-test-user';
      const serverId = 'parameter-test-server';

      await MemberApplicationHandlerServerSide.deleteMemberApplication(
        userId,
        serverId,
      );

      expect(mockDatabase.delete.memberApplication).toHaveBeenCalledWith(
        userId,
        serverId,
      );
    });

    it('應在成功刪除後記錄適當的日誌', async () => {
      await MemberApplicationHandlerServerSide.deleteMemberApplication(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
      );

      expect(mockInfo).toHaveBeenCalledWith(
        expect.stringContaining('deleted member application'),
      );
      expect(mockInfo).toHaveBeenCalledWith(
        expect.stringContaining(DEFAULT_IDS.targetUserId),
      );
      expect(mockInfo).toHaveBeenCalledWith(
        expect.stringContaining(DEFAULT_IDS.serverId),
      );
    });
  });

  describe('錯誤處理', () => {
    it('應正確傳播資料庫錯誤', async () => {
      const customError = new Error('Custom database error');
      (mockDatabase.delete.memberApplication as any).mockRejectedValue(
        customError,
      );

      await expect(
        MemberApplicationHandlerServerSide.deleteMemberApplication(
          DEFAULT_IDS.targetUserId,
          DEFAULT_IDS.serverId,
        ),
      ).rejects.toThrow('Custom database error');
    });

    it('應在錯誤發生時仍然調用資料庫操作', async () => {
      const dbError = new Error('Database error');
      (mockDatabase.delete.memberApplication as any).mockRejectedValue(dbError);

      try {
        await MemberApplicationHandlerServerSide.deleteMemberApplication(
          DEFAULT_IDS.targetUserId,
          DEFAULT_IDS.serverId,
        );
      } catch (error) {
        // 預期會拋出錯誤
      }

      expect(mockDatabase.delete.memberApplication).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
      );
    });
  });
});

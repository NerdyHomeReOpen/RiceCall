import { RefreshMemberApplicationHandler } from '@/api/http/routers/refresh/memberApplication/refreshMemberApplication.handler';
import { createRefreshTestData, DEFAULT_IDS } from './_testHelpers';

// Mock 依賴
jest.mock('@/utils/logger');
jest.mock('@/middleware/data.validator');
jest.mock('@/index', () => ({
  database: {
    get: {
      memberApplication: jest.fn(),
    },
  },
}));

import { database } from '@/index';
import { DataValidator } from '@/middleware/data.validator';

describe('RefreshMemberApplication (成員申請資料刷新)', () => {
  let testData: ReturnType<typeof createRefreshTestData>;

  beforeEach(() => {
    testData = createRefreshTestData();
    jest.clearAllMocks();

    // 設定預設成功 mocks
    (DataValidator.validate as jest.Mock).mockResolvedValue({
      userId: DEFAULT_IDS.userId,
      serverId: DEFAULT_IDS.serverId,
    });
    (database.get.memberApplication as jest.Mock).mockResolvedValue(
      testData.mockApplication,
    );
  });

  describe('✅ 核心業務邏輯', () => {
    it('應成功刷新成員申請資料', async () => {
      const result = await RefreshMemberApplicationHandler.handle({
        userId: DEFAULT_IDS.userId,
        serverId: DEFAULT_IDS.serverId,
      });

      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('success');
      expect(result.data).toEqual(testData.mockApplication);
      expect(database.get.memberApplication).toHaveBeenCalledWith(
        DEFAULT_IDS.userId,
        DEFAULT_IDS.serverId,
      );
    });
  });

  describe('❌ 關鍵錯誤處理', () => {
    it('應處理資料庫錯誤', async () => {
      const dbError = new Error('Database error');
      (database.get.memberApplication as jest.Mock).mockRejectedValue(dbError);

      const result = await RefreshMemberApplicationHandler.handle({
        userId: DEFAULT_IDS.userId,
        serverId: DEFAULT_IDS.serverId,
      });

      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('error');
      expect(result.data.error.name).toBe('ServerError');
      expect(result.data.error.message).toBe(
        '刷新成員申請資料失敗，請稍後再試',
      );
    });
  });
});

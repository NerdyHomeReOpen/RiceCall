import { RefreshFriendGroupHandler } from '@/api/http/routers/refresh/friendGroup/refreshFriendGroup.handler';
import { createRefreshTestData, DEFAULT_IDS } from './_testHelpers';

// Mock 依賴
jest.mock('@/utils/logger');
jest.mock('@/middleware/data.validator');
jest.mock('@/index', () => ({
  database: {
    get: {
      friendGroup: jest.fn(),
    },
  },
}));

import { database } from '@/index';
import { DataValidator } from '@/middleware/data.validator';

describe('RefreshFriendGroup (好友群組資料刷新)', () => {
  let testData: ReturnType<typeof createRefreshTestData>;

  beforeEach(() => {
    testData = createRefreshTestData();
    jest.clearAllMocks();

    // 設定預設成功 mocks
    (DataValidator.validate as jest.Mock).mockResolvedValue({
      friendGroupId: DEFAULT_IDS.groupId,
    });
    (database.get.friendGroup as jest.Mock).mockResolvedValue({
      groupId: DEFAULT_IDS.groupId,
      name: '測試群組',
    });
  });

  describe('✅ 核心業務邏輯', () => {
    it('應成功刷新好友群組資料', async () => {
      const result = await RefreshFriendGroupHandler.handle({
        friendGroupId: DEFAULT_IDS.groupId,
      });

      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('success');
      expect(result.data).toEqual({
        groupId: DEFAULT_IDS.groupId,
        name: '測試群組',
      });
      expect(database.get.friendGroup).toHaveBeenCalledWith(
        DEFAULT_IDS.groupId,
      );
    });
  });

  describe('❌ 關鍵錯誤處理', () => {
    it('應處理資料庫錯誤', async () => {
      const dbError = new Error('Database error');
      (database.get.friendGroup as jest.Mock).mockRejectedValue(dbError);

      const result = await RefreshFriendGroupHandler.handle({
        friendGroupId: DEFAULT_IDS.groupId,
      });

      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('error');
      expect(result.data.error.name).toBe('ServerError');
      expect(result.data.error.message).toBe(
        '刷新好友群組資料失敗，請稍後再試',
      );
    });
  });
});

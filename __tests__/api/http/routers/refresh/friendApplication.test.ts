import { RefreshFriendApplicationHandler } from '@/api/http/routers/refresh/friendApplication/refreshFriendApplication.handler';
import { createRefreshTestData, DEFAULT_IDS } from './_testHelpers';

// Mock 依賴
jest.mock('@/utils/logger');
jest.mock('@/middleware/data.validator');
jest.mock('@/index', () => ({
  database: {
    get: {
      friendApplication: jest.fn(),
    },
  },
}));

import { database } from '@/index';
import { DataValidator } from '@/middleware/data.validator';

describe('RefreshFriendApplication (好友申請資料刷新)', () => {
  let testData: ReturnType<typeof createRefreshTestData>;

  beforeEach(() => {
    testData = createRefreshTestData();
    jest.clearAllMocks();

    // 設定預設成功 mocks
    (DataValidator.validate as jest.Mock).mockResolvedValue({
      senderId: DEFAULT_IDS.userId,
      receiverId: DEFAULT_IDS.friendId,
    });
    (database.get.friendApplication as jest.Mock).mockResolvedValue(
      testData.mockApplication,
    );
  });

  describe('✅ 核心業務邏輯', () => {
    it('應成功刷新好友申請資料', async () => {
      const result = await RefreshFriendApplicationHandler.handle({
        senderId: DEFAULT_IDS.userId,
        receiverId: DEFAULT_IDS.friendId,
      });

      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('success');
      expect(result.data).toEqual(testData.mockApplication);
      expect(database.get.friendApplication).toHaveBeenCalledWith(
        DEFAULT_IDS.userId,
        DEFAULT_IDS.friendId,
      );
    });
  });

  describe('❌ 關鍵錯誤處理', () => {
    it('應處理資料庫錯誤', async () => {
      const dbError = new Error('Database error');
      (database.get.friendApplication as jest.Mock).mockRejectedValue(dbError);

      const result = await RefreshFriendApplicationHandler.handle({
        senderId: DEFAULT_IDS.userId,
        receiverId: DEFAULT_IDS.friendId,
      });

      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('error');
      expect(result.data.error.name).toBe('ServerError');
      expect(result.data.error.message).toBe(
        '刷新好友申請資料失敗，請稍後再試',
      );
    });
  });
});

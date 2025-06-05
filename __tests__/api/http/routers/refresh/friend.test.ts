import { RefreshFriendHandler } from '@/api/http/routers/refresh/friend/refreshFriend.handler';
import { createRefreshTestData, DEFAULT_IDS } from './_testHelpers';

// Mock 依賴
jest.mock('@/utils/logger');
jest.mock('@/middleware/data.validator');
jest.mock('@/api/socket', () => ({
  hasSocket: jest.fn(),
}));
jest.mock('@/index', () => ({
  database: {
    get: {
      friend: jest.fn(),
    },
  },
}));

import SocketServer from '@/api/socket';
import { database } from '@/index';
import { DataValidator } from '@/middleware/data.validator';

describe('RefreshFriend (好友資料刷新)', () => {
  let testData: ReturnType<typeof createRefreshTestData>;

  beforeEach(() => {
    testData = createRefreshTestData();
    jest.clearAllMocks();

    // 設定預設成功 mocks
    (DataValidator.validate as jest.Mock).mockResolvedValue({
      userId: DEFAULT_IDS.userId,
      targetId: DEFAULT_IDS.friendId,
    });
    (database.get.friend as jest.Mock).mockResolvedValue(testData.mockFriend);
    (SocketServer.hasSocket as jest.Mock).mockReturnValue(false);
  });

  describe('✅ 核心業務邏輯', () => {
    it('應成功刷新好友資料', async () => {
      const result = await RefreshFriendHandler.handle({
        userId: DEFAULT_IDS.userId,
        targetId: DEFAULT_IDS.friendId,
      });

      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('success');
      expect(result.data).toEqual({ ...testData.mockFriend, online: false });
      expect(database.get.friend).toHaveBeenCalledWith(
        DEFAULT_IDS.userId,
        DEFAULT_IDS.friendId,
      );
    });
  });

  describe('❌ 關鍵錯誤處理', () => {
    it('應處理資料庫錯誤', async () => {
      const dbError = new Error('Database error');
      (database.get.friend as jest.Mock).mockRejectedValue(dbError);

      const result = await RefreshFriendHandler.handle({
        userId: DEFAULT_IDS.userId,
        targetId: DEFAULT_IDS.friendId,
      });

      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('error');
      expect(result.data.error.name).toBe('ServerError');
      expect(result.data.error.message).toBe('刷新好友資料失敗，請稍後再試');
    });
  });
});

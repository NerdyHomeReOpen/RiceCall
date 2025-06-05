import {
  RefreshUserFriendsHandler,
  RefreshUserHandler,
} from '@/api/http/routers/refresh/user/refreshUser.handler';
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
      user: jest.fn(),
      userFriends: jest.fn(),
      userServers: jest.fn(),
      userFriendApplications: jest.fn(),
      userFriendGroups: jest.fn(),
    },
  },
}));

import SocketServer from '@/api/socket';
import { database } from '@/index';
import { DataValidator } from '@/middleware/data.validator';

describe('RefreshUser (使用者資料刷新)', () => {
  let testData: ReturnType<typeof createRefreshTestData>;

  beforeEach(() => {
    testData = createRefreshTestData();
    jest.clearAllMocks();

    // 設定預設成功 mocks
    (DataValidator.validate as jest.Mock).mockResolvedValue({
      userId: DEFAULT_IDS.userId,
    });
    (SocketServer.hasSocket as jest.Mock).mockReturnValue(true);
    (database.get.user as jest.Mock).mockResolvedValue(testData.mockUser);
    (database.get.userFriends as jest.Mock).mockResolvedValue(
      testData.mockCollections.userFriends,
    );
    (database.get.userServers as jest.Mock).mockResolvedValue(
      testData.mockCollections.userServers,
    );
    (database.get.userFriendApplications as jest.Mock).mockResolvedValue([
      testData.mockApplication,
    ]);
    (database.get.userFriendGroups as jest.Mock).mockResolvedValue([]);
  });

  describe('✅ 核心業務邏輯', () => {
    it('應成功刷新使用者資料', async () => {
      const result = await RefreshUserHandler.handle({
        userId: DEFAULT_IDS.userId,
      });

      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('success');
      expect(result.data).toEqual(testData.mockUser);
      expect(database.get.user).toHaveBeenCalledWith(DEFAULT_IDS.userId);
    });

    it('應成功刷新使用者好友資料並標示線上狀態', async () => {
      const result = await RefreshUserFriendsHandler.handle({
        userId: DEFAULT_IDS.userId,
      });

      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('success');
      expect(result.data).toEqual(testData.mockCollections.userFriends);
      expect(SocketServer.hasSocket).toHaveBeenCalledWith(DEFAULT_IDS.friendId);
    });
  });

  describe('❌ 關鍵錯誤處理', () => {
    it('應處理資料庫錯誤', async () => {
      const dbError = new Error('Database error');
      (database.get.user as jest.Mock).mockRejectedValue(dbError);

      const result = await RefreshUserHandler.handle({
        userId: DEFAULT_IDS.userId,
      });

      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('error');
      expect(result.data.error.name).toBe('ServerError');
      expect(result.data.error.message).toBe('刷新使用者資料失敗，請稍後再試');
    });
  });
});

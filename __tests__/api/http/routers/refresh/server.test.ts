import {
  RefreshServerChannelsHandler,
  RefreshServerHandler,
} from '@/api/http/routers/refresh/server/refreshServer.handler';
import { createRefreshTestData, DEFAULT_IDS } from './_testHelpers';

// Mock 依賴
jest.mock('@/utils/logger');
jest.mock('@/middleware/data.validator');
jest.mock('@/index', () => ({
  database: {
    get: {
      server: jest.fn(),
      serverChannels: jest.fn(),
      serverMembers: jest.fn(),
      serverMemberApplications: jest.fn(),
    },
  },
}));

import { database } from '@/index';
import { DataValidator } from '@/middleware/data.validator';

describe('RefreshServer (伺服器資料刷新)', () => {
  let testData: ReturnType<typeof createRefreshTestData>;

  beforeEach(() => {
    testData = createRefreshTestData();
    jest.clearAllMocks();

    // 設定預設成功 mocks
    (DataValidator.validate as jest.Mock).mockResolvedValue({
      serverId: DEFAULT_IDS.serverId,
    });
    (database.get.server as jest.Mock).mockResolvedValue(testData.mockServer);
    (database.get.serverChannels as jest.Mock).mockResolvedValue(
      testData.mockCollections.serverChannels,
    );
    (database.get.serverMembers as jest.Mock).mockResolvedValue([
      testData.mockMember,
    ]);
    (database.get.serverMemberApplications as jest.Mock).mockResolvedValue([
      testData.mockApplication,
    ]);
  });

  describe('✅ 核心業務邏輯', () => {
    it('應成功刷新伺服器資料', async () => {
      const result = await RefreshServerHandler.handle({
        serverId: DEFAULT_IDS.serverId,
      });

      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('success');
      expect(result.data).toEqual(testData.mockServer);
      expect(database.get.server).toHaveBeenCalledWith(DEFAULT_IDS.serverId);
    });

    it('應成功刷新伺服器頻道資料', async () => {
      const result = await RefreshServerChannelsHandler.handle({
        serverId: DEFAULT_IDS.serverId,
      });

      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('success');
      expect(result.data).toEqual(testData.mockCollections.serverChannels);
      expect(database.get.serverChannels).toHaveBeenCalledWith(
        DEFAULT_IDS.serverId,
      );
    });
  });

  describe('❌ 關鍵錯誤處理', () => {
    it('應處理資料庫錯誤', async () => {
      const dbError = new Error('Database error');
      (database.get.server as jest.Mock).mockRejectedValue(dbError);

      const result = await RefreshServerHandler.handle({
        serverId: DEFAULT_IDS.serverId,
      });

      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('error');
      expect(result.data.error.name).toBe('ServerError');
      expect(result.data.error.message).toBe('刷新群組資料失敗，請稍後再試');
    });
  });
});

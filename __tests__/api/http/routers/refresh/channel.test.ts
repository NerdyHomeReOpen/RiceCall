import { RefreshChannelHandler } from '@/api/http/routers/refresh/channel/refreshChannel.handler';
import { createRefreshTestData, DEFAULT_IDS } from './_testHelpers';

// Mock 依賴
jest.mock('@/utils/logger');
jest.mock('@/middleware/data.validator');
jest.mock('@/index', () => ({
  database: {
    get: {
      channel: jest.fn(),
    },
  },
}));

import { database } from '@/index';
import { DataValidator } from '@/middleware/data.validator';

describe('RefreshChannel (頻道資料刷新)', () => {
  let testData: ReturnType<typeof createRefreshTestData>;

  beforeEach(() => {
    testData = createRefreshTestData();
    jest.clearAllMocks();

    // 設定預設成功 mocks
    (DataValidator.validate as jest.Mock).mockResolvedValue({
      channelId: DEFAULT_IDS.channelId,
    });
    (database.get.channel as jest.Mock).mockResolvedValue(testData.mockChannel);
  });

  describe('✅ 核心業務邏輯', () => {
    it('應成功刷新頻道資料', async () => {
      const result = await RefreshChannelHandler.handle({
        channelId: DEFAULT_IDS.channelId,
      });

      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('success');
      expect(result.data).toEqual(testData.mockChannel);
      expect(database.get.channel).toHaveBeenCalledWith(DEFAULT_IDS.channelId);
    });
  });

  describe('❌ 關鍵錯誤處理', () => {
    it('應處理資料庫錯誤', async () => {
      const dbError = new Error('Database error');
      (database.get.channel as jest.Mock).mockRejectedValue(dbError);

      const result = await RefreshChannelHandler.handle({
        channelId: DEFAULT_IDS.channelId,
      });

      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('error');
      expect(result.data.error.name).toBe('ServerError');
      expect(result.data.error.message).toBe('刷新頻道資料失敗，請稍後再試');
    });
  });
});

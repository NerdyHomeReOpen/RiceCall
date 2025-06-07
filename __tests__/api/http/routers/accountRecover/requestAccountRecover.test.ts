import { RequestAccountRecoverHandler } from '@/api/http/routers/accountRecover/accountRecover.handler';
import { createAccountRecoverTestData, DEFAULT_IDS } from './_testHelpers';

// Mock 所有依賴
jest.mock('@/middleware/data.validator');
jest.mock('@/index', () => ({
  database: {
    get: {
      account: jest.fn(),
    },
    set: {
      accountRecover: jest.fn(),
    },
  },
}));
jest.mock('@/utils/logger');
jest.mock('@/utils');
jest.mock('@/utils/email');

// 匯入 mocked 模組
import { database } from '@/index';
import { DataValidator } from '@/middleware/data.validator';
import { generateRandomString } from '@/utils';
import { sendEmail } from '@/utils/email';

describe('RequestAccountRecoverHandler (請求帳號密碼重設)', () => {
  let testData: ReturnType<typeof createAccountRecoverTestData>;

  beforeEach(() => {
    testData = createAccountRecoverTestData();
    jest.clearAllMocks();

    // 設置預設 mock
    (DataValidator.validate as jest.Mock).mockResolvedValue({});
    (database.get.account as jest.Mock).mockImplementation(
      async (account: string) => {
        if (account === DEFAULT_IDS.account) return testData.accountData;
        if (account === 'nonexistent') return null;
        return testData.accountData;
      },
    );
    (database.set.accountRecover as jest.Mock).mockResolvedValue(true);
    (generateRandomString as jest.Mock).mockReturnValue(DEFAULT_IDS.resetToken);
    (sendEmail as jest.Mock).mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('✅ 核心業務邏輯', () => {
    it('應成功處理有效的帳號重設請求', async () => {
      const requestData = testData.requestData.valid;
      (DataValidator.validate as jest.Mock).mockResolvedValue(requestData);

      const result = await RequestAccountRecoverHandler.handle(requestData);

      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('success');
      expect(result.data.message).toBe(
        'Password reset link sent to your email.',
      );

      // 驗證核心流程
      expect(database.get.account).toHaveBeenCalledWith(DEFAULT_IDS.account);
      expect(database.set.accountRecover).toHaveBeenCalledWith(
        DEFAULT_IDS.userId,
        { resetToken: DEFAULT_IDS.resetToken, tried: 0 },
      );
      expect(sendEmail).toHaveBeenCalled();
    });

    it('應確保重設令牌長度為 256 字符', async () => {
      const requestData = testData.requestData.valid;
      (DataValidator.validate as jest.Mock).mockResolvedValue(requestData);

      await RequestAccountRecoverHandler.handle(requestData);

      expect(generateRandomString).toHaveBeenCalledWith(256);
    });
  });

  describe('❌ 關鍵錯誤處理', () => {
    it('應處理帳號不存在的情況', async () => {
      const requestData = testData.requestData.nonExistent;
      (DataValidator.validate as jest.Mock).mockResolvedValue(requestData);
      (database.get.account as jest.Mock).mockResolvedValue(null);

      const result = await RequestAccountRecoverHandler.handle(requestData);

      expect(result.statusCode).toBe(404);
      expect(result.message).toBe('error');
      expect(result.data.error.name).toBe('AccountNotFoundError');

      // 確認沒有執行後續操作
      expect(database.set.accountRecover).not.toHaveBeenCalled();
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it('應處理空帳號驗證錯誤', async () => {
      const invalidData = testData.requestData.empty;
      const validationError = new Error('帳號不能為空');

      jest.clearAllMocks();
      (DataValidator.validate as jest.Mock).mockRejectedValue(validationError);

      const result = await RequestAccountRecoverHandler.handle(invalidData);

      expect(result.statusCode).toBeGreaterThanOrEqual(400);
      expect(result.message).toBe('error');
    });

    it('應處理資料庫查詢錯誤', async () => {
      const requestData = testData.requestData.valid;
      const dbError = new Error('Database connection failed');

      jest.clearAllMocks();
      (DataValidator.validate as jest.Mock).mockResolvedValue(requestData);
      (database.get.account as jest.Mock).mockRejectedValue(dbError);

      const result = await RequestAccountRecoverHandler.handle(requestData);

      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('error');
      expect(result.data.error.name).toBe('ServerError');
    });

    it('應處理郵件發送失敗', async () => {
      const requestData = testData.requestData.valid;
      const emailError = new Error('Email service unavailable');

      (DataValidator.validate as jest.Mock).mockResolvedValue(requestData);
      (sendEmail as jest.Mock).mockRejectedValue(emailError);

      const result = await RequestAccountRecoverHandler.handle(requestData);

      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('error');
      expect(result.data.error.name).toBe('ServerError');
    });
  });
});

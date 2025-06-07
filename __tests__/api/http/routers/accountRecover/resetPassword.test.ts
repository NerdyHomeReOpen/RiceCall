import { ResetPasswordHandler } from '@/api/http/routers/accountRecover/accountRecover.handler';
import {
  createAccountRecoverTestData,
  DEFAULT_IDS,
  DEFAULT_TIME,
} from './_testHelpers';

// Mock 所有依賴
jest.mock('@/middleware/data.validator');
jest.mock('@/index', () => ({
  database: {
    get: {
      accountRecover: jest.fn(),
      accountByUserId: jest.fn(),
    },
    set: {
      account: jest.fn(),
      accountRecover: jest.fn(),
      user: jest.fn(),
    },
    delete: {
      accountRecover: jest.fn(),
    },
  },
}));
jest.mock('@/utils/logger');
jest.mock('bcrypt');

// 匯入 mocked 模組
import { database } from '@/index';
import { DataValidator } from '@/middleware/data.validator';
import bcrypt from 'bcrypt';

describe('ResetPasswordHandler (重設密碼)', () => {
  let testData: ReturnType<typeof createAccountRecoverTestData>;

  beforeEach(() => {
    testData = createAccountRecoverTestData();
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(DEFAULT_TIME);

    // 設置預設 mock
    (DataValidator.validate as jest.Mock).mockResolvedValue({});
    (database.get.accountRecover as jest.Mock).mockImplementation(
      async (userId: string) => {
        if (userId === DEFAULT_IDS.userId) return testData.accountRecoverData;
        return null;
      },
    );
    (database.get.accountByUserId as jest.Mock).mockImplementation(
      async (userId: string) => {
        if (userId === DEFAULT_IDS.userId) return testData.accountData;
        return null;
      },
    );
    (database.set.account as jest.Mock).mockResolvedValue(true);
    (database.set.accountRecover as jest.Mock).mockResolvedValue(true);
    (database.set.user as jest.Mock).mockResolvedValue(true);
    (database.delete.accountRecover as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue(DEFAULT_IDS.hashedPassword);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('✅ 核心業務邏輯', () => {
    it('應成功重設密碼', async () => {
      const resetData = testData.resetData.valid;
      (DataValidator.validate as jest.Mock).mockResolvedValue(resetData);

      const result = await ResetPasswordHandler.handle(resetData);

      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('success');
      expect(result.data.message).toBe('密碼重設成功。');

      // 驗證核心流程
      expect(database.get.accountRecover).toHaveBeenCalledWith(
        DEFAULT_IDS.userId,
      );
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
      expect(database.get.accountByUserId).toHaveBeenCalledWith(
        DEFAULT_IDS.userId,
      );
      expect(database.set.account).toHaveBeenCalledWith(DEFAULT_IDS.account, {
        password: DEFAULT_IDS.hashedPassword,
      });
      expect(database.delete.accountRecover).toHaveBeenCalledWith(
        DEFAULT_IDS.userId,
      );
    });
  });

  describe('❌ 關鍵安全驗證', () => {
    it('應拒絕無效的重設令牌', async () => {
      const invalidTokenData = testData.resetData.invalidToken;
      (DataValidator.validate as jest.Mock).mockResolvedValue(invalidTokenData);
      (database.get.accountRecover as jest.Mock).mockResolvedValue({
        ...testData.accountRecoverData,
        resetToken: 'different-token',
      });

      const result = await ResetPasswordHandler.handle(invalidTokenData);

      expect(result.statusCode).toBe(400);
      expect(result.message).toBe('error');
      expect(result.data.error.name).toBe('InvalidOrExpiredResetTokenError');

      // 確認沒有執行密碼重設
      expect(database.set.account).not.toHaveBeenCalled();
      expect(database.delete.accountRecover).not.toHaveBeenCalled();
    });

    it('應拒絕超過嘗試次數限制的請求', async () => {
      const resetData = testData.resetData.tooManyAttempts;
      (DataValidator.validate as jest.Mock).mockResolvedValue(resetData);
      (database.get.accountRecover as jest.Mock).mockResolvedValue({
        ...testData.accountRecoverData,
        tried: 5, // 已達到限制
      });

      const result = await ResetPasswordHandler.handle(resetData);

      expect(result.statusCode).toBe(429);
      expect(result.message).toBe('error');
      expect(result.data.error.name).toBe('TooManyFailedAttemptsError');

      // 確認沒有執行密碼重設
      expect(database.set.account).not.toHaveBeenCalled();
    });

    it('應處理帳號不存在的情況', async () => {
      const resetData = testData.resetData.valid;
      (DataValidator.validate as jest.Mock).mockResolvedValue(resetData);
      (database.get.accountByUserId as jest.Mock).mockResolvedValue(null);

      const result = await ResetPasswordHandler.handle(resetData);

      expect(result.statusCode).toBe(404);
      expect(result.message).toBe('error');
      expect(result.data.error.name).toBe('AccountNotFoundError');
    });
  });

  describe('❌ 關鍵驗證錯誤', () => {
    it('應處理弱密碼驗證錯誤', async () => {
      const weakPasswordData = testData.resetData.weakPassword;
      const validationError = new Error('密碼長度至少需要 6 字符');

      jest.clearAllMocks();
      (DataValidator.validate as jest.Mock).mockRejectedValue(validationError);

      const result = await ResetPasswordHandler.handle(weakPasswordData);

      expect(result.statusCode).toBeGreaterThanOrEqual(400);
      expect(result.message).toBe('error');
    });

    it('應處理空重設令牌驗證錯誤', async () => {
      const invalidData = {
        ...testData.resetData.valid,
        resetToken: '',
      };
      const validationError = new Error('重設令牌不能為空');

      jest.clearAllMocks();
      (DataValidator.validate as jest.Mock).mockRejectedValue(validationError);

      const result = await ResetPasswordHandler.handle(invalidData);

      expect(result.statusCode).toBeGreaterThanOrEqual(400);
      expect(result.message).toBe('error');
    });
  });

  describe('❌ 關鍵系統錯誤', () => {
    it('應處理資料庫查詢錯誤', async () => {
      const resetData = testData.resetData.valid;
      const dbError = new Error('Database connection failed');

      jest.clearAllMocks();
      (DataValidator.validate as jest.Mock).mockResolvedValue(resetData);
      (database.get.accountRecover as jest.Mock).mockRejectedValue(dbError);

      const result = await ResetPasswordHandler.handle(resetData);

      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('error');
      expect(result.data.error.name).toBe('ServerError');
    });
  });
});

import { LoginHandler } from '@/api/http/routers/login/login.handler';
import { createLoginTestData, DEFAULT_IDS } from './_testHelpers';

// Mock 所有依賴
jest.mock('bcrypt');
jest.mock('@/utils/logger');
jest.mock('@/utils/jwt');
jest.mock('@/middleware/data.validator');
jest.mock('@/index', () => ({
  database: {
    get: {
      account: jest.fn(),
      user: jest.fn(),
    },
    set: {
      user: jest.fn(),
    },
  },
}));

// 匯入 mocked 模組
import { database } from '@/index';
import { DataValidator } from '@/middleware/data.validator';
import { generateJWT } from '@/utils/jwt';
import bcrypt from 'bcrypt';

describe('LoginHandler (登入處理)', () => {
  let testData: ReturnType<typeof createLoginTestData>;

  beforeEach(() => {
    testData = createLoginTestData();
    jest.clearAllMocks();

    // 設定時間 mock
    jest
      .spyOn(Date, 'now')
      .mockReturnValue(testData.expectedResponses.currentTime);

    // 設定預設成功 mocks
    (DataValidator.validate as jest.Mock).mockResolvedValue(
      testData.validRequests.basic,
    );
    (database.get.account as jest.Mock).mockResolvedValue(
      testData.databaseData.validAccount,
    );
    (database.get.user as jest.Mock).mockResolvedValue(
      testData.databaseData.validUser,
    );
    (database.set.user as jest.Mock).mockResolvedValue(true);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (generateJWT as jest.Mock).mockReturnValue(
      testData.expectedResponses.validToken,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('✅ 核心業務邏輯', () => {
    it('應成功登入並返回 JWT token', async () => {
      const result = await LoginHandler.handle(testData.validRequests.basic);

      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('success');
      expect(result.data.token).toBe(testData.expectedResponses.validToken);

      // 驗證核心流程
      expect(DataValidator.validate).toHaveBeenCalledWith(
        expect.any(Object),
        testData.validRequests.basic,
        'LOGIN',
      );
      expect(database.get.account).toHaveBeenCalledWith(DEFAULT_IDS.account);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        testData.validRequests.basic.password,
        testData.databaseData.validAccount.password,
      );
      expect(database.get.user).toHaveBeenCalledWith(DEFAULT_IDS.userId);
      expect(database.set.user).toHaveBeenCalledWith(DEFAULT_IDS.userId, {
        lastActiveAt: testData.expectedResponses.currentTime,
      });
      expect(generateJWT).toHaveBeenCalledWith({ userId: DEFAULT_IDS.userId });
    });
  });

  describe('❌ 關鍵錯誤處理', () => {
    it('應處理帳號不存在', async () => {
      (database.get.account as jest.Mock).mockResolvedValue(null);

      const result = await LoginHandler.handle(
        testData.invalidRequests.nonExistentAccount,
      );

      expect(result.statusCode).toBe(401);
      expect(result.message).toBe('error');
      expect(result.data.error.name).toBe('ValidationError');
      expect(result.data.error.message).toBe('帳號或密碼錯誤');
      expect(result.data.error.tag).toBe('INVALID_ACCOUNT_OR_PASSWORD');
    });

    it('應處理密碼錯誤', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await LoginHandler.handle(
        testData.invalidRequests.wrongPassword,
      );

      expect(result.statusCode).toBe(401);
      expect(result.message).toBe('error');
      expect(result.data.error.name).toBe('ValidationError');
      expect(result.data.error.message).toBe('帳號或密碼錯誤');
      expect(result.data.error.tag).toBe('INVALID_ACCOUNT_OR_PASSWORD');
    });

    it('應處理資料庫錯誤並包裝為 ServerError', async () => {
      const dbError = new Error('Database connection failed');
      (database.get.account as jest.Mock).mockRejectedValue(dbError);

      const result = await LoginHandler.handle(testData.validRequests.basic);

      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('error');
      expect(result.data.error.name).toBe('ServerError');
      expect(result.data.error.message).toBe('登入失敗，請稍後再試');
      expect(result.data.error.part).toBe('LOGIN');
    });
  });
});

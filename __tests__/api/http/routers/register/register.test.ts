import { RegisterHandler } from '@/api/http/routers/register/register.handler';
import { createRegisterTestData, DEFAULT_IDS } from './_testHelpers';

// Mock 所有依賴
jest.mock('bcrypt');
jest.mock('uuid');
jest.mock('@/utils/logger');
jest.mock('@/middleware/data.validator');
jest.mock('@/config', () => ({
  serverConfig: {
    url: 'http://localhost',
    port: 3000,
  },
}));
jest.mock('@/index', () => ({
  database: {
    get: {
      account: jest.fn(),
    },
    set: {
      user: jest.fn(),
      account: jest.fn(),
    },
  },
}));

// 匯入 mocked 模組
import { database } from '@/index';
import { DataValidator } from '@/middleware/data.validator';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

describe('RegisterHandler (註冊處理)', () => {
  let testData: ReturnType<typeof createRegisterTestData>;

  beforeEach(() => {
    testData = createRegisterTestData();
    jest.clearAllMocks();

    // 設定時間 mock
    jest
      .spyOn(Date, 'now')
      .mockReturnValue(testData.expectedResponses.currentTime);

    // 設定預設成功 mocks
    (DataValidator.validate as jest.Mock).mockResolvedValue(
      testData.validRequests.basic,
    );
    (database.get.account as jest.Mock).mockResolvedValue(null); // 帳號不存在
    (database.set.user as jest.Mock).mockResolvedValue(true);
    (database.set.account as jest.Mock).mockResolvedValue(true);
    (uuidv4 as jest.Mock).mockReturnValue(DEFAULT_IDS.userId);
    (bcrypt.hash as jest.Mock).mockResolvedValue(
      testData.expectedResponses.hashedPassword,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('✅ 核心業務邏輯', () => {
    it('應成功註冊新用戶', async () => {
      const result = await RegisterHandler.handle(testData.validRequests.basic);

      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('success');
      expect(result.data.account).toBe(DEFAULT_IDS.account);

      // 驗證核心流程
      expect(DataValidator.validate).toHaveBeenCalledWith(
        expect.any(Object),
        testData.validRequests.basic,
        'REGISTER',
      );
      expect(database.get.account).toHaveBeenCalledWith(DEFAULT_IDS.account);
      expect(uuidv4).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('TestPass123!', 10);

      // 驗證用戶資料創建
      expect(database.set.user).toHaveBeenCalledWith(DEFAULT_IDS.userId, {
        name: '測試用戶',
        avatar: DEFAULT_IDS.userId,
        avatarUrl: 'http://localhost:3000/images/userAvatars/',
        createdAt: testData.expectedResponses.currentTime,
      });

      // 驗證帳號資料創建
      expect(database.set.account).toHaveBeenCalledWith(DEFAULT_IDS.account, {
        password: testData.expectedResponses.hashedPassword,
        userId: DEFAULT_IDS.userId,
      });
    });
  });

  describe('❌ 關鍵錯誤處理', () => {
    it('應處理帳號已存在的情況', async () => {
      (database.get.account as jest.Mock).mockResolvedValue(
        testData.databaseData.existingAccount,
      );

      const result = await RegisterHandler.handle(
        testData.invalidRequests.existingAccount,
      );

      expect(result.statusCode).toBe(400);
      expect(result.message).toBe('error');
      expect(result.data.error.name).toBe('ServerError');
      expect(result.data.error.message).toBe('帳號已存在');
      expect(result.data.error.tag).toBe('ACCOUNT_EXISTS');

      // 驗證不會創建用戶和帳號
      expect(database.set.user).not.toHaveBeenCalled();
      expect(database.set.account).not.toHaveBeenCalled();
    });

    it('應處理資料庫錯誤', async () => {
      const dbError = new Error('Database connection failed');
      (database.set.user as jest.Mock).mockRejectedValue(dbError);

      const result = await RegisterHandler.handle(testData.validRequests.basic);

      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('error');
      expect(result.data.error.name).toBe('ServerError');
      expect(result.data.error.message).toBe('註冊失敗，請稍後再試');
      expect(result.data.error.part).toBe('REGISTER');
    });
  });
});

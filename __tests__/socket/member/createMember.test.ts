import { jest } from '@jest/globals';
import { mockDatabase, mockDataValidator, mockInfo } from '../../_testSetup';

// Mock Database
jest.mock('@/index', () => ({
  database: require('../../_testSetup').mockDatabase,
}));

// Mock DataValidator
jest.mock('@/middleware/data.validator', () => ({
  DataValidator: require('../../_testSetup').mockDataValidator,
}));

jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockLogger,
}));

jest.mock('@/error', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockStandardizedError,
}));

// Mock SocketServer
jest.mock('@/api/socket', () => ({
  __esModule: true,
  default: require('./_testHelpers').mockSocketServer,
}));

// 被測試的模組和測試輔助工具
import { CreateMemberHandler } from '../../../src/api/socket/events/member/member.handler';
import { CreateMemberSchema } from '../../../src/api/socket/events/member/member.schema';
import {
  createDefaultTestData,
  createStandardMockInstances,
  DEFAULT_IDS,
  mockSocketServer,
  setupAfterEach,
  setupBeforeEach,
  setupTargetUserOnline,
  testDatabaseError,
  testValidationError,
} from './_testHelpers';

describe('CreateMemberHandler (成員創建處理)', () => {
  let mockSocketInstance: any;
  let mockIoInstance: any;
  let testData: ReturnType<typeof createDefaultTestData>;

  beforeEach(() => {
    // 建立測試資料
    testData = createDefaultTestData();

    // 建立 mock 實例
    const mockInstances = createStandardMockInstances(
      DEFAULT_IDS.operatorUserId,
    );
    mockSocketInstance = mockInstances.mockSocketInstance;
    mockIoInstance = mockInstances.mockIoInstance;

    // 設定通用的 beforeEach
    setupBeforeEach(mockSocketInstance, mockIoInstance, testData);
  });

  afterEach(() => {
    setupAfterEach();
  });

  it('應成功創建新成員（操作者為其他人，目標用戶在線）', async () => {
    const targetSocket = setupTargetUserOnline();
    const data = testData.createMemberCreateData();

    await CreateMemberHandler.handle(mockIoInstance, mockSocketInstance, data);

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      CreateMemberSchema,
      data,
      'CREATEMEMBER',
    );

    expect(mockDatabase.set.member).toHaveBeenCalledWith(
      DEFAULT_IDS.targetUserId,
      DEFAULT_IDS.serverId,
      expect.objectContaining({
        permissionLevel: 2,
        nickname: null,
        isBlocked: 0,
        createdAt: expect.any(Number),
      }),
    );

    expect(mockDatabase.set.userServer).toHaveBeenCalledWith(
      DEFAULT_IDS.targetUserId,
      DEFAULT_IDS.serverId,
      { timestamp: expect.any(Number) },
    );

    expect(targetSocket.emit).toHaveBeenCalledWith(
      'serverAdd',
      expect.any(Object),
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('created member'),
    );
  });

  it('應成功創建新成員（目標用戶離線）', async () => {
    // 確保用戶離線
    mockSocketServer.getSocket.mockReturnValue(null);

    const data = testData.createMemberCreateData();

    await CreateMemberHandler.handle(mockIoInstance, mockSocketInstance, data);

    expect(mockDatabase.set.member).toHaveBeenCalledWith(
      DEFAULT_IDS.targetUserId,
      DEFAULT_IDS.serverId,
      expect.objectContaining({
        permissionLevel: 2,
        nickname: null,
        isBlocked: 0,
        createdAt: expect.any(Number),
      }),
    );

    expect(mockDatabase.set.userServer).toHaveBeenCalledWith(
      DEFAULT_IDS.targetUserId,
      DEFAULT_IDS.serverId,
      { timestamp: expect.any(Number) },
    );

    // 用戶離線時不應該調用 emit
    expect(mockSocketServer.getSocket).toHaveBeenCalledWith(
      DEFAULT_IDS.targetUserId,
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('created member'),
    );
  });

  it('應成功創建自己的成員（非擁有者）', async () => {
    const selfCreateData = testData.createMemberCreateData({
      userId: DEFAULT_IDS.operatorUserId,
      member: { permissionLevel: 1 }, // 必須是訪客
    });

    mockSocketInstance.data.userId = DEFAULT_IDS.operatorUserId;

    await CreateMemberHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      selfCreateData,
    );

    expect(mockDatabase.set.member).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      DEFAULT_IDS.serverId,
      expect.objectContaining({
        permissionLevel: 1,
        createdAt: expect.any(Number),
      }),
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('created member'),
    );
  });

  it('應成功創建自己的成員（擁有者）', async () => {
    const ownerCreateData = testData.createMemberCreateData({
      userId: DEFAULT_IDS.ownerUserId,
      member: { permissionLevel: 6 }, // 必須是擁有者權限
    });

    const ownerMockInstances = createStandardMockInstances(
      DEFAULT_IDS.ownerUserId,
    );
    const ownerSocketInstance = ownerMockInstances.mockSocketInstance;

    await CreateMemberHandler.handle(
      mockIoInstance,
      ownerSocketInstance,
      ownerCreateData,
    );

    expect(mockDatabase.set.member).toHaveBeenCalledWith(
      DEFAULT_IDS.ownerUserId,
      DEFAULT_IDS.serverId,
      expect.objectContaining({
        permissionLevel: 6,
        createdAt: expect.any(Number),
      }),
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('created member'),
    );
  });

  it('應處理資料驗證錯誤', async () => {
    const invalidData = { userId: '', serverId: '', member: {} };
    const validationError = new Error('成員資料不正確');

    await testValidationError(
      CreateMemberHandler,
      mockSocketInstance,
      mockIoInstance,
      invalidData,
      validationError,
      '建立成員失敗，請稍後再試',
    );
  });

  it('應處理資料庫錯誤', async () => {
    await testDatabaseError(
      CreateMemberHandler,
      mockSocketInstance,
      mockIoInstance,
      testData.createMemberCreateData(),
      'set',
      'Database connection failed',
      '建立成員失敗，請稍後再試',
    );
  });

  describe('成員資料處理', () => {
    it('應包含創建時間戳', async () => {
      const data = testData.createMemberCreateData();
      await CreateMemberHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      const setMemberCall = mockDatabase.set.member.mock.calls[0];
      const memberData = setMemberCall[2];

      expect(memberData.createdAt).toBeGreaterThan(0);
      expect(typeof memberData.createdAt).toBe('number');
    });

    it('應正確處理自定義權限等級', async () => {
      const data = testData.createMemberCreateData({
        member: {
          permissionLevel: 4,
          nickname: '管理員',
          isBlocked: 0,
        },
      });

      await CreateMemberHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.set.member).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
        expect.objectContaining({
          permissionLevel: 4,
          nickname: '管理員',
          isBlocked: 0,
        }),
      );
    });

    it('應正確處理不同的用戶ID和伺服器ID', async () => {
      const customUserId = 'custom-user-id';
      const customServerId = 'custom-server-id';

      const data = testData.createMemberCreateData({
        userId: customUserId,
        serverId: customServerId,
      });

      await CreateMemberHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.set.member).toHaveBeenCalledWith(
        customUserId,
        customServerId,
        expect.any(Object),
      );

      expect(mockDatabase.set.userServer).toHaveBeenCalledWith(
        customUserId,
        customServerId,
        expect.any(Object),
      );
    });

    it('應正確處理暱稱和封鎖狀態', async () => {
      const data = testData.createMemberCreateData({
        member: {
          permissionLevel: 2,
          nickname: '新成員暱稱',
          isBlocked: 1,
        },
      });

      await CreateMemberHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.set.member).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.serverId,
        expect.objectContaining({
          nickname: '新成員暱稱',
          isBlocked: 1,
        }),
      );
    });
  });

  describe('Socket事件處理', () => {
    it('應在用戶在線時發送serverAdd事件', async () => {
      const targetSocket = setupTargetUserOnline();
      const data = testData.createMemberCreateData();

      await CreateMemberHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(targetSocket.emit).toHaveBeenCalledWith(
        'serverAdd',
        expect.any(Object),
      );
    });

    it('應在socket事件中包含正確的伺服器資料', async () => {
      const targetSocket = setupTargetUserOnline();
      const data = testData.createMemberCreateData();

      await CreateMemberHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 檢查emit被調用時的第二個參數
      const emitCall = targetSocket.emit.mock.calls.find(
        (call: any[]) => call[0] === 'serverAdd',
      );
      expect(emitCall).toBeDefined();
      if (emitCall) {
        expect(emitCall[1]).toBeDefined();
      }
    });

    it('應在用戶離線時不發送socket事件', async () => {
      // 確保用戶離線
      mockSocketServer.getSocket.mockReturnValue(null);

      const data = testData.createMemberCreateData();
      await CreateMemberHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockSocketServer.getSocket).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
      );
      // 沒有socket實例時不應該調用emit
    });
  });

  describe('UserServer處理', () => {
    it('應正確設定UserServer時間戳', async () => {
      const data = testData.createMemberCreateData();
      await CreateMemberHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      const setUserServerCall = mockDatabase.set.userServer.mock.calls[0];
      const userServerData = setUserServerCall[2];

      expect(userServerData.timestamp).toBeGreaterThan(0);
      expect(typeof userServerData.timestamp).toBe('number');
    });

    it('應為不同用戶設定對應的UserServer記錄', async () => {
      const customUserId = 'custom-user-id';
      const data = testData.createMemberCreateData({
        userId: customUserId,
      });

      await CreateMemberHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.set.userServer).toHaveBeenCalledWith(
        customUserId,
        DEFAULT_IDS.serverId,
        expect.objectContaining({
          timestamp: expect.any(Number),
        }),
      );
    });
  });
});

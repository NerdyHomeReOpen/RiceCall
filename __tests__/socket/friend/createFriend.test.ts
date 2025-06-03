import { jest } from '@jest/globals';

// 使用本地的測試輔助工具
import {
  createDefaultTestData,
  createStandardMockInstances,
  DEFAULT_IDS,
  setupAfterEach,
  setupBeforeEach,
  setupBiDirectionalMock,
  testDatabaseError,
  testPermissionFailure,
  testValidationError,
} from './_testHelpers';

// 測試設定
import {
  mockDatabase,
  mockDataValidator,
  mockInfo,
  mockSocketServerGetSocket,
} from '../../_testSetup';

// Mock 核心模組
jest.mock('@/index', () => ({
  database: mockDatabase,
}));

jest.mock('@/middleware/data.validator', () => ({
  DataValidator: mockDataValidator,
}));

jest.mock('@/api/socket', () => ({
  __esModule: true,
  default: { getSocket: mockSocketServerGetSocket },
}));

jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockLogger,
}));

jest.mock('@/error', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockStandardizedError,
}));

// Mock biDirectionalAsyncOperation
const mockBiDirectional = setupBiDirectionalMock();

// 被測試的模組
import { CreateFriendHandler } from '../../../src/api/socket/events/friend/friend.handler';
import { CreateFriendSchema } from '../../../src/api/socket/events/friend/friend.schema';

describe('CreateFriendHandler (好友創建處理)', () => {
  let mockSocketInstance: any;
  let mockIoInstance: any;
  let testData: ReturnType<typeof createDefaultTestData>;

  beforeEach(() => {
    // 建立測試資料
    testData = createDefaultTestData();

    // 建立 mock 實例
    const mockInstances = createStandardMockInstances();
    mockSocketInstance = mockInstances.mockSocketInstance;
    mockIoInstance = mockInstances.mockIoInstance;

    // 設定通用的 beforeEach
    setupBeforeEach(mockSocketInstance, mockIoInstance, testData);

    // 重設 biDirectional mock
    mockBiDirectional.mockClear();
  });

  afterEach(() => {
    setupAfterEach();
  });

  it('應在符合所有條件時成功創建好友', async () => {
    const targetSocket = require('../../_testSetup').createMockSocket(
      DEFAULT_IDS.targetUserId,
      'target-socket-id',
    );
    mockSocketServerGetSocket.mockReturnValue(targetSocket);

    const data = testData.createFriendData();
    await CreateFriendHandler.handle(mockIoInstance, mockSocketInstance, data);

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      CreateFriendSchema,
      data,
      'CREATEFRIEND',
    );

    // 檢查是否有查詢現有好友關係
    expect(mockDatabase.get.friend).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      DEFAULT_IDS.targetUserId,
    );

    // 核心業務邏輯：建立雙向好友關係
    expect(mockBiDirectional).toHaveBeenCalledWith(expect.any(Function), [
      DEFAULT_IDS.operatorUserId,
      DEFAULT_IDS.targetUserId,
    ]);

    // Socket 事件發送
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'friendAdd',
      expect.any(Object),
    );
    expect(targetSocket.emit).toHaveBeenCalledWith(
      'friendAdd',
      expect.any(Object),
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('added friend'),
    );
  });

  it('應處理資料驗證錯誤', async () => {
    const invalidData = { userId: '', targetId: '', friend: {} };
    const validationError = new Error('好友資料不正確');

    await testValidationError(
      CreateFriendHandler,
      mockSocketInstance,
      mockIoInstance,
      invalidData,
      validationError,
      '建立好友失敗，請稍後再試',
    );
  });

  it('應處理資料庫錯誤', async () => {
    await testDatabaseError(
      CreateFriendHandler,
      mockSocketInstance,
      mockIoInstance,
      testData.createFriendData(),
      'set',
      'Database connection failed',
      '建立好友失敗，請稍後再試',
    );
  });

  describe('權限檢查', () => {
    it('操作者不能新增非自己的好友', async () => {
      await testPermissionFailure(
        CreateFriendHandler,
        mockSocketInstance,
        mockIoInstance,
        testData.createFriendData(),
        'different-user-id',
        'Cannot add non-self friends',
      );
    });
  });

  describe('業務規則檢查', () => {
    it('不能新增自己為好友', async () => {
      const data = testData.createFriendData({
        targetId: DEFAULT_IDS.operatorUserId, // 目標是自己
      });

      await CreateFriendHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      const mockWarn = require('../../_testSetup').mockWarn;
      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Cannot add self as a friend'),
      );
      expect(mockDatabase.set.friend).not.toHaveBeenCalled();
    });

    it('當已經是好友時，應阻止重複新增', async () => {
      // Mock已存在的好友關係
      mockDatabase.get.friend.mockResolvedValueOnce({
        userId: DEFAULT_IDS.operatorUserId,
        targetId: DEFAULT_IDS.targetUserId,
        isBlocked: false,
        friendGroupId: null,
      });

      const data = testData.createFriendData();
      await CreateFriendHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      const mockWarn = require('../../_testSetup').mockWarn;
      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Already friends'),
      );
      expect(mockDatabase.set.friend).not.toHaveBeenCalled();
    });
  });

  describe('Socket事件處理', () => {
    it('當目標用戶離線時，只發送給操作者', async () => {
      mockSocketServerGetSocket.mockReturnValue(null); // 目標用戶離線

      const data = testData.createFriendData();
      await CreateFriendHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 發送給操作者
      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'friendAdd',
        expect.any(Object),
      );

      // 檢查是否嘗試取得目標socket
      expect(mockSocketServerGetSocket).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
      );

      // 應該執行建立操作
      expect(mockBiDirectional).toHaveBeenCalled();
    });

    it('當目標用戶線上時，應發送給雙方', async () => {
      const targetSocket = require('../../_testSetup').createMockSocket(
        DEFAULT_IDS.targetUserId,
        'target-socket-id',
      );
      mockSocketServerGetSocket.mockReturnValue(targetSocket);

      const data = testData.createFriendData();
      await CreateFriendHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 發送給操作者
      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'friendAdd',
        expect.any(Object),
      );

      // 發送給目標用戶
      expect(targetSocket.emit).toHaveBeenCalledWith(
        'friendAdd',
        expect.any(Object),
      );
    });
  });

  describe('好友分組處理', () => {
    it('應正確處理指定的好友分組', async () => {
      const data = testData.createFriendData({
        friend: {
          friendGroupId: DEFAULT_IDS.friendGroupId,
          isBlocked: false,
        },
      });

      await CreateFriendHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockBiDirectional).toHaveBeenCalledWith(expect.any(Function), [
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.targetUserId,
      ]);
    });

    it('應正確處理封鎖狀態設定', async () => {
      const data = testData.createFriendData({
        friend: {
          isBlocked: true,
          friendGroupId: null,
        },
      });

      await CreateFriendHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockBiDirectional).toHaveBeenCalledWith(expect.any(Function), [
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.targetUserId,
      ]);
    });
  });
});

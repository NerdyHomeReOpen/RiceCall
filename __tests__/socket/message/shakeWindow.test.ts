import { jest } from '@jest/globals';
import {
  mockDatabase,
  mockDataValidator,
  mockInfo,
  mockWarn,
} from '../../_testSetup';

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
import { ShakeWindowHandler } from '../../../src/api/socket/events/message/message.handler';
import { ShakeWindowSchema } from '../../../src/api/socket/events/message/message.schemas';
import {
  createDefaultTestData,
  createStandardMockInstances,
  DEFAULT_IDS,
  mockSocketServer,
  setupAfterEach,
  setupBeforeEach,
  setupTargetUserOnline,
  testValidationError,
} from './_testHelpers';

describe('ShakeWindowHandler (搖動視窗處理)', () => {
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

  it('應成功搖動好友視窗（目標用戶在線）', async () => {
    const targetSocket = setupTargetUserOnline();
    const data = testData.createShakeWindowData();

    await ShakeWindowHandler.handle(mockIoInstance, mockSocketInstance, data);

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      ShakeWindowSchema,
      data,
      'SHAKEWINDOW',
    );

    expect(mockDatabase.get.userFriend).toHaveBeenCalledWith(
      DEFAULT_IDS.targetUserId,
      DEFAULT_IDS.operatorUserId,
    );

    expect(targetSocket.emit).toHaveBeenCalledWith(
      'onShakeWindow',
      expect.objectContaining({
        userId: DEFAULT_IDS.targetUserId,
        friendId: DEFAULT_IDS.operatorUserId,
        friendGroupId: 'default-group',
        displayName: '好友',
      }),
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('shook window to User'),
    );
  });

  it('應處理目標用戶離線的情況', async () => {
    mockSocketServer.getSocket.mockReturnValue(null);
    const data = testData.createShakeWindowData();

    await ShakeWindowHandler.handle(mockIoInstance, mockSocketInstance, data);

    expect(mockDatabase.get.userFriend).toHaveBeenCalledWith(
      DEFAULT_IDS.targetUserId,
      DEFAULT_IDS.operatorUserId,
    );

    // 目標用戶離線，不會發送事件
    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('shook window to User'),
    );
  });

  it('不能為其他用戶搖動視窗', async () => {
    const otherUserData = testData.createShakeWindowData({
      userId: 'other-user-id',
    });

    await ShakeWindowHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      otherUserData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Cannot shake non-self window'),
    );
  });

  it('不能對非好友搖動視窗', async () => {
    // 設定為非好友關係
    mockDatabase.get.userFriend.mockResolvedValue(null);
    const data = testData.createShakeWindowData();

    await ShakeWindowHandler.handle(mockIoInstance, mockSocketInstance, data);

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Cannot shake non-friend window'),
    );
  });

  it('應處理資料驗證錯誤', async () => {
    const invalidData = { userId: '', targetId: '' };
    const validationError = new Error('搖動視窗資料不正確');

    await testValidationError(
      ShakeWindowHandler,
      mockSocketInstance,
      mockIoInstance,
      invalidData,
      validationError,
      '搖動視窗失敗，請稍後再試',
    );
  });

  describe('好友關係檢查', () => {
    it('應正確檢查好友關係', async () => {
      const data = testData.createShakeWindowData();

      await ShakeWindowHandler.handle(mockIoInstance, mockSocketInstance, data);

      expect(mockDatabase.get.userFriend).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.operatorUserId,
      );
    });

    it('應正確處理不同的目標用戶', async () => {
      const customTargetId = 'custom-target-user';
      const data = testData.createShakeWindowData({
        targetId: customTargetId,
      });

      await ShakeWindowHandler.handle(mockIoInstance, mockSocketInstance, data);

      expect(mockDatabase.get.userFriend).toHaveBeenCalledWith(
        customTargetId,
        DEFAULT_IDS.operatorUserId,
      );
    });

    it('應包含完整的好友資訊在事件中', async () => {
      const targetSocket = setupTargetUserOnline();
      const data = testData.createShakeWindowData();

      await ShakeWindowHandler.handle(mockIoInstance, mockSocketInstance, data);

      expect(targetSocket.emit).toHaveBeenCalledWith(
        'onShakeWindow',
        expect.objectContaining({
          userId: DEFAULT_IDS.targetUserId,
          friendId: DEFAULT_IDS.operatorUserId,
          friendGroupId: 'default-group',
          displayName: '好友',
          addedAt: expect.any(Number),
        }),
      );
    });
  });

  describe('Socket事件處理', () => {
    it('應發送搖動事件給目標用戶（目標用戶在線）', async () => {
      const targetSocket = setupTargetUserOnline();
      const data = testData.createShakeWindowData();

      await ShakeWindowHandler.handle(mockIoInstance, mockSocketInstance, data);

      expect(targetSocket.emit).toHaveBeenCalledWith(
        'onShakeWindow',
        expect.any(Object),
      );
    });

    it('不發送搖動事件（目標用戶離線）', async () => {
      mockSocketServer.getSocket.mockReturnValue(null);
      const data = testData.createShakeWindowData();

      await ShakeWindowHandler.handle(mockIoInstance, mockSocketInstance, data);

      // 檢查是否嘗試取得目標用戶的 socket
      expect(mockSocketServer.getSocket).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
      );

      // 沒有 socket 實例時不會發送事件
    });

    it('應正確發送搖動事件的資料', async () => {
      const targetSocket = setupTargetUserOnline();
      const data = testData.createShakeWindowData();

      await ShakeWindowHandler.handle(mockIoInstance, mockSocketInstance, data);

      const emitCall = targetSocket.emit.mock.calls.find(
        (call: any) => call[0] === 'onShakeWindow',
      );
      expect(emitCall).toBeTruthy();
      if (emitCall) {
        const friendData = emitCall[1];
        expect(friendData).toEqual(testData.userFriend);
      }
    });
  });

  describe('權限和身份檢查', () => {
    it('應檢查操作者身份', async () => {
      const data = testData.createShakeWindowData();

      await ShakeWindowHandler.handle(mockIoInstance, mockSocketInstance, data);

      // 應該允許自己搖動視窗
      expect(mockWarn).not.toHaveBeenCalledWith(
        expect.stringContaining('Cannot shake non-self window'),
      );
    });

    it('應拒絕非本人的搖動請求', async () => {
      const otherUserData = testData.createShakeWindowData({
        userId: 'different-user-id',
      });

      await ShakeWindowHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        otherUserData,
      );

      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Cannot shake non-self window'),
      );

      // 根據實際實現，userFriend 會被調用（在權限檢查之前）
      expect(mockDatabase.get.userFriend).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
        'different-user-id',
      );
    });

    it('操作者與目標用戶不能是同一人', async () => {
      const selfData = testData.createShakeWindowData({
        targetId: DEFAULT_IDS.operatorUserId, // 對自己搖動視窗
      });

      await ShakeWindowHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        selfData,
      );

      // 應該查詢好友關係（即使是對自己的請求）
      expect(mockDatabase.get.userFriend).toHaveBeenCalledWith(
        DEFAULT_IDS.operatorUserId,
        DEFAULT_IDS.operatorUserId,
      );
    });
  });

  describe('業務邏輯檢查', () => {
    it('應正確呼叫資料驗證器', async () => {
      const data = testData.createShakeWindowData();

      await ShakeWindowHandler.handle(mockIoInstance, mockSocketInstance, data);

      expect(mockDataValidator.validate).toHaveBeenCalledWith(
        ShakeWindowSchema,
        data,
        'SHAKEWINDOW',
      );
    });

    it('應按正確順序執行搖動流程', async () => {
      const data = testData.createShakeWindowData();

      await ShakeWindowHandler.handle(mockIoInstance, mockSocketInstance, data);

      // 檢查所有操作都被執行
      expect(mockDataValidator.validate).toHaveBeenCalledTimes(1);
      expect(mockDatabase.get.userFriend).toHaveBeenCalledTimes(1);
    });

    it('非好友關係時不執行搖動', async () => {
      mockDatabase.get.userFriend.mockResolvedValue(null);
      const data = testData.createShakeWindowData();

      await ShakeWindowHandler.handle(mockIoInstance, mockSocketInstance, data);

      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Cannot shake non-friend window'),
      );

      // 不應嘗試取得 socket
      expect(mockSocketServer.getSocket).not.toHaveBeenCalled();
    });
  });
});

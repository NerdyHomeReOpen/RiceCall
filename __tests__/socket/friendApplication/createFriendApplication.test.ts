import { jest } from '@jest/globals';
import {
  mockDatabase,
  mockDataValidator,
  mockInfo,
  mockSocketServerGetSocket,
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

// Mock SocketServer
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

// Mock FriendHandlerServerSide
jest.doMock('@/api/socket/events/friend/friend.handler', () => ({
  FriendHandlerServerSide: {
    createFriend: jest.fn(),
    updateFriendGroup: jest.fn(),
  },
}));

// 被測試的模組和測試輔助工具
import { CreateFriendApplicationHandler } from '../../../src/api/socket/events/friendApplication/friendApplication.handler';
import { CreateFriendApplicationSchema } from '../../../src/api/socket/events/friendApplication/friendApplication.schema';
import {
  createDefaultTestData,
  createStandardMockInstances,
  DEFAULT_IDS,
  setupAfterEach,
  setupBeforeEach,
  testDatabaseError,
  testSenderPermissionFailure,
  testValidationError,
} from './_testHelpers';

describe('CreateFriendApplicationHandler (好友申請創建處理)', () => {
  let mockSocketInstance: any;
  let mockIoInstance: any;
  let testData: ReturnType<typeof createDefaultTestData>;

  beforeEach(() => {
    // 建立測試資料
    testData = createDefaultTestData();

    // 建立 mock 實例
    const mockInstances = createStandardMockInstances(DEFAULT_IDS.senderId);
    mockSocketInstance = mockInstances.mockSocketInstance;
    mockIoInstance = mockInstances.mockIoInstance;

    // 設定通用的 beforeEach
    setupBeforeEach(mockSocketInstance, mockIoInstance, testData);
  });

  afterEach(() => {
    setupAfterEach();
  });

  it('應成功創建好友申請', async () => {
    const receiverSocket = require('../../_testSetup').createMockSocket(
      DEFAULT_IDS.receiverId,
      'receiver-socket-id',
    );
    mockSocketServerGetSocket.mockReturnValue(receiverSocket);

    const data = testData.createFriendApplicationData();
    await CreateFriendApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      data,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      CreateFriendApplicationSchema,
      data,
      'CREATEFRIENDAPPLICATION',
    );

    // 檢查是否有查詢現有好友申請
    expect(mockDatabase.get.friendApplication).toHaveBeenCalledWith(
      DEFAULT_IDS.senderId,
      DEFAULT_IDS.receiverId,
    );

    // 核心業務邏輯：建立好友申請
    expect(mockDatabase.set.friendApplication).toHaveBeenCalled();

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('sent friend application'),
    );
  });

  it('應處理資料驗證錯誤', async () => {
    const invalidData = { senderId: '', receiverId: '', friendApplication: {} };
    const validationError = new Error('好友申請資料不正確');

    await testValidationError(
      CreateFriendApplicationHandler,
      mockSocketInstance,
      mockIoInstance,
      invalidData,
      validationError,
      '發送好友申請失敗，請稍後再試',
    );
  });

  it('應處理資料庫錯誤', async () => {
    await testDatabaseError(
      CreateFriendApplicationHandler,
      mockSocketInstance,
      mockIoInstance,
      testData.createFriendApplicationData(),
      'set',
      'Database connection failed',
      '發送好友申請失敗，請稍後再試',
    );
  });

  describe('權限檢查', () => {
    it('操作者不能發送非自己的好友申請', async () => {
      await testSenderPermissionFailure(
        CreateFriendApplicationHandler,
        mockSocketInstance,
        mockIoInstance,
        testData.createFriendApplicationData(),
        DEFAULT_IDS.otherUserId,
        'Cannot send non-self friend applications',
      );
    });
  });

  describe('業務規則檢查', () => {
    it('不能發送好友申請給自己', async () => {
      const data = testData.createFriendApplicationData({
        receiverId: DEFAULT_IDS.senderId, // 接收者是自己
      });

      await CreateFriendApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Cannot send friend application to self'),
      );
      expect(mockDatabase.set.friendApplication).not.toHaveBeenCalled();
    });

    it('當已經發送申請時，應阻止重複發送', async () => {
      // 重新設定 mock 來覆蓋 beforeEach 中的設定
      jest.clearAllMocks();

      setupBeforeEach(mockSocketInstance, mockIoInstance, testData);

      // 確保沒有反向申請（receiverId -> senderId），只有同向申請（senderId -> receiverId）
      mockDatabase.get.friendApplication.mockImplementation(
        async (sender: string, receiver: string) => {
          // 當查詢反向申請時返回 null
          if (
            sender === DEFAULT_IDS.receiverId &&
            receiver === DEFAULT_IDS.senderId
          ) {
            return null;
          }
          // 當查詢同向申請時返回存在的申請
          if (
            sender === DEFAULT_IDS.senderId &&
            receiver === DEFAULT_IDS.receiverId
          ) {
            return {
              senderId: DEFAULT_IDS.senderId,
              receiverId: DEFAULT_IDS.receiverId,
              description: '之前的申請',
            };
          }
          return null;
        },
      );

      const data = testData.createFriendApplicationData();
      await CreateFriendApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 根據實際的 handler 邏輯，當已經發送申請時會記錄 warning 並直接 return
      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Already sent friend application'),
      );
      // 不應該執行設定操作
      expect(mockDatabase.set.friendApplication).not.toHaveBeenCalled();
      // 檢查其它處理也沒有被執行
      expect(mockSocketServerGetSocket).not.toHaveBeenCalled();
    });
  });

  describe('Socket事件處理', () => {
    it('當接收者離線時，只處理業務邏輯', async () => {
      mockSocketServerGetSocket.mockReturnValue(null); // 接收者離線

      const data = testData.createFriendApplicationData();
      await CreateFriendApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 檢查是否嘗試取得接收者socket
      expect(mockSocketServerGetSocket).toHaveBeenCalledWith(
        DEFAULT_IDS.receiverId,
      );

      // 應該執行建立操作
      expect(mockDatabase.set.friendApplication).toHaveBeenCalled();
    });

    it('當接收者線上時，應發送通知', async () => {
      const receiverSocket = require('../../_testSetup').createMockSocket(
        DEFAULT_IDS.receiverId,
        'receiver-socket-id',
      );
      mockSocketServerGetSocket.mockReturnValue(receiverSocket);

      const data = testData.createFriendApplicationData();
      await CreateFriendApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 應該執行建立操作
      expect(mockDatabase.set.friendApplication).toHaveBeenCalled();

      // 檢查 Socket 事件
      expect(mockSocketServerGetSocket).toHaveBeenCalledWith(
        DEFAULT_IDS.receiverId,
      );
    });
  });

  describe('好友申請內容處理', () => {
    it('應正確處理自定義描述', async () => {
      const data = testData.createFriendApplicationData({
        friendApplication: {
          description: '自定義的好友申請描述',
        },
      });

      await CreateFriendApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.set.friendApplication).toHaveBeenCalled();
    });

    it('應正確處理不同的接收者', async () => {
      const data = testData.createFriendApplicationData({
        receiverId: 'different-receiver-id',
      });

      await CreateFriendApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.get.friendApplication).toHaveBeenCalledWith(
        DEFAULT_IDS.senderId,
        'different-receiver-id',
      );
    });
  });
});

import { jest } from '@jest/globals';

// 使用本地的測試輔助工具
import {
  createDefaultTestData,
  createStandardMockInstances,
  DEFAULT_IDS,
  setupAfterEach,
  setupBeforeEach,
  setupFriendHandlerMock,
  testDatabaseError,
  testValidationError,
} from './_testHelpers';

// 測試設定
import { mockDatabase, mockDataValidator, mockInfo } from '../../_testSetup';

// Mock 核心模組
jest.mock('@/index', () => ({
  database: mockDatabase,
}));

jest.mock('@/middleware/data.validator', () => ({
  DataValidator: mockDataValidator,
}));

jest.mock('@/api/socket', () => ({
  __esModule: true,
  default: { getSocket: require('../../_testSetup').mockSocketServerGetSocket },
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
const { mockCreateFriend, mockUpdateFriendGroup } = setupFriendHandlerMock();

// 被測試的模組
import { ApproveFriendApplicationHandler } from '../../../src/api/socket/events/friendApplication/friendApplication.handler';
import { ApproveFriendApplicationSchema } from '../../../src/api/socket/events/friendApplication/friendApplication.schema';

describe('ApproveFriendApplicationHandler (好友申請批准處理)', () => {
  let mockSocketInstance: any;
  let mockIoInstance: any;
  let testData: ReturnType<typeof createDefaultTestData>;

  beforeEach(() => {
    // 建立測試資料
    testData = createDefaultTestData();

    // 建立 mock 實例（操作者是接收申請的人）
    const mockInstances = createStandardMockInstances(
      DEFAULT_IDS.operatorUserId,
    );
    mockSocketInstance = mockInstances.mockSocketInstance;
    mockIoInstance = mockInstances.mockIoInstance;

    // 設定通用的 beforeEach
    setupBeforeEach(mockSocketInstance, mockIoInstance, testData);

    // 為批准測試特別設定：存在由 targetUserId 發送給 operatorUserId 的申請
    mockDatabase.get.friendApplication.mockImplementation(
      async (senderId: string, receiverId: string) => {
        if (
          senderId === DEFAULT_IDS.targetUserId &&
          receiverId === DEFAULT_IDS.operatorUserId
        ) {
          return {
            senderId: DEFAULT_IDS.targetUserId,
            receiverId: DEFAULT_IDS.operatorUserId,
            description: '想要成為好友',
            createdAt: Date.now() - 1000,
          };
        }
        return null;
      },
    );
  });

  afterEach(() => {
    setupAfterEach();
  });

  it('應成功批准好友申請', async () => {
    const data = testData.createApprovalData();
    await ApproveFriendApplicationHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      data,
    );

    // 資料驗證
    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      ApproveFriendApplicationSchema,
      data,
      'FRIENDAPPROVAL',
    );

    // 檢查好友申請是否存在
    expect(mockDatabase.get.friendApplication).toHaveBeenCalledWith(
      DEFAULT_IDS.targetUserId,
      DEFAULT_IDS.operatorUserId,
    );

    // 檢查是否已經是好友
    expect(mockDatabase.get.friend).toHaveBeenCalledWith(
      DEFAULT_IDS.operatorUserId,
      DEFAULT_IDS.targetUserId,
    );

    // 發送批准事件
    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'friendApproval',
      expect.objectContaining({
        targetId: DEFAULT_IDS.targetUserId,
      }),
    );

    // Logger檢查
    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('approve friend application'),
    );
  });

  it('應處理資料驗證錯誤', async () => {
    const invalidData = { userId: '', targetId: '', friend: {} };
    const validationError = new Error('好友申請資料不正確');

    await testValidationError(
      ApproveFriendApplicationHandler,
      mockSocketInstance,
      mockIoInstance,
      invalidData,
      validationError,
      '處理好友申請失敗，請稍後再試',
    );
  });

  it('應處理資料庫錯誤', async () => {
    await testDatabaseError(
      ApproveFriendApplicationHandler,
      mockSocketInstance,
      mockIoInstance,
      testData.createApprovalData(),
      'set',
      'Database connection failed',
      '處理好友申請失敗，請稍後再試',
    );
  });

  describe('業務規則檢查', () => {
    it('當好友申請不存在時應拋出FriendApplicationNotFoundError', async () => {
      mockDatabase.get.friendApplication.mockResolvedValue(null);

      const data = testData.createApprovalData();
      await ApproveFriendApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({
          name: 'ServerError',
          message: expect.stringContaining('處理好友申請失敗'),
        }),
      );
    });

    it('當已經是好友時應拋出AlreadyFriendError', async () => {
      mockDatabase.get.friend.mockResolvedValue({
        userId: DEFAULT_IDS.operatorUserId,
        targetId: DEFAULT_IDS.targetUserId,
        isBlocked: false,
      });

      const data = testData.createApprovalData();
      await ApproveFriendApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({
          name: 'ServerError',
          message: expect.stringContaining('處理好友申請失敗'),
        }),
      );
    });
  });

  describe('好友分組處理', () => {
    it('應正確處理指定的好友分組', async () => {
      const data = testData.createApprovalData({
        friend: {
          friendGroupId: DEFAULT_IDS.friendGroupId,
        },
      });

      await ApproveFriendApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 應該成功處理並創建好友關係
      expect(mockInfo).toHaveBeenCalledWith(
        expect.stringContaining('approve friend application'),
      );
    });

    it('應正確處理無分組的好友', async () => {
      const data = testData.createApprovalData({
        friend: {
          friendGroupId: null,
        },
      });

      await ApproveFriendApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 應該成功處理並創建好友關係
      expect(mockInfo).toHaveBeenCalledWith(
        expect.stringContaining('approve friend application'),
      );
    });
  });

  describe('批准流程檢查', () => {
    it('應正確刪除好友申請', async () => {
      const data = testData.createApprovalData();
      await ApproveFriendApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 檢查是否刪除了好友申請
      expect(mockDatabase.delete.friendApplication).toHaveBeenCalledWith(
        DEFAULT_IDS.targetUserId,
        DEFAULT_IDS.operatorUserId,
      );
    });

    it('應按正確順序執行批准流程', async () => {
      const data = testData.createApprovalData();
      await ApproveFriendApplicationHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 驗證執行順序：檢查申請 -> 檢查好友關係 -> 刪除申請 -> 創建好友
      expect(mockDatabase.get.friendApplication).toHaveBeenCalled();
      expect(mockDatabase.get.friend).toHaveBeenCalled();
      expect(mockDatabase.delete.friendApplication).toHaveBeenCalled();
    });
  });
});

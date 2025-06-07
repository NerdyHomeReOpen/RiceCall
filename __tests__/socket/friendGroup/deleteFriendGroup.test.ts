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

// Mock UpdateFriendHandler
const mockUpdateFriendHandler = {
  handle: jest.fn(),
};

jest.mock('@/api/socket/events/friend/friend.handler', () => ({
  UpdateFriendHandler: mockUpdateFriendHandler,
}));

// 被測試的模組和測試輔助工具
import { DeleteFriendGroupHandler } from '../../../src/api/socket/events/friendGroup/friendGroup.handler';
import { DeleteFriendGroupSchema } from '../../../src/api/socket/events/friendGroup/friendGroup.schema';
import {
  createDefaultTestData,
  createStandardMockInstances,
  DEFAULT_IDS,
  setupAfterEach,
  setupBeforeEach,
  testDatabaseError,
  testPermissionFailure,
  testValidationError,
} from './_testHelpers';

describe('DeleteFriendGroupHandler (好友群組刪除處理)', () => {
  let mockSocketInstance: any;
  let mockIoInstance: any;
  let testData: ReturnType<typeof createDefaultTestData>;

  beforeEach(() => {
    // 建立測試資料
    testData = createDefaultTestData();

    // 建立 mock 實例
    const mockInstances = createStandardMockInstances(DEFAULT_IDS.userId);
    mockSocketInstance = mockInstances.mockSocketInstance;
    mockIoInstance = mockInstances.mockIoInstance;

    // 設定通用的 beforeEach
    setupBeforeEach(mockSocketInstance, mockIoInstance, testData);

    // 設定 UpdateFriendHandler mock
    (mockUpdateFriendHandler.handle as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    setupAfterEach();
  });

  it('應成功刪除空的好友群組', async () => {
    // 設定群組內沒有好友
    mockDatabase.get.friendGroupFriends.mockResolvedValue([]);

    const data = testData.createFriendGroupDeleteData();
    await DeleteFriendGroupHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      data,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      DeleteFriendGroupSchema,
      data,
      'DELETEFRIENDGROUP',
    );

    expect(mockDatabase.get.friendGroupFriends).toHaveBeenCalledWith(
      DEFAULT_IDS.friendGroupId,
    );

    expect(mockDatabase.delete.friendGroup).toHaveBeenCalledWith(
      DEFAULT_IDS.friendGroupId,
    );

    expect(mockSocketInstance.emit).toHaveBeenCalledWith(
      'friendGroupDelete',
      DEFAULT_IDS.friendGroupId,
    );

    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('deleted friend group'),
    );
  });

  it('應處理資料驗證錯誤', async () => {
    const invalidData = { userId: '', friendGroupId: '' };
    const validationError = new Error('好友群組資料不正確');

    await testValidationError(
      DeleteFriendGroupHandler,
      mockSocketInstance,
      mockIoInstance,
      invalidData,
      validationError,
      '刪除好友群組失敗，請稍後再試',
    );
  });

  it('應處理資料庫錯誤', async () => {
    await testDatabaseError(
      DeleteFriendGroupHandler,
      mockSocketInstance,
      mockIoInstance,
      testData.createFriendGroupDeleteData(),
      'delete',
      'Database connection failed',
      '刪除好友群組失敗，請稍後再試',
    );
  });

  describe('權限檢查', () => {
    it('操作者不能刪除非自己的好友群組', async () => {
      await testPermissionFailure(
        DeleteFriendGroupHandler,
        mockSocketInstance,
        mockIoInstance,
        testData.createFriendGroupDeleteData(),
        DEFAULT_IDS.otherUserId,
        'Cannot delete non-self friend groups',
      );
    });
  });

  describe('好友群組刪除處理', () => {
    it('刪除包含好友的群組時應先移動好友到預設群組', async () => {
      const mockFriends = [
        { userId: DEFAULT_IDS.userId, targetId: DEFAULT_IDS.friendId1 },
        { userId: DEFAULT_IDS.userId, targetId: DEFAULT_IDS.friendId2 },
      ];
      mockDatabase.get.friendGroupFriends.mockResolvedValue(mockFriends);

      const data = testData.createFriendGroupDeleteData();
      await DeleteFriendGroupHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 檢查每個好友都被移動到預設群組 (friendGroupId: null)
      expect(mockUpdateFriendHandler.handle).toHaveBeenCalledTimes(2);

      expect(mockUpdateFriendHandler.handle).toHaveBeenNthCalledWith(
        1,
        mockIoInstance,
        mockSocketInstance,
        {
          userId: DEFAULT_IDS.userId,
          targetId: DEFAULT_IDS.friendId1,
          friend: { friendGroupId: null },
        },
      );

      expect(mockUpdateFriendHandler.handle).toHaveBeenNthCalledWith(
        2,
        mockIoInstance,
        mockSocketInstance,
        {
          userId: DEFAULT_IDS.userId,
          targetId: DEFAULT_IDS.friendId2,
          friend: { friendGroupId: null },
        },
      );

      expect(mockDatabase.delete.friendGroup).toHaveBeenCalledWith(
        DEFAULT_IDS.friendGroupId,
      );
    });

    it('當群組內沒有好友時不應呼叫UpdateFriendHandler', async () => {
      mockDatabase.get.friendGroupFriends.mockResolvedValue([]);

      const data = testData.createFriendGroupDeleteData();
      await DeleteFriendGroupHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockUpdateFriendHandler.handle).not.toHaveBeenCalled();
      expect(mockDatabase.delete.friendGroup).toHaveBeenCalledWith(
        DEFAULT_IDS.friendGroupId,
      );
    });

    it('應正確處理不同的friendGroupId', async () => {
      const customGroupId = 'custom-friend-group-id';
      mockDatabase.get.friendGroupFriends.mockResolvedValue([]);

      const data = testData.createFriendGroupDeleteData({
        friendGroupId: customGroupId,
      });

      await DeleteFriendGroupHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDatabase.get.friendGroupFriends).toHaveBeenCalledWith(
        customGroupId,
      );
      expect(mockDatabase.delete.friendGroup).toHaveBeenCalledWith(
        customGroupId,
      );
      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'friendGroupDelete',
        customGroupId,
      );
    });

    it('刪除包含大量好友的群組時應按順序處理', async () => {
      const mockFriends = [
        { userId: DEFAULT_IDS.userId, targetId: 'friend-1' },
        { userId: DEFAULT_IDS.userId, targetId: 'friend-2' },
        { userId: DEFAULT_IDS.userId, targetId: 'friend-3' },
        { userId: DEFAULT_IDS.userId, targetId: 'friend-4' },
      ];
      mockDatabase.get.friendGroupFriends.mockResolvedValue(mockFriends);

      const data = testData.createFriendGroupDeleteData();
      await DeleteFriendGroupHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockUpdateFriendHandler.handle).toHaveBeenCalledTimes(4);

      // 檢查每個好友都被正確處理
      mockFriends.forEach((friend, index) => {
        expect(mockUpdateFriendHandler.handle).toHaveBeenNthCalledWith(
          index + 1,
          mockIoInstance,
          mockSocketInstance,
          {
            userId: friend.userId,
            targetId: friend.targetId,
            friend: { friendGroupId: null },
          },
        );
      });
    });
  });

  describe('Socket事件處理', () => {
    it('刪除成功後應發送friendGroupDelete事件', async () => {
      mockDatabase.get.friendGroupFriends.mockResolvedValue([]);

      const data = testData.createFriendGroupDeleteData();
      await DeleteFriendGroupHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'friendGroupDelete',
        DEFAULT_IDS.friendGroupId,
      );
    });

    it('應在socket事件中包含正確的群組ID', async () => {
      const customGroupId = 'socket-test-group-id';
      mockDatabase.get.friendGroupFriends.mockResolvedValue([]);

      const data = testData.createFriendGroupDeleteData({
        friendGroupId: customGroupId,
      });

      await DeleteFriendGroupHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'friendGroupDelete',
        customGroupId,
      );
    });
  });

  describe('業務邏輯檢查', () => {
    it('應按正確順序執行刪除流程', async () => {
      const mockFriends = [
        { userId: DEFAULT_IDS.userId, targetId: DEFAULT_IDS.friendId1 },
      ];
      mockDatabase.get.friendGroupFriends.mockResolvedValue(mockFriends);

      const data = testData.createFriendGroupDeleteData();
      await DeleteFriendGroupHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 檢查所有操作都被執行
      expect(mockDataValidator.validate).toHaveBeenCalledWith(
        DeleteFriendGroupSchema,
        data,
        'DELETEFRIENDGROUP',
      );
      expect(mockDatabase.get.friendGroupFriends).toHaveBeenCalledTimes(1);
      expect(mockUpdateFriendHandler.handle).toHaveBeenCalledTimes(1);
      expect(mockDatabase.delete.friendGroup).toHaveBeenCalledTimes(1);
    });

    it('應正確處理刪除操作的參數', async () => {
      mockDatabase.get.friendGroupFriends.mockResolvedValue([]);

      const data = testData.createFriendGroupDeleteData();
      await DeleteFriendGroupHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      expect(mockDataValidator.validate).toHaveBeenCalledWith(
        DeleteFriendGroupSchema,
        data,
        'DELETEFRIENDGROUP',
      );

      expect(mockDatabase.get.friendGroupFriends).toHaveBeenCalledTimes(1);
      expect(mockDatabase.delete.friendGroup).toHaveBeenCalledTimes(1);
      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'friendGroupDelete',
        expect.any(String),
      );
    });

    it('應在執行刪除前進行適當的驗證', async () => {
      mockDatabase.get.friendGroupFriends.mockResolvedValue([]);

      const data = testData.createFriendGroupDeleteData();
      await DeleteFriendGroupHandler.handle(
        mockIoInstance,
        mockSocketInstance,
        data,
      );

      // 檢查驗證和資料庫操作都被執行
      expect(mockDataValidator.validate).toHaveBeenCalledWith(
        DeleteFriendGroupSchema,
        data,
        'DELETEFRIENDGROUP',
      );
      expect(mockDatabase.delete.friendGroup).toHaveBeenCalledTimes(1);
    });
  });
});

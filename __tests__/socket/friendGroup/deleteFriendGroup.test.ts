import { jest } from '@jest/globals';

// Mock UpdateFriendHandler - 需要在jest.mock之前定義
const mockUpdateFriendHandler = {
  handle: jest.fn(),
};

// 被測試的模組
import { DeleteFriendGroupHandler } from '../../../src/api/socket/events/friendGroup/friendGroup.handler';

// 測試設定
import {
  createMockIo,
  createMockSocket,
  mockDataValidator,
  mockDatabase,
  mockInfo,
  mockWarn,
} from '../../_testSetup';

// 錯誤類型和Schema
import { DeleteFriendGroupSchema } from '../../../src/api/socket/events/friendGroup/friendGroup.schema';

// Mock所有相依模組
jest.mock('@/index', () => ({
  database: require('../../_testSetup').mockDatabase,
}));
jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockLogger,
}));
jest.mock('@/middleware/data.validator', () => ({
  DataValidator: require('../../_testSetup').mockDataValidator,
}));
jest.mock('@/api/socket/events/friend/friend.handler', () => ({
  UpdateFriendHandler: mockUpdateFriendHandler,
}));

// 常用的測試ID
const DEFAULT_IDS = {
  userId: 'user-id-123',
  otherUserId: 'other-user-id',
  friendGroupId: 'friend-group-id-123',
} as const;

// 測試數據
const defaultDeleteData = {
  userId: DEFAULT_IDS.userId,
  friendGroupId: DEFAULT_IDS.friendGroupId,
};

describe('DeleteFriendGroupHandler (好友群組刪除處理)', () => {
  let mockSocketInstance: any;
  let mockIoInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // 建立mock socket和io實例，操作者ID設為userId
    mockSocketInstance = createMockSocket(DEFAULT_IDS.userId, 'test-socket-id');
    mockIoInstance = createMockIo();

    // 預設mock回傳值
    mockDatabase.get.friendGroupFriends.mockResolvedValue([]);
    (mockDatabase.delete.friendGroup as any).mockResolvedValue(true);
    mockDataValidator.validate.mockResolvedValue(defaultDeleteData);
    (mockUpdateFriendHandler.handle as any).mockResolvedValue(undefined);
  });

  it('應成功刪除空的好友群組', async () => {
    await DeleteFriendGroupHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultDeleteData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      DeleteFriendGroupSchema,
      defaultDeleteData,
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

  it('操作者不能刪除非自己的好友群組', async () => {
    mockSocketInstance.data.userId = DEFAULT_IDS.otherUserId;

    await DeleteFriendGroupHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultDeleteData,
    );

    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining('Cannot delete non-self friend groups'),
    );
  });

  it('刪除包含好友的群組時應先移動好友到預設群組', async () => {
    const mockFriends = [
      { userId: DEFAULT_IDS.userId, targetId: 'friend1' },
      { userId: DEFAULT_IDS.userId, targetId: 'friend2' },
    ];
    mockDatabase.get.friendGroupFriends.mockResolvedValue(mockFriends);

    await DeleteFriendGroupHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultDeleteData,
    );

    // 檢查每個好友都被移動到預設群組 (friendGroupId: null)
    expect(mockUpdateFriendHandler.handle).toHaveBeenCalledTimes(2);

    expect(mockUpdateFriendHandler.handle).toHaveBeenNthCalledWith(
      1,
      mockIoInstance,
      mockSocketInstance,
      {
        userId: DEFAULT_IDS.userId,
        targetId: 'friend1',
        friend: { friendGroupId: null },
      },
    );

    expect(mockUpdateFriendHandler.handle).toHaveBeenNthCalledWith(
      2,
      mockIoInstance,
      mockSocketInstance,
      {
        userId: DEFAULT_IDS.userId,
        targetId: 'friend2',
        friend: { friendGroupId: null },
      },
    );

    expect(mockDatabase.delete.friendGroup).toHaveBeenCalledWith(
      DEFAULT_IDS.friendGroupId,
    );
  });

  it('應正確呼叫資料驗證器', async () => {
    await DeleteFriendGroupHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultDeleteData,
    );

    expect(mockDataValidator.validate).toHaveBeenCalledWith(
      DeleteFriendGroupSchema,
      defaultDeleteData,
      'DELETEFRIENDGROUP',
    );
  });

  it('當群組內沒有好友時不應呼叫UpdateFriendHandler', async () => {
    mockDatabase.get.friendGroupFriends.mockResolvedValue([]);

    await DeleteFriendGroupHandler.handle(
      mockIoInstance,
      mockSocketInstance,
      defaultDeleteData,
    );

    expect(mockUpdateFriendHandler.handle).not.toHaveBeenCalled();
    expect(mockDatabase.delete.friendGroup).toHaveBeenCalledWith(
      DEFAULT_IDS.friendGroupId,
    );
  });
});

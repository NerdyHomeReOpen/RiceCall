import { jest } from '@jest/globals';

// 被測試的模組
import { FriendHandlerServerSide } from '../../../src/api/socket/events/friend/friend.handler';

// 測試設定
import {
  createMockSocket,
  mockDatabase,
  mockInfo,
  mockSocketServerGetSocket,
} from '../../_testSetup';

// Mock所有相依模組
jest.mock('@/index', () => ({
  database: require('../../_testSetup').mockDatabase,
}));
jest.mock('@/api/socket', () => ({
  __esModule: true,
  default: { getSocket: require('../../_testSetup').mockSocketServerGetSocket },
}));
jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: require('../../_testSetup').MockLogger,
}));
jest.mock('@/utils', () => ({
  biDirectionalAsyncOperation: jest.fn(async (func: any, args: any[]) => {
    await func(args[0], args[1]);
    await func(args[1], args[0]);
  }),
}));

// 常用的測試ID
const DEFAULT_IDS = {
  userId1: 'user-1-id',
  userId2: 'user-2-id',
  friendGroupId: 'friend-group-id',
} as const;

describe('FriendHandlerServerSide (伺服器端好友處理)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // 設定database mock
    (mockDatabase.set.friend as any).mockResolvedValue(true);
    (mockDatabase.get.userFriend as any).mockResolvedValue({
      userId: DEFAULT_IDS.userId1,
      targetId: DEFAULT_IDS.userId2,
      isBlocked: false,
      friendGroupId: null,
    });
  });

  describe('createFriend', () => {
    it('應成功建立雙向好友關係', async () => {
      // 設定沒有現有好友關係
      mockDatabase.get.friend.mockResolvedValue(null);

      const targetSocket = createMockSocket(
        DEFAULT_IDS.userId2,
        'target-socket-id',
      );
      (mockSocketServerGetSocket as any).mockImplementation(
        (userId: string) => {
          if (userId === DEFAULT_IDS.userId2) return targetSocket;
          if (userId === DEFAULT_IDS.userId1)
            return createMockSocket(DEFAULT_IDS.userId1, 'user1-socket-id');
          return null;
        },
      );

      await FriendHandlerServerSide.createFriend(
        DEFAULT_IDS.userId1,
        DEFAULT_IDS.userId2,
      );

      // 檢查是否查詢了現有好友關係（為了舊版相容性）
      expect(mockDatabase.get.friend).toHaveBeenCalledWith(
        DEFAULT_IDS.userId1,
        DEFAULT_IDS.userId2,
      );

      // 檢查logger
      expect(mockInfo).toHaveBeenCalledWith(
        expect.stringContaining('Friend peer'),
      );
    });

    it('應雙向發送Socket事件給線上用戶', async () => {
      mockDatabase.get.friend.mockResolvedValue(null);

      const socket1 = createMockSocket(DEFAULT_IDS.userId1, 'socket1');
      const socket2 = createMockSocket(DEFAULT_IDS.userId2, 'socket2');

      (mockSocketServerGetSocket as any).mockImplementation(
        (userId: string) => {
          if (userId === DEFAULT_IDS.userId1) return socket1;
          if (userId === DEFAULT_IDS.userId2) return socket2;
          return null;
        },
      );

      await FriendHandlerServerSide.createFriend(
        DEFAULT_IDS.userId1,
        DEFAULT_IDS.userId2,
      );

      // 檢查是否向雙方發送了事件
      expect(socket1.emit).toHaveBeenCalledWith(
        'friendAdd',
        expect.any(Object),
      );
      expect(socket2.emit).toHaveBeenCalledWith(
        'friendAdd',
        expect.any(Object),
      );
    });

    it('當用戶離線時應正常處理而不發送Socket事件', async () => {
      mockDatabase.get.friend.mockResolvedValue(null);
      (mockSocketServerGetSocket as any).mockReturnValue(null); // 所有用戶都離線

      await FriendHandlerServerSide.createFriend(
        DEFAULT_IDS.userId1,
        DEFAULT_IDS.userId2,
      );

      // 應該仍然記錄成功
      expect(mockInfo).toHaveBeenCalledWith(
        expect.stringContaining('Friend peer'),
      );

      // 但不會有Socket emit調用（因為沒有socket返回）
      expect(mockSocketServerGetSocket).toHaveBeenCalledWith(
        DEFAULT_IDS.userId1,
      );
      expect(mockSocketServerGetSocket).toHaveBeenCalledWith(
        DEFAULT_IDS.userId2,
      );
    });
  });

  describe('updateFriendGroup', () => {
    const existingFriend = {
      userId: DEFAULT_IDS.userId1,
      targetId: DEFAULT_IDS.userId2,
      isBlocked: false,
      friendGroupId: null,
    };

    const existingFriendGroup = {
      friendGroupId: DEFAULT_IDS.friendGroupId,
      userId: DEFAULT_IDS.userId1,
      name: 'Test Group',
      createdAt: Date.now(),
    };

    it('應成功更新好友分組', async () => {
      mockDatabase.get.friend.mockResolvedValue(existingFriend);
      mockDatabase.get.friendGroup.mockResolvedValue(existingFriendGroup);

      await FriendHandlerServerSide.updateFriendGroup(
        DEFAULT_IDS.userId1,
        DEFAULT_IDS.userId2,
        DEFAULT_IDS.friendGroupId,
      );

      // 檢查是否查詢了好友關係
      expect(mockDatabase.get.friend).toHaveBeenCalledWith(
        DEFAULT_IDS.userId1,
        DEFAULT_IDS.userId2,
      );

      // 檢查是否查詢了好友分組
      expect(mockDatabase.get.friendGroup).toHaveBeenCalledWith(
        DEFAULT_IDS.friendGroupId,
      );

      // 檢查是否更新了好友關係
      expect(mockDatabase.set.friend).toHaveBeenCalledWith(
        DEFAULT_IDS.userId1,
        DEFAULT_IDS.userId2,
        expect.objectContaining({
          ...existingFriend,
          friendGroupId: DEFAULT_IDS.friendGroupId,
        }),
      );
    });

    it('應保留現有好友資料並只更新分組ID', async () => {
      const friendWithData = {
        ...existingFriend,
        isBlocked: true,
        someOtherProperty: 'value',
      };

      mockDatabase.get.friend.mockResolvedValue(friendWithData);
      mockDatabase.get.friendGroup.mockResolvedValue(existingFriendGroup);

      await FriendHandlerServerSide.updateFriendGroup(
        DEFAULT_IDS.userId1,
        DEFAULT_IDS.userId2,
        DEFAULT_IDS.friendGroupId,
      );

      expect(mockDatabase.set.friend).toHaveBeenCalledWith(
        DEFAULT_IDS.userId1,
        DEFAULT_IDS.userId2,
        expect.objectContaining({
          ...friendWithData,
          friendGroupId: DEFAULT_IDS.friendGroupId,
        }),
      );
    });
  });
});

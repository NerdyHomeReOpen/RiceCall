import {
  createMockSocket,
  mockDatabase,
  mockSocketServerGetSocket,
} from '../../_testSetup';
import { Friend, FriendApplication, FriendGroup, User } from './_testTypes';

// 常用的測試數據ID
export const DEFAULT_IDS = {
  operatorUserId: 'operator-user-id',
  targetUserId: 'target-user-id',
  anotherUserId: 'another-user-id',
  friendGroupId: 'friend-group-id',
  anotherFriendGroupId: 'another-friend-group-id',
  applicationId: 'application-id',
} as const;

// 預設用戶資料
export const createDefaultUser = (
  userId: string,
  overrides: Partial<User> = {},
): User => ({
  userId,
  username: `User-${userId}`,
  email: `${userId}@test.com`,
  currentServerId: null,
  currentChannelId: null,
  lastActiveAt: Date.now(),
  ...overrides,
});

// 預設好友資料
export const createDefaultFriend = (
  userId: string,
  targetId: string,
  overrides: Partial<Friend> = {},
): Friend => ({
  userId,
  targetId,
  isBlocked: false,
  friendGroupId: null,
  createdAt: Date.now(),
  ...overrides,
});

// 預設好友分組資料
export const createDefaultFriendGroup = (
  friendGroupId: string,
  userId: string,
  overrides: Partial<FriendGroup> = {},
): FriendGroup => ({
  friendGroupId,
  userId,
  name: `Group-${friendGroupId}`,
  createdAt: Date.now(),
  ...overrides,
});

// 預設好友申請資料
export const createDefaultFriendApplication = (
  senderId: string,
  receiverId: string,
  overrides: Partial<FriendApplication> = {},
): FriendApplication => ({
  applicationId: DEFAULT_IDS.applicationId,
  senderId,
  receiverId,
  message: "Let's be friends!",
  status: 'pending',
  createdAt: Date.now(),
  ...overrides,
});

// 創建預設測試資料
export const createDefaultTestData = () => {
  const operatorUser = createDefaultUser(DEFAULT_IDS.operatorUserId);
  const targetUser = createDefaultUser(DEFAULT_IDS.targetUserId);
  const anotherUser = createDefaultUser(DEFAULT_IDS.anotherUserId);

  const friendGroupData = createDefaultFriendGroup(
    DEFAULT_IDS.friendGroupId,
    DEFAULT_IDS.operatorUserId,
  );

  const friendRelation = createDefaultFriend(
    DEFAULT_IDS.operatorUserId,
    DEFAULT_IDS.targetUserId,
  );

  const friendApplication = createDefaultFriendApplication(
    DEFAULT_IDS.operatorUserId,
    DEFAULT_IDS.targetUserId,
  );

  return {
    operatorUser,
    targetUser,
    anotherUser,
    friendGroupData,
    friendRelation,
    friendApplication,
  };
};

// 設定預設的資料庫 mock
export const setupDefaultDatabaseMocks = (
  testData: ReturnType<typeof createDefaultTestData>,
) => {
  // User mocks
  mockDatabase.get.user.mockImplementation(async (userId: string) => {
    if (userId === DEFAULT_IDS.operatorUserId)
      return testData.operatorUser as any;
    if (userId === DEFAULT_IDS.targetUserId) return testData.targetUser as any;
    if (userId === DEFAULT_IDS.anotherUserId)
      return testData.anotherUser as any;
    return null;
  });

  // Friend mocks
  mockDatabase.get.friend.mockResolvedValue(null); // 預設沒有好友關係
  mockDatabase.get.userFriends.mockResolvedValue([]);
  mockDatabase.get.userFriend.mockResolvedValue(testData.friendRelation as any);

  // FriendGroup mocks
  mockDatabase.get.friendGroup.mockResolvedValue(
    testData.friendGroupData as any,
  );
  mockDatabase.get.userFriendGroups.mockResolvedValue([
    testData.friendGroupData,
  ] as any);
  mockDatabase.get.friendGroupFriends.mockResolvedValue([]);

  // FriendApplication mocks
  mockDatabase.get.friendApplication.mockResolvedValue(null);
  mockDatabase.get.userFriendApplications.mockResolvedValue([]);

  // Set operations - 修復返回值類型
  (mockDatabase.set.friend as any).mockResolvedValue(undefined);
  (mockDatabase.set.friendGroup as any).mockResolvedValue(undefined);
  (mockDatabase.set.friendApplication as any).mockResolvedValue(undefined);

  // Delete operations - 修復返回值類型
  (mockDatabase.delete.friend as any).mockResolvedValue(undefined);
  (mockDatabase.delete.friendGroup as any).mockResolvedValue(undefined);
  (mockDatabase.delete.friendApplication as any).mockResolvedValue(undefined);
};

// 設定 Socket mock
export const setupSocketMocks = (
  testData: ReturnType<typeof createDefaultTestData>,
) => {
  // 預設返回目標用戶的 socket
  const targetSocket = createMockSocket(
    DEFAULT_IDS.targetUserId,
    'target-socket-id',
  );
  (mockSocketServerGetSocket as any).mockImplementation((userId: string) => {
    if (userId === DEFAULT_IDS.targetUserId) return targetSocket;
    if (userId === DEFAULT_IDS.anotherUserId)
      return createMockSocket(DEFAULT_IDS.anotherUserId, 'another-socket-id');
    return null;
  });

  return { targetSocket };
};

// 好友變種創建函數
export const createFriendVariant = (
  baseFriend: Friend,
  overrides: Partial<Friend>,
): Friend => ({
  ...baseFriend,
  ...overrides,
});

// 好友分組變種創建函數
export const createFriendGroupVariant = (
  baseFriendGroup: FriendGroup,
  overrides: Partial<FriendGroup>,
): FriendGroup => ({
  ...baseFriendGroup,
  ...overrides,
});

// 用戶變種創建函數
export const createUserVariant = (
  baseUser: User,
  overrides: Partial<User>,
): User => ({
  ...baseUser,
  ...overrides,
});

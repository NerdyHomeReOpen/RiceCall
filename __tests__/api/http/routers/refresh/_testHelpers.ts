// 統一的測試 ID
export const DEFAULT_IDS = {
  userId: 'test-user-123',
  serverId: 'test-server-456',
  memberId: 'test-member-789',
  applicationId: 'test-app-101',
  friendId: 'test-friend-202',
  groupId: 'test-group-303',
  channelId: 'test-channel-404',
} as const;

// 創建通用的 refresh 測試資料
export const createRefreshTestData = () => {
  return {
    // 通用資料
    mockUser: {
      userId: DEFAULT_IDS.userId,
      name: '測試用戶',
      avatar: 'avatar.jpg',
      status: 'online',
    },
    mockServer: {
      serverId: DEFAULT_IDS.serverId,
      name: '測試伺服器',
      icon: 'server-icon.jpg',
    },
    mockMember: {
      memberId: DEFAULT_IDS.memberId,
      userId: DEFAULT_IDS.userId,
      serverId: DEFAULT_IDS.serverId,
      role: 'member',
    },
    mockApplication: {
      applicationId: DEFAULT_IDS.applicationId,
      userId: DEFAULT_IDS.userId,
      targetId: DEFAULT_IDS.serverId,
      status: 'pending',
    },
    mockFriend: {
      userId: DEFAULT_IDS.userId,
      targetId: DEFAULT_IDS.friendId,
      status: 'accepted',
    },
    mockChannel: {
      channelId: DEFAULT_IDS.channelId,
      serverId: DEFAULT_IDS.serverId,
      name: '測試頻道',
      type: 'text',
    },

    // 集合資料
    mockCollections: {
      userFriends: [
        {
          userId: DEFAULT_IDS.userId,
          targetId: DEFAULT_IDS.friendId,
          status: 'accepted',
          online: true,
        },
      ],
      userServers: [
        {
          serverId: DEFAULT_IDS.serverId,
          name: '測試伺服器',
          icon: 'server-icon.jpg',
        },
      ],
      serverChannels: [
        {
          channelId: DEFAULT_IDS.channelId,
          serverId: DEFAULT_IDS.serverId,
          name: '測試頻道',
          type: 'text',
        },
      ],
    },
  };
};

// 設定通用的 database mock
export const setupDatabaseMocks = (
  mockDatabase: any,
  testData: ReturnType<typeof createRefreshTestData>,
) => {
  // User 相關
  mockDatabase.get.user.mockResolvedValue(testData.mockUser);
  mockDatabase.get.userFriends.mockResolvedValue(
    testData.mockCollections.userFriends,
  );
  mockDatabase.get.userServers.mockResolvedValue(
    testData.mockCollections.userServers,
  );
  mockDatabase.get.userFriendApplications.mockResolvedValue([
    testData.mockApplication,
  ]);
  mockDatabase.get.userFriendGroups.mockResolvedValue([]);

  // Server 相關
  mockDatabase.get.server.mockResolvedValue(testData.mockServer);
  mockDatabase.get.serverChannels.mockResolvedValue(
    testData.mockCollections.serverChannels,
  );
  mockDatabase.get.serverMembers.mockResolvedValue([testData.mockMember]);
  mockDatabase.get.serverMemberApplications.mockResolvedValue([
    testData.mockApplication,
  ]);

  // 其他
  mockDatabase.get.member.mockResolvedValue(testData.mockMember);
  mockDatabase.get.memberApplication.mockResolvedValue(
    testData.mockApplication,
  );
  mockDatabase.get.friend.mockResolvedValue(testData.mockFriend);
  mockDatabase.get.friendApplication.mockResolvedValue(
    testData.mockApplication,
  );
  mockDatabase.get.friendGroup.mockResolvedValue({
    groupId: DEFAULT_IDS.groupId,
    name: '測試群組',
  });
  mockDatabase.get.channel.mockResolvedValue(testData.mockChannel);
};

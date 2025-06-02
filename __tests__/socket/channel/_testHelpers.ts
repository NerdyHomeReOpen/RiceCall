import {
  createMockSocket,
  mockDatabase,
  mockSocketServerGetSocket,
} from '../../_testSetup';
import {
  Channel,
  ChannelType,
  ChannelVisibility,
  Member,
  ServerType,
  User,
  VoiceMode,
} from './_testTypes';

// 常用的測試數據
export const DEFAULT_IDS = {
  operatorUserId: 'operator-user-id',
  targetUserId: 'target-user-id',
  serverId: 'test-server-id',
  lobbyChannelId: 'lobby-channel-id',
  regularChannelId: 'regular-channel-id',
} as const;

// 創建默認測試數據
export const createDefaultTestData = () => {
  const operatorUser: User = {
    userId: DEFAULT_IDS.operatorUserId,
    name: 'OperatorUser',
    currentServerId: DEFAULT_IDS.serverId,
    currentChannelId: DEFAULT_IDS.lobbyChannelId,
    lastActiveAt: Date.now(),
  };

  const targetUser: User = {
    userId: DEFAULT_IDS.targetUserId,
    name: 'TargetUser',
    currentServerId: DEFAULT_IDS.serverId,
    currentChannelId: 'other-channel-id',
    lastActiveAt: Date.now(),
  };

  const mockServerData: ServerType = {
    serverId: DEFAULT_IDS.serverId,
    name: '測試伺服器',
    visibility: 'public',
    lobbyId: DEFAULT_IDS.lobbyChannelId,
    ownerId: 'owner-user-id',
  };

  const mockLobbyChannelData: Channel = {
    channelId: DEFAULT_IDS.lobbyChannelId,
    name: '大廳',
    type: ChannelType.TEXT,
    serverId: DEFAULT_IDS.serverId,
    isLobby: true,
    visibility: ChannelVisibility.PUBLIC,
    voiceMode: VoiceMode.FREE,
  };

  const mockRegularChannelData: Channel = {
    channelId: DEFAULT_IDS.regularChannelId,
    name: '一般頻道',
    type: ChannelType.TEXT,
    serverId: DEFAULT_IDS.serverId,
    isLobby: false,
    visibility: ChannelVisibility.PUBLIC,
    voiceMode: VoiceMode.FREE,
    userLimit: 0,
    password: null,
  };

  const mockOperatorMember: Member = {
    userId: DEFAULT_IDS.operatorUserId,
    serverId: DEFAULT_IDS.serverId,
    permissionLevel: 6,
  };

  const mockTargetMember: Member = {
    userId: DEFAULT_IDS.targetUserId,
    serverId: DEFAULT_IDS.serverId,
    permissionLevel: 2,
  };

  return {
    operatorUser,
    targetUser,
    mockServerData,
    mockLobbyChannelData,
    mockRegularChannelData,
    mockOperatorMember,
    mockTargetMember,
  };
};

// 設置默認的 Database Mock
export const setupDefaultDatabaseMocks = (
  testData: ReturnType<typeof createDefaultTestData>,
) => {
  const {
    operatorUser,
    targetUser,
    mockServerData,
    mockLobbyChannelData,
    mockRegularChannelData,
    mockOperatorMember,
    mockTargetMember,
  } = testData;

  mockDatabase.get.user.mockImplementation(async (userId: string) => {
    if (userId === operatorUser.userId) return operatorUser as any;
    if (userId === targetUser.userId) return targetUser as any;
    return null;
  });

  mockDatabase.get.server.mockResolvedValue(mockServerData as any);

  mockDatabase.get.channel.mockImplementation(async (channelId: string) => {
    if (channelId === mockLobbyChannelData.channelId)
      return mockLobbyChannelData as any;
    if (channelId === mockRegularChannelData.channelId)
      return mockRegularChannelData as any;
    return null;
  });

  mockDatabase.get.channelUsers.mockResolvedValue([]);

  mockDatabase.get.member.mockImplementation(
    async (userId: string, serverId: string) => {
      if (serverId !== mockServerData.serverId) return null;
      if (userId === operatorUser.userId) return mockOperatorMember as any;
      if (userId === targetUser.userId) return mockTargetMember as any;
      return null;
    },
  );

  mockDatabase.set.user.mockResolvedValue(true as any);
  mockDatabase.set.member.mockResolvedValue(true as any);
};

// 設置 Socket Mocks
export const setupSocketMocks = (
  testData: ReturnType<typeof createDefaultTestData>,
) => {
  const { targetUser } = testData;

  const targetMockSocket = createMockSocket(
    targetUser.userId,
    'target-socket-id',
  );
  targetMockSocket.data.userId = targetUser.userId;

  mockSocketServerGetSocket.mockImplementation((userIdToGet) => {
    if (userIdToGet === targetUser.userId) return targetMockSocket;
    return undefined;
  });

  return { targetMockSocket };
};

// 創建基本連接數據
export const createConnectData = (
  overrides: Partial<{
    userId: string;
    channelId: string;
    serverId: string;
    password: string | null;
  }> = {},
) => ({
  userId: DEFAULT_IDS.operatorUserId,
  channelId: DEFAULT_IDS.regularChannelId,
  serverId: DEFAULT_IDS.serverId,
  password: null,
  ...overrides,
});

// 權限測試輔助函數
export const createMemberWithPermission = (
  userId: string,
  serverId: string,
  permissionLevel: number,
): Member => ({
  userId,
  serverId,
  permissionLevel,
});

// 頻道變種創建函數
export const createChannelVariant = (
  baseChannel: Channel,
  overrides: Partial<Channel>,
): Channel => ({
  ...baseChannel,
  ...overrides,
});

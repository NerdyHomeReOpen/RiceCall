import {
  User,
  Channel,
  Server,
  Member,
  Friend,
  FriendActivity,
  FriendGroup,
  FriendApplication,
  MemberApplication,
  MemberInvitation,
  table_users,
  table_user_settings,
  table_global_permissions,
  table_servers,
  table_user_servers,
  table_members,
  table_server_permissions,
  table_server_blocked_users,
  table_channels,
  table_channel_muted_users,
  table_channel_permissions,
  table_friends,
  table_friend_groups,
  table_friend_applications,
  table_user_activities,
  table_member_applications,
  table_member_invitations,
} from '@/types';

const defaultTableUser: table_users = {
  userId: '',
  name: '',
  displayId: '',
  avatar: '',
  avatarUrl: '/default/userAvatar.webp',
  signature: '',
  about: '',
  country: '',
  level: 0,
  vip: 0,
  xp: 0,
  requiredXp: 0,
  progress: 0,
  birthYear: 0,
  birthMonth: 0,
  birthDay: 0,
  isVerified: false,
  status: 'online',
  gender: 'Male',
  currentChannelId: null,
  currentServerId: null,
  lastActiveAt: 0,
  updatedAt: 0,
  createdAt: 0,
};

const defaultTableUserSettings: table_user_settings = {
  userId: '',
  forbidFriendApplications: false,
  forbidShakeMessages: false,
  forbidMemberInvitations: false,
  forbidStrangerMessages: false,
  shareCurrentServer: false,
  shareRecentServers: false,
  shareJoinedServers: false,
  shareFavoriteServers: false,
  notSaveMessageHistory: false,
  updatedAt: 0,
  createdAt: 0,
};

const defaultTableGlobalPermission: table_global_permissions = {
  userId: '',
  permissionLevel: 1,
  updatedAt: 0,
  createdAt: 0,
};

const defaultTableFriend: table_friends = {
  userId: '',
  targetId: '',
  note: '',
  relationStatus: 0,
  isBlocked: false,
  friendGroupId: null,
  createdAt: 0,
  updatedAt: 0,
};

const defaultTableFriendGroup: table_friend_groups = {
  friendGroupId: '',
  name: '',
  order: 0,
  userId: '',
  createdAt: 0,
  updatedAt: 0,
};

const defaultTableFriendApplication: table_friend_applications = {
  senderId: '',
  receiverId: '',
  description: '',
  createdAt: 0,
  updatedAt: 0,
};

const defaultTableUserActivity: table_user_activities = {
  activityId: 0,
  userId: '',
  content: '',
  timestamp: 0,
  updatedAt: 0,
  createdAt: 0,
};

const defaultTableServer: table_servers = {
  serverId: '',
  name: '',
  avatar: `${Date.now()}`,
  avatarUrl: `/default/serverAvatar.webp`,
  announcement: '',
  applyNotice: '',
  description: '',
  displayId: '',
  specialId: null,
  slogan: '',
  level: 0,
  wealth: 0,
  receiveApply: true,
  isVerified: false,
  isShowAvailable: false,
  type: 'game',
  visibility: 'public',
  lobbyId: '',
  receptionLobbyId: null,
  ownerId: '',
  createdAt: 0,
  updatedAt: 0,
};

const defaultTableUserServer: table_user_servers = {
  userId: '',
  serverId: '',
  owned: false,
  recent: false,
  favorite: false,
  timestamp: 0,
  updatedAt: 0,
  createdAt: 0,
};

const defaultTableMember: table_members = {
  userId: '',
  serverId: '',
  nickname: null,
  contribution: 0,
  lastJoinChannelAt: 0,
  joinAt: 0,
  createdAt: 0,
  updatedAt: 0,
};

const defaultTableServerPermission: table_server_permissions = {
  userId: '',
  serverId: '',
  permissionLevel: 1,
  updatedAt: 0,
  createdAt: 0,
};

const defaultTableServerBlocked: table_server_blocked_users = {
  userId: '',
  serverId: '',
  blockedUntil: 0,
  updatedAt: 0,
  createdAt: 0,
};

const defaultTableChannel: table_channels = {
  channelId: '',
  name: '',
  announcement: '',
  password: '',
  order: 0,
  bitrate: 64000,
  userLimit: 0,
  queueTime: 300,
  guestTextGapTime: 0,
  guestTextWaitTime: 0,
  guestTextMaxLength: 2000,
  isLobby: false,
  forbidText: false,
  forbidQueue: false,
  forbidGuestText: false,
  forbidGuestVoice: false,
  forbidGuestQueue: false,
  forbidGuestUrl: false,
  type: 'channel',
  visibility: 'public',
  voiceMode: 'free',
  categoryId: null,
  serverId: '',
  createdAt: 0,
  updatedAt: 0,
};

const defaultTableChannelMute: table_channel_muted_users = {
  userId: '',
  channelId: '',
  isTextMuted: false,
  isVoiceMuted: false,
  updatedAt: 0,
  createdAt: 0,
};

const defaultTableChannelPermission: table_channel_permissions = {
  userId: '',
  channelId: '',
  permissionLevel: 1,
  updatedAt: 0,
  createdAt: 0,
};

const defaultTableMemberApplications: table_member_applications = {
  userId: '',
  serverId: '',
  description: '',
  createdAt: 0,
  updatedAt: 0,
};

const defaultTableMemberInvitations: table_member_invitations = {
  receiverId: '',
  serverId: '',
  description: '',
  createdAt: 0,
  updatedAt: 0,
};

const Default = {
  user: (overrides: Partial<User> = {}): User => ({
    ...defaultTableUser,
    ...defaultTableUserSettings,
    ...defaultTableGlobalPermission,
    badges: '',
    ...overrides,
  }),

  friend: (overrides: Partial<Friend> = {}): Friend => ({
    ...defaultTableFriend,
    ...defaultTableUser,
    ...defaultTableUserSettings,
    badges: '',
    ...overrides,
  }),

  friendActivity: (overrides: Partial<FriendActivity> = {}): FriendActivity => ({
    ...defaultTableUser,
    ...defaultTableUserActivity,
    ...overrides,
  }),

  friendGroup: (overrides: Partial<FriendGroup> = {}): FriendGroup => ({
    ...defaultTableFriendGroup,
    ...overrides,
  }),

  friendApplication: (overrides: Partial<FriendApplication> = {}): FriendApplication => ({
    ...defaultTableFriendApplication,
    ...defaultTableUser,
    ...overrides,
  }),

  server: (overrides: Partial<Server> = {}): Server => ({
    ...defaultTableServer,
    ...defaultTableUserServer,
    ...defaultTableServerPermission,
    contribution: 0,
    ...overrides,
  }),

  channel: (overrides: Partial<Channel> = {}): Channel => ({
    ...defaultTableChannel,
    ...defaultTableChannelMute,
    ...defaultTableChannelPermission,
    type: 'channel',
    ...overrides,
  }),

  member: (overrides: Partial<Member> = {}): Member => ({
    ...defaultTableMember,
    ...defaultTableUser,
    ...defaultTableServerBlocked,
    ...defaultTableGlobalPermission,
    ...overrides,
  }),

  memberApplication: (overrides: Partial<MemberApplication> = {}): MemberApplication => ({
    ...defaultTableMemberApplications,
    ...defaultTableUser,
    ...overrides,
  }),

  memberInvitation: (overrides: Partial<MemberInvitation> = {}): MemberInvitation => ({
    ...defaultTableMemberInvitations,
    ...defaultTableServer,
    ...overrides,
  }),
};

export default Default;

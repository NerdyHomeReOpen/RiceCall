import type * as Types from '@/types';

const defaultTableUser: Types.table_users = {
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
  gender: 'male',
  currentChannelId: null,
  currentServerId: null,
  lastActiveAt: 0,
  updatedAt: 0,
  createdAt: 0,
};

const defaultTableUserSettings: Types.table_user_settings = {
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

const defaultTableGlobalPermission: Types.table_global_permissions = {
  userId: '',
  permissionLevel: 1,
  updatedAt: 0,
  createdAt: 0,
};

const defaultTableFriend: Types.table_friends = {
  userId: '',
  targetId: '',
  note: '',
  relationStatus: 0,
  isBlocked: false,
  friendGroupId: null,
  createdAt: 0,
  updatedAt: 0,
};

const defaultTableFriendGroup: Types.table_friend_groups = {
  friendGroupId: '',
  name: '',
  order: 0,
  userId: '',
  createdAt: 0,
  updatedAt: 0,
};

const defaultTableFriendApplication: Types.table_friend_applications = {
  senderId: '',
  receiverId: '',
  description: '',
  createdAt: 0,
  updatedAt: 0,
};

const defaultTableUserActivity: Types.table_user_activities = {
  activityId: 0,
  userId: '',
  content: '',
  timestamp: 0,
  updatedAt: 0,
  createdAt: 0,
};

const defaultTableServer: Types.table_servers = {
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

const defaultTableUserServer: Types.table_user_servers = {
  userId: '',
  serverId: '',
  owned: false,
  recent: false,
  favorite: false,
  timestamp: 0,
  updatedAt: 0,
  createdAt: 0,
};

const defaultTableMember: Types.table_members = {
  userId: '',
  serverId: '',
  nickname: null,
  contribution: 0,
  lastJoinChannelAt: 0,
  joinAt: 0,
  createdAt: 0,
  updatedAt: 0,
};

const defaultTableServerPermission: Types.table_server_permissions = {
  userId: '',
  serverId: '',
  permissionLevel: 1,
  updatedAt: 0,
  createdAt: 0,
};

const defaultTableServerBlocked: Types.table_server_blocked_users = {
  userId: '',
  serverId: '',
  blockedUntil: 0,
  updatedAt: 0,
  createdAt: 0,
};

const defaultTableChannel: Types.table_channels = {
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

const defaultTableChannelMute: Types.table_channel_muted_users = {
  userId: '',
  channelId: '',
  isTextMuted: false,
  isVoiceMuted: false,
  updatedAt: 0,
  createdAt: 0,
};

const defaultTableChannelPermission: Types.table_channel_permissions = {
  userId: '',
  channelId: '',
  permissionLevel: 1,
  updatedAt: 0,
  createdAt: 0,
};

const defaultTableMemberApplications: Types.table_member_applications = {
  userId: '',
  serverId: '',
  description: '',
  createdAt: 0,
  updatedAt: 0,
};

const defaultTableMemberInvitations: Types.table_member_invitations = {
  receiverId: '',
  serverId: '',
  description: '',
  createdAt: 0,
  updatedAt: 0,
};

/**
 * Get the default user
 * @param overrides - The overrides to apply to the default user
 * @returns The default user
 */
export function getDefaultUser(overrides: Partial<Types.User> = {}): Types.User {
  return {
    ...defaultTableUser,
    ...defaultTableUserSettings,
    ...defaultTableGlobalPermission,
    badges: '',
    ...overrides,
  };
}

/**
 * Get the default friend
 * @param overrides - The overrides to apply to the default friend
 * @returns The default friend
 */
export function getDefaultFriend(overrides: Partial<Types.Friend> = {}): Types.Friend {
  return {
    ...defaultTableFriend,
    ...defaultTableUser,
    ...defaultTableUserSettings,
    badges: '',
    ...overrides,
  };
}

/**
 * Get the default friend activity
 * @param overrides - The overrides to apply to the default friend activity
 * @returns The default friend activity
 */
export function getDefaultFriendActivity(overrides: Partial<Types.FriendActivity> = {}): Types.FriendActivity {
  return {
    ...defaultTableUser,
    ...defaultTableUserActivity,
    ...overrides,
  };
}

/**
 * Get the default friend group
 * @param overrides - The overrides to apply to the default friend group
 * @returns The default friend group
 */
export function getDefaultFriendGroup(overrides: Partial<Types.FriendGroup> = {}): Types.FriendGroup {
  return {
    ...defaultTableFriendGroup,
    ...overrides,
  };
}

/**
 * Get the default friend application
 * @param overrides - The overrides to apply to the default friend application
 * @returns The default friend application
 */
export function getDefaultFriendApplication(overrides: Partial<Types.FriendApplication> = {}): Types.FriendApplication {
  return {
    ...defaultTableFriendApplication,
    ...defaultTableUser,
    ...overrides,
  };
}

/**
 * Get the default server
 * @param overrides - The overrides to apply to the default server
 * @returns The default server
 */
export function getDefaultServer(overrides: Partial<Types.Server> = {}): Types.Server {
  return {
    ...defaultTableServer,
    ...defaultTableUserServer,
    ...defaultTableServerPermission,
    contribution: 0,
    ...overrides,
  };
}

/**
 * Get the default channel
 * @param overrides - The overrides to apply to the default channel
 * @returns The default channel
 */
export function getDefaultChannel(overrides: Partial<Types.Channel> = {}): Types.Channel {
  return {
    ...defaultTableChannel,
    ...defaultTableChannelMute,
    ...defaultTableChannelPermission,
    type: 'channel',
    ...overrides,
  };
}

/**
 * Get the default member
 * @param overrides - The overrides to apply to the default member
 * @returns The default member
 */
export function getDefaultMember(overrides: Partial<Types.Member> = {}): Types.Member {
  return {
    ...defaultTableMember,
    ...defaultTableUser,
    ...defaultTableServerBlocked,
    ...defaultTableGlobalPermission,
    ...overrides,
  };
}

/**
 * Get the default member application
 * @param overrides - The overrides to apply to the default member application
 * @returns The default member application
 */
export function getDefaultMemberApplication(overrides: Partial<Types.MemberApplication> = {}): Types.MemberApplication {
  return {
    ...defaultTableMemberApplications,
    ...defaultTableUser,
    ...overrides,
  };
}

/**
 * Get the default member invitation
 * @param overrides - The overrides to apply to the default member invitation
 * @returns The default member invitation
 */
export function getDefaultMemberInvitation(overrides: Partial<Types.MemberInvitation> = {}): Types.MemberInvitation {
  return {
    ...defaultTableMemberInvitations,
    ...defaultTableServer,
    ...overrides,
  };
}

/**
 * Get the default queue member
 * @param overrides - The overrides to apply to the default queue member
 * @returns The default queue member
 */
export function getDefaultQueueMember(overrides: Partial<Types.QueueMember> = {}): Types.QueueMember {
  return {
    ...defaultTableMember,
    ...defaultTableUser,
    ...defaultTableServerBlocked,
    ...defaultTableChannelMute,
    ...defaultTableServerPermission,
    badges: '[]',
    position: 0,
    leftTime: 0,
    isQueueControlled: false,
    ...overrides,
  };
}

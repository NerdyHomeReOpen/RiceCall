export type table_accounts = {
  account: string;
  password: string;
  userId: string;
};

export type table_badges = {
  badgeId: string;
  name: string;
  description: string;
  iconUrl: string;
  createdAt: number;
};

export type table_announcement = {
  announcementId: number;
  title: string;
  timestamp: string;
  attachment_url: string | null;
  link: string | null;
  category: string;
  content: string;
  discordChannelId: string | null;
  discordMessageId: string | null;
}

export type table_channel_blocked_users = {
  userId: string;
  channelId: string;
  blockedUntil: number;
};

export type table_channel_muted_users = {
  userId: string;
  channelId: string;
  isTextMuted: boolean;
  isVoiceMuted: boolean;
};

export type table_channel_permissions = {
  userId: string;
  channelId: string;
  permissionLevel: number;
};

export type table_channels = {
  channelId: string;
  name: string;
  announcement: string;
  password: string;
  order: number;
  bitrate: number;
  userLimit: number;
  guestTextGapTime: number;
  guestTextWaitTime: number;
  guestTextMaxLength: number;
  isLobby: boolean;
  forbidText: boolean;
  forbidQueue: boolean; // New: Forbid Queue
  forbidGuestText: boolean;
  forbidGuestVoice: boolean; // New: Forbid Guest Voice
  forbidGuestQueue: boolean; // New: Forbid Guest Queue
  forbidGuestUrl: boolean;
  type: 'category' | 'channel';
  visibility: 'public' | 'member' | 'private' | 'readonly';
  voiceMode: 'free' | 'admin' | 'queue';
  categoryId: string | null;
  serverId: string;
  createdAt: number;
};

export type table_codes = {
  userId: string;
  code: string;
  createdAt: number;
};

export type table_friend_applications = {
  senderId: string;
  receiverId: string;
  description: string;
  createdAt: number;
};

export type table_friend_groups = {
  friendGroupId: string;
  name: string;
  order: number;
  userId: string;
  createdAt: number;
};

export type table_friends = {
  userId: string;
  targetId: string;
  note: string; // New: Note
  relationStatus: number; // New: Relation Status (0: stranger, 1: pending, 2: friend, 3: blocked)
  isBlocked: boolean;
  friendGroupId: string | null;
  createdAt: number;
};

export type table_global_permissions = {
  userId: string;
  permissionLevel: number;
};

export type table_member_applications = {
  userId: string;
  serverId: string;
  description: string;
  createdAt: number;
};

export type table_member_invitations = {
  receiverId: string;
  serverId: string;
  description: string;
  createdAt: number;
};

export type table_members = {
  userId: string;
  serverId: string;
  nickname: string | null;
  contribution: number;
  // lastMessageTime: number; // Remove: change to frontend calculate
  // lastJoinChannelTime: number; // Remove: change to frontend calculate
  // isBlocked: number; // Remove: Change to table_server_blocked_users and table_channel_blocked_users
  // permissionLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; // Remove: change to table_server_permissions and table_channel_permissions
  createdAt: number;
};

export type table_recommend_server_categories = {
  categoryId: string;
  name: string;
  order: number;
};

export type table_recommend_servers = {
  categoryId: string;
  serverId: string;
};

export type table_reset_password_requests = {
  userId: string;
  code: string;
  createdAt: number;
};

export type table_server_blocked_users = {
  userId: string;
  serverId: string;
  blockedUntil: number;
};

export type table_server_permissions = {
  userId: string;
  serverId: string;
  permissionLevel: number;
};

export type table_servers = {
  serverId: string;
  name: string;
  avatar: string;
  avatarUrl: string;
  announcement: string;
  applyNotice: string;
  description: string;
  displayId: string;
  slogan: string;
  level: number;
  wealth: number;
  receiveApply: boolean;
  type: 'game' | 'entertainment' | 'other';
  visibility: 'public' | 'private' | 'invisible';
  lobbyId: string;
  receptionLobbyId: string | null;
  ownerId: string;
  createdAt: number;
};

export type table_tokens = {
  userId: string;
  token: string;
  createdAt: number;
};

export type table_user_badges = {
  userId: string;
  badgeId: string;
  order: number;
  showTo: number;
  obtainedAt: number;
};

export type table_user_servers = {
  recent: boolean;
  owned: boolean;
  favorite: boolean;
  timestamp: number;
};

export type table_user_vips = {
  userId: string;
  vip: number;
  createdAt: number;
};

export type table_users = {
  userId: string;
  name: string;
  displayId: string; // New: Display ID (for search user)
  avatar: string;
  avatarUrl: string;
  email: string; // New: Email
  signature: string;
  about: string; // New: About
  country: string;
  level: number;
  vip: number;
  vxp: number; // New: VIP Experience Points
  xp: number;
  requiredXp: number;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  status: 'online' | 'dnd' | 'idle' | 'gn' | 'offline';
  gender: 'Male' | 'Female';
  currentChannelId: string | null;
  currentServerId: string | null;
  lastActiveAt: number;
  createdAt: number;
};

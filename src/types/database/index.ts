export type table_users = {
  userId: string;
  name: string;
  id: string; // New: Display ID (for search user)
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
  currentChannelId: string;
  currentServerId: string;
  lastActiveAt: number;
  createdAt: number;
};

export type table_badges = {
  badgeId: string;
  name: string;
  description: string;
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
  isBlocked: boolean;
  friendGroupId: string | null;
  createdAt: number;
};

export type table_friend_applications = {
  senderId: string;
  receiverId: string;
  description: string;
  createdAt: number;
};

export type table_recommend_servers = {
  categoryId: string;
  serverId: string;
};

export type table_recommend_server_categories = {
  categoryId: string;
  name: string;
  order: number;
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
  forbidGuestQueue: boolean; // New: Forbid Guest Queue (Will change name to forbidQueue)
  forbidGuestUrl: boolean;
  type: 'category' | 'channel';
  visibility: 'public' | 'member' | 'private' | 'readonly';
  voiceMode: 'free' | 'admin' | 'queue';
  categoryId: string | null;
  serverId: string;
  createdAt: number;
};

export type table_members = {
  userId: string;
  serverId: string;
  nickname: string | null;
  contribution: number;
  lastMessageTime: number;
  lastJoinChannelTime: number;
  isBlocked: number; // New: Change to number (Will change name to blocked_to)
  permissionLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  createdAt: number;
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

export type table_user_server = {
  recent: boolean;
  owned: boolean;
  favorite: boolean;
  timestamp: number;
};

export type table_user_badges = {
  userId: string;
  badgeId: string;
  order: number;
  showTo: number;
  obtainedAt: number;
};

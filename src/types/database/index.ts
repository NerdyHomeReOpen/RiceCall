export type table_accounts = {
  account: string;
  password: string;
  email: string;
  userId: string;
  updatedAt: number;
  createdAt: number;
};

export type table_announcements = {
  announcementId: number;
  title: string;
  attachmentUrl: string;
  link: string;
  content: string;
  region: string;
  category: string;
  showFrom: number;
  showTo: number;
  updatedAt: number;
  createdAt: number;
};

export type table_badges = {
  badgeId: string;
  name: string;
  description: string;
  iconUrl: string;
  updatedAt: number;
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
  queueTime: number;
  guestTextGapTime: number;
  guestTextWaitTime: number;
  guestTextMaxLength: number;
  isLobby: boolean;
  forbidText: boolean;
  forbidQueue: boolean;
  forbidGuestText: boolean;
  forbidGuestVoice: boolean;
  forbidGuestQueue: boolean;
  forbidGuestUrl: boolean;
  type: 'channel' | 'category';
  visibility: 'public' | 'member' | 'private' | 'readonly';
  voiceMode: 'free' | 'admin' | 'queue';
  categoryId: string | null;
  serverId: string;
  updatedAt: number;
  createdAt: number;
};

export type table_channel_blocked_users = {
  userId: string;
  channelId: string;
  blockedUntil: number;
  updatedAt: number;
  createdAt: number;
};

export type table_channel_muted_users = {
  userId: string;
  channelId: string;
  isTextMuted: boolean;
  isVoiceMuted: boolean;
  updatedAt: number;
  createdAt: number;
};

export type table_channel_permissions = {
  userId: string;
  channelId: string;
  permissionLevel: number;
  updatedAt: number;
  createdAt: number;
};

export type table_friends = {
  userId: string;
  targetId: string;
  note: string;
  relationStatus: number;
  isBlocked: boolean;
  friendGroupId: string | null;
  updatedAt: number;
  createdAt: number;
};

export type table_friend_applications = {
  senderId: string;
  receiverId: string;
  applicationId: number; // TODO: Remove this column
  description: string;
  updatedAt: number;
  createdAt: number;
};

export type table_friend_groups = {
  friendGroupId: string;
  name: string;
  order: number;
  userId: string;
  updatedAt: number;
  createdAt: number;
};

export type table_global_permissions = {
  userId: string;
  permissionLevel: number;
  updatedAt: number;
  createdAt: number;
};

export type table_members = {
  userId: string;
  serverId: string;
  nickname: string | null;
  contribution: number;
  lastJoinChannelAt: number;
  joinAt: number;
  updatedAt: number;
  createdAt: number;
};

export type table_member_applications = {
  userId: string;
  serverId: string;
  applicationId: number; // TODO: Remove this column
  description: string;
  updatedAt: number;
  createdAt: number;
};

export type table_member_invitations = {
  receiverId: string;
  serverId: string;
  description: string;
  updatedAt: number;
  createdAt: number;
};

export type table_message_logs = {
  logId: number;
  roomId: string;
  senderId: string;
  content: string;
  updatedAt: number;
  createdAt: number;
};

export type table_notifications = {
  notificationId: number;
  content: string;
  region: string;
  showFrom: number;
  showTo: number;
  updatedAt: number;
  createdAt: number;
};

export type table_recommend_servers = {
  serverId: string;
  categoryId: string | null;
  tags: string;
};

export type table_recommend_server_categories = {
  categoryId: string;
  name: string;
  order: number;
};

export type table_reset_email_requests = {
  userId: string;
  code: string;
  updatedAt: number;
  createdAt: number;
};

export type table_reset_password_requests = {
  userId: string;
  code: string;
  updatedAt: number;
  createdAt: number;
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
  specialId: string | null;
  slogan: string;
  level: number;
  wealth: number;
  receiveApply: boolean;
  isVerified: boolean;
  isShowAvailable: boolean;
  type: 'game' | 'entertainment' | 'other';
  visibility: 'public' | 'private' | 'invisible' | 'blocked';
  lobbyId: string | null;
  receptionLobbyId: string | null;
  ownerId: string | null;
  updatedAt: number;
  createdAt: number;
};

export type table_server_blocked_users = {
  userId: string;
  serverId: string;
  blockedUntil: number;
  updatedAt: number;
  createdAt: number;
};

export type table_server_permissions = {
  userId: string;
  serverId: string;
  permissionLevel: number;
  updatedAt: number;
  createdAt: number;
};

export type table_tokens = {
  token: string;
  userId: string;
  updatedAt: number;
  createdAt: number;
};

export type table_users = {
  userId: string;
  name: string;
  displayId: string;
  avatar: string;
  avatarUrl: string;
  signature: string;
  about: string;
  country: string;
  level: number;
  vip: number;
  xp: number;
  requiredXp: number;
  progress: number;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  isVerified: boolean;
  status: string;
  gender: string;
  currentChannelId: string | null;
  currentServerId: string | null;
  lastActiveAt: number;
  updatedAt: number;
  createdAt: number;
};

export type table_user_activities = {
  activityId: number;
  userId: string;
  content: string;
  timestamp: number;
  updatedAt: number;
  createdAt: number;
};

export type table_user_badges = {
  userId: string;
  badgeId: string;
  displayNickname: string | null;
  order: number;
  showTo: number;
  obtainedAt: number;
  updatedAt: number;
  createdAt: number;
};

export type table_user_liked_anchors = {
  userId: string;
  anchorUserId: string;
  sendTime: number;
  updatedAt: number;
  createdAt: number;
};

export type table_user_servers = {
  userId: string;
  serverId: string;
  owned: boolean;
  recent: boolean;
  favorite: boolean;
  timestamp: number;
  updatedAt: number;
  createdAt: number;
};

export type table_user_settings = {
  userId: string;
  forbidFriendApplications: boolean;
  forbidShakeMessages: boolean;
  forbidMemberInvitations: boolean;
  forbidStrangerMessages: boolean;
  shareCurrentServer: boolean;
  shareRecentServers: boolean;
  shareJoinedServers: boolean;
  shareFavoriteServers: boolean;
  notSaveMessageHistory: boolean;
  updatedAt: number;
  createdAt: number;
};

export type table_user_show_stats = {
  userId: string;
  hearts: number;
  flowers: number;
  updatedAt: number;
  createdAt: number;
};

export type table_user_show_daily_record = {
  userId: string;
  date: string;
  totalFlower: number;
  dailyTotalFlower: number;
};

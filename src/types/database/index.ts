// Copied from RiceCallEngineeringStandard/shared/database.ts by scripts/sync-shared.mjs. Do not edit; change the source and run the script.
import { Permission, RelationStatus } from './enums';

export * from './enums';

export type table_accounts = {
  account: string;
  password: string;
  email: string;
  userId: string;
  updatedAt: number;
  createdAt: number;
};

export type table_admin_account_permission_rules = {
  account: string;
  permissionId: number;
  effect: string;
  updatedAt: number;
  createdAt: number;
};

export type table_admin_accounts = {
  account: string;
  password: string;
  permissionLevel: number;
  totpSecret: string;
  isTotpEnabled: number;
  updatedAt: number;
  createdAt: number;
  googleId: string | null;
  googleEmail: string | null;
  oauthProfile: string | null;
  role: string;
  roleId: number | null;
};

export type table_admin_permissions = {
  permissionId: number;
  name: string;
  category: string;
  action: string;
  displayName: string;
  description: string;
  isSystem: number;
  createdAt: number;
  updatedAt: number;
};

export type table_admin_role_permissions = {
  rolePermissionId: number;
  roleId: number;
  permissionId: number;
  grantedBy: string | null;
  grantedAt: number;
  updatedAt: number;
  createdAt: number;
};

export type table_admin_roles = {
  roleId: number;
  name: string;
  displayName: string;
  description: string;
  isSystem: number;
  level: number;
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
  publishedAt: number;
  showStartsAt: number;
  showEndsAt: number;
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
  permissionLevel: Permission;
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
  queueSeconds: number;
  guestTextGapSeconds: number;
  guestTextWaitSeconds: number;
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

export type table_email_verification_requests = {
  userId: string;
  code: string;
  updatedAt: number;
  createdAt: number;
};

export type table_friend_applications = {
  senderId: string;
  receiverId: string;
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

export type table_friends = {
  userId: string;
  targetId: string;
  note: string;
  relationStatus: RelationStatus;
  isBlocked: boolean;
  friendGroupId: string | null;
  updatedAt: number;
  createdAt: number;
};

export type table_global_permissions = {
  userId: string;
  permissionLevel: Permission;
  updatedAt: number;
  createdAt: number;
};

export type table_member_applications = {
  userId: string;
  serverId: string;
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

export type table_members = {
  userId: string;
  serverId: string;
  nickname: string | null;
  contribution: number;
  lastJoinChannelAt: number;
  joinedAt: number;
  updatedAt: number;
  createdAt: number;
};

export type table_messages = {
  messageId: number;
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
  showStartsAt: number;
  showEndsAt: number;
  updatedAt: number;
  createdAt: number;
};

export type table_oauth_states = {
  state: string;
  purpose: string;
  userId: string | null;
  redirect: string | null;
  meta: string | null;
  createdAt: number;
  expiresAt: number;
  updatedAt: number;
};

export type table_password_forget_requests = {
  userId: string;
  code: string;
  updatedAt: number;
  createdAt: number;
};

export type table_queued_emails = {
  queuedEmailId: string;
  path: string;
  payload: string;
  attempts: number;
  nextAttemptAt: number;
  leaseUntil: number | null;
  updatedAt: number;
  createdAt: number;
};

export type table_recommend_server_categories = {
  categoryId: string;
  name: string;
  order: number;
  updatedAt: number;
  createdAt: number;
};

export type table_recommend_servers = {
  serverId: string;
  categoryId: string | null;
  tags: string;
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
  permissionLevel: Permission;
  updatedAt: number;
  createdAt: number;
};

export type table_servers = {
  serverId: string;
  name: string;
  avatar: string;
  avatarUrl: string | null;
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

export type table_tokens = {
  token: string;
  userId: string;
  updatedAt: number;
  createdAt: number;
};

export type table_user_activities = {
  activityId: number;
  userId: string;
  content: string;
  occurredAt: number;
  updatedAt: number;
  createdAt: number;
};

export type table_user_badges = {
  userId: string;
  badgeId: string;
  displayNickname: string | null;
  order: number;
  showEndsAt: number;
  obtainedAt: number;
  updatedAt: number;
  createdAt: number;
};

export type table_user_liked_anchors = {
  userId: string;
  anchorUserId: string;
  sentAt: number;
  updatedAt: number;
  createdAt: number;
};

export type table_user_servers = {
  userId: string;
  serverId: string;
  isOwned: boolean;
  isRecent: boolean;
  isFavorite: boolean;
  lastConnectedAt: number;
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
  disableMessageHistory: boolean;
  updatedAt: number;
  createdAt: number;
};

export type table_user_show_flower_states = {
  userId: string;
  restoreQueue: string;
  totalSent: number;
  updatedAt: number;
  createdAt: number;
};

export type table_user_show_gift_requests = {
  userId: string;
  requestId: string;
  action: string;
  receiverId: string;
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

export type table_users = {
  userId: string;
  name: string;
  displayId: string;
  avatar: string;
  avatarUrl: string | null;
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

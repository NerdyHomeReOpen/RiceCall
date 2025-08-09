export const enum Permission {
  Guest = 1,
  Member = 2,
  ChannelMod = 3,
  ChannelAdmin = 4,
  ServerAdmin = 5,
  ServerOwner = 6,
  Staff = 7,
  Developer = 8,
  Official = 9  
}

export type User = {
  userId: string;
  name: string;
  avatar: string;
  avatarUrl: string;
  signature: string;
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
  currentCategoryId: string;
  lastActiveAt: number;
  createdAt: number;
  badges: Badge[];
};

export type Badge = {
  badgeId: string;
  name: string;
  rare: string;
  description: string;
  order: number;
  createdAt: number;
};

export type FriendGroup = {
  friendGroupId: string;
  name: string;
  order: number;
  userId: string;
  createdAt: number;
};

export type Friend = {
  userId: string;
  targetId: string;
  isBlocked: boolean;
  friendGroupId: string | null;
  createdAt: number;
};

export type FriendApplication = User & {
  // Change name to UserFriendApplication and separate
  senderId: string;
  receiverId: string;
  description: string;
  createdAt: number;
};

export type RecommendedServers = {
  [category: string]: Server[];
};

export type Server = {
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
  online: number;
};

export type BaseChannel = {
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
  forbidGuestText: boolean;
  forbidGuestUrl: boolean;
  type: 'category' | 'channel';
  visibility: 'public' | 'member' | 'private' | 'readonly';
  voiceMode: 'free' | 'queue' | 'forbidden';
  categoryId: string | null;
  serverId: string;
  createdAt: number;
  permissionLevel: number;
};

export type Category = BaseChannel & {
  type: 'category';
};

export type Channel = BaseChannel & {
  type: 'channel';
};

export type ApproveMemberApplicationPayload = {
  userId: string;
  serverId: string;
  member?: Partial<Member>;
};

export type Member = {
  userId: string;
  serverId: string;
  nickname: string | null;
  contribution: number;
  lastMessageTime: number;
  lastJoinChannelTime: number;
  isBlocked: number; // New: Change to number
  permissionLevel: Permission;
  adminChannelPermission: Permission;  
  createdAt: number;
  blockText: number;
  blockVoice: number;
};

export type MemberApplication = User & {
  // Change name to ServerMemberApplication and separate
  userId: string;
  serverId: string;
  description: string;
  createdAt: number;
};

export type Message = {
  // Change name to BaseMessage
  parameter: Record<string, string>;
  contentMetadata: Record<string, string>;
  content: string;
  type: 'general' | 'info' | 'warn' | 'event' | 'alert' | 'dm';
  timestamp: number;
};

export type ChannelMessage = Message &
  ServerMember & {
    type: 'general';
  };

export type DirectMessage = Message &
  UserFriend & {
    type: 'dm';
    user1Id: string;
    user2Id: string;
  };

export type PromptMessage = Message & {
  type: 'alert' | 'info' | 'warn' | 'event';
};

export type UserServerStatus = {
  recent: boolean;
  owned: boolean;
  favorite: boolean;
  timestamp: number;
};

export type UserServer = Server & Member & UserServerStatus;

export type UserFriend = User & Friend;

export type ServerMember = User & Member;

export type ContextMenuItem = {
  id: string;
  label: string;
  show?: boolean;
  disabled?: boolean;
  hasSubmenu?: boolean;
  submenuItems?: ContextMenuItem[];
  icon?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
};

export type Emoji = {
  id: number;
  alt: string;
  path: string;
};

export type DiscordPresence = {
  details: string;
  state: string;
  largeImageKey: string;
  largeImageText: string;
  smallImageKey: string;
  smallImageText: string;
  timestamp: number;
  buttons: {
    label: string;
    url: string;
  }[];
};

export type speakingMode = 'key' | 'auto';

export type mixMode = 'all' | 'app';

export enum SocketClientEvent {
  // User
  SEARCH_USER = 'searchUser',
  EDIT_USER = 'editUser',
  FORBID_MEMBER_VOICE = 'forbidMemberVoice',
  FORBID_MEMBER_TEXT = 'forbidMemberText',
  UNFORBID_MEMBER_VOICE = 'unforbidMemberVoice',
  UNFORBID_MEMBER_TEXT = 'unforbidMemberText',
  // Friend Group
  CREATE_FRIEND_GROUP = 'createFriendGroup',
  EDIT_FRIEND_GROUP = 'editFriendGroup',
  DELETE_FRIEND_GROUP = 'deleteFriendGroup',
  // Friend
  CREATE_FRIEND = 'createFriend',
  EDIT_FRIEND = 'editFriend',
  DELETE_FRIEND = 'deleteFriend',
  // Friend Application
  CREATE_FRIEND_APPLICATION = 'createFriendApplication',
  EDIT_FRIEND_APPLICATION = 'editFriendApplication',
  DELETE_FRIEND_APPLICATION = 'deleteFriendApplication',
  APPROVE_FRIEND_APPLICATION = 'approveFriendApplication',
  // Server
  FAVORITE_SERVER = 'favoriteServer',
  SEARCH_SERVER = 'searchServer',
  CONNECT_SERVER = 'connectServer',
  DISCONNECT_SERVER = 'disconnectServer',
  CREATE_SERVER = 'createServer',
  EDIT_SERVER = 'editServer',
  DELETE_SERVER = 'deleteServer',
  // Channel
  CONNECT_CHANNEL = 'connectChannel',
  DISCONNECT_CHANNEL = 'disconnectChannel',
  CREATE_CHANNEL = 'createChannel',
  EDIT_CHANNEL = 'editChannel',
  EDIT_CHANNELS = 'editChannels',
  DELETE_CHANNEL = 'deleteChannel',
  // Member
  CREATE_MEMBER = 'createMember',
  EDIT_MEMBER = 'editMember',
  DELETE_MEMBER = 'deleteMember',
  // Member Application
  CREATE_MEMBER_APPLICATION = 'createMemberApplication',
  EDIT_MEMBER_APPLICATION = 'editMemberApplication',
  DELETE_MEMBER_APPLICATION = 'deleteMemberApplication',
  APPROVE_MEMBER_APPLICATION = 'approveMemberApplication',
  CREATE_MEMBER_INVITATION_APPLICATION = 'createMemberInvitationApplication',
  // Message
  CHANNEL_MESSAGE = 'channelMessage',
  ACTION_MESSAGE = 'actionMessage',
  DIRECT_MESSAGE = 'directMessage',
  SHAKE_WINDOW = 'shakeWindow',
  // RTC
  RTC_OFFER = 'RTCOffer',
  RTC_ANSWER = 'RTCAnswer',
  RTC_ICE_CANDIDATE = 'RTCIceCandidate',
  // Echo
  PING = 'ping',
}

export enum SocketServerEvent {
  // Notification
  NOTIFICATION = 'notification', // not used yet
  // User
  USER_SEARCH = 'userSearch',
  USER_UPDATE = 'userUpdate',
  // Friend Group
  FRIEND_GROUPS_SET = 'friendGroupsSet',
  FRIEND_GROUP_ADD = 'friendGroupAdd',
  FRIEND_GROUP_UPDATE = 'friendGroupUpdate',
  FRIEND_GROUP_REMOVE = 'friendGroupRemove',
  // Friend
  FRIENDS_SET = 'friendsSet',
  FRIEND_ADD = 'friendAdd',
  FRIEND_UPDATE = 'friendUpdate',
  FRIEND_REMOVE = 'friendRemove',
  // Friend Application
  FRIEND_APPLICATIONS_SET = 'friendApplicationsSet',
  FRIEND_APPLICATION_ADD = 'friendApplicationAdd',
  FRIEND_APPLICATION_UPDATE = 'friendApplicationUpdate',
  FRIEND_APPLICATION_REMOVE = 'friendApplicationRemove',
  // Server
  SERVER_SEARCH = 'serverSearch',
  SERVERS_SET = 'serversSet',
  SERVER_ADD = 'serverAdd',
  SERVER_UPDATE = 'serverUpdate',
  SERVER_REMOVE = 'serverRemove',
  // Channel
  SERVER_CHANNELS_SET = 'serverChannelsSet',
  SERVER_CHANNEL_ADD = 'serverChannelAdd',
  SERVER_CHANNEL_UPDATE = 'serverChannelUpdate',
  SERVER_CHANNEL_REMOVE = 'serverChannelRemove',
  // Member
  SERVER_MEMBERS_SET = 'serverMembersSet',
  SERVER_MEMBER_ADD = 'serverMemberAdd',
  SERVER_MEMBER_UPDATE = 'serverMemberUpdate',
  SERVER_MEMBER_REMOVE = 'serverMemberRemove',
  SERVER_ONLINE_MEMBERS_SET = 'serverOnlineMembersSet',
  SERVER_ONLINE_MEMBER_ADD = 'serverOnlineMemberAdd',
  SERVER_ONLINE_MEMBER_REMOVE = 'serverOnlineMemberRemove',
  // Member Application
  SERVER_MEMBER_APPLICATIONS_SET = 'serverMemberApplicationsSet',
  SERVER_MEMBER_APPLICATION_ADD = 'serverMemberApplicationAdd',
  SERVER_MEMBER_APPLICATION_UPDATE = 'serverMemberApplicationUpdate',
  SERVER_MEMBER_APPLICATION_REMOVE = 'serverMemberApplicationRemove',
  MEMBER_APPROVAL = 'memberApproval',
  // Message
  CHANNEL_MESSAGE = 'channelMessage',
  ACTION_MESSAGE = 'actionMessage',
  DIRECT_MESSAGE = 'directMessage',
  SHAKE_WINDOW = 'shakeWindow',
  // RTC
  RTC_OFFER = 'RTCOffer',
  RTC_ANSWER = 'RTCAnswer',
  RTC_ICE_CANDIDATE = 'RTCIceCandidate',
  RTC_JOIN = 'RTCJoin',
  RTC_LEAVE = 'RTCLeave',
  // Play Sound
  PLAY_SOUND = 'playSound',
  // Echo
  PONG = 'pong',
  // Popup
  OPEN_POPUP = 'openPopup',
}

export enum PopupType {
  AVATAR_CROPPER = 'avatarCropper',
  USER_INFO = 'userInfo',
  USER_SETTING = 'userSetting',
  CHANNEL_SETTING = 'channelSetting',
  CHANNEL_PASSWORD = 'channelPassword',
  SERVER_SETTING = 'serverSetting',
  SERVER_BROADCAST = 'serverBroadcast',
  BLOCK_MEMBER = 'blockMember',
  SYSTEM_SETTING = 'systemSetting',
  MEMBER_APPLY_SETTING = 'memberApplySetting',
  CREATE_SERVER = 'createServer',
  CREATE_CHANNEL = 'createChannel',
  CREATE_FRIENDGROUP = 'createFriendGroup',
  EDIT_CHANNEL_ORDER = 'editChannelOrder',
  EDIT_CHANNEL_NAME = 'editChannelName',
  EDIT_NICKNAME = 'editNickname',
  EDIT_FRIENDGROUP = 'editFriendGroup',
  EDIT_FRIEND = 'editFriend',
  APPLY_MEMBER = 'applyMember',
  APPLY_FRIEND = 'applyFriend',
  SEARCH_USER = 'searchUser',
  DIRECT_MESSAGE = 'directMessage',
  DIALOG_ALERT = 'dialogAlert',
  DIALOG_ALERT2 = 'dialogAlert2',
  DIALOG_SUCCESS = 'dialogSuccess',
  DIALOG_WARNING = 'dialogWarning',
  DIALOG_ERROR = 'dialogError',
  DIALOG_INFO = 'dialogInfo',
  CHANGE_THEME = 'changeTheme',
  ABOUTUS = 'aboutus',
  FRIEND_VERIFICATION = 'friendVerification',
}

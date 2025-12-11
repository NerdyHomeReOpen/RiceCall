/* eslint-disable @typescript-eslint/no-explicit-any */
import * as mediasoupClient from 'mediasoup-client';

import {
  table_badges,
  table_channels,
  table_friend_applications,
  table_friend_groups,
  table_friends,
  table_global_permissions,
  table_server_permissions,
  table_member_applications,
  table_member_invitations,
  table_members,
  table_recommend_servers,
  table_servers,
  table_user_activities,
  table_user_badges,
  table_user_settings,
  table_user_servers,
  table_users,
  table_channel_permissions,
  table_server_blocked_users,
  table_channel_muted_users,
  table_announcements,
  table_notifies,
} from './database';

export type Announcement = table_announcements;

export type Notify = table_notifies;

export type BadgeList = {
  badges: string;
};

export type User = table_users & table_global_permissions & table_user_settings & BadgeList;

export type UserSetting = table_user_settings;

export type Badge = table_badges & table_user_badges;

export type Friend = table_friends & table_users & table_user_settings & BadgeList;

export type FriendActivity = table_friends & table_users & table_user_activities;

export type FriendGroup = table_friend_groups;

export type FriendApplication = table_friend_applications & table_users;

export type Server = table_servers & table_user_servers & table_members & table_server_permissions;

export type RecommendServer = table_servers &
  table_recommend_servers & {
    online: number;
  };

export type Category = table_channels &
  table_channel_muted_users &
  table_channel_permissions & {
    type: 'category';
  };

export type Channel = table_channels &
  table_channel_muted_users &
  table_channel_permissions & {
    type: 'channel';
  };

export type ChannelEvent = OnlineMember & {
  type: 'join' | 'move' | 'leave';
  prevChannelId: string | null;
  nextChannelId: string | null;
  timestamp: number;
};

export type OnlineMember = table_members & table_users & table_channel_muted_users & table_server_permissions & BadgeList;

export type QueueUser = {
  userId: string;
  position: number;
  leftTime: number;
  isQueueControlled: boolean;
};

export type QueueMember = QueueUser & OnlineMember;

export type Member = table_members & table_users & table_server_blocked_users & table_server_permissions;

export type MemberApplication = table_member_applications & table_users;

export type MemberInvitation = table_member_invitations & table_users;

export type Message = {
  parameter: Record<string, string>;
  contentMetadata: Record<string, string>;
  content: string;
  type: 'general' | 'info' | 'warn' | 'event' | 'alert' | 'dm';
  timestamp: number;
};

export type ChannelMessage = Message &
  OnlineMember & {
    type: 'general';
  };

export type ChatHistory = Message &
  User & {
    type: 'chatHistory';
    user1Id: string;
    user2Id: string;
  };

export type DirectMessage = Message &
  User & {
    type: 'dm';
    user1Id: string;
    user2Id: string;
  };

export type PromptMessage = Message & {
  type: 'alert' | 'info' | 'warn' | 'event';
  displaySeconds?: number;
};

export type SystemSettings = {
  autoLogin: boolean;
  autoLaunch: boolean;
  alwaysOnTop: boolean;
  statusAutoIdle: boolean;
  statusAutoIdleMinutes: number;
  statusAutoDnd: boolean;
  channelUIMode: ChannelUIMode;
  closeToTray: boolean;
  fontSize: number;
  font: string;

  inputAudioDevice: string;
  outputAudioDevice: string;
  recordFormat: 'wav' | 'mp3';
  recordSavePath: string;
  mixEffect: boolean;
  mixEffectType: string;
  autoMixSetting: boolean;
  echoCancellation: boolean;
  noiseCancellation: boolean;
  microphoneAmplification: boolean;
  manualMixMode: boolean;
  mixMode: MixMode;

  speakingMode: SpeakingMode;
  defaultSpeakingKey: string;

  notSaveMessageHistory: boolean;

  hotKeyOpenMainWindow: string;
  hotKeyScreenshot: string;
  hotKeyIncreaseVolume: string;
  hotKeyDecreaseVolume: string;
  hotKeyToggleSpeaker: string;
  hotKeyToggleMicrophone: string;

  disableAllSoundEffect: boolean;
  enterVoiceChannelSound: boolean;
  leaveVoiceChannelSound: boolean;
  startSpeakingSound: boolean;
  stopSpeakingSound: boolean;
  receiveDirectMessageSound: boolean;
  receiveChannelMessageSound: boolean;

  autoCheckForUpdates: boolean;
  updateCheckInterval: number;
  updateChannel: string;
};

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

export type NotifyMenuItem = {
  id: string;
  label: string;
  show?: boolean;
  disabled?: boolean;
  showContentLength?: boolean;
  showContent?: boolean;
  contentType?: string;
  contents?: string[];
  icon?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
};

export type Theme = {
  headerImage: string;
  mainColor: string;
  secondaryColor: string;
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

export type SpeakingMode = 'key' | 'auto';

export type MixMode = 'all' | 'app';

export type ChannelUIMode = 'classic' | 'three-line' | 'auto';

export type LanguageKey = 'zh-TW' | 'zh-CN' | 'en-US' | 'fa-IR' | 'pt-BR' | 'ru-RU' | 'es-ES' | 'tr-TR';

export type PopupType =
  | 'aboutus'
  | 'applyFriend'
  | 'applyMember'
  | 'approveFriend'
  | 'blockMember'
  | 'channelEvent'
  | 'changeTheme'
  | 'channelPassword'
  | 'channelSetting'
  | 'chatHistory'
  | 'createChannel'
  | 'createFriendGroup'
  | 'createServer'
  | 'dialogAlert'
  | 'dialogAlert2'
  | 'dialogError'
  | 'dialogInfo'
  | 'dialogSuccess'
  | 'dialogWarning'
  | 'directMessage'
  | 'editChannelName'
  | 'editChannelOrder'
  | 'editFriendNote'
  | 'editFriendGroupName'
  | 'editNickname'
  | 'friendVerification'
  | 'imageCropper'
  | 'inviteMember'
  | 'kickMemberFromChannel'
  | 'kickMemberFromServer'
  | 'memberApplicationSetting'
  | 'memberInvitation'
  | 'searchUser'
  | 'serverApplication'
  | 'serverBroadcast'
  | 'serverSetting'
  | 'systemSetting'
  | 'userInfo'
  | 'userSetting';

export type ACK<T = any> = { ok: true; data: T } | { ok: false; error: string };

export type ClientToServerEvents = {
  // User
  searchUser: (...args: { query: string }[]) => void;
  editUser: (...args: { update: Partial<table_users> }[]) => void;
  editUserSetting: (...args: { update: Partial<table_user_settings> }[]) => void;
  // Friend
  editFriend: (...args: { targetId: string; update: Partial<table_friends> }[]) => void;
  deleteFriend: (...args: { targetId: string }[]) => void;
  blockUser: (...args: { targetId: string }[]) => void;
  unblockUser: (...args: { targetId: string }[]) => void;
  stranger: (...args: { targetId: string }[]) => void;
  // Friend Group
  createFriendGroup: (...args: { preset: Partial<table_friend_groups> }[]) => void;
  editFriendGroup: (...args: { friendGroupId: string; update: Partial<table_friend_groups> }[]) => void;
  deleteFriendGroup: (...args: { friendGroupId: string }[]) => void;
  // Friend Application
  sendFriendApplication: (...args: { receiverId: string; preset: Partial<table_friend_applications>; friendGroupId: string | null }[]) => void;
  editFriendApplication: (...args: { receiverId: string; update: Partial<table_friend_applications> }[]) => void;
  deleteFriendApplication: (...args: { receiverId: string }[]) => void;
  approveFriendApplication: (...args: { senderId: string; friendGroupId: string | null; note: string }[]) => void;
  rejectFriendApplication: (...args: { senderId: string }[]) => void;
  // Server
  favoriteServer: (...args: { serverId: string }[]) => void;
  searchServer: (...args: { query: string }[]) => void;
  connectServer: (...args: { serverId: string }[]) => void;
  disconnectServer: (...args: { serverId: string }[]) => void;
  blockUserFromServer: (...args: { userId: string; serverId: string; blockUntil?: number }[]) => void;
  unblockUserFromServer: (...args: { userId: string; serverId: string }[]) => void;
  createServer: (...args: { preset: Partial<table_servers> }[]) => void;
  editServer: (...args: { serverId: string; update: Partial<table_servers> }[]) => void;
  deleteServer: (...args: { serverId: string }[]) => void;
  // Channel
  connectChannel: (...args: { serverId: string; channelId: string; password?: string }[]) => void;
  moveUserToChannel: (...args: { userId: string; serverId: string; channelId: string }[]) => void;
  disconnectChannel: (...args: { serverId: string; channelId: string }[]) => void;
  blockUserFromChannel: (...args: { userId: string; serverId: string; channelId: string; blockUntil?: number }[]) => void;
  unblockUserFromChannel: (...args: { userId: string; serverId: string; channelId: string }[]) => void;
  createChannel: (...args: { serverId: string; preset: Partial<table_channels> }[]) => void;
  editChannel: (...args: { serverId: string; channelId: string; update: Partial<table_channels> }[]) => void;
  deleteChannel: (...args: { serverId: string; channelId: string }[]) => void;
  muteUserInChannel: (...args: { userId: string; serverId: string; channelId: string; mute: Partial<table_channel_muted_users> }[]) => void;
  // Member
  editMember: (...args: { userId: string; serverId: string; update: Partial<table_members> }[]) => void;
  terminateMember: (...args: { userId: string; serverId: string }[]) => void;
  // Permission
  editServerPermission: (...args: { userId: string; serverId: string; update: Partial<table_server_permissions> }[]) => void;
  editChannelPermission: (...args: { userId: string; serverId: string; channelId: string; update: Partial<table_channel_permissions> }[]) => void;
  // Member Application
  sendMemberApplication: (...args: { serverId: string; preset: Partial<table_member_applications> }[]) => void;
  editMemberApplication: (...args: { serverId: string; update: Partial<table_member_applications> }[]) => void;
  deleteMemberApplication: (...args: { serverId: string }[]) => void;
  approveMemberApplication: (...args: { userId: string; serverId: string }[]) => void;
  rejectMemberApplication: (...args: { userId: string; serverId: string }[]) => void;
  // Member Invitation
  sendMemberInvitation: (...args: { receiverId: string; serverId: string; preset: Partial<table_member_invitations> }[]) => void;
  editMemberInvitation: (...args: { receiverId: string; serverId: string; update: Partial<table_member_invitations> }[]) => void;
  deleteMemberInvitation: (...args: { receiverId: string; serverId: string }[]) => void;
  acceptMemberInvitation: (...args: { serverId: string }[]) => void;
  rejectMemberInvitation: (...args: { serverId: string }[]) => void;
  // Queue
  joinQueue: (...args: { serverId: string; channelId: string; position?: number }[]) => void;
  addUserToQueue: (...args: { serverId: string; channelId: string; userId: string }[]) => void;
  leaveQueue: (...args: { serverId: string; channelId: string }[]) => void;
  removeUserFromQueue: (...args: { serverId: string; channelId: string; userId: string }[]) => void;
  clearQueue: (...args: { serverId: string; channelId: string }[]) => void;
  increaseUserQueueTime: (...args: { serverId: string; channelId: string; userId: string }[]) => void;
  moveUserQueuePosition: (...args: { serverId: string; channelId: string; userId: string; position: number }[]) => void;
  controlQueue: (...args: { serverId: string; channelId: string }[]) => void;
  // Message
  channelMessage: (...args: { serverId: string; channelId: string; preset: Partial<ChannelMessage> }[]) => void;
  actionMessage: (...args: { serverId: string; channelId?: string; preset: Partial<PromptMessage> }[]) => void;
  directMessage: (...args: { targetId: string; preset: Partial<DirectMessage> }[]) => void;
  shakeWindow: (...args: { targetId: string }[]) => void;
  chatHistory: (...args: { userId: string; targetId: string }[]) => void;
};

export type ServerToClientEvents = {
  // Socket
  connect: () => void;
  connect_error: (error: any) => void;
  connect_timeout: () => void;
  reconnect: () => void;
  reconnect_attempt: (attemptNumbers: number) => void;
  reconnect_error: (error: any) => void;
  reconnect_failed: () => void;
  disconnect: () => void;
  heartbeat: (...args: { seq: number; latency: number }[]) => void;
  // Notification
  notification: (...args: { message: string }[]) => void; // not used yet
  // User
  userSearch: (...args: User[]) => void;
  userUpdate: (...args: { update: Partial<User> }[]) => void;
  // Friend Group
  friendGroupAdd: (...args: { data: FriendGroup }[]) => void;
  friendGroupUpdate: (...args: { friendGroupId: string; update: Partial<FriendGroup> }[]) => void;
  friendGroupRemove: (...args: { friendGroupId: string }[]) => void;
  // Friend
  friendAdd: (...args: { data: Friend }[]) => void;
  friendUpdate: (...args: { targetId: string; update: Partial<Friend> }[]) => void;
  friendRemove: (...args: { targetId: string }[]) => void;
  // Friend Application
  friendApplicationAdd: (...args: { data: FriendApplication }[]) => void;
  friendApplicationUpdate: (...args: { senderId: string; update: Partial<FriendApplication> }[]) => void;
  friendApplicationRemove: (...args: { senderId: string }[]) => void;
  // Server
  serverSearch: (...args: Server[]) => void;
  serverAdd: (...args: { data: Server }[]) => void;
  serverUpdate: (...args: { serverId: string; update: Partial<Server> }[]) => void;
  serverRemove: (...args: { serverId: string }[]) => void;
  // Server Member
  serverMemberAdd: (...args: { data: Member }[]) => void;
  serverMemberUpdate: (...args: { userId: string; serverId: string; update: Partial<Member> }[]) => void;
  serverMemberRemove: (...args: { userId: string; serverId: string }[]) => void;
  // Server Online Member
  serverOnlineMemberAdd: (...args: { data: OnlineMember }[]) => void;
  serverOnlineMemberUpdate: (...args: { userId: string; serverId: string; update: Partial<OnlineMember> }[]) => void;
  serverOnlineMemberRemove: (...args: { userId: string; serverId: string }[]) => void;
  // Member Application
  serverMemberApplicationAdd: (...args: { data: MemberApplication }[]) => void;
  serverMemberApplicationUpdate: (...args: { userId: string; serverId: string; update: Partial<MemberApplication> }[]) => void;
  serverMemberApplicationRemove: (...args: { userId: string; serverId: string }[]) => void;
  // Channel
  channelAdd: (...args: { data: Channel }[]) => void;
  channelUpdate: (...args: { channelId: string; update: Partial<Channel> }[]) => void;
  channelRemove: (...args: { channelId: string }[]) => void;
  // Channel Member
  channelMemberUpdate: (...args: { userId: string; serverId: string; channelId: string; update: Partial<Member> }[]) => void;
  // Queue Member
  queueMembersSet: (...args: QueueUser[]) => void;
  // Member Invitation
  memberInvitationAdd: (...args: { data: MemberInvitation }[]) => void;
  memberInvitationUpdate: (...args: { serverId: string; update: Partial<MemberInvitation> }[]) => void;
  memberInvitationRemove: (...args: { serverId: string }[]) => void;
  // Message
  channelMessage: (...args: ChannelMessage[]) => void;
  actionMessage: (...args: PromptMessage[]) => void;
  directMessage: (...args: DirectMessage[]) => void;
  shakeWindow: (...args: DirectMessage[]) => void;
  chatHistory: (...args: ChatHistory[]) => void;
  // SFU
  SFUJoined: (...args: { channelId: string }[]) => void;
  SFULeft: () => void;
  SFUNewProducer: (...args: { userId: string; producerId: string; channelId: string }[]) => void;
  SFUProducerClosed: (...args: { userId: string; producerId: string }[]) => void;
  // Play Sound
  playSound: (...args: ('enterVoiceChannel' | 'leaveVoiceChannel' | 'receiveChannelMessage' | 'receiveDirectMessage' | 'startSpeaking' | 'stopSpeaking')[]) => void;
  // Popup
  openPopup: (...args: { type: PopupType; id: string; initialData?: unknown; force?: boolean }[]) => void;
  // Error
  error: (error: Error) => void;
};

export type StoreType = {
  accounts: Record<string, any>;
  language: LanguageKey;
  customThemes: Theme[];
  currentTheme: Theme | null;
  autoLogin: boolean;
  autoLaunch: boolean;
  alwaysOnTop: boolean;
  closeToTray: boolean;
  statusAutoIdle: boolean;
  statusAutoIdleMinutes: number;
  statusAutoDnd: boolean;
  channelUIMode: ChannelUIMode;
  font: string;
  fontSize: number;
  inputAudioDevice: string;
  outputAudioDevice: string;
  recordFormat: 'wav' | 'mp3';
  recordSavePath: string;
  mixEffect: boolean;
  mixEffectType: string;
  autoMixSetting: boolean;
  echoCancellation: boolean;
  noiseCancellation: boolean;
  microphoneAmplification: boolean;
  manualMixMode: boolean;
  mixMode: MixMode;
  speakingMode: SpeakingMode;
  defaultSpeakingKey: string;
  notSaveMessageHistory: boolean;
  hotKeyOpenMainWindow: string;
  hotKeyScreenshot: string;
  hotKeyIncreaseVolume: string;
  hotKeyDecreaseVolume: string;
  hotKeyToggleSpeaker: string;
  hotKeyToggleMicrophone: string;
  disableAllSoundEffect: boolean;
  enterVoiceChannelSound: boolean;
  leaveVoiceChannelSound: boolean;
  startSpeakingSound: boolean;
  stopSpeakingSound: boolean;
  receiveDirectMessageSound: boolean;
  receiveChannelMessageSound: boolean;
  dontShowDisclaimer: boolean;
  autoCheckForUpdates: boolean;
  updateCheckInterval: number;
  updateChannel: string;
  server: 'prod' | 'dev';
};

export type SFUCreateTransportParams = {
  direction: 'send' | 'recv';
  channelId: string;
};

export type SFUCreateTransportReturnType = {
  id: string;
  iceParameters: any;
  iceCandidates: any;
  dtlsParameters: any;
  routerRtpCapabilities: any;
  producers?: SFUCreateProducerReturnType[];
};

export type SFUConnectTransportParams = {
  transportId: string;
  dtlsParameters: any;
};

export type SFUCreateProducerParams = {
  kind: mediasoupClient.types.MediaKind;
  transportId: string;
  rtpParameters: any;
  channelId: string;
};

export type SFUCreateProducerReturnType = {
  id: string;
  userId: string;
  kind: mediasoupClient.types.MediaKind;
};

export type SFUCreateConsumerParams = {
  transportId: string;
  producerId: string;
  rtpCapabilities: any;
  channelId: string;
};

export type SFUCreateConsumerReturnType = {
  id: string;
  userId: string;
  producerId: string;
  kind: mediasoupClient.types.MediaKind;
  rtpParameters: any;
};

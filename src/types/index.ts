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
  table_notifications,
} from './database';
import type { PopupOpenRequest } from './popup';

export type Announcement = table_announcements;

export type Notification = table_notifications;

export type User = table_users & table_global_permissions & table_user_settings & { badges: string };

export type UserSetting = table_user_settings;

export type Badge = table_badges & table_user_badges;

export type Friend = table_friends & table_users & table_user_settings & { badges: string };

export type FriendActivity = table_users & table_user_activities;

export type FriendGroup = table_friend_groups;

export type FriendApplication = table_friend_applications & table_users;

export type Server = table_servers & table_user_servers & table_server_permissions & { contribution: number };

export type RecommendServer = table_servers & table_recommend_servers & { online: number };

export type Category = table_channels & table_channel_muted_users & table_channel_permissions & { type: 'category' };

export type Channel = table_channels & table_channel_muted_users & table_channel_permissions & { type: 'channel' };

export type ChannelEvent = OnlineMember & { type: 'join' | 'move' | 'leave'; prevChannelId: string | null; nextChannelId: string | null; timestamp: number };

export type OnlineMember = table_members & table_users & table_channel_muted_users & table_server_permissions & { badges: string };

export type QueueUser = { userId: string; position: number; leftTime: number; isQueueControlled: boolean };

export type QueueMember = QueueUser & OnlineMember;

export type Member = table_members & table_users & table_server_blocked_users & table_server_permissions;

export type MemberApplication = table_member_applications & table_users;

export type MemberInvitation = table_member_invitations & table_servers;

export type Message = {
  parameter: Record<string, string>;
  contentMetadata: Record<string, string>;
  content: string;
  type: 'general' | 'info' | 'warn' | 'event' | 'alert' | 'dm';
  timestamp: number;
};

export type ChannelMessage = Message & Member & { type: 'general' };

export type DirectMessage = Message & User & { type: 'dm'; user1Id: string; user2Id: string };

// A stored message from GET /direct-messages or /channel-messages; nickname is the sender's nickname in the channel's server.
export type HistoryMessage = { messageId: number; content: string; createdAt: number; sender: { userId: string; name: string; nickname: string | null; avatarUrl: string | null } };

// Page 1 holds the newest messages; total counts every message that matches the filter.
export type HistoryPage = { messages: HistoryMessage[]; total: number; page: number; pageSize: number };

export type PromptMessage = Message & { type: 'alert' | 'info' | 'warn' | 'event'; displaySeconds?: number };

export type SystemSettings = {
  isAutoLoginEnabled: boolean;
  isAutoLaunchEnabled: boolean;
  isAlwaysOnTop: boolean;
  isStatusAutoIdleEnabled: boolean;
  statusAutoIdleMinutes: number;
  isStatusAutoDndEnabled: boolean;
  channelUIMode: ChannelUIMode;
  closeToTray: boolean;
  fontSize: number;
  font: string;

  inputAudioDevice: string;
  outputAudioDevice: string;
  recordFormat: RecordFormat;
  recordSavePath: string;
  isMixEffectEnabled: boolean;
  mixEffectType: string;
  isAutoMixSettingEnabled: boolean;
  isEchoCancellationEnabled: boolean;
  isNoiseCancellationEnabled: boolean;
  isMicrophoneAmplificationEnabled: boolean;
  isManualMixMode: boolean;
  mixMode: MixMode;

  speakingMode: SpeakingMode;
  defaultSpeakingKey: string;

  disableMessageHistory: boolean;

  hotKeyOpenMainWindow: string;
  hotKeyScreenshot: string;
  hotKeyIncreaseVolume: string;
  hotKeyDecreaseVolume: string;
  hotKeyToggleSpeaker: string;
  hotKeyToggleMicrophone: string;

  disableAllSoundEffect: boolean;
  isEnterVoiceChannelSoundEnabled: boolean;
  isLeaveVoiceChannelSoundEnabled: boolean;
  isStartSpeakingSoundEnabled: boolean;
  isStopSpeakingSoundEnabled: boolean;
  isReceiveDirectMessageSoundEnabled: boolean;
  isReceiveChannelMessageSoundEnabled: boolean;

  isAutoCheckForUpdatesEnabled: boolean;
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

// What every context menu hook returns.
export type ContextMenuBuilder = { buildContextMenu: () => ContextMenuItem[] };

export type NotificationMenuItem = {
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
  code: string;
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

export type RTCStatus = 'disconnected' | 'connecting' | 'connected' | 'failed';

export type ChannelUIMode = 'classic' | 'three-line' | 'auto';

export type RecordFormat = 'wav' | 'mp3';

export type LanguageKey = 'zh-TW' | 'zh-CN' | 'en-US' | 'fa-IR' | 'pt-BR' | 'ru-RU' | 'es-ES' | 'tr-TR';

export type RegionKey = 'zh-TW' | 'zh-CN' | 'en-US';

export type Popup = {
  id: string;
  type: PopupType;
  size: { height: number; width: number };
  position: { top: number; left: number };
  title: string;
  hideHeader: boolean;
  buttons: ('close' | 'minimize' | 'maxsize')[];
  node: () => React.ReactNode | null;
};

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
  | 'inviteFriend'
  | 'inviteMember'
  | 'kickMemberFromChannel'
  | 'kickMemberFromServer'
  | 'memberApplicationSetting'
  | 'memberInvitation'
  | 'networkDiagnosis'
  | 'rtcDisconnect'
  | 'searchUser'
  | 'serverAnnouncement'
  | 'serverApplication'
  | 'serverBroadcast'
  | 'serverSetting'
  | 'systemSetting'
  | 'userInfo'
  | 'userSetting';

export type ACK<T> = { ok: true; data: T } | { ok: false; error: string };

export type ClientToServerEvents = {
  editUser: (...args: { update: Partial<table_users> }[]) => void;
  editUserSetting: (...args: { update: Partial<table_user_settings> }[]) => void;
  editFriend: (...args: { targetId: string; update: Partial<table_friends> }[]) => void;
  deleteFriend: (...args: { targetId: string }[]) => void;
  blockUser: (...args: { targetId: string }[]) => void;
  unblockUser: (...args: { targetId: string }[]) => void;
  stranger: (...args: { targetId: string }[]) => void;
  createFriendGroup: (...args: { preset: Partial<table_friend_groups> }[]) => void;
  editFriendGroup: (...args: { friendGroupId: string; update: Partial<table_friend_groups> }[]) => void;
  deleteFriendGroup: (...args: { friendGroupId: string }[]) => void;
  sendFriendApplication: (...args: { receiverId: string; preset: Partial<table_friend_applications>; friendGroupId: string | null }[]) => void;
  editFriendApplication: (...args: { receiverId: string; update: Partial<table_friend_applications> }[]) => void;
  deleteFriendApplication: (...args: { receiverId: string }[]) => void;
  approveFriendApplication: (...args: { senderId: string; friendGroupId: string | null; note: string }[]) => void;
  rejectFriendApplication: (...args: { senderId: string }[]) => void;
  favoriteServer: (...args: { serverId: string }[]) => void;
  connectServer: (...args: { serverId: string }[]) => void;
  disconnectServer: (...args: { serverId: string }[]) => void;
  blockUserFromServer: (...args: { userId: string; serverId: string; blockUntil?: number }[]) => void;
  unblockUserFromServer: (...args: { userId: string; serverId: string }[]) => void;
  createServer: (...args: { preset: Partial<table_servers> }[]) => void;
  editServer: (...args: { serverId: string; update: Partial<table_servers> }[]) => void;
  connectChannel: (...args: { serverId: string; channelId: string; password?: string }[]) => void;
  moveUserToChannel: (...args: { userId: string; serverId: string; channelId: string }[]) => void;
  blockUserFromChannel: (...args: { userId: string; serverId: string; channelId: string; blockUntil?: number }[]) => void;
  unblockUserFromChannel: (...args: { userId: string; serverId: string; channelId: string }[]) => void;
  createChannel: (...args: { serverId: string; preset: Partial<table_channels> }[]) => void;
  editChannel: (...args: { serverId: string; channelId: string; update: Partial<table_channels> }[]) => void;
  deleteChannel: (...args: { serverId: string; channelId: string }[]) => void;
  muteUserInChannel: (...args: { userId: string; serverId: string; channelId: string; mute: Partial<table_channel_muted_users> }[]) => void;
  editMember: (...args: { userId: string; serverId: string; update: Partial<table_members> }[]) => void;
  terminateMember: (...args: { userId: string; serverId: string }[]) => void;
  editServerPermission: (...args: { userId: string; serverId: string; update: Partial<table_server_permissions> }[]) => void;
  editChannelPermission: (...args: { userId: string; serverId: string; channelId: string; update: Partial<table_channel_permissions> }[]) => void;
  sendMemberApplication: (...args: { serverId: string; preset: Partial<table_member_applications> }[]) => void;
  editMemberApplication: (...args: { serverId: string; update: Partial<table_member_applications> }[]) => void;
  deleteMemberApplication: (...args: { serverId: string }[]) => void;
  approveMemberApplication: (...args: { userId: string; serverId: string }[]) => void;
  rejectMemberApplication: (...args: { userId: string; serverId: string }[]) => void;
  sendMemberInvitation: (...args: { receiverId: string; serverId: string; preset: Partial<table_member_invitations> }[]) => void;
  editMemberInvitation: (...args: { receiverId: string; serverId: string; update: Partial<table_member_invitations> }[]) => void;
  deleteMemberInvitation: (...args: { receiverId: string; serverId: string }[]) => void;
  acceptMemberInvitation: (...args: { serverId: string }[]) => void;
  rejectMemberInvitation: (...args: { serverId: string }[]) => void;
  joinQueue: (...args: { serverId: string; channelId: string; position?: number }[]) => void;
  addUserToQueue: (...args: { serverId: string; channelId: string; userId: string }[]) => void;
  leaveQueue: (...args: { serverId: string; channelId: string }[]) => void;
  removeUserFromQueue: (...args: { serverId: string; channelId: string; userId: string }[]) => void;
  clearQueue: (...args: { serverId: string; channelId: string }[]) => void;
  increaseUserQueueTime: (...args: { serverId: string; channelId: string; userId: string }[]) => void;
  moveUserQueuePosition: (...args: { serverId: string; channelId: string; userId: string; position: number }[]) => void;
  controlQueue: (...args: { serverId: string; channelId: string }[]) => void;
  channelMessage: (...args: { serverId: string; channelId: string; preset: Partial<ChannelMessage> }[]) => void;
  actionMessage: (...args: { serverId: string; channelId?: string; preset: Partial<PromptMessage> }[]) => void;
  directMessage: (...args: { targetId: string; preset: Partial<DirectMessage> }[]) => void;
  shakeWindow: (...args: { targetId: string }[]) => void;
};

export type ServerToClientEvents = {
  connect: () => void;
  connect_error: (e: unknown) => void;
  connect_timeout: () => void;
  reconnect: () => void;
  reconnect_attempt: (attemptNumbers: number) => void;
  reconnect_error: (e: unknown) => void;
  reconnect_failed: () => void;
  disconnect: () => void;
  heartbeat: (...args: { seq: number; latency: number }[]) => void;
  userUpdate: (...args: { update: Partial<User> }[]) => void;
  friendGroupAdd: (...args: { data: FriendGroup }[]) => void;
  friendGroupUpdate: (...args: { friendGroupId: string; update: Partial<FriendGroup> }[]) => void;
  friendGroupRemove: (...args: { friendGroupId: string }[]) => void;
  friendAdd: (...args: { data: Friend }[]) => void;
  friendUpdate: (...args: { targetId: string; update: Partial<Friend> }[]) => void;
  friendApplicationAdd: (...args: { data: FriendApplication }[]) => void;
  friendApplicationUpdate: (...args: { senderId: string; update: Partial<FriendApplication> }[]) => void;
  friendApplicationRemove: (...args: { senderId: string }[]) => void;
  serverAdd: (...args: { data: Server }[]) => void;
  serverUpdate: (...args: { serverId: string; update: Partial<Server> }[]) => void;
  serverMemberUpdate: (...args: { userId: string; serverId: string; update: Partial<Member> }[]) => void;
  serverOnlineMemberAdd: (...args: { data: OnlineMember }[]) => void;
  serverOnlineMemberUpdate: (...args: { userId: string; serverId: string; update: Partial<OnlineMember> }[]) => void;
  serverOnlineMemberRemove: (...args: { userId: string; serverId: string }[]) => void;
  serverMemberApplicationAdd: (...args: { data: MemberApplication }[]) => void;
  serverMemberApplicationUpdate: (...args: { userId: string; serverId: string; update: Partial<MemberApplication> }[]) => void;
  serverMemberApplicationRemove: (...args: { userId: string; serverId: string }[]) => void;
  channelAdd: (...args: { data: Channel }[]) => void;
  channelUpdate: (...args: { channelId: string; update: Partial<Channel> }[]) => void;
  channelRemove: (...args: { channelId: string }[]) => void;
  channelMemberUpdate: (...args: { userId: string; serverId: string; channelId: string; update: Partial<Member> }[]) => void;
  queueMembersSet: (...args: QueueUser[]) => void;
  memberInvitationAdd: (...args: { data: MemberInvitation }[]) => void;
  memberInvitationUpdate: (...args: { serverId: string; update: Partial<MemberInvitation> }[]) => void;
  memberInvitationRemove: (...args: { serverId: string }[]) => void;
  channelMessage: (...args: ChannelMessage[]) => void;
  actionMessage: (...args: PromptMessage[]) => void;
  directMessage: (...args: (DirectMessage & { event?: 'directMessage'; message?: DirectMessage; initialData?: unknown })[]) => void;
  shakeWindow: (...args: (DirectMessage & { event?: 'shakeWindow'; message?: DirectMessage; initialData?: unknown })[]) => void;
  sfuJoined: (...args: { channelId: string }[]) => void;
  sfuLeft: () => void;
  sfuProducerAdd: (...args: { userId: string; producerId: string; channelId: string }[]) => void;
  sfuProducerRemove: (...args: { userId: string; producerId: string }[]) => void;
  webrtcDisconnectCountUpdate: (count: number) => void;
  playSound: (...args: ('enterVoiceChannel' | 'leaveVoiceChannel' | 'receiveChannelMessage' | 'receiveDirectMessage' | 'startSpeaking' | 'stopSpeaking')[]) => void;
  openPopup: (...args: PopupOpenRequest[]) => void;
  error: (error: { code: number; message: string }) => void;
};

export type ClientToServerEventsWithAck = {
  showViewer: (payload: { channelId: string }) => {
    viewer: { userId: string; isHeartUsed: boolean; availableFlowers: number; nextRestoreAt: number | null; totalSentFlowers: number; maxFlowers: number };
  };
  showGift: (payload: { channelId: string; action: 'heart' | 'flower'; requestId: string }) => {
    isDuplicate: boolean;
    viewer: { userId: string; isHeartUsed: boolean; availableFlowers: number; nextRestoreAt: number | null; totalSentFlowers: number; maxFlowers: number };
  };
  sfuCreateTransport: (payload: SfuCreateTransportParams) => SfuCreateTransportReturnType;
  sfuConnectTransport: (payload: SfuConnectTransportParams) => void;
  sfuCreateProducer: (payload: SfuCreateProducerParams) => SfuCreateProducerReturnType;
  sfuCreateConsumer: (payload: SfuCreateConsumerParams) => SfuCreateConsumerReturnType;
};

export type StoreType = {
  accounts: Record<string, { isAutoLoginEnabled: boolean; rememberAccount: boolean; password: string }>;
  language: LanguageKey;
  customThemes: Theme[];
  currentTheme: Theme | null;
  isAutoLoginEnabled: boolean;
  isAutoLaunchEnabled: boolean;
  isAlwaysOnTop: boolean;
  closeToTray: boolean;
  isStatusAutoIdleEnabled: boolean;
  statusAutoIdleMinutes: number;
  isStatusAutoDndEnabled: boolean;
  channelUIMode: ChannelUIMode;
  font: string;
  fontSize: number;
  inputAudioDevice: string;
  outputAudioDevice: string;
  recordFormat: RecordFormat;
  recordSavePath: string;
  isMixEffectEnabled: boolean;
  mixEffectType: string;
  isAutoMixSettingEnabled: boolean;
  isEchoCancellationEnabled: boolean;
  isNoiseCancellationEnabled: boolean;
  isMicrophoneAmplificationEnabled: boolean;
  isManualMixMode: boolean;
  mixMode: MixMode;
  speakingMode: SpeakingMode;
  defaultSpeakingKey: string;
  disableMessageHistory: boolean;
  hotKeyOpenMainWindow: string;
  hotKeyScreenshot: string;
  hotKeyIncreaseVolume: string;
  hotKeyDecreaseVolume: string;
  hotKeyToggleSpeaker: string;
  hotKeyToggleMicrophone: string;
  disableAllSoundEffect: boolean;
  isEnterVoiceChannelSoundEnabled: boolean;
  isLeaveVoiceChannelSoundEnabled: boolean;
  isStartSpeakingSoundEnabled: boolean;
  isStopSpeakingSoundEnabled: boolean;
  isReceiveDirectMessageSoundEnabled: boolean;
  isReceiveChannelMessageSoundEnabled: boolean;
  isDisclaimerHidden: boolean;
  isAutoCheckForUpdatesEnabled: boolean;
  updateCheckInterval: number;
  updateChannel: string;
  env: 'prod' | 'dev';
  token: string;
};

export type SfuCreateTransportParams = {
  direction: 'send' | 'recv';
  channelId: string;
};

export type SfuCreateTransportReturnType = {
  id: string;
  iceParameters: mediasoupClient.types.IceParameters;
  iceCandidates: mediasoupClient.types.IceCandidate[];
  dtlsParameters: mediasoupClient.types.DtlsParameters;
  routerRtpCapabilities: mediasoupClient.types.RtpCapabilities;
  producers?: SfuCreateProducerReturnType[];
};

export type SfuConnectTransportParams = {
  transportId: string;
  dtlsParameters: mediasoupClient.types.DtlsParameters;
};

export type SfuCreateProducerParams = {
  kind: mediasoupClient.types.MediaKind;
  transportId: string;
  rtpParameters: mediasoupClient.types.RtpParameters;
  channelId: string;
};

export type SfuCreateProducerReturnType = {
  id: string;
  userId: string;
  kind: mediasoupClient.types.MediaKind;
};

export type SfuCreateConsumerParams = {
  transportId: string;
  producerId: string;
  rtpCapabilities: mediasoupClient.types.RtpCapabilities;
  channelId: string;
};

export type SfuCreateConsumerReturnType = {
  id: string;
  userId: string;
  producerId: string;
  kind: mediasoupClient.types.MediaKind;
  rtpParameters: mediasoupClient.types.RtpParameters;
};

export type Staff = {
  title: string;
  contact: string;
  github: string;
  discord: string;
  ricecall: string;
  email: string;
};

export type MtrHop = {
  hop: number;
  host: string;
  ip: string;
  loss: number;
  avg: number;
  best: number;
  worst: number;
  stdev: number;
};

export type DiagnosisResult = {
  domain: string;
  dns: { resolved: boolean; addresses: string[]; error: string | null };
  mtr: { executed: boolean; hops: MtrHop[]; error: string | null };
};

export type ProgressData = {
  step?: string;
  cycle?: number;
  totalCycles?: number;
  hops?: MtrHop[];
  domain?: string;
};

export type FullReport = {
  timestamp: string;
  localNetwork: unknown;
  diagnosis: DiagnosisResult[];
};

export type ReportError = {
  error: string;
};

export type StepStatus = 'pending' | 'active' | 'completed' | 'failed';

export type Stage = {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: StepStatus;
};

export type SfuDiagnosisInfo = {
  ip?: string;
  port?: number;
};

export type StoreStateSnapshot = {
  user: User;
  friends: Friend[];
  friendActivities: FriendActivity[];
  friendGroups: FriendGroup[];
  friendApplications: FriendApplication[];
  memberInvitations: MemberInvitation[];
  servers: Server[];
  currentServer: Server;
  channels: (Channel | Category)[];
  channelEvents: ChannelEvent[];
  onlineMembers: OnlineMember[];
  memberApplications: MemberApplication[];
  currentChannel: Channel;
  announcements: Announcement[];
  notifications: Notification[];
  recommendServers: RecommendServer[];
};

export * from './database';
export * from './popup';

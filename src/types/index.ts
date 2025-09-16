/* eslint-disable @typescript-eslint/no-explicit-any */
import * as mediasoupClient from 'mediasoup-client';

import {
  table_badges,
  table_channels,
  table_friend_groups,
  table_friends,
  table_friend_applications,
  table_servers,
  table_members,
  table_member_applications,
  table_member_invitations,
  table_users,
  table_user_servers,
  table_user_badges,
  table_server_permissions,
  table_channel_permissions,
  table_channel_muted_users,
  table_server_blocked_users,
  table_announcements,
} from '@/types/database';

export type Announcement = table_announcements;

export type Permission = {
  permissionLevel: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
};

export type BadgeList = {
  badges: string;
};

export type User = table_users & Permission & BadgeList;

export type Badge = table_badges & table_user_badges;

export type Friend = table_friends & table_users & BadgeList;

export type FriendGroup = table_friend_groups;

export type FriendApplication = table_friend_applications & table_users;

export type Server = table_servers & table_user_servers & table_members & Permission;

export type RecommendServerList = {
  [category: string]: RecommendServer[];
};

export type RecommendServer = table_servers & {
  online: number;
};

export type Category = table_channels &
  table_channel_muted_users &
  Permission & {
    type: 'category';
  };

export type Channel = table_channels &
  table_channel_muted_users &
  Permission & {
    type: 'channel';
  };

export type OnlineMember = table_members & table_users & table_channel_muted_users & Permission & BadgeList;

export type QueueUser = {
  userId: string;
  position: number;
  leftTime: number;
  isQueueControlled: boolean;
};

export type Member = table_members & table_users & table_server_blocked_users & Permission;

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

export type DirectMessage = Message &
  User & {
    type: 'dm';
    user1Id: string;
    user2Id: string;
  };

export type PromptMessage = (DirectMessage | ChannelMessage | Message) & {
  type: 'alert' | 'info' | 'warn' | 'event';
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

export type PopupType =
  | 'aboutus'
  | 'applyFriend'
  | 'applyMember'
  | 'approveFriend'
  | 'blockMember'
  | 'changeTheme'
  | 'channelPassword'
  | 'channelSetting'
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
  | 'memberApplicationSetting'
  | 'memberInvitation'
  | 'searchUser'
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
  // Echo
  ping: () => void;
};

export type ServerToClientEvents = {
  // Socket
  connect: () => void;
  disconnect: () => void;
  reconnect: (attemptNumbers: number) => void;
  error: (message: string) => void;
  connect_error: (error: any) => void;
  reconnect_error: (error: any) => void;
  // Notification
  notification: (...args: { message: string }[]) => void; // not used yet
  // User
  userSearch: (...args: User[]) => void;
  userUpdate: (...args: { update: Partial<User> }[]) => void;
  // Friend Group
  friendGroupsSet: (...args: FriendGroup[]) => void;
  friendGroupAdd: (...args: { data: FriendGroup }[]) => void;
  friendGroupUpdate: (...args: { friendGroupId: string; update: Partial<FriendGroup> }[]) => void;
  friendGroupRemove: (...args: { friendGroupId: string }[]) => void;
  // Friend
  friendsSet: (...args: Friend[]) => void;
  friendAdd: (...args: { data: Friend }[]) => void;
  friendUpdate: (...args: { targetId: string; update: Partial<Friend> }[]) => void;
  friendRemove: (...args: { targetId: string }[]) => void;
  // Friend Application
  friendApplicationsSet: (...args: FriendApplication[]) => void;
  friendApplicationAdd: (...args: { data: FriendApplication }[]) => void;
  friendApplicationUpdate: (...args: { senderId: string; update: Partial<FriendApplication> }[]) => void;
  friendApplicationRemove: (...args: { senderId: string }[]) => void;
  // Server
  serverSearch: (...args: Server[]) => void;
  serversSet: (...args: Server[]) => void;
  serverAdd: (...args: { data: Server }[]) => void;
  serverUpdate: (...args: { serverId: string; update: Partial<Server> }[]) => void;
  serverRemove: (...args: { serverId: string }[]) => void;
  // Server Member
  serverMembersSet: (...args: Member[]) => void;
  serverMemberAdd: (...args: { data: Member }[]) => void;
  serverMemberUpdate: (...args: { userId: string; serverId: string; update: Partial<Member> }[]) => void;
  serverMemberRemove: (...args: { userId: string; serverId: string }[]) => void;
  // Server Online Member
  serverOnlineMembersSet: (...args: OnlineMember[]) => void;
  serverOnlineMemberAdd: (...args: { data: OnlineMember }[]) => void;
  serverOnlineMemberUpdate: (...args: { userId: string; serverId: string; update: Partial<OnlineMember> }[]) => void;
  serverOnlineMemberRemove: (...args: { userId: string; serverId: string }[]) => void;
  // Member Application
  serverMemberApplicationsSet: (...args: MemberApplication[]) => void;
  serverMemberApplicationAdd: (...args: { data: MemberApplication }[]) => void;
  serverMemberApplicationUpdate: (...args: { userId: string; serverId: string; update: Partial<MemberApplication> }[]) => void;
  serverMemberApplicationRemove: (...args: { userId: string; serverId: string }[]) => void;
  // Channel
  channelsSet: (...args: Channel[]) => void;
  channelAdd: (...args: { data: Channel }[]) => void;
  channelUpdate: (...args: { channelId: string; update: Partial<Channel> }[]) => void;
  channelRemove: (...args: { channelId: string }[]) => void;
  // Channel Member
  channelMemberAdd: (...args: { data: Member }[]) => void;
  channelMemberUpdate: (...args: { userId: string; serverId: string; update: Partial<Member> }[]) => void;
  channelMemberRemove: (...args: { userId: string; serverId: string }[]) => void;
  // Queue Member
  queueMembersSet: (...args: QueueUser[]) => void;
  // Member Invitation
  memberInvitationsSet: (...args: MemberInvitation[]) => void;
  memberInvitationAdd: (...args: { data: MemberInvitation }[]) => void;
  memberInvitationUpdate: (...args: { serverId: string; update: Partial<MemberInvitation> }[]) => void;
  memberInvitationRemove: (...args: { serverId: string }[]) => void;
  // Message
  channelMessage: (...args: ChannelMessage[]) => void;
  actionMessage: (...args: PromptMessage[]) => void;
  directMessage: (...args: DirectMessage[]) => void;
  shakeWindow: (...args: DirectMessage[]) => void;
  // SFU
  SFUJoined: (...args: { channelId: string }[]) => void;
  SFULeft: () => void;
  SFUNewProducer: (...args: { userId: string; producerId: string; channelId: string }[]) => void;
  SFUProducerClosed: (...args: { userId: string; producerId: string }[]) => void;
  // Play Sound
  playSound: (...args: ('enterVoiceChannel' | 'leaveVoiceChannel' | 'receiveChannelMessage' | 'receiveDirectMessage' | 'startSpeaking' | 'stopSpeaking')[]) => void;
  // Popup
  openPopup: (...args: { type: PopupType; id: string; initialData?: unknown; force?: boolean }[]) => void;
  // Echo
  pong: () => void;
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

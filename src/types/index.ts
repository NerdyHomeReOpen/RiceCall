/* eslint-disable @typescript-eslint/no-explicit-any */
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
  table_user_server,
  table_user_badges,
} from '@/types/database';

export type Permission = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type User = table_users & {
  badges: Badge[];
};

export type Badge = table_badges & table_user_badges;

export type FriendGroup = table_friend_groups;

export type Friend = table_friends & User;

export type FriendApplication = table_friend_applications & User;

export type RecommendServerList = {
  [category: string]: RecommendServer[];
};

export type Server = table_members & table_servers & table_user_server;

export type RecommendServer = table_servers & {
  online: number;
};

export type Category = table_channels & {
  type: 'category';
};

export type Channel = table_channels & {
  type: 'channel';
};

export type Member = table_members & User;

export type MemberApplication = table_member_applications & User;

export type MemberInvitation = table_member_invitations & User;

export type Message = {
  parameter: Record<string, string>;
  contentMetadata: Record<string, string>;
  content: string;
  type: 'general' | 'info' | 'warn' | 'event' | 'alert' | 'dm';
  timestamp: number;
};

export type ChannelMessage = Message &
  Member & {
    type: 'general';
  };

export type DirectMessage = Message &
  Friend & {
    type: 'dm';
    user1Id: string;
    user2Id: string;
  };

export type PromptMessage = Message & {
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
  | 'avatarCropper'
  | 'userInfo'
  | 'userSetting'
  | 'channelSetting'
  | 'channelPassword'
  | 'serverSetting'
  | 'serverBroadcast'
  | 'blockMember'
  | 'systemSetting'
  | 'memberApplySetting'
  | 'createServer'
  | 'createChannel'
  | 'createFriendGroup'
  | 'editChannelOrder'
  | 'editChannelName'
  | 'editNickname'
  | 'editFriendGroup'
  | 'editFriend'
  | 'applyMember'
  | 'applyFriend'
  | 'searchUser'
  | 'directMessage'
  | 'dialogAlert'
  | 'dialogAlert2'
  | 'dialogSuccess'
  | 'dialogWarning'
  | 'dialogError'
  | 'dialogInfo'
  | 'changeTheme'
  | 'aboutus'
  | 'friendVerification';

export type ClientToServerEvents = {
  // User
  searchUser: (...args: { query: string }[]) => void;
  editUser: (...args: { update: Partial<table_users> }[]) => void;
  // Friend Group
  createFriendGroup: (...args: { preset: Partial<table_friend_groups> }[]) => void;
  editFriendGroup: (...args: { friendGroupId: string; update: Partial<table_friend_groups> }[]) => void;
  deleteFriendGroup: (...args: { friendGroupId: string }[]) => void;
  // Friend
  editFriend: (...args: { targetId: string; update: Partial<table_friends> }[]) => void;
  deleteFriend: (...args: { targetId: string }[]) => void;
  // Friend Application
  sendFriendApplication: (...args: { receiverId: string; preset: Partial<table_friend_applications> }[]) => void;
  editFriendApplication: (...args: { receiverId: string; update: Partial<table_friend_applications> }[]) => void;
  deleteFriendApplication: (...args: { receiverId: string }[]) => void;
  approveFriendApplication: (...args: { senderId: string }[]) => void;
  rejectFriendApplication: (...args: { senderId: string }[]) => void;
  // Server
  favoriteServer: (...args: { serverId: string }[]) => void;
  searchServer: (...args: { query: string }[]) => void;
  connectServer: (...args: { serverId: string }[]) => void;
  disconnectServer: (...args: { serverId: string }[]) => void;
  kickFromServer: (...args: { userId: string; serverId: string }[]) => void;
  createServer: (...args: { preset: Partial<table_servers> }[]) => void;
  editServer: (...args: { serverId: string; update: Partial<table_servers> }[]) => void;
  deleteServer: (...args: { serverId: string }[]) => void;
  // Channel
  connectChannel: (...args: { serverId: string; channelId: string; password?: string }[]) => void;
  moveToChannel: (...args: { userId: string; serverId: string; channelId: string }[]) => void;
  disconnectChannel: (...args: { serverId: string; channelId: string }[]) => void;
  kickFromChannel: (...args: { userId: string; serverId: string; channelId: string }[]) => void;
  kickToLobbyChannel: (...args: { userId: string; serverId: string; channelId: string }[]) => void;
  createChannel: (...args: { serverId: string; preset: Partial<table_channels> }[]) => void;
  editChannel: (...args: { serverId: string; channelId: string; update: Partial<table_channels> }[]) => void;
  deleteChannel: (...args: { serverId: string; channelId: string }[]) => void;
  // Member
  editMember: (...args: { userId: string; serverId: string; update: Partial<table_members> }[]) => void;
  deleteMember: (...args: { userId: string; serverId: string }[]) => void;
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
  // Message
  channelMessage: (...args: { serverId: string; channelId: string; preset: Partial<ChannelMessage> }[]) => void;
  actionMessage: (...args: { serverId: string; channelId?: string; preset: Partial<PromptMessage> }[]) => void;
  directMessage: (...args: { targetId: string; preset: Partial<DirectMessage> }[]) => void;
  shakeWindow: (...args: { targetId: string }[]) => void;
  // RTC
  RTCOffer: (...args: { to: string; offer: { type: RTCSdpType; sdp?: string } }[]) => void;
  RTCAnswer: (...args: { to: string; answer: { type: RTCSdpType; sdp?: string } }[]) => void;
  RTCIceCandidate: (...args: { to: string; candidate: { candidate: string; sdpMid: string | null; sdpMLineIndex: number | null; usernameFragment: string | null } }[]) => void;
  // Echo
  ping: () => void;
  // Popup
  openPopup: (...args: { type: PopupType; id: string; initialData?: unknown; force?: boolean }[]) => void;
};

export type ServerToClientEvents = {
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
  // Channel
  serverChannelsSet: (...args: Channel[]) => void;
  serverChannelAdd: (...args: { data: Channel }[]) => void;
  serverChannelUpdate: (...args: { channelId: string; update: Partial<Channel> }[]) => void;
  serverChannelRemove: (...args: { channelId: string }[]) => void;
  // Member
  serverMembersSet: (...args: Member[]) => void;
  serverMemberAdd: (...args: { data: Member }[]) => void;
  serverMemberUpdate: (...args: { userId: string; serverId: string; update: Partial<Member> }[]) => void;
  serverMemberRemove: (...args: { userId: string; serverId: string }[]) => void;
  serverOnlineMembersSet: (...args: Member[]) => void;
  serverOnlineMemberAdd: (...args: { data: Member }[]) => void;
  serverOnlineMemberRemove: (...args: { userId: string; serverId: string }[]) => void;
  // Member Application
  serverMemberApplicationsSet: (...args: MemberApplication[]) => void;
  serverMemberApplicationAdd: (...args: { data: MemberApplication }[]) => void;
  serverMemberApplicationUpdate: (...args: { userId: string; serverId: string; update: Partial<MemberApplication> }[]) => void;
  serverMemberApplicationRemove: (...args: { userId: string; serverId: string }[]) => void;
  // Message
  channelMessage: (...args: ChannelMessage[]) => void;
  actionMessage: (...args: PromptMessage[]) => void;
  directMessage: (...args: DirectMessage[]) => void;
  shakeWindow: (senderId: string) => void;
  // RTC
  RTCOffer: (...args: { from: string; userId: string; offer: { type: RTCSdpType; sdp: string } }[]) => void;
  RTCAnswer: (...args: { from: string; userId: string; answer: { type: RTCSdpType; sdp: string } }[]) => void;
  RTCIceCandidate: (...args: { from: string; userId: string; candidate: { candidate: string; sdpMid: string | null; sdpMLineIndex: number | null; usernameFragment: string | null } }[]) => void;
  RTCJoin: (...args: { from: string; userId: string }[]) => void;
  RTCLeave: (...args: { from: string; userId: string }[]) => void;
  // Play Sound
  playSound: (...args: { sound: 'enterVoiceChannel' | 'leaveVoiceChannel' | 'receiveChannelMessage' | 'receiveDirectMessage' | 'startSpeaking' | 'stopSpeaking' }[]) => void;
  // Echo
  pong: () => void;
  // Popup
  openPopup: (...args: { type: PopupType; id: string; initialData?: unknown; force?: boolean }[]) => void;
  // Socket
  connect: () => void;
  disconnect: () => void;
  reconnect: (attemptNumbers: number) => void;
  error: (message: string) => void;
  connect_error: (error: any) => void;
  reconnect_error: (error: any) => void;
};

export type Data = {
  from: string;
  userId: string;
};

export type Offer = {
  from: string;
  userId: string;
  offer: {
    type: RTCSdpType;
    sdp: string;
  };
};

export type Answer = {
  from: string;
  userId: string;
  answer: {
    type: RTCSdpType;
    sdp: string;
  };
};

export type IceCandidate = {
  from: string;
  userId: string;
  candidate: {
    candidate: string;
    sdpMid: string | null;
    sdpMLineIndex: number | null;
    usernameFragment: string | null;
  };
};

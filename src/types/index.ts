/* eslint-disable @typescript-eslint/no-explicit-any */

export type Permission = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

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
  // online: number;
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
  createdAt: number;
};

export type MemberApplication = User & {
  // Change name to ServerMemberApplication and separate
  userId: string;
  serverId: string;
  description: string;
  createdAt: number;
};

export type MemberInvitation = Server & {
  senderId: string;
  receiverId: string;
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

export type SpeakingMode = 'key' | 'auto';

export type MixMode = 'all' | 'app';

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
  editUser: (...args: { update: Partial<User> }[]) => void;
  // Friend Group
  createFriendGroup: (...args: { preset: Partial<FriendGroup> }[]) => void;
  editFriendGroup: (...args: { friendGroupId: string; update: Partial<FriendGroup> }[]) => void;
  deleteFriendGroup: (...args: { friendGroupId: string }[]) => void;
  // Friend
  editFriend: (...args: { targetId: string; update: Partial<Friend> }[]) => void;
  deleteFriend: (...args: { targetId: string }[]) => void;
  // Friend Application
  sendFriendApplication: (...args: { receiverId: string; preset: Partial<FriendApplication> }[]) => void;
  editFriendApplication: (...args: { receiverId: string; update: Partial<FriendApplication> }[]) => void;
  deleteFriendApplication: (...args: { receiverId: string }[]) => void;
  approveFriendApplication: (...args: { senderId: string }[]) => void;
  rejectFriendApplication: (...args: { senderId: string }[]) => void;
  // Server
  favoriteServer: (...args: { serverId: string }[]) => void;
  searchServer: (...args: { query: string }[]) => void;
  connectServer: (...args: { serverId: string }[]) => void;
  disconnectServer: (...args: { serverId: string }[]) => void;
  kickFromServer: (...args: { userId: string; serverId: string }[]) => void;
  createServer: (...args: { preset: Partial<Server> }[]) => void;
  editServer: (...args: { serverId: string; update: Partial<Server> }[]) => void;
  deleteServer: (...args: { serverId: string }[]) => void;
  // Channel
  connectChannel: (...args: { serverId: string; channelId: string; password?: string }[]) => void;
  moveToChannel: (...args: { userId: string; serverId: string; channelId: string }[]) => void;
  disconnectChannel: (...args: { serverId: string; channelId: string }[]) => void;
  kickFromChannel: (...args: { userId: string; serverId: string; channelId: string }[]) => void;
  kickToLobbyChannel: (...args: { userId: string; serverId: string; channelId: string }[]) => void;
  createChannel: (...args: { serverId: string; preset: Partial<Channel> }[]) => void;
  editChannel: (...args: { serverId: string; channelId: string; update: Partial<Channel> }[]) => void;
  deleteChannel: (...args: { serverId: string; channelId: string }[]) => void;
  // Member
  editMember: (...args: { userId: string; serverId: string; update: Partial<Member> }[]) => void;
  deleteMember: (...args: { userId: string; serverId: string }[]) => void;
  // Member Application
  sendMemberApplication: (...args: { serverId: string; preset: Partial<MemberApplication> }[]) => void;
  editMemberApplication: (...args: { serverId: string; update: Partial<MemberApplication> }[]) => void;
  deleteMemberApplication: (...args: { serverId: string }[]) => void;
  approveMemberApplication: (...args: { userId: string; serverId: string }[]) => void;
  rejectMemberApplication: (...args: { userId: string; serverId: string }[]) => void;
  // Member Invitation
  sendMemberInvitation: (...args: { receiverId: string; serverId: string; preset: Partial<MemberInvitation> }[]) => void;
  editMemberInvitation: (...args: { receiverId: string; serverId: string; update: Partial<MemberInvitation> }[]) => void;
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
  friendsSet: (...args: UserFriend[]) => void;
  friendAdd: (...args: { data: UserFriend }[]) => void;
  friendUpdate: (...args: { targetId: string; update: Partial<Friend> }[]) => void;
  friendRemove: (...args: { targetId: string }[]) => void;
  // Friend Application
  friendApplicationsSet: (...args: FriendApplication[]) => void;
  friendApplicationAdd: (...args: { data: FriendApplication }[]) => void;
  friendApplicationUpdate: (...args: { senderId: string; update: Partial<FriendApplication> }[]) => void;
  friendApplicationRemove: (...args: { senderId: string }[]) => void;
  // Server
  serverSearch: (...args: UserServer[]) => void;
  serversSet: (...args: UserServer[]) => void;
  serverAdd: (...args: { data: UserServer }[]) => void;
  serverUpdate: (...args: { serverId: string; update: Partial<Server> }[]) => void;
  serverRemove: (...args: { serverId: string }[]) => void;
  // Channel
  serverChannelsSet: (...args: Channel[]) => void;
  serverChannelAdd: (...args: { data: Channel }[]) => void;
  serverChannelUpdate: (...args: { channelId: string; update: Partial<Channel> }[]) => void;
  serverChannelRemove: (...args: { channelId: string }[]) => void;
  // Member
  serverMembersSet: (...args: ServerMember[]) => void;
  serverMemberAdd: (...args: { data: ServerMember }[]) => void;
  serverMemberUpdate: (...args: { userId: string; serverId: string; update: Partial<ServerMember> }[]) => void;
  serverMemberRemove: (...args: { userId: string; serverId: string }[]) => void;
  serverOnlineMembersSet: (...args: ServerMember[]) => void;
  serverOnlineMemberAdd: (...args: { data: ServerMember }[]) => void;
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

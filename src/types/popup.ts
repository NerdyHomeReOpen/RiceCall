import type { Channel, DirectMessage, Friend, FriendApplication, FriendGroup, Member, MemberApplication, MemberInvitation, PopupType, Server, SystemSettings, User, UserSetting } from '@/types';

// Popups that take no data besides their id.
type NoData = Record<never, never>;

type DialogData = { message?: string; parameter?: Record<string, string>; error?: Error };

// What each popup component receives, besides its id.
export type PopupInitialData = {
  aboutus: NoData;
  applyFriend: { receiver: User; friendApplication: FriendApplication | null };
  applyMember: { server: Server; memberApplication: MemberApplication | null };
  approveFriend: { senderId: User['userId'] };
  blockMember: { serverId: Server['serverId']; member: Member };
  channelEvent: NoData;
  changeTheme: NoData;
  channelPassword: NoData;
  channelSetting: { server: Server; channel: Channel; channelMembers: Member[] };
  chatHistory: { targetId?: User['userId'] };
  createChannel: { serverId: Server['serverId']; parent: Channel | null };
  createFriendGroup: NoData;
  createServer: NoData;
  dialogAlert: DialogData;
  dialogAlert2: DialogData;
  dialogError: DialogData;
  dialogInfo: DialogData;
  dialogSuccess: DialogData;
  dialogWarning: DialogData;
  directMessage: { target: User; event?: 'directMessage' | 'shakeWindow'; message?: DirectMessage };
  editChannelName: { serverId: Server['serverId']; channel: Channel };
  editChannelOrder: { serverId: Server['serverId'] };
  editFriendNote: { friend: Friend };
  editFriendGroupName: { friendGroup: FriendGroup };
  editNickname: { serverId: Server['serverId']; member: Member };
  friendVerification: NoData;
  imageCropper: { imageUnit8Array: Uint8Array };
  inviteFriend: { server: Server };
  inviteMember: { serverId: Server['serverId']; receiverMember: Member; memberInvitation: MemberInvitation | null };
  kickMemberFromChannel: { serverId: Server['serverId']; channel: Channel; member: Member };
  kickMemberFromServer: { serverId: Server['serverId']; member: Member };
  memberApplicationSetting: { server: Server };
  memberInvitation: NoData;
  networkDiagnosis: NoData;
  rtcDisconnect: { count?: number };
  searchUser: NoData;
  serverAnnouncement: { serverAnnouncement: Server['announcement'] };
  serverApplication: { server: Server };
  serverBroadcast: { serverId: Server['serverId']; channelId: Channel['channelId'] };
  serverSetting: { server: Server; serverMembers: Member[]; memberApplications: MemberApplication[] };
  systemSetting: { userSettings: UserSetting; systemSettings: SystemSettings };
  userInfo: { target: User; targetServers: Server[] };
  userSetting: { target: User; targetServers: Server[] };
};

// What callers pass to open a popup whose data is fetched before it opens (see main/popup/initial-data-loader.ts).
export type PopupRequestData = {
  applyFriend: { senderId: User['userId']; receiverId: User['userId'] };
  applyMember: { userId: User['userId']; serverId: Server['serverId'] };
  blockMember: { userId: User['userId']; serverId: Server['serverId'] };
  channelSetting: { userId: User['userId']; serverId: Server['serverId']; channelId: Channel['channelId'] };
  createChannel: { userId: User['userId']; serverId: Server['serverId']; channelId?: Channel['channelId'] };
  directMessage: { targetId: User['userId']; event?: 'directMessage' | 'shakeWindow'; message?: DirectMessage };
  editChannelOrder: { userId: User['userId']; serverId: Server['serverId'] };
  editChannelName: { userId: User['userId']; serverId: Server['serverId']; channelId: Channel['channelId'] };
  editFriendNote: { userId: User['userId']; targetId: User['userId'] };
  editFriendGroupName: { userId: User['userId']; friendGroupId: FriendGroup['friendGroupId'] };
  editNickname: { userId: User['userId']; serverId: Server['serverId'] };
  inviteFriend: { userId: User['userId']; serverId: Server['serverId'] };
  inviteMember: { receiverId: User['userId']; serverId: Server['serverId'] };
  kickMemberFromServer: { userId: User['userId']; serverId: Server['serverId'] };
  kickMemberFromChannel: { userId: User['userId']; serverId: Server['serverId']; channelId: Channel['channelId'] };
  memberApplicationSetting: { userId: User['userId']; serverId: Server['serverId'] };
  serverApplication: { userId: User['userId']; serverId: Server['serverId'] };
  serverSetting: { userId: User['userId']; serverId: Server['serverId'] };
  systemSetting: { userId: User['userId'] };
  userInfo: { targetId: User['userId'] };
};

export type PopupOpenData<T extends PopupType> = T extends keyof PopupRequestData ? PopupRequestData[T] : PopupInitialData[T];

// A loader returns the props its request does not already carry; systemSettings is added by the opener.
export type PopupLoaders = {
  [T in keyof PopupRequestData]?: (data: PopupRequestData[T]) => Promise<Omit<PopupInitialData[T], keyof PopupRequestData[T] | 'systemSettings'>>;
};

// Popups that need no data can be opened without passing any.
export type PopupOpenArgs<T extends PopupType> = Record<string, never> extends PopupOpenData<T> ? [initialData?: PopupOpenData<T>, force?: boolean] : [initialData: PopupOpenData<T>, force?: boolean];

export type PopupOpenRequest = { [T in PopupType]: { type: T; id: string; initialData: PopupOpenData<T>; force?: boolean } }[PopupType];

export type PopupProps<T extends PopupType> = { id: string } & PopupInitialData[T];

export type PopupData = { [T in PopupType]: { type: T; data: PopupInitialData[T] } }[PopupType];

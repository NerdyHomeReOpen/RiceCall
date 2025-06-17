import {
  User,
  Channel,
  Server,
  FriendApplication,
  MemberApplication,
  ServerMember,
  Permission,
  UserServer,
  Member,
  Friend,
  UserFriend,
  FriendGroup,
  UserServerStatus,
} from '@/types';

const Default = {
  user: (overrides: Partial<User> = {}): User => ({
    userId: '',
    name: '',
    avatar: `${Date.now()}`,
    avatarUrl: `${process.env.NEXT_PUBLIC_SERVER_URL}/images/userAvatars/`,
    signature: '',
    status: 'online',
    gender: 'Male',
    birthYear: new Date().getFullYear() - 20,
    birthMonth: 1,
    birthDay: 1,
    country: 'taiwan',
    level: 0,
    vip: 0,
    vxp: 0,
    xp: 0,
    requiredXp: 0,
    currentChannelId: '',
    currentServerId: '',
    lastActiveAt: 0,
    createdAt: 0,
    badges: [],
    ...overrides,
  }),

  channel: (overrides: Partial<Channel> = {}): Channel => ({
    channelId: '',
    name: '',
    announcement: '',
    type: 'channel',
    visibility: 'public',
    password: '',
    voiceMode: 'free',
    isLobby: false,
    forbidText: false,
    forbidGuestText: false,
    forbidGuestUrl: false,
    guestTextMaxLength: 2000,
    guestTextWaitTime: 0,
    guestTextGapTime: 0,
    bitrate: 64000,
    userLimit: 0,
    order: 0,
    serverId: '',
    categoryId: '',
    createdAt: 0,
    ...overrides,
  }),

  server: (overrides: Partial<Server> = {}): Server => ({
    serverId: '',
    name: '',
    avatar: `${Date.now()}`,
    avatarUrl: `${process.env.NEXT_PUBLIC_SERVER_URL}/images/serverAvatars/`,
    announcement: '',
    applyNotice: '',
    description: '',
    slogan: '',
    type: 'other',
    visibility: 'public',
    receiveApply: true,
    level: 0,
    wealth: 0,
    displayId: '',
    lobbyId: '',
    receptionLobbyId: '',
    ownerId: '',
    createdAt: 0,
    ...overrides,
  }),

  friend: (overrides: Partial<Friend> = {}): Friend => ({
    userId: '',
    targetId: '',
    isBlocked: false,
    friendGroupId: '',
    createdAt: 0,
    ...overrides,
  }),

  friendGroup: (overrides: Partial<FriendGroup> = {}): FriendGroup => ({
    friendGroupId: '',
    userId: '',
    name: '',
    order: 0,
    createdAt: 0,
    ...overrides,
  }),

  userFriend: (overrides: Partial<UserFriend> = {}): UserFriend => ({
    ...Default.friend(),
    ...Default.user(),
    ...overrides,
  }),

  member: (overrides: Partial<Member> = {}): Member => ({
    userId: '',
    serverId: '',
    isBlocked: 0,
    nickname: null,
    contribution: 0,
    lastMessageTime: 0,
    lastJoinChannelTime: 0,
    permissionLevel: Permission.Guest,
    createdAt: 0,
    ...overrides,
  }),

  userServerStatus: (
    overrides: Partial<UserServerStatus> = {},
  ): UserServerStatus => ({
    recent: false,
    owned: false,
    favorite: false,
    timestamp: 0,
    ...overrides,
  }),

  userServer: (overrides: Partial<UserServer> = {}): UserServer => ({
    ...Default.server(),
    ...Default.member(),
    ...Default.userServerStatus(),
    ...overrides,
  }),

  serverMember: (overrides: Partial<ServerMember> = {}): ServerMember => ({
    ...Default.user(),
    ...Default.member(),
    ...overrides,
  }),

  friendApplication: (
    overrides: Partial<FriendApplication> = {},
  ): FriendApplication => ({
    senderId: '',
    receiverId: '',
    description: '',
    ...Default.user(),
    ...overrides,
  }),

  memberApplication: (
    overrides: Partial<MemberApplication> = {},
  ): MemberApplication => ({
    serverId: '',
    description: '',
    ...Default.user(),
    ...overrides,
  }),
};

export default Default;

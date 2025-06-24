// Services
import apiService from '@/services/api.service';

// Types
import {
  User,
  Server,
  Channel,
  FriendApplication,
  Friend,
  MemberApplication,
  Member,
  DirectMessage,
  UserFriend,
  FriendGroup,
  ServerMember,
  UserServer,
} from '@/types';

export const getService = {
  user: async ({ userId }: { userId: User['userId'] }): Promise<User | null> => {
    const user = await apiService.post('/user', { userId });
    return user;
  },

  userFriends: async ({ userId }: { userId: User['userId'] }): Promise<UserFriend[] | null> => {
    const userFriends = await apiService.post('/userFriends', {
      userId,
    });
    return userFriends;
  },

  userFriendGroups: async ({ userId }: { userId: User['userId'] }): Promise<FriendGroup[] | null> => {
    const userFriendGroups = await apiService.post('/userFriendGroups', {
      userId,
    });
    return userFriendGroups;
  },

  userFriendApplications: async ({ userId }: { userId: User['userId'] }): Promise<FriendApplication[] | null> => {
    const userFriendApplications = await apiService.post('/userFriendApplications', { userId });
    return userFriendApplications;
  },

  userServers: async ({ userId }: { userId: User['userId'] }): Promise<UserServer[] | null> => {
    const userServers = await apiService.post('/userServers', {
      userId,
    });
    return userServers;
  },

  server: async ({ serverId }: { serverId: Server['serverId'] }): Promise<Server | null> => {
    const server = await apiService.post('/server', { serverId });
    return server;
  },

  serverChannels: async ({ serverId }: { serverId: Server['serverId'] }): Promise<Channel[] | null> => {
    const serverChannels = await apiService.post('/serverChannels', {
      serverId,
    });
    return serverChannels;
  },

  serverMembers: async ({ serverId }: { serverId: Server['serverId'] }): Promise<ServerMember[] | null> => {
    const serverMembers = await apiService.post('/serverMembers', {
      serverId,
    });
    return serverMembers;
  },

  serverMemberApplications: async ({
    serverId,
  }: {
    serverId: Server['serverId'];
  }): Promise<MemberApplication[] | null> => {
    const serverMemberApplications = await apiService.post('/serverMemberApplications', { serverId });
    return serverMemberApplications;
  },

  channel: async ({ channelId }: { channelId: Channel['channelId'] }): Promise<Channel | null> => {
    const channel = await apiService.post('/channel', { channelId });
    return channel;
  },

  friendGroup: async ({
    friendGroupId,
  }: {
    friendGroupId: FriendGroup['friendGroupId'];
  }): Promise<FriendGroup | null> => {
    const friendGroup = await apiService.post('/friendGroup', {
      friendGroupId,
    });
    return friendGroup;
  },

  friendApplication: async ({
    senderId,
    receiverId,
  }: {
    senderId: User['userId'];
    receiverId: User['userId'];
  }): Promise<FriendApplication | null> => {
    const friendApplication = await apiService.post('/friendApplication', {
      senderId,
      receiverId,
    });
    return friendApplication;
  },

  friend: async ({
    userId,
    targetId,
  }: {
    userId: User['userId'];
    targetId: User['userId'];
  }): Promise<Friend | null> => {
    const friend = await apiService.post('/friend', {
      userId,
      targetId,
    });
    return friend;
  },

  memberApplication: async ({
    userId,
    serverId,
  }: {
    userId: User['userId'];
    serverId: Server['serverId'];
  }): Promise<MemberApplication | null> => {
    const memberApplication = await apiService.post('/memberApplication', {
      userId,
      serverId,
    });
    return memberApplication;
  },

  member: async ({
    userId,
    serverId,
  }: {
    userId: User['userId'];
    serverId: Server['serverId'];
  }): Promise<Member | null> => {
    const member = await apiService.post('/member', {
      userId,
      serverId,
    });
    return member;
  },

  directMessage: async ({
    userId,
    targetId,
  }: {
    userId: User['userId'];
    targetId: User['userId'];
  }): Promise<DirectMessage[] | null> => {
    const directMessage = await apiService.post('/directMessage', {
      userId,
      targetId,
    });
    return directMessage;
  },
};

export default getService;

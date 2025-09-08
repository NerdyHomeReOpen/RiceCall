// Services
import api from '@/services/api.service';

// Types
import type { User, Server, Channel, FriendApplication, Friend, MemberApplication, Member, FriendGroup, RecommendServerList, MemberInvitation } from '@/types';

export const dataService = {
  user: async ({ userId }: { userId: User['userId'] }): Promise<User | null> => {
    const user = await api.post('/user', { userId });
    return user;
  },

  friend: async ({ userId, targetId }: { userId: User['userId']; targetId: User['userId'] }): Promise<Friend | null> => {
    const friend = await api.post('/friend', { userId, targetId });
    return friend;
  },

  friends: async ({ userId }: { userId: User['userId'] }): Promise<Friend[] | []> => {
    const friends = await api.post('/friends', { userId });
    return friends;
  },

  friendGroup: async ({ userId, friendGroupId }: { userId: User['userId']; friendGroupId: FriendGroup['friendGroupId'] }): Promise<FriendGroup | null> => {
    const friendGroup = await api.post('/friendGroup', { userId, friendGroupId });
    return friendGroup;
  },

  friendGroups: async ({ userId }: { userId: User['userId'] }): Promise<FriendGroup[] | []> => {
    const friendGroups = await api.post('/friendGroups', { userId });
    return friendGroups;
  },

  friendApplication: async ({ receiverId, senderId }: { receiverId: User['userId']; senderId: User['userId'] }): Promise<FriendApplication | null> => {
    const friendApplication = await api.post('/friendApplication', { receiverId, senderId });
    return friendApplication;
  },

  friendApplications: async ({ receiverId }: { receiverId: User['userId'] }): Promise<FriendApplication[] | []> => {
    const friendApplications = await api.post('/friendApplications', { receiverId });
    return friendApplications;
  },

  server: async ({ userId, serverId }: { userId: User['userId']; serverId: Server['serverId'] }): Promise<Server | null> => {
    const server = await api.post('/server', { userId, serverId });
    return server;
  },

  servers: async ({ userId }: { userId: User['userId'] }): Promise<Server[] | []> => {
    const servers = await api.post('/servers', { userId });
    return servers;
  },

  serverMembers: async ({ serverId }: { serverId: Server['serverId'] }): Promise<Member[] | []> => {
    const serverMembers = await api.post('/serverMembers', { serverId });
    return serverMembers;
  },

  recommendServerList: async (): Promise<RecommendServerList | null> => {
    const recommendServerList = await api.post('/recommendServerList', {});
    return recommendServerList;
  },

  channel: async ({ userId, serverId, channelId }: { userId: User['userId']; serverId: Server['serverId']; channelId: Channel['channelId'] }): Promise<Channel | null> => {
    const channel = await api.post('/channel', { userId, serverId, channelId });
    return channel;
  },

  channelMembers: async ({ serverId, channelId }: { serverId: Server['serverId']; channelId: Channel['channelId'] }): Promise<Channel | null> => {
    const channel = await api.post('/channelMembers', { serverId, channelId });
    return channel;
  },

  channels: async ({ userId, serverId }: { userId: User['userId']; serverId: Server['serverId'] }): Promise<Channel[] | []> => {
    const channels = await api.post('/channels', { userId, serverId });
    return channels;
  },

  member: async ({ serverId, userId, channelId }: { userId: User['userId']; serverId: Server['serverId']; channelId?: Channel['channelId'] }): Promise<Member | null> => {
    const member = await api.post('/member', { userId, serverId, channelId });
    return member;
  },

  memberApplication: async ({ userId, serverId }: { userId: User['userId']; serverId: Server['serverId'] }): Promise<MemberApplication | null> => {
    const memberApplication = await api.post('/memberApplication', { userId, serverId });
    return memberApplication;
  },

  memberApplications: async ({ serverId }: { serverId: Server['serverId'] }): Promise<MemberApplication[] | []> => {
    const memberApplications = await api.post('/memberApplications', { serverId });
    return memberApplications;
  },

  memberInvitations: async ({ receiverId }: { receiverId: User['userId'] }): Promise<MemberInvitation[] | []> => {
    const memberInvitations = await api.post('/memberInvitations', { receiverId });
    return memberInvitations;
  },

  memberInvitation: async ({ receiverId, serverId }: { receiverId: User['userId']; serverId: Server['serverId'] }): Promise<MemberInvitation | null> => {
    const memberInvitations = await api.post('/memberInvitation', { receiverId, serverId });
    return memberInvitations;
  },
};

export default dataService;

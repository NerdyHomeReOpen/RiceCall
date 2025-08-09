// Services
import apiService from '@/services/api.service';

// Types
import type { User, Server, Channel, FriendApplication, Friend, MemberApplication, Member, FriendGroup, RecommendServerList, MemberInvitation } from '@/types';

export const getService = {
  user: async ({ userId }: { userId: User['userId'] }): Promise<User | null> => {
    const user = await apiService.post('/user', { userId });
    return user;
  },

  friend: async ({ userId, targetId }: { userId: User['userId']; targetId: User['userId'] }): Promise<Friend | null> => {
    const friend = await apiService.post('/friend', { userId, targetId });
    return friend;
  },

  friends: async ({ userId }: { userId: User['userId'] }): Promise<Friend[] | []> => {
    const friends = await apiService.post('/friends', { userId });
    return friends;
  },

  friendGroup: async ({ userId, friendGroupId }: { userId: User['userId']; friendGroupId: FriendGroup['friendGroupId'] }): Promise<FriendGroup | null> => {
    const friendGroup = await apiService.post('/friendGroup', { userId, friendGroupId });
    return friendGroup;
  },

  friendGroups: async ({ userId }: { userId: User['userId'] }): Promise<FriendGroup[] | []> => {
    const friendGroups = await apiService.post('/friendGroups', { userId });
    return friendGroups;
  },

  friendApplication: async ({ receiverId, senderId }: { receiverId: User['userId']; senderId: User['userId'] }): Promise<FriendApplication | null> => {
    const friendApplication = await apiService.post('/friendApplication', { receiverId, senderId });
    return friendApplication;
  },

  friendApplications: async ({ receiverId }: { receiverId: User['userId'] }): Promise<FriendApplication[] | []> => {
    const friendApplications = await apiService.post('/friendApplications', { receiverId });
    return friendApplications;
  },

  server: async ({ userId, serverId }: { userId: User['userId']; serverId: Server['serverId'] }): Promise<Server | null> => {
    const server = await apiService.post('/server', { userId, serverId });
    return server;
  },

  servers: async ({ userId }: { userId: User['userId'] }): Promise<Server[] | []> => {
    const servers = await apiService.post('/servers', { userId });
    return servers;
  },

  recommendServerList: async (): Promise<RecommendServerList | null> => {
    const recommendServerList = await apiService.post('/recommendServerList', {});
    return recommendServerList;
  },

  channel: async ({ serverId, channelId }: { serverId: Server['serverId']; channelId: Channel['channelId'] }): Promise<Channel | null> => {
    const channel = await apiService.post('/channel', { serverId, channelId });
    return channel;
  },

  channels: async ({ serverId }: { serverId: Server['serverId'] }): Promise<Channel[] | []> => {
    const channels = await apiService.post('/channels', { serverId });
    return channels;
  },

  member: async ({ serverId, userId }: { userId: User['userId']; serverId: Server['serverId'] }): Promise<Member | null> => {
    const member = await apiService.post('/member', { userId, serverId });
    return member;
  },

  members: async ({ serverId }: { serverId: Server['serverId'] }): Promise<Member[] | []> => {
    const members = await apiService.post('/members', { serverId });
    return members;
  },

  memberApplication: async ({ userId, serverId }: { userId: User['userId']; serverId: Server['serverId'] }): Promise<MemberApplication | null> => {
    const memberApplication = await apiService.post('/memberApplication', { userId, serverId });
    return memberApplication;
  },

  memberApplications: async ({ serverId }: { serverId: Server['serverId'] }): Promise<MemberApplication[] | []> => {
    const memberApplications = await apiService.post('/memberApplications', { serverId });
    return memberApplications;
  },

  memberInvitations: async ({ receiverId }: { receiverId: User['userId'] }): Promise<MemberInvitation[] | []> => {
    const memberInvitations = await apiService.post('/memberInvitations', { receiverId });
    return memberInvitations;
  },
};

export default getService;

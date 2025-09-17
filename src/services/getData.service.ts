// Services
import api from '@/services/api.service';

// Types
import type { User, Server, Channel, FriendApplication, Friend, MemberApplication, Member, FriendGroup, RecommendServerList, MemberInvitation, Announcement } from '@/types';

export const getDataService = {
  user: async (params: { userId: User['userId'] }): Promise<User | null> => {
    const user = await api.get(`/user?${new URLSearchParams(params).toString()}`);
    return user;
  },

  friend: async (params: { userId: User['userId']; targetId: User['userId'] }): Promise<Friend | null> => {
    const friend = await api.get(`/friend?${new URLSearchParams(params).toString()}`);
    return friend;
  },

  friends: async (params: { userId: User['userId'] }): Promise<Friend[] | []> => {
    const friends = await api.get(`/friends?${new URLSearchParams(params).toString()}`);
    return friends;
  },

  friendGroup: async (params: { userId: User['userId']; friendGroupId: FriendGroup['friendGroupId'] }): Promise<FriendGroup | null> => {
    const friendGroup = await api.get(`/friendGroup?${new URLSearchParams(params).toString()}`);
    return friendGroup;
  },

  friendGroups: async (params: { userId: User['userId'] }): Promise<FriendGroup[] | []> => {
    const friendGroups = await api.get(`/friendGroups?${new URLSearchParams(params).toString()}`);
    return friendGroups;
  },

  friendApplication: async (params: { receiverId: User['userId']; senderId: User['userId'] }): Promise<FriendApplication | null> => {
    const friendApplication = await api.get(`/friendApplication?${new URLSearchParams(params).toString()}`);
    return friendApplication;
  },

  friendApplications: async (params: { receiverId: User['userId'] }): Promise<FriendApplication[] | []> => {
    const friendApplications = await api.get(`/friendApplications?${new URLSearchParams(params).toString()}`);
    return friendApplications;
  },

  server: async (params: { userId: User['userId']; serverId: Server['serverId'] }): Promise<Server | null> => {
    const server = await api.get(`/server?${new URLSearchParams(params).toString()}`);
    return server;
  },

  servers: async (params: { userId: User['userId'] }): Promise<Server[] | []> => {
    const servers = await api.get(`/servers?${new URLSearchParams(params).toString()}`);
    return servers;
  },

  serverMembers: async (params: { serverId: Server['serverId'] }): Promise<Member[] | []> => {
    const serverMembers = await api.get(`/serverMembers?${new URLSearchParams(params).toString()}`);
    return serverMembers;
  },

  channel: async (params: { userId: User['userId']; serverId: Server['serverId']; channelId: Channel['channelId'] }): Promise<Channel | null> => {
    const channel = await api.get(`/channel?${new URLSearchParams(params).toString()}`);
    return channel;
  },

  channels: async (params: { userId: User['userId']; serverId: Server['serverId'] }): Promise<Channel[] | []> => {
    const channels = await api.get(`/channels?${new URLSearchParams(params).toString()}`);
    return channels;
  },

  channelMembers: async (params: { serverId: Server['serverId']; channelId: Channel['channelId'] }): Promise<Member[] | []> => {
    const channel = await api.get(`/channelMembers?${new URLSearchParams(params).toString()}`);
    return channel;
  },

  member: async (params: { userId: User['userId']; serverId: Server['serverId']; channelId?: Channel['channelId'] }): Promise<Member | null> => {
    const member = await api.get(`/member?${new URLSearchParams(params).toString()}`);
    return member;
  },

  memberApplication: async (params: { userId: User['userId']; serverId: Server['serverId'] }): Promise<MemberApplication | null> => {
    const memberApplication = await api.get(`/memberApplication?${new URLSearchParams(params).toString()}`);
    return memberApplication;
  },

  memberApplications: async (params: { serverId: Server['serverId'] }): Promise<MemberApplication[] | []> => {
    const memberApplications = await api.get(`/memberApplications?${new URLSearchParams(params).toString()}`);
    return memberApplications;
  },

  memberInvitation: async (params: { receiverId: User['userId']; serverId: Server['serverId'] }): Promise<MemberInvitation | null> => {
    const memberInvitations = await api.get(`/memberInvitation?${new URLSearchParams(params).toString()}`);
    return memberInvitations;
  },

  memberInvitations: async (params: { receiverId: User['userId'] }): Promise<MemberInvitation[] | []> => {
    const memberInvitations = await api.get(`/memberInvitations?${new URLSearchParams(params).toString()}`);
    return memberInvitations;
  },

  announcement: async (params: { announcementId: Announcement['announcementId']; region: Announcement['region'] }): Promise<Announcement | null> => {
    const announcement = await api.get(`/announcement?${new URLSearchParams({ announcementId: params.announcementId.toString(), region: params.region }).toString()}`);
    return announcement;
  },

  announcements: async (params: { region: Announcement['region'] }): Promise<Announcement[] | null> => {
    const announcements = await api.get(`/announcements?${new URLSearchParams(params).toString()}`);
    return announcements;
  },

  recommendServerList: async (): Promise<RecommendServerList> => {
    const recommendServerList = await api.get(`/recommendServerList`);
    return recommendServerList;
  },
};

export default getDataService;

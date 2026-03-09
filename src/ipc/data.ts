import * as Types from '@/types';
import { modules } from './modules';

export const data = {
  user: async (params: { userId: string }): Promise<Types.User | null> => {
    return await modules.default.dataUser(params);
  },

  userHotReload: async (params: { userId: string }): Promise<Types.User | null> => {
    return await modules.default.dataUserHotReload(params);
  },

  friend: async (params: { userId: string; targetId: string }): Promise<Types.Friend | null> => {
    return await modules.default.dataFriend(params);
  },

  friends: async (params: { userId: string }): Promise<Types.Friend[]> => {
    return await modules.default.dataFriends(params);
  },

  friendActivities: async (params: { userId: string }): Promise<Types.FriendActivity[]> => {
    return await modules.default.dataFriendActivities(params);
  },

  friendGroup: async (params: { userId: string; friendGroupId: string }): Promise<Types.FriendGroup | null> => {
    return await modules.default.dataFriendGroup(params);
  },

  friendGroups: async (params: { userId: string }): Promise<Types.FriendGroup[]> => {
    return await modules.default.dataFriendGroups(params);
  },

  friendApplication: async (params: { receiverId: string; senderId: string }): Promise<Types.FriendApplication | null> => {
    return await modules.default.dataFriendApplication(params);
  },

  friendApplications: async (params: { receiverId: string }): Promise<Types.FriendApplication[]> => {
    return await modules.default.dataFriendApplications(params);
  },

  server: async (params: { userId: string; serverId: string }): Promise<Types.Server | null> => {
    return await modules.default.dataServer(params);
  },

  servers: async (params: { userId: string }): Promise<Types.Server[]> => {
    return await modules.default.dataServers(params);
  },

  serverMembers: async (params: { serverId: string }): Promise<Types.Member[]> => {
    return await modules.default.dataServerMembers(params);
  },

  serverOnlineMembers: async (params: { serverId: string }): Promise<Types.OnlineMember[]> => {
    return await modules.default.dataServerOnlineMembers(params);
  },

  channel: async (params: { userId: string; serverId: string; channelId: string }): Promise<Types.Channel | null> => {
    return await modules.default.dataChannel(params);
  },

  channels: async (params: { userId: string; serverId: string }): Promise<Types.Channel[]> => {
    return await modules.default.dataChannels(params);
  },

  channelMembers: async (params: { serverId: string; channelId: string }): Promise<Types.Member[]> => {
    return await modules.default.dataChannelMembers(params);
  },

  member: async (params: { userId: string; serverId: string; channelId?: string }): Promise<Types.Member | null> => {
    return await modules.default.dataMember(params);
  },

  memberApplication: async (params: { userId: string; serverId: string }): Promise<Types.MemberApplication | null> => {
    return await modules.default.dataMemberApplication(params);
  },

  memberApplications: async (params: { serverId: string }): Promise<Types.MemberApplication[]> => {
    return await modules.default.dataMemberApplications(params);
  },

  memberInvitation: async (params: { receiverId: string; serverId: string }): Promise<Types.MemberInvitation | null> => {
    return await modules.default.dataMemberInvitation(params);
  },

  memberInvitations: async (params: { receiverId: string }): Promise<Types.MemberInvitation[]> => {
    return await modules.default.dataMemberInvitations(params);
  },

  notifications: async (params: { region: Types.LanguageKey }): Promise<Types.Notification[]> => {
    return await modules.default.dataNotifications(params);
  },

  announcements: async (params: { region: Types.LanguageKey }): Promise<Types.Announcement[]> => {
    return await modules.default.dataAnnouncements(params);
  },

  recommendServers: async (params: { region: Types.LanguageKey }): Promise<Types.RecommendServer[]> => {
    return await modules.default.dataRecommendServers(params);
  },

  uploadImage: async (params: { folder: string; imageName: string; imageUnit8Array: Uint8Array }): Promise<{ imageName: string; imageUrl: string } | null> => {
    return await modules.default.dataUploadImage(params);
  },

  searchServer: async (params: { query: string }): Promise<Types.Server[]> => {
    return await modules.default.dataSearchServer(params);
  },

  searchUser: async (params: { query: string }): Promise<Types.User[]> => {
    return await modules.default.dataSearchUser(params);
  },
};

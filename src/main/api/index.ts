import type * as Types from '@/types';

import { modules } from '@/main/modules';

export const api = {
  fetchUser: async (params: { userId: string }): Promise<Types.User | null> => {
    return await modules.default.fetchUser(params);
  },

  fetchUserHotReload: async (params: { userId: string }): Promise<Types.User | null> => {
    return await modules.default.fetchUserHotReload(params);
  },

  fetchFriend: async (params: { userId: string; targetId: string }): Promise<Types.Friend | null> => {
    return await modules.default.fetchFriend(params);
  },

  fetchFriends: async (params: { userId: string }): Promise<Types.Friend[]> => {
    return await modules.default.fetchFriends(params);
  },

  fetchFriendActivities: async (params: { userId: string }): Promise<Types.FriendActivity[]> => {
    return await modules.default.fetchFriendActivities(params);
  },

  fetchFriendGroup: async (params: { userId: string; friendGroupId: string }): Promise<Types.FriendGroup | null> => {
    return await modules.default.fetchFriendGroup(params);
  },

  fetchFriendGroups: async (params: { userId: string }): Promise<Types.FriendGroup[]> => {
    return await modules.default.fetchFriendGroups(params);
  },

  fetchFriendApplication: async (params: { receiverId: string; senderId: string }): Promise<Types.FriendApplication | null> => {
    return await modules.default.fetchFriendApplication(params);
  },

  fetchFriendApplications: async (params: { receiverId: string }): Promise<Types.FriendApplication[]> => {
    return await modules.default.fetchFriendApplications(params);
  },

  fetchServer: async (params: { userId: string; serverId: string }): Promise<Types.Server | null> => {
    return await modules.default.fetchServer(params);
  },

  fetchServers: async (params: { userId: string }): Promise<Types.Server[]> => {
    return await modules.default.fetchServers(params);
  },

  fetchServerMembers: async (params: { serverId: string }): Promise<Types.Member[]> => {
    return await modules.default.fetchServerMembers(params);
  },

  fetchServerOnlineMembers: async (params: { serverId: string }): Promise<Types.OnlineMember[]> => {
    return await modules.default.fetchServerOnlineMembers(params);
  },

  fetchChannel: async (params: { userId: string; serverId: string; channelId: string }): Promise<Types.Channel | null> => {
    return await modules.default.fetchChannel(params);
  },

  fetchChannels: async (params: { userId: string; serverId: string }): Promise<Types.Channel[]> => {
    return await modules.default.fetchChannels(params);
  },

  fetchChannelMembers: async (params: { serverId: string; channelId: string }): Promise<Types.Member[]> => {
    return await modules.default.fetchChannelMembers(params);
  },

  fetchMember: async (params: { userId: string; serverId: string; channelId?: string }): Promise<Types.Member | null> => {
    return await modules.default.fetchMember(params);
  },

  fetchMemberApplication: async (params: { userId: string; serverId: string }): Promise<Types.MemberApplication | null> => {
    return await modules.default.fetchMemberApplication(params);
  },

  fetchMemberApplications: async (params: { serverId: string }): Promise<Types.MemberApplication[]> => {
    return await modules.default.fetchMemberApplications(params);
  },

  fetchMemberInvitation: async (params: { receiverId: string; serverId: string }): Promise<Types.MemberInvitation | null> => {
    return await modules.default.fetchMemberInvitation(params);
  },

  fetchMemberInvitations: async (params: { receiverId: string }): Promise<Types.MemberInvitation[]> => {
    return await modules.default.fetchMemberInvitations(params);
  },

  fetchNotifications: async (params: { region: Types.LanguageKey }): Promise<Types.Notification[]> => {
    return await modules.default.fetchNotifications(params);
  },

  fetchAnnouncements: async (params: { region: Types.LanguageKey }): Promise<Types.Announcement[]> => {
    return await modules.default.fetchAnnouncements(params);
  },

  fetchRecommendServers: async (params: { region: Types.LanguageKey }): Promise<Types.RecommendServer[]> => {
    return await modules.default.fetchRecommendServers(params);
  },

  uploadImage: async (params: { folder: string; imageName: string; imageUnit8Array: Uint8Array }): Promise<{ imageName: string; imageUrl: string } | null> => {
    return await modules.default.uploadImage(params);
  },

  searchServer: async (params: { query: string }): Promise<Types.Server[]> => {
    return await modules.default.searchServer(params);
  },

  searchUser: async (params: { query: string }): Promise<Types.User[]> => {
    return await modules.default.searchUser(params);
  },
};

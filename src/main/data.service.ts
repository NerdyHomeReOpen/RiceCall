import api from './api.service.js';

import type * as Types from '../types';

const dataService = {
  user: async (params: { userId: string }): Promise<Types.User | null> => {
    return await api.get(`/user?${new URLSearchParams(params).toString()}`);
  },

  friend: async (params: { userId: string; targetId: string }): Promise<Types.Friend | null> => {
    return await api.get(`/friend?${new URLSearchParams(params).toString()}`);
  },

  friends: async (params: { userId: string }): Promise<Types.Friend[]> => {
    return await api.get(`/friends?${new URLSearchParams(params).toString()}`);
  },

  friendActivities: async (params: { userId: string }): Promise<Types.FriendActivity[]> => {
    return await api.get(`/friendActivities?${new URLSearchParams(params).toString()}`);
  },

  friendGroup: async (params: { userId: string; friendGroupId: string }): Promise<Types.FriendGroup | null> => {
    return await api.get(`/friendGroup?${new URLSearchParams(params).toString()}`);
  },

  friendGroups: async (params: { userId: string }): Promise<Types.FriendGroup[]> => {
    return await api.get(`/friendGroups?${new URLSearchParams(params).toString()}`);
  },

  friendApplication: async (params: { receiverId: string; senderId: string }): Promise<Types.FriendApplication | null> => {
    return await api.get(`/friendApplication?${new URLSearchParams(params).toString()}`);
  },

  friendApplications: async (params: { receiverId: string }): Promise<Types.FriendApplication[]> => {
    return await api.get(`/friendApplications?${new URLSearchParams(params).toString()}`);
  },

  server: async (params: { userId: string; serverId: string }): Promise<Types.Server | null> => {
    return await api.get(`/server?${new URLSearchParams(params).toString()}`);
  },

  servers: async (params: { userId: string }): Promise<Types.Server[]> => {
    return await api.get(`/servers?${new URLSearchParams(params).toString()}`);
  },

  serverMembers: async (params: { serverId: string }): Promise<Types.Member[]> => {
    return await api.get(`/serverMembers?${new URLSearchParams(params).toString()}`);
  },

  serverOnlineMembers: async (params: { serverId: string }): Promise<Types.OnlineMember[]> => {
    return await api.get(`/serverOnlineMembers?${new URLSearchParams(params).toString()}`);
  },

  channel: async (params: { userId: string; serverId: string; channelId: string }): Promise<Types.Channel | null> => {
    return await api.get(`/channel?${new URLSearchParams(params).toString()}`);
  },

  channels: async (params: { userId: string; serverId: string }): Promise<Types.Channel[]> => {
    return await api.get(`/channels?${new URLSearchParams(params).toString()}`);
  },

  channelMembers: async (params: { serverId: string; channelId: string }): Promise<Types.Member[]> => {
    return await api.get(`/channelMembers?${new URLSearchParams(params).toString()}`);
  },

  member: async (params: { userId: string; serverId: string; channelId?: string }): Promise<Types.Member | null> => {
    return await api.get(`/member?${new URLSearchParams(params).toString()}`);
  },

  memberApplication: async (params: { userId: string; serverId: string }): Promise<Types.MemberApplication | null> => {
    return await api.get(`/memberApplication?${new URLSearchParams(params).toString()}`);
  },

  memberApplications: async (params: { serverId: string }): Promise<Types.MemberApplication[]> => {
    return await api.get(`/memberApplications?${new URLSearchParams(params).toString()}`);
  },

  memberInvitation: async (params: { receiverId: string; serverId: string }): Promise<Types.MemberInvitation | null> => {
    return await api.get(`/memberInvitation?${new URLSearchParams(params).toString()}`);
  },

  memberInvitations: async (params: { receiverId: string }): Promise<Types.MemberInvitation[]> => {
    return await api.get(`/memberInvitations?${new URLSearchParams(params).toString()}`);
  },

  notifications: async (params: { region: string }): Promise<Types.Notification[]> => {
    return await api.get(`/notifications?${new URLSearchParams(params).toString()}`);
  },

  announcements: async (params: { region: string }): Promise<Types.Announcement[]> => {
    return await api.get(`/announcements?${new URLSearchParams(params).toString()}`);
  },

  recommendServers: async (params: { region: string }): Promise<Types.RecommendServer[]> => {
    return await api.get(`/recommendServers?${new URLSearchParams(params).toString()}`);
  },

  uploadImage: async (folder: string, imageName: string, imageUnit8Array: Uint8Array): Promise<{ imageName: string; imageUrl: string } | null> => {
    const formData = new FormData();
    formData.append('folder', folder);
    formData.append('imageName', imageName);
    formData.append('image', new Blob([imageUnit8Array], { type: 'image/webp' }), `${imageName}.webp`);
    return await api.post('/upload/image', formData);
  },

  searchServer: async (query: string): Promise<Types.Server[]> => {
    return await api.get(`/server/search?${new URLSearchParams({ query }).toString()}`);
  },

  searchUser: async (query: string): Promise<Types.User[]> => {
    return await api.get(`/user/search?${new URLSearchParams({ query }).toString()}`);
  },
};

export default dataService;

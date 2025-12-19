import api from './api.service.js';

const dataService = {
  user: async (params: { userId: string }) => {
    return await api.get(`/user?${new URLSearchParams(params).toString()}`);
  },

  friend: async (params: { userId: string; targetId: string }) => {
    return await api.get(`/friend?${new URLSearchParams(params).toString()}`);
  },

  friends: async (params: { userId: string }) => {
    return await api.get(`/friends?${new URLSearchParams(params).toString()}`);
  },

  friendActivities: async (params: { userId: string }) => {
    return await api.get(`/friendActivities?${new URLSearchParams(params).toString()}`);
  },

  friendGroup: async (params: { userId: string; friendGroupId: string }) => {
    return await api.get(`/friendGroup?${new URLSearchParams(params).toString()}`);
  },

  friendGroups: async (params: { userId: string }) => {
    return await api.get(`/friendGroups?${new URLSearchParams(params).toString()}`);
  },

  friendApplication: async (params: { receiverId: string; senderId: string }) => {
    return await api.get(`/friendApplication?${new URLSearchParams(params).toString()}`);
  },

  friendApplications: async (params: { receiverId: string }) => {
    return await api.get(`/friendApplications?${new URLSearchParams(params).toString()}`);
  },

  server: async (params: { userId: string; serverId: string }) => {
    return await api.get(`/server?${new URLSearchParams(params).toString()}`);
  },

  servers: async (params: { userId: string }) => {
    return await api.get(`/servers?${new URLSearchParams(params).toString()}`);
  },

  serverMembers: async (params: { serverId: string }) => {
    return await api.get(`/serverMembers?${new URLSearchParams(params).toString()}`);
  },

  serverOnlineMembers: async (params: { serverId: string }) => {
    return await api.get(`/serverOnlineMembers?${new URLSearchParams(params).toString()}`);
  },

  channel: async (params: { userId: string; serverId: string; channelId: string }) => {
    return await api.get(`/channel?${new URLSearchParams(params).toString()}`);
  },

  channels: async (params: { userId: string; serverId: string }) => {
    return await api.get(`/channels?${new URLSearchParams(params).toString()}`);
  },

  channelMembers: async (params: { serverId: string; channelId: string }) => {
    return await api.get(`/channelMembers?${new URLSearchParams(params).toString()}`);
  },

  member: async (params: { userId: string; serverId: string; channelId?: string }) => {
    return await api.get(`/member?${new URLSearchParams(params).toString()}`);
  },

  memberApplication: async (params: { userId: string; serverId: string }) => {
    return await api.get(`/memberApplication?${new URLSearchParams(params).toString()}`);
  },

  memberApplications: async (params: { serverId: string }) => {
    return await api.get(`/memberApplications?${new URLSearchParams(params).toString()}`);
  },

  memberInvitation: async (params: { receiverId: string; serverId: string }) => {
    return await api.get(`/memberInvitation?${new URLSearchParams(params).toString()}`);
  },

  memberInvitations: async (params: { receiverId: string }) => {
    return await api.get(`/memberInvitations?${new URLSearchParams(params).toString()}`);
  },

  notifications: async (params: { region: string }) => {
    return await api.get(`/notifications?${new URLSearchParams(params).toString()}`);
  },

  announcements: async (params: { region: string }) => {
    return await api.get(`/announcements?${new URLSearchParams(params).toString()}`);
  },

  recommendServers: async (params: { region: string }) => {
    return await api.get(`/recommendServers?${new URLSearchParams(params).toString()}`);
  },

  uploadImage: async (folder: string, imageName: string, imageUnit8Array: Uint8Array) => {
    console.log(folder, imageName, imageUnit8Array);
    const formData = new FormData();
    formData.append('folder', folder);
    formData.append('imageName', imageName);
    formData.append('image', new Blob([imageUnit8Array], { type: 'image/webp' }), `${imageName}.webp`);
    return await api.post('/upload/image', formData).then((response) => {
      console.log(response);
      return response;
    });
  },

  searchServer: async (query: string) => {
    return await api.get(`/server/search?${new URLSearchParams({ query }).toString()}`);
  },

  searchUser: async (query: string) => {
    return await api.get(`/user/search?${new URLSearchParams({ query }).toString()}`);
  },
};

export default dataService;

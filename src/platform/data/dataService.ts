/**
 * Platform-agnostic DataService factory.
 * 
 * This creates a DataService that can work in both Electron main and Web browser
 * by accepting an ApiClient instance (which handles the actual HTTP calls).
 */

import type * as Types from '@/types';

// Minimal ApiClient interface needed by DataService
export interface DataServiceApiClient {
  get<T>(endpoint: string): Promise<T | null>;
  post<T>(endpoint: string, data: unknown): Promise<T | null>;
}

export interface DataService {
  user(params: { userId: string }): Promise<Types.User | null>;
  friend(params: { userId: string; targetId: string }): Promise<Types.Friend | null>;
  friends(params: { userId: string }): Promise<Types.Friend[]>;
  friendActivities(params: { userId: string }): Promise<Types.FriendActivity[]>;
  friendGroup(params: { userId: string; friendGroupId: string }): Promise<Types.FriendGroup | null>;
  friendGroups(params: { userId: string }): Promise<Types.FriendGroup[]>;
  friendApplication(params: { receiverId: string; senderId: string }): Promise<Types.FriendApplication | null>;
  friendApplications(params: { receiverId: string }): Promise<Types.FriendApplication[]>;
  server(params: { userId: string; serverId: string }): Promise<Types.Server | null>;
  servers(params: { userId: string }): Promise<Types.Server[]>;
  serverMembers(params: { serverId: string }): Promise<Types.Member[]>;
  serverOnlineMembers(params: { serverId: string }): Promise<Types.OnlineMember[]>;
  channel(params: { userId: string; serverId: string; channelId: string }): Promise<Types.Channel | null>;
  channels(params: { userId: string; serverId: string }): Promise<Types.Channel[]>;
  channelMembers(params: { serverId: string; channelId: string }): Promise<Types.Member[]>;
  member(params: { userId: string; serverId: string; channelId?: string }): Promise<Types.Member | null>;
  memberApplication(params: { userId: string; serverId: string }): Promise<Types.MemberApplication | null>;
  memberApplications(params: { serverId: string }): Promise<Types.MemberApplication[]>;
  memberInvitation(params: { receiverId: string; serverId: string }): Promise<Types.MemberInvitation | null>;
  memberInvitations(params: { receiverId: string }): Promise<Types.MemberInvitation[]>;
  notifications(params: { region: Types.LanguageKey }): Promise<Types.Notification[]>;
  announcements(params: { region: Types.LanguageKey }): Promise<Types.Announcement[]>;
  recommendServers(params: { region: Types.LanguageKey }): Promise<Types.RecommendServer[]>;
  uploadImage(params: { folder: string; imageName: string; imageUnit8Array: Uint8Array }): Promise<{ imageName: string; imageUrl: string } | null>;
  searchServer(params: { query: string }): Promise<Types.Server[]>;
  searchUser(params: { query: string }): Promise<Types.User[]>;
}

function toQuery(params: Record<string, unknown>): string {
  const filtered: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) {
      filtered[k] = String(v);
    }
  }
  return new URLSearchParams(filtered).toString();
}

/**
 * Create a DataService instance using the provided ApiClient.
 * This allows the same DataService logic to work in Electron main (with electron-specific ApiClient)
 * or in Web browser (with browser-safe ApiClient).
 */
export function createDataService(api: DataServiceApiClient): DataService {
  return {
    user: (params) => api.get(`/user?${toQuery(params)}`),
    friend: (params) => api.get(`/friend?${toQuery(params)}`),
    friends: async (params) => (await api.get(`/friends?${toQuery(params)}`)) ?? [],
    friendActivities: async (params) => (await api.get(`/friendActivities?${toQuery(params)}`)) ?? [],
    friendGroup: (params) => api.get(`/friendGroup?${toQuery(params)}`),
    friendGroups: async (params) => (await api.get(`/friendGroups?${toQuery(params)}`)) ?? [],
    friendApplication: (params) => api.get(`/friendApplication?${toQuery(params)}`),
    friendApplications: async (params) => (await api.get(`/friendApplications?${toQuery(params)}`)) ?? [],
    server: (params) => api.get(`/server?${toQuery(params)}`),
    servers: async (params) => (await api.get(`/servers?${toQuery(params)}`)) ?? [],
    serverMembers: async (params) => (await api.get(`/serverMembers?${toQuery(params)}`)) ?? [],
    serverOnlineMembers: async (params) => (await api.get(`/serverOnlineMembers?${toQuery(params)}`)) ?? [],
    channel: (params) => api.get(`/channel?${toQuery(params)}`),
    channels: async (params) => (await api.get(`/channels?${toQuery(params)}`)) ?? [],
    channelMembers: async (params) => (await api.get(`/channelMembers?${toQuery(params)}`)) ?? [],
    member: (params) => api.get(`/member?${toQuery(params)}`),
    memberApplication: (params) => api.get(`/memberApplication?${toQuery(params)}`),
    memberApplications: async (params) => (await api.get(`/memberApplications?${toQuery(params)}`)) ?? [],
    memberInvitation: (params) => api.get(`/memberInvitation?${toQuery(params)}`),
    memberInvitations: async (params) => (await api.get(`/memberInvitations?${toQuery(params)}`)) ?? [],
    notifications: async (params) => (await api.get(`/notifications?${toQuery(params)}`)) ?? [],
    announcements: async (params) => (await api.get(`/announcements?${toQuery(params)}`)) ?? [],
    recommendServers: async (params) => (await api.get(`/recommendServers?${toQuery(params)}`)) ?? [],
    uploadImage: async (params) => {
      const formData = new FormData();
      formData.append('folder', params.folder);
      formData.append('imageName', params.imageName);
      const bytes = params.imageUnit8Array;
      const copied = bytes.slice().buffer;
      formData.append('image', new Blob([copied], { type: 'image/webp' }), `${params.imageName}.webp`);
      return api.post('/upload/image', formData);
    },
    searchServer: async (params) => (await api.get(`/server/search?${toQuery(params)}`)) ?? [],
    searchUser: async (params) => (await api.get(`/user/search?${toQuery(params)}`)) ?? [],
  };
}

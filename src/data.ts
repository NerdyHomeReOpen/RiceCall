import type * as Types from '@/types';

import { post, get } from '@/api';

export async function user(params: { userId: string }): Promise<Types.User | null> {
  return await get(`/user?${new URLSearchParams(params).toString()}`);
}

export async function userSettings(params: { userId: string }): Promise<Types.UserSetting | null> {
  return await get(`/user?${new URLSearchParams(params).toString()}`);
}

export async function friend(params: { userId: string; targetId: string }): Promise<Types.Friend | null> {
  return await get(`/friend?${new URLSearchParams(params).toString()}`);
}

export async function friends(params: { userId: string }): Promise<Types.Friend[]> {
  return (await get(`/friends?${new URLSearchParams(params).toString()}`)) ?? [];
}

export async function friendActivities(params: { userId: string }): Promise<Types.FriendActivity[]> {
  return (await get(`/friendActivities?${new URLSearchParams(params).toString()}`)) ?? [];
}

export async function friendGroup(params: { userId: string; friendGroupId: string }): Promise<Types.FriendGroup | null> {
  return await get(`/friendGroup?${new URLSearchParams(params).toString()}`);
}

export async function friendGroups(params: { userId: string }): Promise<Types.FriendGroup[]> {
  return (await get(`/friendGroups?${new URLSearchParams(params).toString()}`)) ?? [];
}

export async function friendApplication(params: { receiverId: string; senderId: string }): Promise<Types.FriendApplication | null> {
  return await get(`/friendApplication?${new URLSearchParams(params).toString()}`);
}

export async function friendApplications(params: { receiverId: string }): Promise<Types.FriendApplication[]> {
  return (await get(`/friendApplications?${new URLSearchParams(params).toString()}`)) ?? [];
}

export async function server(params: { userId: string; serverId: string }): Promise<Types.Server | null> {
  return await get(`/server?${new URLSearchParams(params).toString()}`);
}

export async function servers(params: { userId: string }): Promise<Types.Server[]> {
  return (await get(`/servers?${new URLSearchParams(params).toString()}`)) ?? [];
}

export async function serverMembers(params: { serverId: string }): Promise<Types.Member[]> {
  return (await get(`/serverMembers?${new URLSearchParams(params).toString()}`)) ?? [];
}

export async function serverOnlineMembers(params: { serverId: string }): Promise<Types.OnlineMember[]> {
  return (await get(`/serverOnlineMembers?${new URLSearchParams(params).toString()}`)) ?? [];
}

export async function channel(params: { userId: string; serverId: string; channelId: string }): Promise<Types.Channel | null> {
  return await get(`/channel?${new URLSearchParams(params).toString()}`);
}

export async function channels(params: { userId: string; serverId: string }): Promise<Types.Channel[]> {
  return (await get(`/channels?${new URLSearchParams(params).toString()}`)) ?? [];
}

export async function channelMembers(params: { serverId: string; channelId: string }): Promise<Types.Member[]> {
  return (await get(`/channelMembers?${new URLSearchParams(params).toString()}`)) ?? [];
}

export async function member(params: { userId: string; serverId: string; channelId?: string }): Promise<Types.Member | null> {
  return await get(`/member?${new URLSearchParams(params).toString()}`);
}

export async function memberApplication(params: { userId: string; serverId: string }): Promise<Types.MemberApplication | null> {
  return await get(`/memberApplication?${new URLSearchParams(params).toString()}`);
}

export async function memberApplications(params: { serverId: string }): Promise<Types.MemberApplication[]> {
  return (await get(`/memberApplications?${new URLSearchParams(params).toString()}`)) ?? [];
}

export async function memberInvitation(params: { receiverId: string; serverId: string }): Promise<Types.MemberInvitation | null> {
  return await get(`/memberInvitation?${new URLSearchParams(params).toString()}`);
}

export async function memberInvitations(params: { receiverId: string }): Promise<Types.MemberInvitation[]> {
  return (await get(`/memberInvitations?${new URLSearchParams(params).toString()}`)) ?? [];
}

export async function notifications(params: { region: string }): Promise<Types.Notification[]> {
  return (await get(`/notifications?${new URLSearchParams(params).toString()}`)) ?? [];
}

export async function announcements(params: { region: string }): Promise<Types.Announcement[]> {
  return (await get(`/announcements?${new URLSearchParams(params).toString()}`)) ?? [];
}

export async function recommendServers(params: { region: string }): Promise<Types.RecommendServer[]> {
  return (await get(`/recommendServers?${new URLSearchParams(params).toString()}`)) ?? [];
}

export async function uploadImage(params: { folder: string; imageName: string; imageUnit8Array: Uint8Array }): Promise<{ imageName: string; imageUrl: string } | null> {
  const formData = new FormData();
  formData.append('folder', params.folder);
  formData.append('imageName', params.imageName);
  formData.append('image', new Blob([params.imageUnit8Array], { type: 'image/webp' }), `${params.imageName}.webp`);
  return await post('/upload/image', formData);
}

export async function searchServer(params: { query: string }): Promise<Types.Server[]> {
  return (await get(`/server/search?${new URLSearchParams(params).toString()}`)) ?? [];
}

export async function searchUser(params: { query: string }): Promise<Types.User[]> {
  return (await get(`/user/search?${new URLSearchParams(params).toString()}`)) ?? [];
}

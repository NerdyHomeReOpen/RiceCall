import type * as Types from '@/types';

import { post, get } from '@/api';

type userDataParams = {
  userId: string;
}

export async function user(params: userDataParams): Promise<Types.User | null> {
  return await get(`/user?${new URLSearchParams(params).toString()}`);
}

type userSettingsParams = {
  userId: string;
}

export async function userSettings(params: userSettingsParams): Promise<Types.UserSetting | null> {
  return await get(`/user?${new URLSearchParams(params).toString()}`);
}

type friendDataParams = {
  userId: string;
  targetId: string;
}

export async function friend(params: friendDataParams): Promise<Types.Friend | null> {
  return await get(`/friend?${new URLSearchParams(params).toString()}`);
}

type friendsDataParams = {
  userId: string;
}

export async function friends(params: friendsDataParams): Promise<Types.Friend[]> {
  return (await get(`/friends?${new URLSearchParams(params).toString()}`)) ?? [];
}

type friendActivitiesDataParams = {
  userId: string;
}

export async function friendActivities(params: friendActivitiesDataParams): Promise<Types.FriendActivity[]> {
  return (await get(`/friendActivities?${new URLSearchParams(params).toString()}`)) ?? [];
}

type friendGroupDataParams = {
  userId: string;
  friendGroupId: string;
}

export async function friendGroup(params: friendGroupDataParams): Promise<Types.FriendGroup | null> {
  return await get(`/friendGroup?${new URLSearchParams(params).toString()}`);
}

type friendGroupsDataParams = {
  userId: string;
}

export async function friendGroups(params: friendGroupsDataParams): Promise<Types.FriendGroup[]> {
  return (await get(`/friendGroups?${new URLSearchParams(params).toString()}`)) ?? [];
}

type friendApplicationDataParams = {
  receiverId: string;
  senderId: string;
}

export async function friendApplication(params: friendApplicationDataParams): Promise<Types.FriendApplication | null> {
  return await get(`/friendApplication?${new URLSearchParams(params).toString()}`);
}

type friendApplicationsDataParams = {
  receiverId: string;
}

export async function friendApplications(params: friendApplicationsDataParams): Promise<Types.FriendApplication[]> {
  return (await get(`/friendApplications?${new URLSearchParams(params).toString()}`)) ?? [];
}

type serverDataParams = {
  userId: string;
  serverId: string;
}

export async function server(params: serverDataParams): Promise<Types.Server | null> {
  return await get(`/server?${new URLSearchParams(params).toString()}`);
}

type serversDataParams = {
  userId: string;
}

export async function servers(params: serversDataParams): Promise<Types.Server[]> {
  return (await get(`/servers?${new URLSearchParams(params).toString()}`)) ?? [];
}

type serverMembersDataParams = {
  serverId: string;
}

export async function serverMembers(params: serverMembersDataParams): Promise<Types.Member[]> {
  return (await get(`/serverMembers?${new URLSearchParams(params).toString()}`)) ?? [];
}

type serverOnlineMembersDataParams = {
  serverId: string;
}

export async function serverOnlineMembers(params: serverOnlineMembersDataParams): Promise<Types.OnlineMember[]> {
  return (await get(`/serverOnlineMembers?${new URLSearchParams(params).toString()}`)) ?? [];
}

type channelDataParams = {
  userId: string;
  serverId: string;
  channelId: string;
}

export async function channel(params: channelDataParams): Promise<Types.Channel | null> {
  return await get(`/channel?${new URLSearchParams(params).toString()}`);
}

type channelsDataParams = {
  userId: string;
  serverId: string;
}

export async function channels(params: channelsDataParams): Promise<Types.Channel[]> {
  return (await get(`/channels?${new URLSearchParams(params).toString()}`)) ?? [];
}

type channelMembersDataParams = {
  serverId: string;
  channelId: string;
}

export async function channelMembers(params: channelMembersDataParams): Promise<Types.Member[]> {
  return (await get(`/channelMembers?${new URLSearchParams(params).toString()}`)) ?? [];
}

type memberDataParams = {
  userId: string;
  serverId: string;
  channelId?: string;
}

export async function member(params: memberDataParams): Promise<Types.Member | null> {
  return await get(`/member?${new URLSearchParams(params).toString()}`);
}

type memberApplicationDataParams = {
  userId: string;
  serverId: string;
}

export async function memberApplication(params: memberApplicationDataParams): Promise<Types.MemberApplication | null> {
  return await get(`/memberApplication?${new URLSearchParams(params).toString()}`);
}

type memberApplicationsDataParams = {
  serverId: string;
}

export async function memberApplications(params: memberApplicationsDataParams): Promise<Types.MemberApplication[]> {
  return (await get(`/memberApplications?${new URLSearchParams(params).toString()}`)) ?? [];
}

type memberInvitationDataParams = {
  receiverId: string;
  serverId: string;
}

export async function memberInvitation(params: memberInvitationDataParams): Promise<Types.MemberInvitation | null> {
  return await get(`/memberInvitation?${new URLSearchParams(params).toString()}`);
}

type memberInvitationsDataParams = {
  receiverId: string;
}

export async function memberInvitations(params: memberInvitationsDataParams): Promise<Types.MemberInvitation[]> {
  return (await get(`/memberInvitations?${new URLSearchParams(params).toString()}`)) ?? [];
}

type notificationsDataParams = {
  region: string;
}

export async function notifications(params: notificationsDataParams): Promise<Types.Notification[]> {
  return (await get(`/notifications?${new URLSearchParams(params).toString()}`)) ?? [];
}

type announcementsDataParams = {
  region: string;
}

export async function announcements(params: announcementsDataParams): Promise<Types.Announcement[]> {
  return (await get(`/announcements?${new URLSearchParams(params).toString()}`)) ?? [];
}

type recommendServersDataParams = {
  region: string;
}

export async function recommendServers(params: recommendServersDataParams): Promise<Types.RecommendServer[]> {
  return (await get(`/recommendServers?${new URLSearchParams(params).toString()}`)) ?? [];
}

type uploadImageDataParams = {
  folder: string;
  imageName: string;
  imageUnit8Array: Uint8Array;
}

export async function uploadImage(params: uploadImageDataParams): Promise<{ imageName: string; imageUrl: string } | null> {
  const formData = new FormData();
  formData.append('folder', params.folder);
  formData.append('imageName', params.imageName);
  formData.append('image', new Blob([params.imageUnit8Array], { type: 'image/webp' }), `${params.imageName}.webp`);
  return await post('/upload/image', formData);
}

type searchServerDataParams = {
  query: string;
}

export async function searchServer(params: searchServerDataParams): Promise<Types.Server[]> {
  return (await get(`/server/search?${new URLSearchParams(params).toString()}`)) ?? [];
}

type searchUserDataParams = {
  query: string;
}

export async function searchUser(params: searchUserDataParams): Promise<Types.User[]> {
  return (await get(`/user/search?${new URLSearchParams(params).toString()}`)) ?? [];
}

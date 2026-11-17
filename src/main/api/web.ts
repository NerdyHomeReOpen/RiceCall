import { getToken } from '@/api';

import type * as Types from '@/types';

import {
  fetchUser as _fetchUser,
  fetchFriend as _fetchFriend,
  fetchFriends as _fetchFriends,
  fetchFriendActivities as _fetchFriendActivities,
  fetchFriendGroup as _fetchFriendGroup,
  fetchFriendGroups as _fetchFriendGroups,
  fetchFriendApplication as _fetchFriendApplication,
  fetchFriendApplications as _fetchFriendApplications,
  fetchServer as _fetchServer,
  fetchServers as _fetchServers,
  fetchServerMembers as _fetchServerMembers,
  fetchServerOnlineMembers as _fetchServerOnlineMembers,
  fetchChannel as _fetchChannel,
  fetchChannels as _fetchChannels,
  fetchChannelMembers as _fetchChannelMembers,
  fetchMember as _fetchMember,
  fetchMemberApplication as _fetchMemberApplication,
  fetchMemberApplications as _fetchMemberApplications,
  fetchMemberInvitation as _fetchMemberInvitation,
  fetchMemberInvitations as _fetchMemberInvitations,
  fetchNotifications as _fetchNotifications,
  fetchAnnouncements as _fetchAnnouncements,
  fetchRecommendServers as _fetchRecommendServers,
  uploadImage as _uploadImage,
  searchServer as _searchServer,
  searchUser as _searchUser,
} from '@/services';

export async function fetchUser(params: { userId: string }): Promise<Types.User | null> {
  return await _fetchUser(params);
}

export async function fetchUserHotReload(params: { userId: string }): Promise<Types.User | null> {
  if (!getToken()) return null;
  return await _fetchUser(params);
}

export async function fetchFriend(params: { userId: string; targetId: string }): Promise<Types.Friend | null> {
  return await _fetchFriend(params);
}

export async function fetchFriends(params: { userId: string }): Promise<Types.Friend[]> {
  return await _fetchFriends(params);
}

export async function fetchFriendActivities(params: { userId: string }): Promise<Types.FriendActivity[]> {
  return await _fetchFriendActivities(params);
}

export async function fetchFriendGroup(params: { userId: string; friendGroupId: string }): Promise<Types.FriendGroup | null> {
  return await _fetchFriendGroup(params);
}

export async function fetchFriendGroups(params: { userId: string }): Promise<Types.FriendGroup[]> {
  return await _fetchFriendGroups(params);
}

export async function fetchFriendApplication(params: { receiverId: string; senderId: string }): Promise<Types.FriendApplication | null> {
  return await _fetchFriendApplication(params);
}

export async function fetchFriendApplications(params: { receiverId: string }): Promise<Types.FriendApplication[]> {
  return await _fetchFriendApplications(params);
}

export async function fetchServer(params: { userId: string; serverId: string }): Promise<Types.Server | null> {
  return await _fetchServer(params);
}

export async function fetchServers(params: { userId: string }): Promise<Types.Server[]> {
  return await _fetchServers(params);
}

export async function fetchServerMembers(params: { serverId: string }): Promise<Types.Member[]> {
  return await _fetchServerMembers(params);
}

export async function fetchServerOnlineMembers(params: { serverId: string }): Promise<Types.OnlineMember[]> {
  return await _fetchServerOnlineMembers(params);
}

export async function fetchChannel(params: { userId: string; serverId: string; channelId: string }): Promise<Types.Channel | null> {
  return await _fetchChannel(params);
}

export async function fetchChannels(params: { userId: string; serverId: string }): Promise<Types.Channel[]> {
  return await _fetchChannels(params);
}

export async function fetchChannelMembers(params: { serverId: string; channelId: string }): Promise<Types.Member[]> {
  return await _fetchChannelMembers(params);
}

export async function fetchMember(params: { userId: string; serverId: string; channelId?: string }): Promise<Types.Member | null> {
  return await _fetchMember(params);
}

export async function fetchMemberApplication(params: { userId: string; serverId: string }): Promise<Types.MemberApplication | null> {
  return await _fetchMemberApplication(params);
}

export async function fetchMemberApplications(params: { serverId: string }): Promise<Types.MemberApplication[]> {
  return await _fetchMemberApplications(params);
}

export async function fetchMemberInvitation(params: { receiverId: string; serverId: string }): Promise<Types.MemberInvitation | null> {
  return await _fetchMemberInvitation(params);
}

export async function fetchMemberInvitations(params: { receiverId: string }): Promise<Types.MemberInvitation[]> {
  return await _fetchMemberInvitations(params);
}

export async function fetchNotifications(params: { region: string }): Promise<Types.Notification[]> {
  return await _fetchNotifications(params);
}

export async function fetchAnnouncements(params: { region: string }): Promise<Types.Announcement[]> {
  return await _fetchAnnouncements(params);
}

export async function fetchRecommendServers(params: { region: string }): Promise<Types.RecommendServer[]> {
  return await _fetchRecommendServers(params);
}

export async function uploadImage(params: {
  folder: string;
  imageName: string;
  imageUnit8Array: Uint8Array;
  targetServerId?: string;
  targetChannelId?: string;
}): Promise<{ imageName: string; imageUrl: string } | null> {
  return await _uploadImage(params);
}

export async function searchServer(params: { query: string }): Promise<Types.Server[]> {
  return await _searchServer(params);
}

export async function searchUser(params: { query: string }): Promise<Types.User[]> {
  return await _searchUser(params);
}

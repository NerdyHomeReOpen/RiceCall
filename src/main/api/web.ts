import { getToken } from '@/api';

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

export async function fetchUser(params: { userId: string }) {
  return await _fetchUser(params);
}

export async function fetchUserHotReload(params: { userId: string }) {
  if (!getToken()) return null;
  return await _fetchUser(params);
}

export async function fetchFriend(params: { userId: string; targetId: string }) {
  return await _fetchFriend(params);
}

export async function fetchFriends(params: { userId: string }) {
  return await _fetchFriends(params);
}

export async function fetchFriendActivities(params: { userId: string }) {
  return await _fetchFriendActivities(params);
}

export async function fetchFriendGroup(params: { userId: string; friendGroupId: string }) {
  return await _fetchFriendGroup(params);
}

export async function fetchFriendGroups(params: { userId: string }) {
  return await _fetchFriendGroups(params);
}

export async function fetchFriendApplication(params: { receiverId: string; senderId: string }) {
  return await _fetchFriendApplication(params);
}

export async function fetchFriendApplications(params: { receiverId: string }) {
  return await _fetchFriendApplications(params);
}

export async function fetchServer(params: { userId: string; serverId: string }) {
  return await _fetchServer(params);
}

export async function fetchServers(params: { userId: string }) {
  return await _fetchServers(params);
}

export async function fetchServerMembers(params: { serverId: string }) {
  return await _fetchServerMembers(params);
}

export async function fetchServerOnlineMembers(params: { serverId: string }) {
  return await _fetchServerOnlineMembers(params);
}

export async function fetchChannel(params: { userId: string; serverId: string; channelId: string }) {
  return await _fetchChannel(params);
}

export async function fetchChannels(params: { userId: string; serverId: string }) {
  return await _fetchChannels(params);
}

export async function fetchChannelMembers(params: { serverId: string; channelId: string }) {
  return await _fetchChannelMembers(params);
}

export async function fetchMember(params: { userId: string; serverId: string; channelId?: string }) {
  return await _fetchMember(params);
}

export async function fetchMemberApplication(params: { userId: string; serverId: string }) {
  return await _fetchMemberApplication(params);
}

export async function fetchMemberApplications(params: { serverId: string }) {
  return await _fetchMemberApplications(params);
}

export async function fetchMemberInvitation(params: { receiverId: string; serverId: string }) {
  return await _fetchMemberInvitation(params);
}

export async function fetchMemberInvitations(params: { receiverId: string }) {
  return await _fetchMemberInvitations(params);
}

export async function fetchNotifications(params: { region: string }) {
  return await _fetchNotifications(params);
}

export async function fetchAnnouncements(params: { region: string }) {
  return await _fetchAnnouncements(params);
}

export async function fetchRecommendServers(params: { region: string }) {
  return await _fetchRecommendServers(params);
}

export async function uploadImage(params: { folder: string; imageName: string; imageUnit8Array: Uint8Array }) {
  return await _uploadImage(params);
}

export async function searchServer(params: { query: string }) {
  return await _searchServer(params);
}

export async function searchUser(params: { query: string }) {
  return await _searchUser(params);
}

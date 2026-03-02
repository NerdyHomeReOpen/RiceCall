import * as Data from '@/data';
import { getToken } from '@/token';

export async function dataUser(params: { userId: string }) {
  return await Data.user(params);
}

export async function dataUserHotReload(params: { userId: string }) {
  if (!getToken()) return null;
  return await Data.user(params);
}

export async function dataFriend(params: { userId: string; targetId: string }) {
  return await Data.friend(params);
}

export async function dataFriends(params: { userId: string }) {
  return await Data.friends(params);
}

export async function dataFriendActivities(params: { userId: string }) {
  return await Data.friendActivities(params);
}

export async function dataFriendGroup(params: { userId: string; friendGroupId: string }) {
  return await Data.friendGroup(params);
}

export async function dataFriendGroups(params: { userId: string }) {
  return await Data.friendGroups(params);
}

export async function dataFriendApplication(params: { receiverId: string; senderId: string }) {
  return await Data.friendApplication(params);
}

export async function dataFriendApplications(params: { receiverId: string }) {
  return await Data.friendApplications(params);
}

export async function dataServer(params: { userId: string; serverId: string }) {
  return await Data.server(params);
}

export async function dataServers(params: { userId: string }) {
  return await Data.servers(params);
}

export async function dataServerMembers(params: { serverId: string }) {
  return await Data.serverMembers(params);
}

export async function dataServerOnlineMembers(params: { serverId: string }) {
  return await Data.serverOnlineMembers(params);
}

export async function dataChannel(params: { userId: string; serverId: string; channelId: string }) {
  return await Data.channel(params);
}

export async function dataChannels(params: { userId: string; serverId: string }) {
  return await Data.channels(params);
}

export async function dataChannelMembers(params: { serverId: string; channelId: string }) {
  return await Data.channelMembers(params);
}

export async function dataMember(params: { userId: string; serverId: string; channelId?: string }) {
  return await Data.member(params);
}

export async function dataMemberApplication(params: { userId: string; serverId: string }) {
  return await Data.memberApplication(params);
}

export async function dataMemberApplications(params: { serverId: string }) {
  return await Data.memberApplications(params);
}

export async function dataMemberInvitation(params: { receiverId: string; serverId: string }) {
  return await Data.memberInvitation(params);
}

export async function dataMemberInvitations(params: { receiverId: string }) {
  return await Data.memberInvitations(params);
}

export async function dataNotifications(params: { region: string }) {
  return await Data.notifications(params);
}

export async function dataAnnouncements(params: { region: string }) {
  return await Data.announcements(params);
}

export async function dataRecommendServers(params: { region: string }) {
  return await Data.recommendServers(params);
}

export async function dataUploadImage(params: { folder: string; imageName: string; imageUnit8Array: Uint8Array }) {
  return await Data.uploadImage(params);
}

export async function dataSearchServer(params: { query: string }) {
  return await Data.searchServer(params);
}

export async function dataSearchUser(params: { query: string }) {
  return await Data.searchUser(params);
}

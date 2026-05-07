import { ipcMain } from 'electron';

import { getToken } from '@/api';

import {
  fetchUser,
  fetchFriend,
  fetchFriends,
  fetchFriendActivities,
  fetchFriendGroup,
  fetchFriendGroups,
  fetchFriendApplication,
  fetchFriendApplications,
  fetchServer,
  fetchServers,
  fetchServerMembers,
  fetchServerOnlineMembers,
  fetchChannel,
  fetchChannels,
  fetchChannelMembers,
  fetchMember,
  fetchMemberApplication,
  fetchMemberApplications,
  fetchMemberInvitation,
  fetchMemberInvitations,
  fetchNotifications,
  fetchAnnouncements,
  fetchRecommendServers,
  uploadImage,
  searchServer,
  searchUser,
} from '@/services';

export function registerApiHandlers() {
  ipcMain.handle('fetch-user', async (_, params: { userId: string }) => {
    return await fetchUser(params);
  });

  ipcMain.handle('fetch-user-hot-reload', async (_, params: { userId: string }) => {
    if (!getToken()) return null;
    return await fetchUser(params);
  });

  ipcMain.handle('fetch-friend', async (_, params: { userId: string; targetId: string }) => {
    return await fetchFriend(params);
  });

  ipcMain.handle('fetch-friends', async (_, params: { userId: string }) => {
    return await fetchFriends(params);
  });

  ipcMain.handle('fetch-friend-activities', async (_, params: { userId: string }) => {
    return await fetchFriendActivities(params);
  });

  ipcMain.handle('fetch-friend-group', async (_, params: { userId: string; friendGroupId: string }) => {
    return await fetchFriendGroup(params);
  });

  ipcMain.handle('fetch-friend-groups', async (_, params: { userId: string }) => {
    return await fetchFriendGroups(params);
  });

  ipcMain.handle('fetch-friend-application', async (_, params: { receiverId: string; senderId: string }) => {
    return await fetchFriendApplication(params);
  });

  ipcMain.handle('fetch-friend-applications', async (_, params: { receiverId: string }) => {
    return await fetchFriendApplications(params);
  });

  ipcMain.handle('fetch-server', async (_, params: { userId: string; serverId: string }) => {
    return await fetchServer(params);
  });

  ipcMain.handle('fetch-servers', async (_, params: { userId: string }) => {
    return await fetchServers(params);
  });

  ipcMain.handle('fetch-server-members', async (_, params: { serverId: string }) => {
    return await fetchServerMembers(params);
  });

  ipcMain.handle('fetch-server-online-members', async (_, params: { serverId: string }) => {
    return await fetchServerOnlineMembers(params);
  });

  ipcMain.handle('fetch-channel', async (_, params: { userId: string; serverId: string; channelId: string }) => {
    return await fetchChannel(params);
  });

  ipcMain.handle('fetch-channels', async (_, params: { userId: string; serverId: string }) => {
    return await fetchChannels(params);
  });

  ipcMain.handle('fetch-channel-members', async (_, params: { serverId: string; channelId: string }) => {
    return await fetchChannelMembers(params);
  });

  ipcMain.handle('fetch-member', async (_, params: { userId: string; serverId: string; channelId?: string }) => {
    return await fetchMember(params);
  });

  ipcMain.handle('fetch-member-application', async (_, params: { userId: string; serverId: string }) => {
    return await fetchMemberApplication(params);
  });

  ipcMain.handle('fetch-member-applications', async (_, params: { serverId: string }) => {
    return await fetchMemberApplications(params);
  });

  ipcMain.handle('fetch-member-invitation', async (_, params: { receiverId: string; serverId: string }) => {
    return await fetchMemberInvitation(params);
  });

  ipcMain.handle('fetch-member-invitations', async (_, params: { receiverId: string }) => {
    return await fetchMemberInvitations(params);
  });

  ipcMain.handle('fetch-notifications', async (_, params: { region: string }) => {
    return await fetchNotifications(params);
  });

  ipcMain.handle('fetch-announcements', async (_, params: { region: string }) => {
    return await fetchAnnouncements(params);
  });

  ipcMain.handle('fetch-recommend-servers', async (_, params: { region: string }) => {
    return await fetchRecommendServers(params);
  });

  ipcMain.handle('upload-image', async (_, params: { folder: string; imageName: string; imageUnit8Array: Uint8Array }) => {
    return await uploadImage(params);
  });

  ipcMain.handle('search-server', async (_, params: { query: string }) => {
    return await searchServer(params);
  });

  ipcMain.handle('search-user', async (_, params: { query: string }) => {
    return await searchUser(params);
  });
}

import { ipcMain } from 'electron';
import * as Data from '@/data.service.js';
import { getToken } from '@/auth.token.js';

export default function registerDataHandlers() {
  ipcMain.handle('data-user', async (_, params: { userId: string }) => {
    return await Data.user(params);
  });

  ipcMain.handle('data-user-hot-reload', async (_, params: { userId: string }) => {
    if (!getToken()) return null;
    return await Data.user(params);
  });

  ipcMain.handle('data-friend', async (_, params: { userId: string; targetId: string }) => {
    return await Data.friend(params);
  });

  ipcMain.handle('data-friends', async (_, params: { userId: string }) => {
    return await Data.friends(params);
  });

  ipcMain.handle('data-friendActivities', async (_, params: { userId: string }) => {
    return await Data.friendActivities(params);
  });

  ipcMain.handle('data-friendGroup', async (_, params: { userId: string; friendGroupId: string }) => {
    return await Data.friendGroup(params);
  });

  ipcMain.handle('data-friendGroups', async (_, params: { userId: string }) => {
    return await Data.friendGroups(params);
  });

  ipcMain.handle('data-friendApplication', async (_, params: { receiverId: string; senderId: string }) => {
    return await Data.friendApplication(params);
  });

  ipcMain.handle('data-friendApplications', async (_, params: { receiverId: string }) => {
    return await Data.friendApplications(params);
  });

  ipcMain.handle('data-server', async (_, params: { userId: string; serverId: string }) => {
    return await Data.server(params);
  });

  ipcMain.handle('data-servers', async (_, params: { userId: string }) => {
    return await Data.servers(params);
  });

  ipcMain.handle('data-serverMembers', async (_, params: { serverId: string }) => {
    return await Data.serverMembers(params);
  });

  ipcMain.handle('data-serverOnlineMembers', async (_, params: { serverId: string }) => {
    return await Data.serverOnlineMembers(params);
  });

  ipcMain.handle('data-channel', async (_, params: { userId: string; serverId: string; channelId: string }) => {
    return await Data.channel(params);
  });

  ipcMain.handle('data-channels', async (_, params: { userId: string; serverId: string }) => {
    return await Data.channels(params);
  });

  ipcMain.handle('data-channelMembers', async (_, params: { serverId: string; channelId: string }) => {
    return await Data.channelMembers(params);
  });

  ipcMain.handle('data-member', async (_, params: { userId: string; serverId: string; channelId?: string }) => {
    return await Data.member(params);
  });

  ipcMain.handle('data-memberApplication', async (_, params: { userId: string; serverId: string }) => {
    return await Data.memberApplication(params);
  });

  ipcMain.handle('data-memberApplications', async (_, params: { serverId: string }) => {
    return await Data.memberApplications(params);
  });

  ipcMain.handle('data-memberInvitation', async (_, params: { receiverId: string; serverId: string }) => {
    return await Data.memberInvitation(params);
  });

  ipcMain.handle('data-memberInvitations', async (_, params: { receiverId: string }) => {
    return await Data.memberInvitations(params);
  });

  ipcMain.handle('data-notifications', async (_, params: { region: string }) => {
    return await Data.notifications(params);
  });

  ipcMain.handle('data-announcements', async (_, params: { region: string }) => {
    return await Data.announcements(params);
  });

  ipcMain.handle('data-recommendServers', async (_, params: { region: string }) => {
    return await Data.recommendServers(params);
  });

  ipcMain.handle('data-uploadImage', async (_, params: { folder: string; imageName: string; imageUnit8Array: Uint8Array }) => {
    return await Data.uploadImage(params);
  });

  ipcMain.handle('data-searchServer', async (_, params: { query: string }) => {
    return await Data.searchServer(params);
  });

  ipcMain.handle('data-searchUser', async (_, params: { query: string }) => {
    return await Data.searchUser(params);
  });
}

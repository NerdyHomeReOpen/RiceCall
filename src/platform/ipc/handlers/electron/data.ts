import { IpcMain } from 'electron';
import * as DataService from '@/data.service';
import { getToken } from '@/auth.token';

export function registerDataHandlers(ipcMain: IpcMain) {
  // Data handlers
  ipcMain.handle('data-user', async (_, params: { userId: string }) => {
    return await DataService.user(params);
  });

  ipcMain.handle('data-user-hot-reload', async (_, params: { userId: string }) => {
    if (!getToken()) return null;
    return await DataService.user(params);
  });

  ipcMain.handle('data-friend', async (_, params: { userId: string; targetId: string }) => {
    return await DataService.friend(params);
  });

  ipcMain.handle('data-friends', async (_, params: { userId: string }) => {
    return await DataService.friends(params);
  });

  ipcMain.handle('data-friendActivities', async (_, params: { userId: string }) => {
    return await DataService.friendActivities(params);
  });

  ipcMain.handle('data-friendGroup', async (_, params: { userId: string; friendGroupId: string }) => {
    return await DataService.friendGroup(params);
  });

  ipcMain.handle('data-friendGroups', async (_, params: { userId: string }) => {
    return await DataService.friendGroups(params);
  });

  ipcMain.handle('data-friendApplication', async (_, params: { receiverId: string; senderId: string }) => {
    return await DataService.friendApplication(params);
  });

  ipcMain.handle('data-friendApplications', async (_, params: { receiverId: string }) => {
    return await DataService.friendApplications(params);
  });

  ipcMain.handle('data-server', async (_, params: { userId: string; serverId: string }) => {
    return await DataService.server(params);
  });

  ipcMain.handle('data-servers', async (_, params: { userId: string }) => {
    return await DataService.servers(params);
  });

  ipcMain.handle('data-serverMembers', async (_, params: { serverId: string }) => {
    return await DataService.serverMembers(params);
  });

  ipcMain.handle('data-serverOnlineMembers', async (_, params: { serverId: string }) => {
    return await DataService.serverOnlineMembers(params);
  });

  ipcMain.handle('data-channel', async (_, params: { userId: string; serverId: string; channelId: string }) => {
    return await DataService.channel(params);
  });

  ipcMain.handle('data-channels', async (_, params: { userId: string; serverId: string }) => {
    return await DataService.channels(params);
  });

  ipcMain.handle('data-channelMembers', async (_, params: { serverId: string; channelId: string }) => {
    return await DataService.channelMembers(params);
  });

  ipcMain.handle('data-member', async (_, params: { userId: string; serverId: string; channelId?: string }) => {
    return await DataService.member(params);
  });

  ipcMain.handle('data-memberApplication', async (_, params: { userId: string; serverId: string }) => {
    return await DataService.memberApplication(params);
  });

  ipcMain.handle('data-memberApplications', async (_, params: { serverId: string }) => {
    return await DataService.memberApplications(params);
  });

  ipcMain.handle('data-memberInvitation', async (_, params: { receiverId: string; serverId: string }) => {
    return await DataService.memberInvitation(params);
  });

  ipcMain.handle('data-memberInvitations', async (_, params: { receiverId: string }) => {
    return await DataService.memberInvitations(params);
  });

  ipcMain.handle('data-notifications', async (_, params: { region: string }) => {
    return await DataService.notifications(params);
  });

  ipcMain.handle('data-announcements', async (_, params: { region: string }) => {
    return await DataService.announcements(params);
  });

  ipcMain.handle('data-recommendServers', async (_, params: { region: string }) => {
    return await DataService.recommendServers(params);
  });

  ipcMain.handle('data-uploadImage', async (_, params: { folder: string; imageName: string; imageUnit8Array: Uint8Array }) => {
    return await DataService.uploadImage(params);
  });

  ipcMain.handle('data-searchServer', async (_, params: { query: string }) => {
    return await DataService.searchServer(params);
  });

  ipcMain.handle('data-searchUser', async (_, params: { query: string }) => {
    return await DataService.searchUser(params);
  });
}
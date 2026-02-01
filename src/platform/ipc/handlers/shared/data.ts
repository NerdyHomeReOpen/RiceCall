import type { IpcRouter } from '../../router';
import * as DataService from '@/data.service';
import { getToken } from '@/auth.token';

/**
 * Shared data handlers logic.
 * Exposes DataService methods via IPC channels.
 */
export function registerSharedDataHandlers(ipc: IpcRouter) {
  ipc.handle('data-user', async (_, params: { userId: string }) => {
    return await DataService.user(params);
  });

  ipc.handle('data-user-hot-reload', async (_, params: { userId: string }) => {
    if (!getToken()) return null;
    return await DataService.user(params);
  });

  ipc.handle('data-friend', async (_, params: { userId: string; targetId: string }) => {
    return await DataService.friend(params);
  });

  ipc.handle('data-friends', async (_, params: { userId: string }) => {
    return await DataService.friends(params);
  });

  ipc.handle('data-friendActivities', async (_, params: { userId: string }) => {
    return await DataService.friendActivities(params);
  });

  ipc.handle('data-friendGroup', async (_, params: { userId: string; friendGroupId: string }) => {
    return await DataService.friendGroup(params);
  });

  ipc.handle('data-friendGroups', async (_, params: { userId: string }) => {
    return await DataService.friendGroups(params);
  });

  ipc.handle('data-friendApplication', async (_, params: { receiverId: string; senderId: string }) => {
    return await DataService.friendApplication(params);
  });

  ipc.handle('data-friendApplications', async (_, params: { receiverId: string }) => {
    return await DataService.friendApplications(params);
  });

  ipc.handle('data-server', async (_, params: { userId: string; serverId: string }) => {
    return await DataService.server(params);
  });

  ipc.handle('data-servers', async (_, params: { userId: string }) => {
    return await DataService.servers(params);
  });

  ipc.handle('data-serverMembers', async (_, params: { serverId: string }) => {
    return await DataService.serverMembers(params);
  });

  ipc.handle('data-serverOnlineMembers', async (_, params: { serverId: string }) => {
    return await DataService.serverOnlineMembers(params);
  });

  ipc.handle('data-channel', async (_, params: { userId: string; serverId: string; channelId: string }) => {
    return await DataService.channel(params);
  });

  ipc.handle('data-channels', async (_, params: { userId: string; serverId: string }) => {
    return await DataService.channels(params);
  });

  ipc.handle('data-channelMembers', async (_, params: { serverId: string; channelId: string }) => {
    return await DataService.channelMembers(params);
  });

  ipc.handle('data-member', async (_, params: { userId: string; serverId: string; channelId?: string }) => {
    return await DataService.member(params);
  });

  ipc.handle('data-memberApplication', async (_, params: { userId: string; serverId: string }) => {
    return await DataService.memberApplication(params);
  });

  ipc.handle('data-memberApplications', async (_, params: { serverId: string }) => {
    return await DataService.memberApplications(params);
  });

  ipc.handle('data-memberInvitation', async (_, params: { receiverId: string; serverId: string }) => {
    return await DataService.memberInvitation(params);
  });

  ipc.handle('data-memberInvitations', async (_, params: { receiverId: string }) => {
    return await DataService.memberInvitations(params);
  });

  // eslint-disable-next-line
  ipc.handle('data-notifications', async (_, params: { region: any }) => {
    return await DataService.notifications(params);
  });

  // eslint-disable-next-line
  ipc.handle('data-announcements', async (_, params: { region: any }) => {
    return await DataService.announcements(params);
  });

  // eslint-disable-next-line
  ipc.handle('data-recommendServers', async (_, params: { region: any }) => {
    return await DataService.recommendServers(params);
  });

  ipc.handle('data-uploadImage', async (_, params: { folder: string; imageName: string; imageUnit8Array: Uint8Array }) => {
    return await DataService.uploadImage(params);
  });

  ipc.handle('data-searchServer', async (_, params: { query: string }) => {
    return await DataService.searchServer(params);
  });

  ipc.handle('data-searchUser', async (_, params: { query: string }) => {
    return await DataService.searchUser(params);
  });
}

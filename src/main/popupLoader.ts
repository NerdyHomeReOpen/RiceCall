/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSettings } from '../../main.js';

// Services
import data from './data.service.js';

const popupLoaders: Record<string, (data: any) => Promise<any>> = {
  applyMember: async ({ userId, serverId }: { userId: string; serverId: string }) => {
    const [server, memberApplication] = await Promise.all([data.server({ userId, serverId }), data.memberApplication({ userId, serverId })]);

    return { server, memberApplication };
  },

  applyFriend: async ({ userId, targetId }: { userId: string; targetId: string }) => {
    const [target, friendGroups, friendApplication, receivedFriendApplication] = await Promise.all([
      data.user({ userId: targetId }),
      data.friendGroups({ userId }),
      data.friendApplication({ senderId: userId, receiverId: targetId }),
      data.friendApplication({ senderId: targetId, receiverId: userId }),
    ]);

    if (!receivedFriendApplication) {
      return { userId, targetId, target, friendGroups, friendApplication };
    }
    return { isApprove: true, targetId, friendGroups };
  },

  approveFriend: async ({ userId, targetId }: { userId: string; targetId: string }) => {
    const [friendGroups] = await Promise.all([data.friendGroups({ userId })]);

    return { targetId, friendGroups };
  },

  blockMember: async ({ userId, serverId }: { userId: string; serverId: string }) => {
    const [member] = await Promise.all([data.member({ userId, serverId })]);

    return { serverId, member };
  },

  channelEvent: async ({ userId, serverId, channelEvents }: { userId: string; serverId: string; channelEvents: Record<string, string>[] }) => {
    const [user, server, channels, serverOnlineMembers] = await Promise.all([
      data.user({ userId }),
      data.server({ userId, serverId }),
      data.channels({ userId, serverId }),
      data.serverOnlineMembers({ serverId }),
    ]);

    return { user, server, channels, serverOnlineMembers, channelEvents };
  },

  channelSetting: async ({ userId, serverId, channelId }: { userId: string; serverId: string; channelId: string }) => {
    const [user, server, channel, channelMembers] = await Promise.all([
      data.user({ userId }),
      data.server({ userId, serverId }),
      data.channel({ userId, serverId, channelId }),
      data.channelMembers({ serverId, channelId }),
    ]);

    return { userId, serverId, channelId, user, server, channel, channelMembers };
  },

  createServer: async ({ userId }: { userId: string }) => {
    const [user, servers] = await Promise.all([data.user({ userId }), data.servers({ userId })]);

    return { userId, user, servers };
  },

  createChannel: async ({ userId, serverId, channelId }: { userId: string; serverId: string; channelId: string }) => {
    if (!channelId) {
      return { userId, serverId };
    }

    const [parent] = await Promise.all([data.channel({ userId, serverId, channelId })]);

    return { userId, serverId, channelId, parent };
  },

  chatHistory: async ({ userId, targetId }: { userId: string; targetId: string }) => {
    const [user, friend, target] = await Promise.all([data.user({ userId }), data.friend({ userId, targetId }), data.user({ userId: targetId })]);

    return { userId, targetId, user, friend, target };
  },

  directMessage: async ({ userId, targetId, event, message }: { userId: string; targetId: string; event: 'directMessage' | 'shakeWindow'; message: any }) => {
    const [user, friend, target] = await Promise.all([data.user({ userId }), data.friend({ userId, targetId }), data.user({ userId: targetId })]);

    return { userId, targetId, user, friend, target, event, message };
  },

  editChannelOrder: async ({ userId, serverId }: { userId: string; serverId: string }) => {
    const [serverChannels] = await Promise.all([data.channels({ userId, serverId })]);

    return { userId, serverId, serverChannels };
  },

  editChannelName: async ({ userId, serverId, channelId }: { userId: string; serverId: string; channelId: string }) => {
    const [channel] = await Promise.all([data.channel({ userId, serverId, channelId })]);

    return { userId, serverId, channelId, channel };
  },

  editFriendNote: async ({ userId, targetId }: { userId: string; targetId: string }) => {
    const [friend, friendGroups] = await Promise.all([data.friend({ userId, targetId }), data.friendGroups({ userId })]);

    return { userId, targetId, friend, friendGroups };
  },

  editFriendGroupName: async ({ userId, friendGroupId }: { userId: string; friendGroupId: string }) => {
    const [friendGroup] = await Promise.all([data.friendGroup({ userId, friendGroupId })]);

    return { userId, friendGroupId, friendGroup };
  },

  editNickname: async ({ userId, serverId }: { userId: string; serverId: string }) => {
    const [member] = await Promise.all([data.member({ userId, serverId })]);

    return { userId, serverId, member };
  },

  friendVerification: async ({ userId }: { userId: string }) => {
    const [friendApplications] = await Promise.all([data.friendApplications({ receiverId: userId })]);

    return { userId, friendApplications };
  },

  inviteMember: async ({ userId, serverId }: { userId: string; serverId: string }) => {
    const [target, memberInvitation] = await Promise.all([data.member({ userId, serverId }), data.memberInvitation({ serverId, receiverId: userId })]);

    return { userId, serverId, target, memberInvitation };
  },

  kickMemberFromServer: async ({ userId, serverId }: { userId: string; serverId: string }) => {
    const [member] = await Promise.all([data.member({ userId, serverId })]);

    return { serverId, member };
  },

  kickMemberFromChannel: async ({ userId, serverId, channelId }: { userId: string; serverId: string; channelId: string }) => {
    const [member] = await Promise.all([data.member({ userId, serverId, channelId })]);
    const [channel] = await Promise.all([data.channel({ userId, serverId, channelId })]);

    return { serverId, channel, member };
  },

  memberApplicationSetting: async ({ userId, serverId }: { userId: string; serverId: string }) => {
    const [server] = await Promise.all([data.server({ userId, serverId })]);

    return { userId, serverId, server };
  },

  memberInvitation: async ({ userId }: { userId: string }) => {
    const [memberInvitations] = await Promise.all([data.memberInvitations({ receiverId: userId })]);

    return { userId, memberInvitations };
  },

  serverSetting: async ({ userId, serverId }: { userId: string; serverId: string }) => {
    const [user, server, serverMembers, memberApplications] = await Promise.all([
      data.user({ userId }),
      data.server({ userId, serverId }),
      data.serverMembers({ serverId }),
      data.memberApplications({ serverId }),
    ]);

    return { userId, serverId, user, server, serverMembers, memberApplications };
  },

  systemSetting: async ({ userId }: { userId: string }) => {
    const [user, systemSettings] = await Promise.all([data.user({ userId }), getSettings()]);

    return { userId, user, systemSettings };
  },

  userInfo: async ({ userId, targetId }: { userId: string; targetId: string }) => {
    const [friend, target, targetServers] = await Promise.all([data.friend({ userId, targetId }), data.user({ userId: targetId }), data.servers({ userId: targetId })]);

    return { userId, targetId, friend, target, targetServers };
  },
};

export default popupLoaders;

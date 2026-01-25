/**
 * Web version of popupLoader.ts.
 * 
 * In Electron, main.ts calls PopupLoader[type](initialData) before opening a popup
 * to fetch all necessary data from DataService.
 * 
 * In web mode, we need to do the same via ipc.data.* which calls the API.
 * This module mirrors popupLoader.ts but uses the web-compatible ipc.data calls.
 */

import ipc from '@/ipc';
import type * as Types from '@/types';

type LoaderInput = Record<string, unknown>;
type LoaderFn = (data: LoaderInput) => Promise<LoaderInput | null>;

export const webPopupLoaders: Partial<Record<Types.PopupType, LoaderFn>> = {
  applyMember: async ({ userId, serverId }) => {
    const [server, memberApplication] = await Promise.all([
      ipc.data.server({ userId: userId as string, serverId: serverId as string }),
      ipc.data.memberApplication({ userId: userId as string, serverId: serverId as string }).catch(() => null),
    ]);
    return { server, memberApplication };
  },

  applyFriend: async ({ userId, targetId }) => {
    const [target, friendGroups, friendApplication] = await Promise.all([
      ipc.data.user({ userId: targetId as string }),
      ipc.data.friendGroups({ userId: userId as string }),
      ipc.data.friendApplication({ senderId: userId as string, receiverId: targetId as string }).catch(() => null),
    ]);
    return { userId, targetId, target, friendGroups, friendApplication };
  },

  approveFriend: async ({ userId, targetId }) => {
    const friendGroups = await ipc.data.friendGroups({ userId: userId as string });
    return { targetId, friendGroups };
  },

  blockMember: async ({ userId, serverId }) => {
    const member = await ipc.data.member({ userId: userId as string, serverId: serverId as string });
    return { serverId, member };
  },

  channelEvent: async ({ userId, serverId, channelEvents }) => {
    const [user, server, channels, serverOnlineMembers] = await Promise.all([
      ipc.data.user({ userId: userId as string }),
      ipc.data.server({ userId: userId as string, serverId: serverId as string }),
      ipc.data.channels({ userId: userId as string, serverId: serverId as string }),
      ipc.data.serverOnlineMembers({ serverId: serverId as string }),
    ]);
    return { user, server, channels, serverOnlineMembers, channelEvents };
  },

  channelSetting: async ({ userId, serverId, channelId }) => {
    const [user, server, channel, channelMembers] = await Promise.all([
      ipc.data.user({ userId: userId as string }),
      ipc.data.server({ userId: userId as string, serverId: serverId as string }),
      ipc.data.channel({ userId: userId as string, serverId: serverId as string, channelId: channelId as string }),
      ipc.data.channelMembers({ serverId: serverId as string, channelId: channelId as string }),
    ]);
    return { userId, serverId, channelId, user, server, channel, channelMembers };
  },

  createServer: async ({ userId }) => {
    const [user, servers] = await Promise.all([
      ipc.data.user({ userId: userId as string }),
      ipc.data.servers({ userId: userId as string }),
    ]);
    if (!user || !servers) return null;
    return { userId, user, servers };
  },

  createChannel: async ({ userId, serverId, channelId }) => {
    if (!channelId) return { userId, serverId };
    const parent = await ipc.data.channel({ userId: userId as string, serverId: serverId as string, channelId: channelId as string });
    return { userId, serverId, channelId, parent };
  },

  chatHistory: async ({ userId, targetId }) => {
    const [user, friend, target] = await Promise.all([
      ipc.data.user({ userId: userId as string }),
      ipc.data.friend({ userId: userId as string, targetId: targetId as string }).catch(() => null),
      ipc.data.user({ userId: targetId as string }),
    ]);
    return { userId, targetId, user, friend, target };
  },

  directMessage: async ({ userId, targetId, event, message }) => {
    const [user, friend, target] = await Promise.all([
      ipc.data.user({ userId: userId as string }),
      ipc.data.friend({ userId: userId as string, targetId: targetId as string }).catch(() => null),
      ipc.data.user({ userId: targetId as string }),
    ]);
    return { userId, targetId, user, friend, target, event, message };
  },

  editChannelOrder: async ({ userId, serverId }) => {
    const serverChannels = await ipc.data.channels({ userId: userId as string, serverId: serverId as string });
    return { userId, serverId, serverChannels };
  },

  editChannelName: async ({ userId, serverId, channelId }) => {
    const channel = await ipc.data.channel({ userId: userId as string, serverId: serverId as string, channelId: channelId as string });
    return { userId, serverId, channelId, channel };
  },

  editFriendNote: async ({ userId, targetId }) => {
    const [friend, friendGroups] = await Promise.all([
      ipc.data.friend({ userId: userId as string, targetId: targetId as string }),
      ipc.data.friendGroups({ userId: userId as string }),
    ]);
    return { userId, targetId, friend, friendGroups };
  },

  editFriendGroupName: async ({ userId, friendGroupId }) => {
    const friendGroup = await ipc.data.friendGroup({ userId: userId as string, friendGroupId: friendGroupId as string });
    return { userId, friendGroupId, friendGroup };
  },

  editNickname: async ({ userId, serverId }) => {
    const member = await ipc.data.member({ userId: userId as string, serverId: serverId as string });
    return { userId, serverId, member };
  },

  friendVerification: async ({ userId }) => {
    const friendApplications = await ipc.data.friendApplications({ receiverId: userId as string });
    return { userId, friendApplications };
  },

  inviteMember: async ({ userId, serverId }) => {
    const [target, memberInvitation] = await Promise.all([
      ipc.data.member({ userId: userId as string, serverId: serverId as string }),
      ipc.data.memberInvitation({ serverId: serverId as string, receiverId: userId as string }).catch(() => null),
    ]);
    return { userId, serverId, target, memberInvitation };
  },

  kickMemberFromServer: async ({ userId, serverId }) => {
    const member = await ipc.data.member({ userId: userId as string, serverId: serverId as string });
    return { serverId, member };
  },

  kickMemberFromChannel: async ({ userId, serverId, channelId }) => {
    const [member, channel] = await Promise.all([
      ipc.data.member({ userId: userId as string, serverId: serverId as string }),
      ipc.data.channel({ userId: userId as string, serverId: serverId as string, channelId: channelId as string }),
    ]);
    return { serverId, channel, member };
  },

  memberApplicationSetting: async ({ userId, serverId }) => {
    const server = await ipc.data.server({ userId: userId as string, serverId: serverId as string });
    return { userId, serverId, server };
  },

  memberInvitation: async ({ userId }) => {
    const memberInvitations = await ipc.data.memberInvitations({ receiverId: userId as string });
    return { userId, memberInvitations };
  },

  serverApplication: async ({ userId, serverId }) => {
    const server = await ipc.data.server({ userId: userId as string, serverId: serverId as string });
    return { userId, serverId, server };
  },

  serverSetting: async ({ userId, serverId }) => {
    const [user, server, serverMembers, memberApplications] = await Promise.all([
      ipc.data.user({ userId: userId as string }),
      ipc.data.server({ userId: userId as string, serverId: serverId as string }),
      ipc.data.serverMembers({ serverId: serverId as string }),
      ipc.data.memberApplications({ serverId: serverId as string }),
    ]);
    return { userId, serverId, user, server, serverMembers, memberApplications };
  },

  systemSetting: async ({ userId }) => {
    const user = await ipc.data.user({ userId: userId as string });
    // In web mode, systemSettings comes from localStorage or defaults.
    const systemSettings = ipc.systemSettings.get() ?? {};
    return { userId, user, systemSettings };
  },

  userInfo: async ({ userId, targetId }) => {
    const [friend, target, targetServers] = await Promise.all([
      ipc.data.friend({ userId: userId as string, targetId: targetId as string }).catch(() => null),
      ipc.data.user({ userId: targetId as string }),
      ipc.data.servers({ userId: targetId as string }),
    ]);
    return { userId, targetId, friend, target, targetServers };
  },

  // userSetting uses the same loader as userInfo
  userSetting: async ({ userId, targetId }) => {
    const [friend, target, targetServers] = await Promise.all([
      ipc.data.friend({ userId: userId as string, targetId: targetId as string }).catch(() => null),
      ipc.data.user({ userId: targetId as string }),
      ipc.data.servers({ userId: targetId as string }),
    ]);
    return { userId, targetId, friend, target, targetServers };
  },

  serverBroadcast: async ({ userId, serverId }) => {
    const [user, server] = await Promise.all([
      ipc.data.user({ userId: userId as string }),
      ipc.data.server({ userId: userId as string, serverId: serverId as string }),
    ]);
    return { userId, serverId, user, server };
  },
};

/**
 * Hydrate popup initialData for web mode.
 * Mirrors what Electron's main.ts does with PopupLoader.
 */
export async function hydratePopupData(
  type: Types.PopupType,
  initialData: Record<string, unknown> | null | undefined
): Promise<Record<string, unknown> | null> {
  if (!initialData) return null;

  const loader = webPopupLoaders[type];
  if (!loader) {
    // No loader defined - return data as-is (some popups like dialogs don't need extra data)
    return initialData;
  }

  try {
    const hydrated = await loader(initialData);
    return hydrated ? { ...initialData, ...hydrated } : null;
  } catch (error) {
    console.error(`[webPopupLoader] Failed to hydrate ${type}:`, error);
    return null;
  }
}

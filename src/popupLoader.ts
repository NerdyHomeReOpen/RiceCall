/* eslint-disable @typescript-eslint/no-explicit-any */
import type * as Types from './types/index.js';

/**
 * Data fetcher interface - injected by the caller
 */
interface DataFetcher {
  user(params: { userId: string }): Promise<Types.User | null>;
  friend(params: { userId: string; targetId: string }): Promise<Types.Friend | null>;
  friendGroup(params: { userId: string; friendGroupId: string }): Promise<Types.FriendGroup | null>;
  friendApplication(params: { senderId: string; receiverId: string }): Promise<Types.FriendApplication | null>;
  server(params: { userId: string; serverId: string }): Promise<Types.Server | null>;
  servers(params: { userId: string }): Promise<Types.Server[]>;
  channel(params: { userId: string; serverId: string; channelId: string }): Promise<Types.Channel | null>;
  channels(params: { userId: string; serverId: string }): Promise<Types.Channel[]>;
  member(params: { userId: string; serverId: string; channelId?: string }): Promise<Types.Member | null>;
  serverMembers(params: { serverId: string }): Promise<Types.Member[]>;
  channelMembers(params: { serverId: string; channelId: string }): Promise<Types.Member[]>;
  memberApplication(params: { userId: string; serverId: string }): Promise<Types.MemberApplication | null>;
  memberInvitation(params: { serverId: string; receiverId: string }): Promise<Types.MemberInvitation | null>;
}

/**
 * Dependencies for popup loaders
 */
interface LoaderDeps {
  data: DataFetcher;
  getSystemSettings: () => Partial<Types.SystemSettings>;
}

let _deps: LoaderDeps | null = null;

/**
 * Initialize the popup loader with dependencies
 * Must be called before using any loader
 */
export function initPopupLoader(deps: LoaderDeps): void {
  _deps = deps;
}

function getDeps(): LoaderDeps {
  if (!_deps) throw new Error('PopupLoader not initialized. Call initPopupLoader first.');
  return _deps;
}

// ============ Popup Loader Functions ============

async function applyFriend({ userId, targetId }: { userId: string; targetId: string }) {
  const { data } = getDeps();
  const [target, friendApplication] = await Promise.all([
    data.user({ userId: targetId }),
    data.friendApplication({ senderId: userId, receiverId: targetId }),
  ]);
  return { userId, targetId, target, friendApplication };
}

async function applyMember({ userId, serverId }: { userId: string; serverId: string }) {
  const { data } = getDeps();
  const [server, memberApplication] = await Promise.all([
    data.server({ userId, serverId }),
    data.memberApplication({ userId, serverId }),
  ]);
  return { userId, serverId, server, memberApplication };
}

async function blockMember({ userId, serverId }: { userId: string; serverId: string }) {
  const { data } = getDeps();
  const member = await data.member({ userId, serverId });
  return { userId, serverId, member };
}

async function channelSetting({ userId, serverId, channelId }: { userId: string; serverId: string; channelId: string }) {
  const { data } = getDeps();
  const [server, channel, channelMembers] = await Promise.all([
    data.server({ userId, serverId }),
    data.channel({ userId, serverId, channelId }),
    data.channelMembers({ serverId, channelId }),
  ]);
  return { userId, serverId, channelId, server, channel, channelMembers };
}

async function createChannel({ userId, serverId, channelId }: { userId: string; serverId: string; channelId: string }) {
  if (!channelId) return { userId, serverId };
  const { data } = getDeps();
  const parent = await data.channel({ userId, serverId, channelId });
  return { userId, serverId, channelId, parent };
}

async function directMessage({ userId, targetId, event, message }: { userId: string; targetId: string; event: 'directMessage' | 'shakeWindow'; message: any }) {
  const { data } = getDeps();
  const [friend, target] = await Promise.all([
    data.friend({ userId, targetId }),
    data.user({ userId: targetId }),
  ]);
  return { userId, targetId, friend, target, event, message };
}

async function editChannelName({ userId, serverId, channelId }: { userId: string; serverId: string; channelId: string }) {
  const { data } = getDeps();
  const channel = await data.channel({ userId, serverId, channelId });
  return { userId, serverId, channelId, channel };
}

async function editChannelOrder({ userId, serverId }: { userId: string; serverId: string }) {
  const { data } = getDeps();
  const channels = await data.channels({ userId, serverId });
  return { userId, serverId, channels };
}

async function editFriendNote({ userId, targetId }: { userId: string; targetId: string }) {
  const { data } = getDeps();
  const friend = await data.friend({ userId, targetId });
  return { userId, targetId, friend };
}

async function editFriendGroupName({ userId, friendGroupId }: { userId: string; friendGroupId: string }) {
  const { data } = getDeps();
  const friendGroup = await data.friendGroup({ userId, friendGroupId });
  return { userId, friendGroupId, friendGroup };
}

async function editNickname({ userId, serverId }: { userId: string; serverId: string }) {
  const { data } = getDeps();
  const member = await data.member({ userId, serverId });
  return { userId, serverId, member };
}

async function inviteFriend({ userId, serverId }: { userId: string; serverId: string }) {
  const { data } = getDeps();
  const server = await data.server({ userId, serverId });
  return { userId, serverId, server };
}

async function inviteMember({ userId, serverId }: { userId: string; serverId: string }) {
  const { data } = getDeps();
  const [target, memberInvitation] = await Promise.all([
    data.member({ userId, serverId }),
    data.memberInvitation({ serverId, receiverId: userId }),
  ]);
  return { userId, serverId, target, memberInvitation };
}

async function kickMemberFromChannel({ userId, serverId, channelId }: { userId: string; serverId: string; channelId: string }) {
  const { data } = getDeps();
  const [member, channel] = await Promise.all([
    data.member({ userId, serverId, channelId }),
    data.channel({ userId, serverId, channelId }),
  ]);
  return { userId, serverId, channelId, channel, member };
}

async function kickMemberFromServer({ userId, serverId }: { userId: string; serverId: string }) {
  const { data } = getDeps();
  const member = await data.member({ userId, serverId });
  return { userId, serverId, member };
}

async function memberApplicationSetting({ userId, serverId }: { userId: string; serverId: string }) {
  const { data } = getDeps();
  const server = await data.server({ userId, serverId });
  return { userId, serverId, server };
}

async function serverApplication({ userId, serverId }: { userId: string; serverId: string }) {
  const { data } = getDeps();
  const server = await data.server({ userId, serverId });
  return { userId, serverId, server };
}

async function serverSetting({ userId, serverId }: { userId: string; serverId: string }) {
  const { data } = getDeps();
  const [server, serverMembers] = await Promise.all([
    data.server({ userId, serverId }),
    data.serverMembers({ serverId }),
  ]);
  return { userId, serverId, server, serverMembers };
}

async function systemSetting({ userId }: { userId: string }) {
  const { data, getSystemSettings } = getDeps();
  const userSettings = await data.user({ userId });
  const systemSettings = getSystemSettings() ?? {};
  return { userId, userSettings, systemSettings };
}

async function userInfo({ userId, targetId }: { userId: string; targetId: string }) {
  const { data } = getDeps();
  const [friend, target, targetServers] = await Promise.all([
    data.friend({ userId, targetId }),
    data.user({ userId: targetId }),
    data.servers({ userId: targetId }),
  ]);
  return { userId, targetId, friend, target, targetServers };
}

// ============ Export Loaders as Object ============

/**
 * All popup loaders as a record
 * Used by main.ts: PopupLoader.loaders[type](initialData)
 */
export const loaders = {
  applyFriend,
  applyMember,
  blockMember,
  channelSetting,
  createChannel,
  directMessage,
  editChannelName,
  editChannelOrder,
  editFriendNote,
  editFriendGroupName,
  editNickname,
  inviteFriend,
  inviteMember,
  kickMemberFromChannel,
  kickMemberFromServer,
  memberApplicationSetting,
  serverApplication,
  serverSetting,
  systemSetting,
  userInfo,
} as const;

export type LoaderType = keyof typeof loaders;

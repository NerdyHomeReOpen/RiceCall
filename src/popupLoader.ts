/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSettings } from '../main.js';
import * as DataService from './data.service.js';

export async function applyFriend({ userId, targetId }: { userId: string; targetId: string }) {
  const targetPromise = DataService.user({ userId: targetId });
  const friendApplicationPromise = DataService.friendApplication({ senderId: userId, receiverId: targetId });

  const [target, friendApplication] = await Promise.all([targetPromise, friendApplicationPromise]).catch((error) => {
    throw error;
  });

  return { userId, targetId, target, friendApplication };
}

export async function applyMember({ userId, serverId }: { userId: string; serverId: string }) {
  const serverPromise = DataService.server({ userId, serverId });
  const memberApplicationPromise = DataService.memberApplication({ userId, serverId });

  const [server, memberApplication] = await Promise.all([serverPromise, memberApplicationPromise]).catch((error) => {
    throw error;
  });

  return { userId, serverId, server, memberApplication };
}

export async function blockMember({ userId, serverId }: { userId: string; serverId: string }) {
  const memberPromise = DataService.member({ userId, serverId });

  const [member] = await Promise.all([memberPromise]).catch((error) => {
    throw error;
  });

  return { userId, serverId, member };
}

export async function channelSetting({ userId, serverId, channelId }: { userId: string; serverId: string; channelId: string }) {
  const serverPromise = DataService.server({ userId, serverId });
  const channelPromise = DataService.channel({ userId, serverId, channelId });
  const channelMembersPromise = DataService.channelMembers({ serverId, channelId });

  const [server, channel, channelMembers] = await Promise.all([serverPromise, channelPromise, channelMembersPromise]).catch((error) => {
    throw error;
  });

  return { userId, serverId, channelId, server, channel, channelMembers };
}

export async function createChannel({ userId, serverId, channelId }: { userId: string; serverId: string; channelId: string }) {
  if (!channelId) return { userId, serverId };

  const parentPromise = DataService.channel({ userId, serverId, channelId });

  const [parent] = await Promise.all([parentPromise]).catch((error) => {
    throw error;
  });

  return { userId, serverId, channelId, parent };
}

export async function directMessage({ userId, targetId, event, message }: { userId: string; targetId: string; event: 'directMessage' | 'shakeWindow'; message: any }) {
  const friendPromise = DataService.friend({ userId, targetId });
  const targetPromise = DataService.user({ userId: targetId });

  const [friend, target] = await Promise.all([friendPromise, targetPromise]).catch((error) => {
    throw error;
  });

  return { userId, targetId, friend, target, event, message };
}

export async function editChannelName({ userId, serverId, channelId }: { userId: string; serverId: string; channelId: string }) {
  const channelPromise = DataService.channel({ userId, serverId, channelId });

  const [channel] = await Promise.all([channelPromise]).catch((error) => {
    throw error;
  });

  return { userId, serverId, channelId, channel };
}

export async function editChannelOrder({ userId, serverId }: { userId: string; serverId: string }) {
  const channelsPromise = DataService.channels({ userId, serverId });

  const [channels] = await Promise.all([channelsPromise]).catch((error) => {
    throw error;
  });

  return { userId, serverId, channels };
}

export async function editFriendNote({ userId, targetId }: { userId: string; targetId: string }) {
  const friendPromise = DataService.friend({ userId, targetId });

  const [friend] = await Promise.all([friendPromise]).catch((error) => {
    throw error;
  });

  return { userId, targetId, friend };
}

export async function editFriendGroupName({ userId, friendGroupId }: { userId: string; friendGroupId: string }) {
  const friendGroupPromise = DataService.friendGroup({ userId, friendGroupId });

  const [friendGroup] = await Promise.all([friendGroupPromise]).catch((error) => {
    throw error;
  });

  return { userId, friendGroupId, friendGroup };
}

export async function editNickname({ userId, serverId }: { userId: string; serverId: string }) {
  const memberPromise = DataService.member({ userId, serverId });

  const [member] = await Promise.all([memberPromise]).catch((error) => {
    throw error;
  });

  return { userId, serverId, member };
}

export async function inviteFriend({ userId, serverId }: { userId: string; serverId: string }) {
  const serverPromise = DataService.server({ userId, serverId });

  const [server] = await Promise.all([serverPromise]).catch((error) => {
    throw error;
  });

  return { userId, serverId, server };
}

export async function inviteMember({ userId, serverId }: { userId: string; serverId: string }) {
  const targetPromise = DataService.member({ userId, serverId });
  const memberInvitationPromise = DataService.memberInvitation({ serverId, receiverId: userId });

  const [target, memberInvitation] = await Promise.all([targetPromise, memberInvitationPromise]).catch((error) => {
    throw error;
  });

  return { userId, serverId, target, memberInvitation };
}

export async function kickMemberFromChannel({ userId, serverId, channelId }: { userId: string; serverId: string; channelId: string }) {
  const memberPromise = DataService.member({ userId, serverId, channelId });
  const channelPromise = DataService.channel({ userId, serverId, channelId });

  const [member, channel] = await Promise.all([memberPromise, channelPromise]).catch((error) => {
    throw error;
  });

  return { userId, serverId, channelId, channel, member };
}

export async function kickMemberFromServer({ userId, serverId }: { userId: string; serverId: string }) {
  const memberPromise = DataService.member({ userId, serverId });

  const [member] = await Promise.all([memberPromise]).catch((error) => {
    throw error;
  });

  return { userId, serverId, member };
}

export async function memberApplicationSetting({ userId, serverId }: { userId: string; serverId: string }) {
  const serverPromise = DataService.server({ userId, serverId });

  const [server] = await Promise.all([serverPromise]).catch((error) => {
    throw error;
  });

  return { userId, serverId, server };
}

export async function serverApplication({ userId, serverId }: { userId: string; serverId: string }) {
  const serverPromise = DataService.server({ userId, serverId });

  const [server] = await Promise.all([serverPromise]).catch((error) => {
    throw error;
  });

  return { userId, serverId, server };
}

export async function serverSetting({ userId, serverId }: { userId: string; serverId: string }) {
  const serverPromise = DataService.server({ userId, serverId });
  const serverMembersPromise = DataService.serverMembers({ serverId });

  const [server, serverMembers] = await Promise.all([serverPromise, serverMembersPromise]).catch((error) => {
    throw error;
  });

  return { userId, serverId, server, serverMembers };
}

export async function systemSetting({ userId }: { userId: string }) {
  const userSettingsPromise = DataService.user({ userId });
  const systemSettings = getSettings();

  const [userSettings] = await Promise.all([userSettingsPromise]).catch((error) => {
    throw error;
  });

  return { userId, userSettings, systemSettings };
}

export async function userInfo({ userId, targetId }: { userId: string; targetId: string }) {
  const friendPromise = DataService.friend({ userId, targetId });
  const targetPromise = DataService.user({ userId: targetId });
  const targetServersPromise = DataService.servers({ userId: targetId });

  const [friend, target, targetServers] = await Promise.all([friendPromise, targetPromise, targetServersPromise]).catch((error) => {
    throw error;
  });

  return { userId, targetId, friend, target, targetServers };
}

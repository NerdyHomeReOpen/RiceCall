/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSettings } from '../main.js';
import * as DataService from './data.service.js';

export async function applyMember({ userId, serverId }: { userId: string; serverId: string }) {
  const serverPromise = DataService.server({ userId, serverId });
  const memberApplicationPromise = DataService.memberApplication({ userId, serverId });

  const [server, memberApplication] = await Promise.all([serverPromise, memberApplicationPromise]).catch((error) => {
    throw error;
  });

  return { server, memberApplication };
}

export async function applyFriend({ userId, targetId }: { userId: string; targetId: string }) {
  const targetPromise = DataService.user({ userId: targetId });
  const friendGroupsPromise = DataService.friendGroups({ userId });
  const friendApplicationPromise = DataService.friendApplication({ senderId: userId, receiverId: targetId });

  const [target, friendGroups, friendApplication] = await Promise.all([targetPromise, friendGroupsPromise, friendApplicationPromise]).catch((error) => {
    throw error;
  });

  return { userId, targetId, target, friendGroups, friendApplication };
}

export async function approveFriend({ userId, targetId }: { userId: string; targetId: string }) {
  const friendGroupsPromise = DataService.friendGroups({ userId });

  const [friendGroups] = await Promise.all([friendGroupsPromise]).catch((error) => {
    throw error;
  });

  return { targetId, friendGroups };
}

export async function blockMember({ userId, serverId }: { userId: string; serverId: string }) {
  const memberPromise = DataService.member({ userId, serverId });

  const [member] = await Promise.all([memberPromise]).catch((error) => {
    throw error;
  });

  return { serverId, member };
}

export async function channelEvent({ userId, serverId, channelEvents }: { userId: string; serverId: string; channelEvents: Record<string, string>[] }) {
  const userPromise = DataService.user({ userId });
  const serverPromise = DataService.server({ userId, serverId });
  const channelsPromise = DataService.channels({ userId, serverId });
  const serverOnlineMembersPromise = DataService.serverOnlineMembers({ serverId });

  const [user, server, channels, serverOnlineMembers] = await Promise.all([userPromise, serverPromise, channelsPromise, serverOnlineMembersPromise]).catch((error) => {
    throw error;
  });

  return { user, server, channels, serverOnlineMembers, channelEvents };
}

export async function channelSetting({ userId, serverId, channelId }: { userId: string; serverId: string; channelId: string }) {
  const userPromise = DataService.user({ userId });
  const serverPromise = DataService.server({ userId, serverId });
  const channelPromise = DataService.channel({ userId, serverId, channelId });
  const channelMembersPromise = DataService.channelMembers({ serverId, channelId });

  const [user, server, channel, channelMembers] = await Promise.all([userPromise, serverPromise, channelPromise, channelMembersPromise]).catch((error) => {
    throw error;
  });

  return { userId, serverId, channelId, user, server, channel, channelMembers };
}

export async function createServer({ userId }: { userId: string }) {
  const userPromise = DataService.user({ userId });
  const serversPromise = DataService.servers({ userId });

  const [user, servers] = await Promise.all([userPromise, serversPromise]).catch((error) => {
    throw error;
  });

  if (!user || !servers) return null;

  return { userId, user, servers };
}

export async function createChannel({ userId, serverId, channelId }: { userId: string; serverId: string; channelId: string }) {
  if (!channelId) return { userId, serverId };

  const parentPromise = DataService.channel({ userId, serverId, channelId });

  const [parent] = await Promise.all([parentPromise]).catch((error) => {
    throw error;
  });

  return { userId, serverId, channelId, parent };
}

export async function chatHistory({ userId, targetId }: { userId: string; targetId: string }) {
  const userPromise = DataService.user({ userId });
  const friendPromise = DataService.friend({ userId, targetId });
  const targetPromise = DataService.user({ userId: targetId });

  const [user, friend, target] = await Promise.all([userPromise, friendPromise, targetPromise]).catch((error) => {
    throw error;
  });

  return { userId, targetId, user, friend, target };
}

export async function directMessage({ userId, targetId, event, message }: { userId: string; targetId: string; event: 'directMessage' | 'shakeWindow'; message: any }) {
  const userPromise = DataService.user({ userId });
  const friendPromise = DataService.friend({ userId, targetId });
  const targetPromise = DataService.user({ userId: targetId });

  const [user, friend, target] = await Promise.all([userPromise, friendPromise, targetPromise]).catch((error) => {
    throw error;
  });

  return { userId, targetId, user, friend, target, event, message };
}

export async function editChannelOrder({ userId, serverId }: { userId: string; serverId: string }) {
  const serverChannelsPromise = DataService.channels({ userId, serverId });

  const [serverChannels] = await Promise.all([serverChannelsPromise]).catch((error) => {
    throw error;
  });

  return { userId, serverId, serverChannels };
}

export async function editChannelName({ userId, serverId, channelId }: { userId: string; serverId: string; channelId: string }) {
  const channelPromise = DataService.channel({ userId, serverId, channelId });

  const [channel] = await Promise.all([channelPromise]).catch((error) => {
    throw error;
  });

  return { userId, serverId, channelId, channel };
}

export async function editFriendNote({ userId, targetId }: { userId: string; targetId: string }) {
  const friendPromise = DataService.friend({ userId, targetId });
  const friendGroupsPromise = DataService.friendGroups({ userId });

  const [friend, friendGroups] = await Promise.all([friendPromise, friendGroupsPromise]).catch((error) => {
    throw error;
  });

  return { userId, targetId, friend, friendGroups };
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

export async function friendVerification({ userId }: { userId: string }) {
  const friendApplicationsPromise = DataService.friendApplications({ receiverId: userId });

  const [friendApplications] = await Promise.all([friendApplicationsPromise]).catch((error) => {
    throw error;
  });

  return { userId, friendApplications };
}

export async function inviteMember({ userId, serverId }: { userId: string; serverId: string }) {
  const targetPromise = DataService.member({ userId, serverId });
  const memberInvitationPromise = DataService.memberInvitation({ serverId, receiverId: userId });

  const [target, memberInvitation] = await Promise.all([targetPromise, memberInvitationPromise]).catch((error) => {
    throw error;
  });

  return { userId, serverId, target, memberInvitation };
}

export async function kickMemberFromServer({ userId, serverId }: { userId: string; serverId: string }) {
  const memberPromise = DataService.member({ userId, serverId });

  const [member] = await Promise.all([memberPromise]).catch((error) => {
    throw error;
  });

  return { serverId, member };
}

export async function kickMemberFromChannel({ userId, serverId, channelId }: { userId: string; serverId: string; channelId: string }) {
  const memberPromise = DataService.member({ userId, serverId, channelId });
  const channelPromise = DataService.channel({ userId, serverId, channelId });

  const [member, channel] = await Promise.all([memberPromise, channelPromise]).catch((error) => {
    throw error;
  });

  return { serverId, channel, member };
}

export async function memberApplicationSetting({ userId, serverId }: { userId: string; serverId: string }) {
  const serverPromise = DataService.server({ userId, serverId });

  const [server] = await Promise.all([serverPromise]).catch((error) => {
    throw error;
  });

  return { userId, serverId, server };
}

export async function memberInvitation({ userId }: { userId: string }) {
  const memberInvitationsPromise = DataService.memberInvitations({ receiverId: userId });

  const [memberInvitations] = await Promise.all([memberInvitationsPromise]).catch((error) => {
    throw error;
  });

  return { userId, memberInvitations };
}

export async function serverApplication({ userId, serverId }: { userId: string; serverId: string }) {
  const serverPromise = DataService.server({ userId, serverId });

  const [server] = await Promise.all([serverPromise]).catch((error) => {
    throw error;
  });

  return { userId, serverId, server };
}

export async function serverSetting({ userId, serverId }: { userId: string; serverId: string }) {
  const userPromise = DataService.user({ userId });
  const serverPromise = DataService.server({ userId, serverId });
  const serverMembersPromise = DataService.serverMembers({ serverId });
  const memberApplicationsPromise = DataService.memberApplications({ serverId });

  const [user, server, serverMembers, memberApplications] = await Promise.all([userPromise, serverPromise, serverMembersPromise, memberApplicationsPromise]).catch((error) => {
    throw error;
  });

  return { userId, serverId, user, server, serverMembers, memberApplications };
}

export async function systemSetting({ userId }: { userId: string }) {
  const userPromise = DataService.user({ userId });
  const systemSettings = getSettings();

  const [user] = await Promise.all([userPromise]).catch((error) => {
    throw error;
  });

  return { userId, user, systemSettings };
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

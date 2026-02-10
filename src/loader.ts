import type * as Types from '@/types';

import * as Data from '@/data.service';

export async function applyMember({ userId, serverId }: { userId: string; serverId: string }) {
  const serverPromise = Data.server({ userId, serverId });
  const memberApplicationPromise = Data.memberApplication({ userId, serverId });

  const [server, memberApplication] = await Promise.all([serverPromise, memberApplicationPromise]);

  return { server, memberApplication };
}

export async function applyFriend({ userId, targetId }: { userId: string; targetId: string }) {
  const targetPromise = Data.user({ userId: targetId });
  const friendGroupsPromise = Data.friendGroups({ userId });
  const friendApplicationPromise = Data.friendApplication({ senderId: userId, receiverId: targetId });

  const [target, friendGroups, friendApplication] = await Promise.all([targetPromise, friendGroupsPromise, friendApplicationPromise]);

  return { userId, targetId, target, friendGroups, friendApplication };
}

export async function approveFriend({ userId, targetId }: { userId: string; targetId: string }) {
  const friendGroupsPromise = Data.friendGroups({ userId });

  const [friendGroups] = await Promise.all([friendGroupsPromise]);

  return { targetId, friendGroups };
}

export async function blockMember({ userId, serverId }: { userId: string; serverId: string }) {
  const memberPromise = Data.member({ userId, serverId });

  const [member] = await Promise.all([memberPromise]);

  return { serverId, member };
}

export async function channelEvent({ userId, serverId, channelEvents }: { userId: string; serverId: string; channelEvents: Record<string, string>[] }) {
  const userPromise = Data.user({ userId });
  const serverPromise = Data.server({ userId, serverId });
  const channelsPromise = Data.channels({ userId, serverId });
  const serverOnlineMembersPromise = Data.serverOnlineMembers({ serverId });

  const [user, server, channels, serverOnlineMembers] = await Promise.all([userPromise, serverPromise, channelsPromise, serverOnlineMembersPromise]);

  return { user, server, channels, serverOnlineMembers, channelEvents };
}

export async function channelSetting({ userId, serverId, channelId }: { userId: string; serverId: string; channelId: string }) {
  const userPromise = Data.user({ userId });
  const serverPromise = Data.server({ userId, serverId });
  const channelPromise = Data.channel({ userId, serverId, channelId });
  const channelMembersPromise = Data.channelMembers({ serverId, channelId });

  const [user, server, channel, channelMembers] = await Promise.all([userPromise, serverPromise, channelPromise, channelMembersPromise]);

  return { userId, serverId, channelId, user, server, channel, channelMembers };
}

export async function createServer({ userId }: { userId: string }) {
  const userPromise = Data.user({ userId });
  const serversPromise = Data.servers({ userId });

  const [user, servers] = await Promise.all([userPromise, serversPromise]);

  if (!user || !servers) return null;

  return { userId, user, servers };
}

export async function createChannel({ userId, serverId, channelId }: { userId: string; serverId: string; channelId: string }) {
  if (!channelId) return { userId, serverId };

  const parentPromise = Data.channel({ userId, serverId, channelId });

  const [parent] = await Promise.all([parentPromise]);

  return { userId, serverId, channelId, parent };
}

export async function chatHistory({ userId, targetId }: { userId: string; targetId: string }) {
  const userPromise = Data.user({ userId });
  const friendPromise = Data.friend({ userId, targetId });
  const targetPromise = Data.user({ userId: targetId });

  const [user, friend, target] = await Promise.all([userPromise, friendPromise, targetPromise]);

  return { userId, targetId, user, friend, target };
}

export async function directMessage({ userId, targetId, event, message }: { userId: string; targetId: string; event: 'directMessage' | 'shakeWindow'; message: unknown }) {
  const userPromise = Data.user({ userId });
  const friendPromise = Data.friend({ userId, targetId });
  const targetPromise = Data.user({ userId: targetId });

  const [user, friend, target] = await Promise.all([userPromise, friendPromise, targetPromise]);

  return { userId, targetId, user, friend, target, event, message };
}

export async function editChannelOrder({ userId, serverId }: { userId: string; serverId: string }) {
  const channelsPromise = Data.channels({ userId, serverId });

  const [channels] = await Promise.all([channelsPromise]);

  return { userId, serverId, channels };
}

export async function editChannelName({ userId, serverId, channelId }: { userId: string; serverId: string; channelId: string }) {
  const channelPromise = Data.channel({ userId, serverId, channelId });

  const [channel] = await Promise.all([channelPromise]);

  return { userId, serverId, channelId, channel };
}

export async function editFriendNote({ userId, targetId }: { userId: string; targetId: string }) {
  const friendPromise = Data.friend({ userId, targetId });
  const friendGroupsPromise = Data.friendGroups({ userId });

  const [friend, friendGroups] = await Promise.all([friendPromise, friendGroupsPromise]);

  return { userId, targetId, friend, friendGroups };
}

export async function editFriendGroupName({ userId, friendGroupId }: { userId: string; friendGroupId: string }) {
  const friendGroupPromise = Data.friendGroup({ userId, friendGroupId });

  const [friendGroup] = await Promise.all([friendGroupPromise]);

  return { userId, friendGroupId, friendGroup };
}

export async function editNickname({ userId, serverId }: { userId: string; serverId: string }) {
  const memberPromise = Data.member({ userId, serverId });

  const [member] = await Promise.all([memberPromise]);

  return { userId, serverId, member };
}

export async function friendVerification({ userId }: { userId: string }) {
  const friendApplicationsPromise = Data.friendApplications({ receiverId: userId });

  const [friendApplications] = await Promise.all([friendApplicationsPromise]);

  return { userId, friendApplications };
}

export async function inviteMember({ userId, serverId }: { userId: string; serverId: string }) {
  const targetPromise = Data.member({ userId, serverId });
  const memberInvitationPromise = Data.memberInvitation({ serverId, receiverId: userId });

  const [target, memberInvitation] = await Promise.all([targetPromise, memberInvitationPromise]);

  return { userId, serverId, target, memberInvitation };
}

export async function kickMemberFromServer({ userId, serverId }: { userId: string; serverId: string }) {
  const memberPromise = Data.member({ userId, serverId });

  const [member] = await Promise.all([memberPromise]);

  return { serverId, member };
}

export async function kickMemberFromChannel({ userId, serverId, channelId }: { userId: string; serverId: string; channelId: string }) {
  const memberPromise = Data.member({ userId, serverId, channelId });
  const channelPromise = Data.channel({ userId, serverId, channelId });

  const [member, channel] = await Promise.all([memberPromise, channelPromise]);

  return { serverId, channel, member };
}

export async function memberApplicationSetting({ userId, serverId }: { userId: string; serverId: string }) {
  const serverPromise = Data.server({ userId, serverId });

  const [server] = await Promise.all([serverPromise]);

  return { userId, serverId, server };
}

export async function memberInvitation({ userId }: { userId: string }) {
  const memberInvitationsPromise = Data.memberInvitations({ receiverId: userId });

  const [memberInvitations] = await Promise.all([memberInvitationsPromise]);

  return { userId, memberInvitations };
}

export async function serverApplication({ userId, serverId }: { userId: string; serverId: string }) {
  const serverPromise = Data.server({ userId, serverId });

  const [server] = await Promise.all([serverPromise]);

  return { userId, serverId, server };
}

export async function serverSetting({ userId, serverId }: { userId: string; serverId: string }) {
  const userPromise = Data.user({ userId });
  const serverPromise = Data.server({ userId, serverId });
  const serverMembersPromise = Data.serverMembers({ serverId });
  const memberApplicationsPromise = Data.memberApplications({ serverId });

  const [user, server, serverMembers, memberApplications] = await Promise.all([userPromise, serverPromise, serverMembersPromise, memberApplicationsPromise]);

  return { userId, serverId, user, server, serverMembers, memberApplications };
}

export async function systemSetting({ userId, systemSettings }: { userId: string; systemSettings: Types.SystemSettings }) {
  const userSettingsPromise = Data.userSettings({ userId });

  const [userSettings] = await Promise.all([userSettingsPromise]);

  return { userId, userSettings, systemSettings };
}

export async function userInfo({ userId, targetId }: { userId: string; targetId: string }) {
  const friendPromise = Data.friend({ userId, targetId });
  const targetPromise = Data.user({ userId: targetId });
  const targetServersPromise = Data.servers({ userId: targetId });

  const [friend, target, targetServers] = await Promise.all([friendPromise, targetPromise, targetServersPromise]);

  return { userId, targetId, friend, target, targetServers };
}

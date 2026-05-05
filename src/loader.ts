import type * as Types from '@/types';

import * as Data from '@/api/data';

export async function applyMember({ userId, serverId }: { userId: string; serverId: string }) {
  const serverPromise = Data.server({ userId, serverId });
  const memberApplicationPromise = Data.memberApplication({ userId, serverId });

  const [server, memberApplication] = await Promise.all([serverPromise, memberApplicationPromise]);

  return { server, memberApplication };
}

export async function applyFriend({ senderId, receiverId }: { senderId: string; receiverId: string }) {
  const receiverPromise = Data.user({ userId: receiverId });
  const friendApplicationPromise = Data.friendApplication({ senderId, receiverId });

  const [receiver, friendApplication] = await Promise.all([receiverPromise, friendApplicationPromise]);

  return { receiver, friendApplication };
}

export async function blockMember({ userId, serverId }: { userId: string; serverId: string }) {
  const memberPromise = Data.member({ userId, serverId });

  const [member] = await Promise.all([memberPromise]);

  return { serverId, member };
}

export async function channelSetting({ userId, serverId, channelId }: { userId: string; serverId: string; channelId: string }) {
  const userPromise = Data.user({ userId });
  const serverPromise = Data.server({ userId, serverId });
  const channelPromise = Data.channel({ userId, serverId, channelId });
  const channelMembersPromise = Data.channelMembers({ serverId, channelId });

  const [user, server, channel, channelMembers] = await Promise.all([userPromise, serverPromise, channelPromise, channelMembersPromise]);

  return { userId, serverId, channelId, user, server, channel, channelMembers };
}

export async function createChannel({ userId, serverId, channelId }: { userId: string; serverId: string; channelId: string }) {
  const parentPromise = Data.channel({ userId, serverId, channelId });

  const [parent] = await Promise.all([parentPromise]);

  return { userId, serverId, channelId, parent };
}

export async function directMessage({ userId, targetId, event, message }: { userId: string; targetId: string; event: 'directMessage' | 'shakeWindow'; message: unknown }) {
  const targetPromise = Data.user({ userId: targetId });

  const [target] = await Promise.all([targetPromise]);

  return { userId, targetId, target, event, message };
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

  const [friend] = await Promise.all([friendPromise]);

  return { userId, targetId, friend };
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

export async function inviteMember({ receiverId, serverId }: { receiverId: string; serverId: string }) {
  const receiverMemberPromise = Data.member({ userId: receiverId, serverId });
  const memberInvitationPromise = Data.memberInvitation({ receiverId, serverId });

  const [receiverMember, memberInvitation] = await Promise.all([receiverMemberPromise, memberInvitationPromise]);

  return { receiverId, serverId, receiverMember, memberInvitation };
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

export async function serverApplication({ userId, serverId }: { userId: string; serverId: string }) {
  const serverPromise = Data.server({ userId, serverId });

  const [server] = await Promise.all([serverPromise]);

  return { userId, serverId, server };
}

export async function serverSetting({ userId, serverId }: { userId: string; serverId: string }) {
  const serverPromise = Data.server({ userId, serverId });
  const serverMembersPromise = Data.serverMembers({ serverId });
  const memberApplicationsPromise = Data.memberApplications({ serverId });

  const [server, serverMembers, memberApplications] = await Promise.all([serverPromise, serverMembersPromise, memberApplicationsPromise]);

  return { userId, serverId, server, serverMembers, memberApplications };
}

export async function systemSetting({ userId, systemSettings }: { userId: string; systemSettings: Types.SystemSettings }) {
  const userSettingsPromise = Data.userSettings({ userId });

  const [userSettings] = await Promise.all([userSettingsPromise]);

  return { userId, userSettings, systemSettings };
}

export async function userInfo({ userId, targetId }: { userId: string; targetId: string }) {
  const targetPromise = Data.user({ userId: targetId });
  const targetServersPromise = Data.servers({ userId: targetId });

  const [target, targetServers] = await Promise.all([targetPromise, targetServersPromise]);

  return { userId, targetId, target, targetServers };
}

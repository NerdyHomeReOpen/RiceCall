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
  const serverPromise = Data.server({ userId, serverId });
  const channelPromise = Data.channel({ userId, serverId, channelId });
  const channelMembersPromise = Data.channelMembers({ serverId, channelId });

  const [server, channel, channelMembers] = await Promise.all([serverPromise, channelPromise, channelMembersPromise]);

  return { server, channel, channelMembers };
}

export async function createChannel({ userId, serverId, channelId }: { userId: string; serverId: string; channelId: string }) {
  const parentPromise = Data.channel({ userId, serverId, channelId });

  const [parent] = await Promise.all([parentPromise]);

  return { parent };
}

export async function directMessage({ targetId, event, message }: { targetId: string; event: 'directMessage' | 'shakeWindow'; message: unknown }) {
  const targetPromise = Data.user({ userId: targetId });

  const [target] = await Promise.all([targetPromise]);

  return { target, event, message };
}

export async function editChannelOrder({ userId, serverId }: { userId: string; serverId: string }) {
  const channelsPromise = Data.channels({ userId, serverId });

  const [channels] = await Promise.all([channelsPromise]);

  return { channels };
}

export async function editChannelName({ userId, serverId, channelId }: { userId: string; serverId: string; channelId: string }) {
  const channelPromise = Data.channel({ userId, serverId, channelId });

  const [channel] = await Promise.all([channelPromise]);

  return { channel };
}

export async function editFriendNote({ userId, targetId }: { userId: string; targetId: string }) {
  const friendPromise = Data.friend({ userId, targetId });

  const [friend] = await Promise.all([friendPromise]);

  return { friend };
}

export async function editFriendGroupName({ userId, friendGroupId }: { userId: string; friendGroupId: string }) {
  const friendGroupPromise = Data.friendGroup({ userId, friendGroupId });

  const [friendGroup] = await Promise.all([friendGroupPromise]);

  return { friendGroup };
}

export async function editNickname({ userId, serverId }: { userId: string; serverId: string }) {
  const memberPromise = Data.member({ userId, serverId });

  const [member] = await Promise.all([memberPromise]);

  return { member };
}

export async function inviteMember({ receiverId, serverId }: { receiverId: string; serverId: string }) {
  const receiverMemberPromise = Data.member({ userId: receiverId, serverId });
  const memberInvitationPromise = Data.memberInvitation({ receiverId, serverId });

  const [receiverMember, memberInvitation] = await Promise.all([receiverMemberPromise, memberInvitationPromise]);

  return { receiverMember, memberInvitation };
}

export async function kickMemberFromServer({ userId, serverId }: { userId: string; serverId: string }) {
  const memberPromise = Data.member({ userId, serverId });

  const [member] = await Promise.all([memberPromise]);

  return { member };
}

export async function kickMemberFromChannel({ userId, serverId, channelId }: { userId: string; serverId: string; channelId: string }) {
  const memberPromise = Data.member({ userId, serverId, channelId });
  const channelPromise = Data.channel({ userId, serverId, channelId });

  const [member, channel] = await Promise.all([memberPromise, channelPromise]);

  return { channel, member };
}

export async function memberApplicationSetting({ userId, serverId }: { userId: string; serverId: string }) {
  const serverPromise = Data.server({ userId, serverId });

  const [server] = await Promise.all([serverPromise]);

  return { server };
}

export async function serverApplication({ userId, serverId }: { userId: string; serverId: string }) {
  const serverPromise = Data.server({ userId, serverId });

  const [server] = await Promise.all([serverPromise]);

  return { server };
}

export async function serverSetting({ userId, serverId }: { userId: string; serverId: string }) {
  const serverPromise = Data.server({ userId, serverId });
  const serverMembersPromise = Data.serverMembers({ serverId });
  const memberApplicationsPromise = Data.memberApplications({ serverId });

  const [server, serverMembers, memberApplications] = await Promise.all([serverPromise, serverMembersPromise, memberApplicationsPromise]);

  return { server, serverMembers, memberApplications };
}

export async function systemSetting({ userId, systemSettings }: { userId: string; systemSettings: Types.SystemSettings }) {
  const userSettingsPromise = Data.userSettings({ userId });

  const [userSettings] = await Promise.all([userSettingsPromise]);

  return { userSettings, systemSettings };
}

export async function userInfo({ targetId }: { targetId: string }) {
  const targetPromise = Data.user({ userId: targetId });
  const targetServersPromise = Data.servers({ userId: targetId });

  const [target, targetServers] = await Promise.all([targetPromise, targetServersPromise]);

  return { target, targetServers };
}

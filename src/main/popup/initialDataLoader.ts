import type * as Types from '@/types';

import {
  fetchUser,
  fetchUserSettings,
  fetchFriend,
  fetchFriendGroup,
  fetchFriendApplication,
  fetchServer,
  fetchServers,
  fetchServerMembers,
  fetchChannel,
  fetchChannels,
  fetchChannelMembers,
  fetchMember,
  fetchMemberApplication,
  fetchMemberApplications,
  fetchMemberInvitation,
} from '@/services';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const initialDataLoader: Partial<Record<Types.PopupType, (initialData: any) => Promise<any>>> = {
  applyMember: async ({ userId, serverId }: { userId: string; serverId: string }) => {
    const serverPromise = fetchServer({ userId, serverId });
    const memberApplicationPromise = fetchMemberApplication({ userId, serverId });

    const [server, memberApplication] = await Promise.all([serverPromise, memberApplicationPromise]);

    return { server, memberApplication };
  },

  applyFriend: async ({ senderId, receiverId }: { senderId: string; receiverId: string }) => {
    const receiverPromise = fetchUser({ userId: receiverId });
    const friendApplicationPromise = fetchFriendApplication({ senderId, receiverId });

    const [receiver, friendApplication] = await Promise.all([receiverPromise, friendApplicationPromise]);

    return { receiver, friendApplication };
  },

  blockMember: async ({ userId, serverId }: { userId: string; serverId: string }) => {
    const memberPromise = fetchMember({ userId, serverId });

    const [member] = await Promise.all([memberPromise]);

    return { serverId, member };
  },

  channelSetting: async ({ userId, serverId, channelId }: { userId: string; serverId: string; channelId: string }) => {
    const serverPromise = fetchServer({ userId, serverId });
    const channelPromise = fetchChannel({ userId, serverId, channelId });
    const channelMembersPromise = fetchChannelMembers({ serverId, channelId });

    const [server, channel, channelMembers] = await Promise.all([serverPromise, channelPromise, channelMembersPromise]);

    return { server, channel, channelMembers };
  },

  createChannel: async ({ userId, serverId, channelId }: { userId: string; serverId: string; channelId?: string }) => {
    if (!channelId) return { parent: null };

    const parentPromise = fetchChannel({ userId, serverId, channelId });

    const [parent] = await Promise.all([parentPromise]);

    return { parent };
  },

  directMessage: async ({ targetId, event, message }: { targetId: string; event: 'directMessage' | 'shakeWindow'; message: unknown }) => {
    const targetPromise = fetchUser({ userId: targetId });

    const [target] = await Promise.all([targetPromise]);

    return { target, event, message };
  },

  editChannelOrder: async ({ userId, serverId }: { userId: string; serverId: string }) => {
    const channelsPromise = fetchChannels({ userId, serverId });

    const [channels] = await Promise.all([channelsPromise]);

    return { channels };
  },

  editChannelName: async ({ userId, serverId, channelId }: { userId: string; serverId: string; channelId: string }) => {
    const channelPromise = fetchChannel({ userId, serverId, channelId });

    const [channel] = await Promise.all([channelPromise]);

    return { channel };
  },

  editFriendNote: async ({ userId, targetId }: { userId: string; targetId: string }) => {
    const friendPromise = fetchFriend({ userId, targetId });

    const [friend] = await Promise.all([friendPromise]);

    return { friend };
  },

  editFriendGroupName: async ({ userId, friendGroupId }: { userId: string; friendGroupId: string }) => {
    const friendGroupPromise = fetchFriendGroup({ userId, friendGroupId });

    const [friendGroup] = await Promise.all([friendGroupPromise]);

    return { friendGroup };
  },

  editNickname: async ({ userId, serverId }: { userId: string; serverId: string }) => {
    const memberPromise = fetchMember({ userId, serverId });

    const [member] = await Promise.all([memberPromise]);

    return { member };
  },

  inviteMember: async ({ receiverId, serverId }: { receiverId: string; serverId: string }) => {
    const receiverMemberPromise = fetchMember({ userId: receiverId, serverId });
    const memberInvitationPromise = fetchMemberInvitation({ receiverId, serverId });

    const [receiverMember, memberInvitation] = await Promise.all([receiverMemberPromise, memberInvitationPromise]);

    return { receiverMember, memberInvitation };
  },

  kickMemberFromServer: async ({ userId, serverId }: { userId: string; serverId: string }) => {
    const memberPromise = fetchMember({ userId, serverId });

    const [member] = await Promise.all([memberPromise]);

    return { member };
  },

  kickMemberFromChannel: async ({ userId, serverId, channelId }: { userId: string; serverId: string; channelId: string }) => {
    const memberPromise = fetchMember({ userId, serverId, channelId });
    const channelPromise = fetchChannel({ userId, serverId, channelId });

    const [member, channel] = await Promise.all([memberPromise, channelPromise]);

    return { channel, member };
  },

  memberApplicationSetting: async ({ userId, serverId }: { userId: string; serverId: string }) => {
    const serverPromise = fetchServer({ userId, serverId });

    const [server] = await Promise.all([serverPromise]);

    return { server };
  },

  serverApplication: async ({ userId, serverId }: { userId: string; serverId: string }) => {
    const serverPromise = fetchServer({ userId, serverId });

    const [server] = await Promise.all([serverPromise]);

    return { server };
  },

  serverSetting: async ({ userId, serverId }: { userId: string; serverId: string }) => {
    const serverPromise = fetchServer({ userId, serverId });
    const serverMembersPromise = fetchServerMembers({ serverId });
    const memberApplicationsPromise = fetchMemberApplications({ serverId });

    const [server, serverMembers, memberApplications] = await Promise.all([serverPromise, serverMembersPromise, memberApplicationsPromise]);

    return { server, serverMembers, memberApplications };
  },

  systemSetting: async ({ userId }: { userId: string }) => {
    const userSettingsPromise = fetchUserSettings({ userId });

    const [userSettings] = await Promise.all([userSettingsPromise]);

    return { userSettings };
  },

  userInfo: async ({ targetId }: { targetId: string }) => {
    const targetPromise = fetchUser({ userId: targetId });
    const targetServersPromise = fetchServers({ userId: targetId });

    const [target, targetServers] = await Promise.all([targetPromise, targetServersPromise]);

    return { target, targetServers };
  },
}

export default initialDataLoader;
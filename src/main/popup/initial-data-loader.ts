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

// A popup cannot open without the records it shows, so a missing one aborts the open.
function required<T>(value: T | null, name: string): T {
  if (value === null) throw new Error(`Popup data ${name} not found`);
  return value;
}

const initialDataLoader: Types.PopupLoaders = {
  applyMember: async ({ userId, serverId }: { userId: string; serverId: string }) => {
    const serverPromise = fetchServer({ userId, serverId });
    const memberApplicationPromise = fetchMemberApplication({ userId, serverId });
    const [server, memberApplication] = await Promise.all([serverPromise, memberApplicationPromise]);
    return { server: required(server, 'server'), memberApplication };
  },
  applyFriend: async ({ senderId, receiverId }: { senderId: string; receiverId: string }) => {
    const receiverPromise = fetchUser({ userId: receiverId });
    const friendApplicationPromise = fetchFriendApplication({ senderId, receiverId });
    const [receiver, friendApplication] = await Promise.all([receiverPromise, friendApplicationPromise]);
    return { receiver: required(receiver, 'receiver'), friendApplication };
  },
  blockMember: async ({ userId, serverId }: { userId: string; serverId: string }) => {
    const memberPromise = fetchMember({ userId, serverId });
    const [member] = await Promise.all([memberPromise]);
    return { serverId, member: required(member, 'member') };
  },
  channelSetting: async ({ userId, serverId, channelId }: { userId: string; serverId: string; channelId: string }) => {
    const serverPromise = fetchServer({ userId, serverId });
    const channelPromise = fetchChannel({ userId, serverId, channelId });
    const channelMembersPromise = fetchChannelMembers({ serverId, channelId });
    const [server, channel, channelMembers] = await Promise.all([serverPromise, channelPromise, channelMembersPromise]);
    return { server: required(server, 'server'), channel: required(channel, 'channel'), channelMembers };
  },
  createChannel: async ({ userId, serverId, channelId }: { userId: string; serverId: string; channelId?: string }) => {
    if (!channelId) return { parent: null };
    const parentPromise = fetchChannel({ userId, serverId, channelId });
    const [parent] = await Promise.all([parentPromise]);
    return { parent };
  },
  directMessage: async ({ targetId, event, message }) => {
    const targetPromise = fetchUser({ userId: targetId });
    const [target] = await Promise.all([targetPromise]);
    return { target: required(target, 'target'), event, message };
  },
  editChannelOrder: async ({ userId, serverId }: { userId: string; serverId: string }) => {
    const channelsPromise = fetchChannels({ userId, serverId });
    const [channels] = await Promise.all([channelsPromise]);
    return { channels };
  },
  editChannelName: async ({ userId, serverId, channelId }: { userId: string; serverId: string; channelId: string }) => {
    const channelPromise = fetchChannel({ userId, serverId, channelId });
    const [channel] = await Promise.all([channelPromise]);
    return { channel: required(channel, 'channel') };
  },
  editFriendNote: async ({ userId, targetId }: { userId: string; targetId: string }) => {
    const friendPromise = fetchFriend({ userId, targetId });
    const [friend] = await Promise.all([friendPromise]);
    return { friend: required(friend, 'friend') };
  },
  editFriendGroupName: async ({ userId, friendGroupId }: { userId: string; friendGroupId: string }) => {
    const friendGroupPromise = fetchFriendGroup({ userId, friendGroupId });
    const [friendGroup] = await Promise.all([friendGroupPromise]);
    return { friendGroup: required(friendGroup, 'friendGroup') };
  },
  editNickname: async ({ userId, serverId }: { userId: string; serverId: string }) => {
    const memberPromise = fetchMember({ userId, serverId });
    const [member] = await Promise.all([memberPromise]);
    return { member: required(member, 'member') };
  },
  inviteFriend: async ({ userId, serverId }: { userId: string; serverId: string }) => {
    const serverPromise = fetchServer({ userId, serverId });
    const [server] = await Promise.all([serverPromise]);
    return { server: required(server, 'server') };
  },
  inviteMember: async ({ receiverId, serverId }: { receiverId: string; serverId: string }) => {
    const receiverMemberPromise = fetchMember({ userId: receiverId, serverId });
    const memberInvitationPromise = fetchMemberInvitation({ receiverId, serverId });
    const [receiverMember, memberInvitation] = await Promise.all([receiverMemberPromise, memberInvitationPromise]);
    return { receiverMember: required(receiverMember, 'receiverMember'), memberInvitation };
  },
  kickMemberFromServer: async ({ userId, serverId }: { userId: string; serverId: string }) => {
    const memberPromise = fetchMember({ userId, serverId });
    const [member] = await Promise.all([memberPromise]);
    return { member: required(member, 'member') };
  },
  kickMemberFromChannel: async ({ userId, serverId, channelId }: { userId: string; serverId: string; channelId: string }) => {
    const memberPromise = fetchMember({ userId, serverId, channelId });
    const channelPromise = fetchChannel({ userId, serverId, channelId });
    const [member, channel] = await Promise.all([memberPromise, channelPromise]);
    return { channel: required(channel, 'channel'), member: required(member, 'member') };
  },
  memberApplicationSetting: async ({ userId, serverId }: { userId: string; serverId: string }) => {
    const serverPromise = fetchServer({ userId, serverId });
    const [server] = await Promise.all([serverPromise]);
    return { server: required(server, 'server') };
  },
  serverApplication: async ({ userId, serverId }: { userId: string; serverId: string }) => {
    const serverPromise = fetchServer({ userId, serverId });
    const [server] = await Promise.all([serverPromise]);
    return { server: required(server, 'server') };
  },
  serverSetting: async ({ userId, serverId }: { userId: string; serverId: string }) => {
    const serverPromise = fetchServer({ userId, serverId });
    const serverMembersPromise = fetchServerMembers({ serverId });
    const memberApplicationsPromise = fetchMemberApplications({ serverId });
    const [server, serverMembers, memberApplications] = await Promise.all([serverPromise, serverMembersPromise, memberApplicationsPromise]);
    return { server: required(server, 'server'), serverMembers, memberApplications };
  },
  systemSetting: async ({ userId }: { userId: string }) => {
    const userSettingsPromise = fetchUserSettings({ userId });
    const [userSettings] = await Promise.all([userSettingsPromise]);
    return { userSettings: required(userSettings, 'userSettings') };
  },
  userInfo: async ({ targetId }: { targetId: string }) => {
    const targetPromise = fetchUser({ userId: targetId });
    const targetServersPromise = fetchServers({ userId: targetId });
    const [target, targetServers] = await Promise.all([targetPromise, targetServersPromise]);
    return { target: required(target, 'target'), targetServers };
  },
};

// Fetches the data a popup needs and merges it with what the caller passed.
export async function loadPopupData<T extends Types.PopupType>(type: T, data: Types.PopupOpenData<T>, systemSettings: Types.SystemSettings): Promise<Types.PopupInitialData[T]> {
  const loader = (initialDataLoader as Partial<Record<Types.PopupType, (data: unknown) => Promise<object>>>)[type];
  if (!loader) return data as Types.PopupInitialData[T];
  const loadedData = await loader(data);
  return { ...loadedData, ...data, systemSettings } as Types.PopupInitialData[T];
}

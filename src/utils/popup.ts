import ipc from '@/ipc';

import * as Types from '@/types';

export const handleOpenAlertDialog = (message: string, callback: () => void) => {
  ipc.popup.open('dialogAlert', 'dialogAlert', { message });
  ipc.popup.onSubmit('dialogAlert', callback);
};

export const handleOpenErrorDialog = (message: string, callback: () => void) => {
  ipc.popup.open('dialogError', 'dialogError', { message, timestamp: Date.now() });
  ipc.popup.onSubmit('dialogError', callback);
};

export const handleOpenDirectMessage = (userId: Types.User['userId'], targetId: Types.User['userId']) => {
  ipc.popup.open('directMessage', `directMessage-${targetId}`, { userId, targetId });
};

export const handleOpenChatHistory = (userId: Types.User['userId'], targetId: Types.User['userId']) => {
  ipc.popup.open('chatHistory', 'chatHistory', { userId, targetId });
};

export const handleOpenUserInfo = (userId: Types.User['userId'], targetId: Types.User['userId']) => {
  ipc.popup.open('userInfo', `userInfo-${targetId}`, { userId, targetId });
};

export const handleOpenServerSetting = (userId: Types.User['userId'], serverId: Types.Server['serverId']) => {
  ipc.popup.open('serverSetting', 'serverSetting', { userId, serverId });
};

export const handleOpenChannelEvent = (userId: Types.User['userId'], serverId: Types.Server['serverId'], channelEvents: Types.ChannelEvent[]) => {
  ipc.popup.open('channelEvent', 'channelEvent', { userId, serverId, channelEvents });
};

export const handleOpenChannelSetting = (userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) => {
  ipc.popup.open('channelSetting', 'channelSetting', { userId, serverId, channelId });
};

export const handleOpenCreateServer = (userId: Types.User['userId']) => {
  ipc.popup.open('createServer', 'createServer', { userId });
};

export const handleOpenCreateChannel = (userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) => {
  ipc.popup.open('createChannel', 'createChannel', { userId, serverId, channelId });
};

export const handleOpenEditNickname = (userId: Types.User['userId'], serverId: Types.Server['serverId']) => {
  ipc.popup.open('editNickname', 'editNickname', { serverId, userId });
};

export const handleOpenBlockMember = (userId: Types.User['userId'], serverId: Types.Server['serverId']) => {
  ipc.popup.open('blockMember', `blockMember`, { userId, serverId });
};

export const handleOpenKickMemberFromServer = (userId: Types.User['userId'], serverId: Types.Server['serverId']) => {
  ipc.popup.open('kickMemberFromServer', `kickMemberFromServer`, { userId, serverId });
};

export const handleOpenKickMemberFromChannel = (userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) => {
  ipc.popup.open('kickMemberFromChannel', `kickMemberFromChannel`, { userId, serverId, channelId });
};

export const handleOpenInviteMember = (userId: Types.User['userId'], serverId: Types.Server['serverId']) => {
  ipc.popup.open('inviteMember', `inviteMember`, { userId, serverId });
};

export const handleOpenMemberApplicationSetting = (userId: Types.User['userId'], serverId: Types.Server['serverId']) => {
  ipc.popup.open('memberApplicationSetting', 'memberApplicationSetting', { userId, serverId });
};

export const handleOpenEditChannelOrder = (userId: Types.User['userId'], serverId: Types.Server['serverId']) => {
  ipc.popup.open('editChannelOrder', 'editChannelOrder', { serverId, userId });
};

export const handleOpenServerBroadcast = (serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) => {
  ipc.popup.open('serverBroadcast', 'serverBroadcast', { serverId, channelId });
};

export const handleOpenChannelPassword = (onSubmit: (password: string) => void) => {
  ipc.popup.open('channelPassword', 'channelPassword', {});
  ipc.popup.onSubmit('channelPassword', onSubmit);
};

export const handleOpenEditChannelName = (userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], channelName: Types.Channel['name'] = '') => {
  ipc.popup.open('editChannelName', 'editChannelName', { userId, serverId, channelId, channelName: channelName });
};

export const handleOpenFriendVerification = (userId: Types.User['userId']) => {
  ipc.popup.open('friendVerification', 'friendVerification', { userId });
};

export const handleOpenMemberInvitation = (userId: Types.User['userId']) => {
  ipc.popup.open('memberInvitation', 'memberInvitation', { userId });
};

export const handleOpenSearchUser = (userId: Types.User['userId']) => {
  ipc.popup.open('searchUser', 'searchUser', { userId });
};

export const handleOpenApplyFriend = async (userId: Types.User['userId'], targetId: Types.User['userId']) => {
  await ipc.data.friendApplication(userId, targetId).then((receivedFriendApplication) => {
    if (receivedFriendApplication) {
      ipc.popup.open('approveFriend', 'approveFriend', { userId, targetId });
    } else {
      ipc.popup.open('applyFriend', 'applyFriend', { userId, targetId });
    }
  });
};

export const handleOpenApproveFriend = (userId: Types.User['userId'], targetId: Types.User['userId']) => {
  ipc.popup.open('approveFriend', 'approveFriend', { userId, targetId });
};

export const handleOpenCreateFriendGroup = () => {
  ipc.popup.open('createFriendGroup', 'createFriendGroup', {});
};

export const handleOpenEditFriendNote = (userId: Types.User['userId'], targetId: Types.User['userId']) => {
  ipc.popup.open('editFriendNote', 'editFriendNote', { userId, targetId });
};

export const handleOpenEditFriendGroupName = (userId: Types.User['userId'], friendGroupId: Types.FriendGroup['friendGroupId']) => {
  ipc.popup.open('editFriendGroupName', 'editFriendGroupName', { userId, friendGroupId });
};

export const handleOpenSystemSetting = (userId: Types.User['userId']) => {
  ipc.popup.open('systemSetting', 'systemSetting', { userId });
};

export const handleOpenAboutUs = () => {
  ipc.popup.open('aboutus', 'aboutUs', {});
};

export const handleOpenChangeTheme = () => {
  ipc.popup.open('changeTheme', 'changeTheme', {});
};

export const handleOpenApplyMember = (userId: Types.User['userId'], serverId: Types.Server['serverId']) => {
  ipc.popup.open('applyMember', 'applyMember', { userId, serverId });
};

export const handleOpenImageCropper = (imageUnit8Array: Uint8Array, onSubmit: (imageUnit8Array: Uint8Array) => void) => {
  ipc.popup.open('imageCropper', 'imageCropper', { imageUnit8Array });
  ipc.popup.onSubmit('imageCropper', onSubmit);
};

export const handleOpenServerApplication = (userId: Types.User['userId'], serverId: Types.Server['serverId'], onSubmit: (action: string) => void) => {
  ipc.popup.open('serverApplication', 'serverApplication', { userId, serverId });
  ipc.popup.onSubmit('serverApplication', onSubmit);
};

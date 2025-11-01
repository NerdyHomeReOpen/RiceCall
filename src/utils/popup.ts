// Types
import type { User, Server, Channel, FriendGroup } from '@/types';

// Services
import ipc from '@/services/ipc.service';

/* Dialog */
export const handleOpenAlertDialog = (message: string, callback: () => void) => {
  ipc.popup.open('dialogAlert', 'dialogAlert', { message, submitTo: 'dialogAlert' });
  ipc.popup.onSubmit('dialogAlert', callback);
};

export const handleOpenErrorDialog = (message: string, callback: () => void) => {
  ipc.popup.open('dialogError', 'dialogError', { message, submitTo: 'dialogError' });
  ipc.popup.onSubmit('dialogError', callback);
};

/* General popup */
export const handleOpenDirectMessage = (userId: User['userId'], targetId: User['userId']) => {
  ipc.popup.open('directMessage', `directMessage-${targetId}`, { userId, targetId });
};

export const handleOpenChatHistory = (userId: User['userId'], targetId: User['userId']) => {
  ipc.popup.open('chatHistory', 'chatHistory', { userId, targetId });
};

export const handleOpenUserInfo = (userId: User['userId'], targetId: User['userId']) => {
  ipc.popup.open('userInfo', `userInfo-${targetId}`, { userId, targetId });
};

/* Group popup */
export const handleOpenServerSetting = (userId: User['userId'], serverId: Server['serverId']) => {
  ipc.popup.open('serverSetting', 'serverSetting', { userId, serverId });
};

export const handleOpenChannelSetting = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId']) => {
  ipc.popup.open('channelSetting', 'channelSetting', { userId, serverId, channelId });
};

export const handleOpenCreateServer = (userId: User['userId']) => {
  ipc.popup.open('createServer', 'createServer', { userId });
};

export const handleOpenCreateChannel = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId']) => {
  ipc.popup.open('createChannel', 'createChannel', { userId, serverId, channelId });
};

export const handleOpenEditNickname = (userId: User['userId'], serverId: Server['serverId']) => {
  ipc.popup.open('editNickname', 'editNickname', { serverId, userId });
};

export const handleOpenBlockMember = (userId: User['userId'], serverId: Server['serverId']) => {
  ipc.popup.open('blockMember', `blockMember`, { userId, serverId });
};

export const handleOpenInviteMember = (userId: User['userId'], serverId: Server['serverId']) => {
  ipc.popup.open('inviteMember', `inviteMember`, { userId, serverId });
};

export const handleOpenMemberApplicationSetting = (userId: User['userId'], serverId: Server['serverId']) => {
  ipc.popup.open('memberApplicationSetting', 'memberApplicationSetting', { userId, serverId });
};

export const handleOpenEditChannelOrder = (userId: User['userId'], serverId: Server['serverId']) => {
  ipc.popup.open('editChannelOrder', 'editChannelOrder', { serverId, userId });
};

export const handleOpenServerBroadcast = (serverId: Server['serverId'], channelId: Channel['channelId']) => {
  ipc.popup.open('serverBroadcast', 'serverBroadcast', { serverId, channelId });
};

export const handleOpenChannelPassword = (serverId: Server['serverId'], channelId: Channel['channelId']) => {
  ipc.popup.open('channelPassword', 'channelPassword', { submitTo: 'channelPassword' });
  ipc.popup.onSubmit('channelPassword', (password) => ipc.socket.send('connectChannel', { serverId, channelId, password }));
};

export const handleOpenEditChannelName = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId'], channelName: Channel['name'] = '') => {
  ipc.popup.open('editChannelName', 'editChannelName', { userId, serverId, channelId, channelName: channelName });
};

/* Applications popup */
export const handleOpenFriendVerification = (userId: User['userId']) => {
  ipc.popup.open('friendVerification', 'friendVerification', { userId });
};

export const handleOpenMemberInvitation = (userId: User['userId']) => {
  ipc.popup.open('memberInvitation', 'memberInvitation', { userId });
};

/* Friend popup */
export const handleOpenSearchUser = (userId: User['userId']) => {
  ipc.popup.open('searchUser', 'searchUser', { userId });
};

export const handleOpenApplyFriend = (userId: User['userId'], targetId: User['userId']) => {
  ipc.popup.open('applyFriend', 'applyFriend', { userId, targetId });
};

export const handleOpenApproveFriend = (userId: User['userId'], targetId: User['userId']) => {
  ipc.popup.open('approveFriend', 'approveFriend', { userId, targetId });
};

export const handleOpenCreateFriendGroup = () => {
  ipc.popup.open('createFriendGroup', 'createFriendGroup', {});
};

export const handleOpenEditFriendNote = (userId: User['userId'], targetId: User['userId']) => {
  ipc.popup.open('editFriendNote', 'editFriendNote', { userId, targetId });
};

export const handleOpenEditFriendGroupName = (userId: User['userId'], friendGroupId: FriendGroup['friendGroupId']) => {
  ipc.popup.open('editFriendGroupName', 'editFriendGroupName', { userId, friendGroupId });
};

/* SystemMenu popup */
export const handleOpenSystemSetting = (userId: User['userId']) => {
  ipc.popup.open('systemSetting', 'systemSetting', { userId });
};

export const handleOpenAboutUs = () => {
  ipc.popup.open('aboutus', 'aboutUs', {});
};

export const handleOpenChangeTheme = () => {
  ipc.popup.open('changeTheme', 'changeTheme', {});
};

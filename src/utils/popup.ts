import ipc from '@/ipc';

import * as Types from '@/types';

export function handleOpenAlertDialog(message: string, callback: () => void) {
  ipc.popup.open('dialogAlert', 'dialogAlert', { message });
  ipc.popup.onSubmit('dialogAlert', callback);
}

export function handleOpenErrorDialog(message: string, callback: () => void) {
  ipc.popup.open('dialogError', 'dialogError', { message, timestamp: Date.now() });
  ipc.popup.onSubmit('dialogError', callback);
}

export function handleOpenDirectMessage(userId: Types.User['userId'], targetId: Types.User['userId']) {
  ipc.popup.open('directMessage', `directMessage-${targetId}`, { userId, targetId });
}

export function handleOpenChatHistory(userId: Types.User['userId'], targetId: Types.User['userId']) {
  ipc.popup.open('chatHistory', 'chatHistory', { userId, targetId });
}

export function handleOpenUserInfo(userId: Types.User['userId'], targetId: Types.User['userId']) {
  ipc.popup.open('userInfo', `userInfo-${targetId}`, { userId, targetId });
}

export function handleOpenServerSetting(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  ipc.popup.open('serverSetting', 'serverSetting', { userId, serverId });
}

export function handleOpenChannelEvent(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelEvents: Types.ChannelEvent[]) {
  ipc.popup.open('channelEvent', 'channelEvent', { userId, serverId, channelEvents });
}

export function handleOpenChannelSetting(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) {
  ipc.popup.open('channelSetting', 'channelSetting', { userId, serverId, channelId });
}

export function handleOpenCreateServer(userId: Types.User['userId']) {
  ipc.popup.open('createServer', 'createServer', { userId });
}

export function handleOpenCreateChannel(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) {
  ipc.popup.open('createChannel', 'createChannel', { userId, serverId, channelId });
}

export function handleOpenEditNickname(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  ipc.popup.open('editNickname', 'editNickname', { serverId, userId });
}

export function handleOpenBlockMember(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  ipc.popup.open('blockMember', `blockMember`, { userId, serverId });
}

export function handleOpenKickMemberFromServer(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  ipc.popup.open('kickMemberFromServer', `kickMemberFromServer`, { userId, serverId });
}

export function handleOpenKickMemberFromChannel(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) {
  ipc.popup.open('kickMemberFromChannel', `kickMemberFromChannel`, { userId, serverId, channelId });
}

export function handleOpenInviteMember(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  ipc.popup.open('inviteMember', `inviteMember`, { userId, serverId });
}

export function handleOpenMemberApplicationSetting(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  ipc.popup.open('memberApplicationSetting', 'memberApplicationSetting', { userId, serverId });
}

export function handleOpenEditChannelOrder(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  ipc.popup.open('editChannelOrder', 'editChannelOrder', { serverId, userId });
}

export function handleOpenServerBroadcast(serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) {
  ipc.popup.open('serverBroadcast', 'serverBroadcast', { serverId, channelId });
}

export function handleOpenChannelPassword(onSubmit: (password: string) => void) {
  ipc.popup.open('channelPassword', 'channelPassword', {});
  ipc.popup.onSubmit('channelPassword', onSubmit);
}

export function handleOpenEditChannelName(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], channelName: Types.Channel['name'] = '') {
  ipc.popup.open('editChannelName', 'editChannelName', { userId, serverId, channelId, channelName: channelName });
}

export function handleOpenFriendVerification(userId: Types.User['userId']) {
  ipc.popup.open('friendVerification', 'friendVerification', { userId });
}

export function handleOpenMemberInvitation(userId: Types.User['userId']) {
  ipc.popup.open('memberInvitation', 'memberInvitation', { userId });
}

export function handleOpenSearchUser(userId: Types.User['userId']) {
  ipc.popup.open('searchUser', 'searchUser', { userId });
}

export async function handleOpenApplyFriend(userId: Types.User['userId'], targetId: Types.User['userId']) {
  await ipc.data.friendApplication({ receiverId: userId, senderId: targetId }).then((receivedFriendApplication) => {
    if (receivedFriendApplication) {
      ipc.popup.open('approveFriend', 'approveFriend', { userId, targetId });
    } else {
      ipc.popup.open('applyFriend', 'applyFriend', { userId, targetId });
    }
  });
}

export function handleOpenApproveFriend(userId: Types.User['userId'], targetId: Types.User['userId']) {
  ipc.popup.open('approveFriend', 'approveFriend', { userId, targetId });
}

export function handleOpenCreateFriendGroup() {
  ipc.popup.open('createFriendGroup', 'createFriendGroup', {});
}

export function handleOpenEditFriendNote(userId: Types.User['userId'], targetId: Types.User['userId']) {
  ipc.popup.open('editFriendNote', 'editFriendNote', { userId, targetId });
}

export function handleOpenEditFriendGroupName(userId: Types.User['userId'], friendGroupId: Types.FriendGroup['friendGroupId']) {
  ipc.popup.open('editFriendGroupName', 'editFriendGroupName', { userId, friendGroupId });
}

export function handleOpenSystemSetting(userId: Types.User['userId']) {
  ipc.popup.open('systemSetting', 'systemSetting', { userId });
}

export function handleOpenAboutUs() {
  ipc.popup.open('aboutus', 'aboutUs', {});
}

export function handleOpenChangeTheme() {
  ipc.popup.open('changeTheme', 'changeTheme', {});
}

export function handleOpenApplyMember(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  ipc.popup.open('applyMember', 'applyMember', { userId, serverId });
}

export function handleOpenImageCropper(imageUnit8Array: Uint8Array, onSubmit: (imageUnit8Array: Uint8Array) => void) {
  ipc.popup.open('imageCropper', 'imageCropper', { imageUnit8Array });
  ipc.popup.onSubmit('imageCropper', onSubmit);
}

export function handleOpenServerApplication(userId: Types.User['userId'], serverId: Types.Server['serverId'], onSubmit: (action: string) => void) {
  ipc.popup.open('serverApplication', 'serverApplication', { userId, serverId });
  ipc.popup.onSubmit('serverApplication', onSubmit);
}

export function handleOpenServerAnnouncement(announcement: Types.Server['announcement']) {
  ipc.popup.open('serverAnnouncement', 'serverAnnouncement', { announcement });
}
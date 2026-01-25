import ipc from '@/ipc';
import { getPopupController } from '@/platform/popup';

import * as Types from '@/types';

export function handleOpenAlertDialog(message: string, callback: () => void) {
  const popup = getPopupController();
  popup.open('dialogAlert', 'dialogAlert', { message });
  popup.onSubmit('dialogAlert', callback);
}

export function handleOpenErrorDialog(message: string, callback: () => void) {
  const popup = getPopupController();
  popup.open('dialogError', 'dialogError', { message, timestamp: Date.now() });
  popup.onSubmit('dialogError', callback);
}

export function handleOpenDirectMessage(userId: Types.User['userId'], targetId: Types.User['userId']) {
  getPopupController().open('directMessage', `directMessage-${targetId}`, { userId, targetId });
}

export function handleOpenChatHistory(userId: Types.User['userId'], targetId: Types.User['userId']) {
  getPopupController().open('chatHistory', 'chatHistory', { userId, targetId });
}

export function handleOpenUserInfo(userId: Types.User['userId'], targetId: Types.User['userId']) {
  getPopupController().open('userInfo', `userInfo-${targetId}`, { userId, targetId });
}

export function handleOpenServerSetting(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  getPopupController().open('serverSetting', 'serverSetting', { userId, serverId });
}

export function handleOpenChannelEvent(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelEvents: Types.ChannelEvent[]) {
  getPopupController().open('channelEvent', 'channelEvent', { userId, serverId, channelEvents });
}

export function handleOpenChannelSetting(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) {
  getPopupController().open('channelSetting', 'channelSetting', { userId, serverId, channelId });
}

export function handleOpenCreateServer(userId: Types.User['userId']) {
  getPopupController().open('createServer', 'createServer', { userId });
}

export function handleOpenCreateChannel(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) {
  getPopupController().open('createChannel', 'createChannel', { userId, serverId, channelId });
}

export function handleOpenEditNickname(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  getPopupController().open('editNickname', 'editNickname', { serverId, userId });
}

export function handleOpenBlockMember(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  getPopupController().open('blockMember', `blockMember`, { userId, serverId });
}

export function handleOpenKickMemberFromServer(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  getPopupController().open('kickMemberFromServer', `kickMemberFromServer`, { userId, serverId });
}

export function handleOpenKickMemberFromChannel(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) {
  getPopupController().open('kickMemberFromChannel', `kickMemberFromChannel`, { userId, serverId, channelId });
}

export function handleOpenInviteMember(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  getPopupController().open('inviteMember', `inviteMember`, { userId, serverId });
}

export function handleOpenMemberApplicationSetting(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  getPopupController().open('memberApplicationSetting', 'memberApplicationSetting', { userId, serverId });
}

export function handleOpenEditChannelOrder(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  getPopupController().open('editChannelOrder', 'editChannelOrder', { serverId, userId });
}

export function handleOpenServerBroadcast(serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) {
  getPopupController().open('serverBroadcast', 'serverBroadcast', { serverId, channelId });
}

export function handleOpenChannelPassword(onSubmit: (password: string) => void) {
  const popup = getPopupController();
  popup.open('channelPassword', 'channelPassword', {});
  popup.onSubmit('channelPassword', onSubmit);
}

export function handleOpenEditChannelName(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], channelName: Types.Channel['name'] = '') {
  getPopupController().open('editChannelName', 'editChannelName', { userId, serverId, channelId, channelName: channelName });
}

export function handleOpenFriendVerification(userId: Types.User['userId']) {
  getPopupController().open('friendVerification', 'friendVerification', { userId });
}

export function handleOpenMemberInvitation(userId: Types.User['userId']) {
  getPopupController().open('memberInvitation', 'memberInvitation', { userId });
}

export function handleOpenSearchUser(userId: Types.User['userId']) {
  getPopupController().open('searchUser', 'searchUser', { userId });
}

export async function handleOpenApplyFriend(userId: Types.User['userId'], targetId: Types.User['userId']) {
  await ipc.data.friendApplication({ receiverId: userId, senderId: targetId }).then((receivedFriendApplication: Types.FriendApplication | null) => {
    if (receivedFriendApplication) {
      getPopupController().open('approveFriend', 'approveFriend', { userId, targetId });
    } else {
      getPopupController().open('applyFriend', 'applyFriend', { userId, targetId });
    }
  });
}

export function handleOpenApproveFriend(userId: Types.User['userId'], targetId: Types.User['userId']) {
  getPopupController().open('approveFriend', 'approveFriend', { userId, targetId });
}

export function handleOpenCreateFriendGroup() {
  getPopupController().open('createFriendGroup', 'createFriendGroup', {});
}

export function handleOpenEditFriendNote(userId: Types.User['userId'], targetId: Types.User['userId']) {
  getPopupController().open('editFriendNote', 'editFriendNote', { userId, targetId });
}

export function handleOpenEditFriendGroupName(userId: Types.User['userId'], friendGroupId: Types.FriendGroup['friendGroupId']) {
  getPopupController().open('editFriendGroupName', 'editFriendGroupName', { userId, friendGroupId });
}

export function handleOpenSystemSetting(userId: Types.User['userId']) {
  getPopupController().open('systemSetting', 'systemSetting', { userId });
}

export function handleOpenAboutUs() {
  getPopupController().open('aboutus', 'aboutUs', {});
}

export function handleOpenChangeTheme() {
  getPopupController().open('changeTheme', 'changeTheme', {});
}

export function handleOpenApplyMember(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  getPopupController().open('applyMember', 'applyMember', { userId, serverId });
}

export function handleOpenImageCropper(imageUnit8Array: Uint8Array, onSubmit: (imageUnit8Array: Uint8Array) => void) {
  const popup = getPopupController();
  popup.open('imageCropper', 'imageCropper', { imageUnit8Array });
  popup.onSubmit('imageCropper', onSubmit);
}

export function handleOpenServerApplication(userId: Types.User['userId'], serverId: Types.Server['serverId'], onSubmit: (action: string) => void) {
  const popup = getPopupController();
  popup.open('serverApplication', 'serverApplication', { userId, serverId });
  popup.onSubmit('serverApplication', onSubmit);
}

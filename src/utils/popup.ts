import { t } from 'i18next';
import ipc from '@/ipc';

import * as Types from '@/types';

export function openAlertDialog(message: string, callback: () => void) {
  ipc.popup.open('dialogAlert', 'dialogAlert', { message });
  ipc.popup.onSubmit('dialogAlert', callback);
}

export function openErrorDialog(message: string, callback: () => void) {
  ipc.popup.open('dialogError', 'dialogError', { message, timestamp: Date.now() });
  ipc.popup.onSubmit('dialogError', callback);
}

export function openDirectMessage(userId: Types.User['userId'], targetId: Types.User['userId']) {
  ipc.popup.open('directMessage', `directMessage-${targetId}`, { userId, targetId });
}

export function openChatHistory(userId: Types.User['userId'], targetId: Types.User['userId']) {
  ipc.popup.open('chatHistory', 'chatHistory', { userId, targetId });
}

export function openUserInfo(userId: Types.User['userId'], targetId: Types.User['userId']) {
  ipc.popup.open('userInfo', `userInfo-${targetId}`, { userId, targetId });
}

export function openServerSetting(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  ipc.popup.open('serverSetting', 'serverSetting', { userId, serverId });
}

export function openChannelEvent(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelEvents: Types.ChannelEvent[]) {
  ipc.popup.open('channelEvent', 'channelEvent', { userId, serverId, channelEvents });
}

export function openChannelSetting(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) {
  ipc.popup.open('channelSetting', 'channelSetting', { userId, serverId, channelId });
}

export function openCreateServer(userId: Types.User['userId']) {
  ipc.popup.open('createServer', 'createServer', { userId });
}

export function openCreateChannel(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) {
  ipc.popup.open('createChannel', 'createChannel', { userId, serverId, channelId });
}

export function openEditNickname(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  ipc.popup.open('editNickname', 'editNickname', { serverId, userId });
}

export function openBlockMember(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  ipc.popup.open('blockMember', `blockMember`, { userId, serverId });
}

export function openKickMemberFromServer(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  ipc.popup.open('kickMemberFromServer', `kickMemberFromServer`, { userId, serverId });
}

export function openKickMemberFromChannel(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) {
  ipc.popup.open('kickMemberFromChannel', `kickMemberFromChannel`, { userId, serverId, channelId });
}

export function openInviteFriend(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  ipc.popup.open('inviteFriend', `inviteFriend`, { userId, serverId });
}

export function openInviteMember(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  ipc.popup.open('inviteMember', `inviteMember`, { userId, serverId });
}

export function openMemberApplicationSetting(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  ipc.popup.open('memberApplicationSetting', 'memberApplicationSetting', { userId, serverId });
}

export function openEditChannelOrder(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  ipc.popup.open('editChannelOrder', 'editChannelOrder', { serverId, userId });
}

export function openServerBroadcast(serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) {
  ipc.popup.open('serverBroadcast', 'serverBroadcast', { serverId, channelId });
}

export function openChannelPassword(onSubmit: (password: string) => void) {
  ipc.popup.open('channelPassword', 'channelPassword', {});
  ipc.popup.onSubmit('channelPassword', onSubmit);
}

export function openEditChannelName(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], channelName: Types.Channel['name'] = '') {
  ipc.popup.open('editChannelName', 'editChannelName', { userId, serverId, channelId, channelName: channelName });
}

export function openFriendVerification(userId: Types.User['userId']) {
  ipc.popup.open('friendVerification', 'friendVerification', { userId });
}

export function openMemberInvitation(userId: Types.User['userId']) {
  ipc.popup.open('memberInvitation', 'memberInvitation', { userId });
}

export function openSearchUser(userId: Types.User['userId']) {
  ipc.popup.open('searchUser', 'searchUser', { userId });
}

export async function openApplyFriend(userId: Types.User['userId'], targetId: Types.User['userId']) {
  await ipc.data.friendApplication({ receiverId: userId, senderId: targetId }).then((receivedFriendApplication) => {
    if (receivedFriendApplication) {
      ipc.popup.open('approveFriend', 'approveFriend', { userId, targetId });
    } else {
      ipc.popup.open('applyFriend', 'applyFriend', { userId, targetId });
    }
  });
}

export function openApproveFriend(userId: Types.User['userId'], targetId: Types.User['userId']) {
  ipc.popup.open('approveFriend', 'approveFriend', { userId, targetId });
}

export function openCreateFriendGroup() {
  ipc.popup.open('createFriendGroup', 'createFriendGroup', {});
}

export function openEditFriendNote(userId: Types.User['userId'], targetId: Types.User['userId']) {
  ipc.popup.open('editFriendNote', 'editFriendNote', { userId, targetId });
}

export function openEditFriendGroupName(userId: Types.User['userId'], friendGroupId: Types.FriendGroup['friendGroupId']) {
  ipc.popup.open('editFriendGroupName', 'editFriendGroupName', { userId, friendGroupId });
}

export function openSystemSetting(userId: Types.User['userId']) {
  ipc.popup.open('systemSetting', 'systemSetting', { userId });
}

export function openAboutUs() {
  ipc.popup.open('aboutus', 'aboutUs', {});
}

export function openChangeTheme() {
  ipc.popup.open('changeTheme', 'changeTheme', {});
}

export function openApplyMember(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  ipc.popup.open('applyMember', 'applyMember', { userId, serverId });
}

export function openImageCropper(imageUnit8Array: Uint8Array, onSubmit: (imageUnit8Array: Uint8Array) => void) {
  ipc.popup.open('imageCropper', 'imageCropper', { imageUnit8Array });
  ipc.popup.onSubmit('imageCropper', onSubmit);
}

export function openServerApplication(userId: Types.User['userId'], serverId: Types.Server['serverId'], onSubmit: (action: string) => void) {
  ipc.popup.open('serverApplication', 'serverApplication', { userId, serverId });
  ipc.popup.onSubmit('serverApplication', onSubmit);
}

export function openServerAnnouncement(announcement: Types.Server['announcement']) {
  ipc.popup.open('serverAnnouncement', 'serverAnnouncement', { announcement });
}

export function connectChannel(serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], canJoin: boolean, needsPassword: boolean) {
  if (!canJoin) return;
  if (needsPassword) openChannelPassword((password) => ipc.socket.send('connectChannel', { serverId, channelId, password }));
  else ipc.socket.send('connectChannel', { serverId, channelId });
}

export function editServer(serverId: Types.Server['serverId'], update: Partial<Types.Server>) {
  ipc.socket.send('editServer', { serverId, update });
}

export function editServerPermission(userId: Types.User['userId'], serverId: Types.Server['serverId'], update: Partial<Types.Server>) {
  ipc.socket.send('editServerPermission', { userId, serverId, update });
}

export function editChannelPermission(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], update: Partial<Types.Channel>) {
  ipc.socket.send('editChannelPermission', { userId, serverId, channelId, update });
}

export function moveUserToChannel(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) {
  openAlertDialog(t('confirm-move-members-to-channel', { '0': 1 }), () => ipc.socket.send('moveUserToChannel', { userId, serverId, channelId }));
}

export function moveAllUsersToChannel(userIds: Types.User['userId'][], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) {
  openAlertDialog(t('confirm-move-members-to-channel', { '0': userIds.length }), () => ipc.socket.send('moveUserToChannel', ...userIds.map((userId) => ({ userId, serverId, channelId }))));
}

export function kickUsersFromServer(userIds: Types.User['userId'][], serverId: Types.Server['serverId']) {
  openAlertDialog(t('confirm-kick-users-from-server', { '0': userIds.length }), () => ipc.socket.send('blockUserFromServer', ...userIds.map((userId) => ({ userId, serverId }))));
}

export function applyMember(userId: Types.User['userId'], serverId: Types.Server['serverId'], isReceiveApply: boolean) {
  if (!isReceiveApply) openAlertDialog(t('cannot-apply-member'), () => {});
  else openApplyMember(userId, serverId);
}

export function deleteChannel(serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], channelName: Types.Channel['name']) {
  openAlertDialog(t('confirm-delete-channel', { '0': channelName }), () => ipc.socket.send('deleteChannel', { serverId, channelId }));
}

export function editChannel(serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], update: Partial<Types.Channel>) {
  ipc.socket.send('editChannel', { serverId, channelId, update });
}

export function editChannels(serverId: Types.Server['serverId'], updates: Partial<Types.Channel>[]) {
  ipc.socket.send('editChannel', ...updates.map((update) => ({ serverId, channelId: update.channelId!, update })));
}

export function sendFriendApplication(receiverId: Types.User['userId'], preset: Partial<Types.FriendApplication>, friendGroupId: Types.FriendGroup['friendGroupId'] | null) {
  ipc.socket.send('sendFriendApplication', { receiverId, preset, friendGroupId });
}

export function editFriendApplication(receiverId: Types.User['userId'], update: Partial<Types.FriendApplication>) {
  ipc.socket.send('editFriendApplication', { receiverId, update });
}

export function approveFriendApplication(senderId: Types.User['userId'], friendGroupId: Types.FriendGroup['friendGroupId'] | null, friendNote: Types.Friend['note']) {
  ipc.socket.send('approveFriendApplication', { senderId, friendGroupId, note: friendNote });
}

export function sendMemberApplication(serverId: Types.Server['serverId'], preset: Partial<Types.MemberApplication>) {
  ipc.socket.send('sendMemberApplication', { serverId, preset });
}

export function editMemberApplication(serverId: Types.Server['serverId'], update: Partial<Types.MemberApplication>) {
  ipc.socket.send('editMemberApplication', { serverId, update });
}

export function blockUserFromServer(userId: Types.User['userId'], serverId: Types.Server['serverId'], blockUntil: number) {
  ipc.socket.send('blockUserFromServer', { userId, serverId, blockUntil });
  ipc.socket.send('terminateMember', { userId, serverId });
}

export function unblockUserFromServer(userId: Types.User['userId'], serverId: Types.Server['serverId'], userName: Types.User['name']) {
  openAlertDialog(t('confirm-unblock-user', { '0': userName }), () => ipc.socket.send('unblockUserFromServer', { userId, serverId }));
}

export function blockUserFromChannel(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], blockUntil: number) {
  ipc.socket.send('blockUserFromChannel', { userId, serverId, channelId, blockUntil });
}

export function unblockUserFromChannel(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], userName: Types.User['name']) {
  openAlertDialog(t('confirm-unblock-user', { '0': userName }), () => ipc.socket.send('unblockUserFromChannel', { userId, serverId, channelId }));
}

export function terminateMember(userId: Types.User['userId'], serverId: Types.Server['serverId'], userName: Types.User['name']) {
  openAlertDialog(t('confirm-terminate-membership', { '0': userName }), () => ipc.socket.send('terminateMember', { userId, serverId }));
}

export function approveMemberApplication(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  ipc.socket.send('approveMemberApplication', { userId, serverId });
}

export function rejectMemberApplication(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  ipc.socket.send('rejectMemberApplication', { userId, serverId });
}

export function broadcastChannel(serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], preset: Partial<Types.PromptMessage>) {
  ipc.socket.send('actionMessage', { serverId, channelId, preset });
}

export function broadcastServer(serverId: Types.Server['serverId'], preset: Partial<Types.PromptMessage>) {
  ipc.socket.send('actionMessage', { serverId, preset });
}

export function acceptMemberInvitation(serverId: Types.Server['serverId']) {
  ipc.socket.send('acceptMemberInvitation', { serverId });
}

export function rejectMemberInvitation(serverId: Types.Server['serverId']) {
  ipc.socket.send('rejectMemberInvitation', { serverId });
}

export function rejectAllMemberInvitation(memberInvitations: Types.MemberInvitation[]) {
  if (memberInvitations.length === 0) return;
  openAlertDialog(t('confirm-reject-all-member-invitation'), () => ipc.socket.send('rejectMemberInvitation', ...memberInvitations.map((item) => ({ serverId: item.serverId }))));
}

export function sendMemberInvitation(receiverId: Types.Member['userId'], serverId: Types.Server['serverId'], preset: Partial<Types.MemberInvitation>) {
  ipc.socket.send('sendMemberInvitation', { receiverId, serverId, preset });
}

export function editMemberInvitation(receiverId: Types.Member['userId'], serverId: Types.Server['serverId'], update: Partial<Types.MemberInvitation>) {
  ipc.socket.send('editMemberInvitation', { receiverId, serverId, update });
}

export function rejectFriendApplication(senderId: Types.User['userId'], applicationName: Types.FriendApplication['name']) {
  openAlertDialog(t('confirm-reject-friend-application', { 0: applicationName }), () => ipc.socket.send('rejectFriendApplication', { senderId }));
}

export function rejectAllFriendApplication(friendApplications: Types.FriendApplication[]) {
  if (friendApplications.length === 0) return;
  openAlertDialog(t('confirm-reject-all-friend-application'), () => ipc.socket.send('rejectFriendApplication', ...friendApplications.map((item) => ({ senderId: item.senderId }))));
}

export function editMember(userId: Types.User['userId'], serverId: Types.Server['serverId'], update: Partial<Types.Member>) {
  ipc.socket.send('editMember', { userId, serverId, update });
}

export function editFriend(targetId: Types.User['userId'], update: Partial<Types.Friend>) {
  ipc.socket.send('editFriend', { targetId, update });
}

export function editFriendGroup(friendGroupId: Types.FriendGroup['friendGroupId'], update: Partial<Types.FriendGroup>) {
  ipc.socket.send('editFriendGroup', { friendGroupId, update });
}

export function sendMessage(targetId: Types.User['userId'], preset: Partial<Types.DirectMessage>) {
  ipc.socket.send('directMessage', { targetId, preset });
}

export function blockUser(targetId: Types.User['userId'], targetName: Types.User['name']) {
  openAlertDialog(t('confirm-block-user', { '0': targetName }), () => ipc.socket.send('blockUser', { targetId }));
}

export function unblockUser(targetId: Types.User['userId'], targetName: Types.User['name']) {
  openAlertDialog(t('confirm-unblock-user', { '0': targetName }), () => ipc.socket.send('unblockUser', { targetId }));
}

export function createServer(preset: Partial<Types.Server>) {
  ipc.socket.send('createServer', { preset });
}

export function createChannel(serverId: Types.Server['serverId'], preset: Partial<Types.Channel>) {
  ipc.socket.send('createChannel', { serverId, preset });
}

export function leaveServer(serverId: Types.Server['serverId']) {
  ipc.socket.send('disconnectServer', { serverId });
}

export function editUserStatus(status: Types.User['status']) {
  ipc.socket.send('editUser', { update: { status } });
}

export function editUser(update: Partial<Types.User>) {
  ipc.socket.send('editUser', { update });
}

export function favoriteServer(serverId: Types.Server['serverId']) {
  ipc.socket.send('favoriteServer', { serverId });
}

export function deleteFriendGroup(friendGroupId: Types.FriendGroup['friendGroupId'], friendGroupName: Types.FriendGroup['name']) {
  openAlertDialog(t('confirm-delete-friend-group', { '0': friendGroupName }), () => ipc.socket.send('deleteFriendGroup', { friendGroupId }));
}

export function deleteFriend(targetId: Types.User['userId'], targetName: Types.User['name']) {
  openAlertDialog(t('confirm-delete-friend', { '0': targetName }), () => ipc.socket.send('deleteFriend', { targetId }));
}

export function deleteFriendApplication(receiverId: Types.User['userId']) {
  openAlertDialog(t('confirm-delete-friend-application'), () => ipc.socket.send('deleteFriendApplication', { receiverId }));
}

export function forbidUserTextInChannel(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], isTextMuted: boolean) {
  ipc.socket.send('muteUserInChannel', { userId, serverId, channelId, mute: { isTextMuted } });
}

export function forbidUserVoiceInChannel(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], isVoiceMuted: boolean) {
  ipc.socket.send('muteUserInChannel', { userId, serverId, channelId, mute: { isVoiceMuted } });
}

export function increaseUserQueueTime(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) {
  ipc.socket.send('increaseUserQueueTime', { serverId, channelId, userId });
}

export function moveUserQueuePositionDown(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], position: number) {
  ipc.socket.send('moveUserQueuePosition', { serverId, channelId, userId, position });
}

export function moveUserQueuePositionUp(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], position: number) {
  ipc.socket.send('moveUserQueuePosition', { serverId, channelId, userId, position });
}

export function removeUserFromQueue(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], userName: Types.User['name']) {
  openAlertDialog(t('confirm-remove-from-queue', { '0': userName }), () => ipc.socket.send('removeUserFromQueue', { serverId, channelId, userId }));
}

export function clearQueue(serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) {
  openAlertDialog(t('confirm-clear-queue'), () => ipc.socket.send('clearQueue', { serverId, channelId }));
}

export function kickUserFromServer(userId: Types.User['userId'], serverId: Types.Server['serverId'], userName: Types.User['name']) {
  openAlertDialog(t('confirm-kick-user', { '0': userName }), () => ipc.socket.send('blockUserFromServer', { userId, serverId }));
}

export function kickUserFromChannel(userId: Types.User['userId'], channelId: Types.Channel['channelId'], serverId: Types.Server['serverId'], userName: Types.User['name']) {
  openAlertDialog(t('confirm-kick-user', { '0': userName }), () => ipc.socket.send('blockUserFromChannel', { userId, serverId, channelId }));
}

export function sendChannelMessage(serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], preset: Partial<Types.ChannelMessage>) {
  ipc.socket.send('channelMessage', { serverId, channelId, preset });
}

export function joinQueue(serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], position?: number) {
  ipc.socket.send('joinQueue', { serverId, channelId, position });
}

export function leaveQueue(serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) {
  ipc.socket.send('leaveQueue', { serverId, channelId });
}

export function controlQueue(serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) {
  ipc.socket.send('controlQueue', { serverId, channelId });
}

import packageJson from '../../package.json' with { type: 'json' };

import { t } from 'i18next';

import type * as Types from '@/types';

import { post, get } from '@/api';

import * as ipc from '@/main/ipc';

export function acceptMemberInvitation(serverId: Types.Server['serverId']) {
  ipc.socket.send('acceptMemberInvitation', { serverId });
}

export function addUserToQueue(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) {
  ipc.socket.send('addUserToQueue', { userId, serverId, channelId });
}

export function applyMember(userId: Types.User['userId'], serverId: Types.Server['serverId'], isReceiveApply: boolean) {
  if (!isReceiveApply) openAlertDialog(t('cannot-apply-member'), () => { });
  else openApplyMember(userId, serverId);
}

export function approveFriendApplication(senderId: Types.User['userId'], friendGroupId: Types.FriendGroup['friendGroupId'] | null, friendNote: Types.Friend['note']) {
  ipc.socket.send('approveFriendApplication', { senderId, friendGroupId, note: friendNote });
}

export function approveMemberApplication(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  ipc.socket.send('approveMemberApplication', { userId, serverId });
}

export function blockUser(targetId: Types.User['userId'], targetName: Types.User['name']) {
  openAlertDialog(t('confirm-block-user', { '0': targetName }), () => ipc.socket.send('blockUser', { targetId }));
}

export function blockUserFromChannel(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], blockUntil: number) {
  ipc.socket.send('blockUserFromChannel', { userId, serverId, channelId, blockUntil });
}

export function blockUserFromServer(userId: Types.User['userId'], serverId: Types.Server['serverId'], blockUntil: number) {
  ipc.socket.send('blockUserFromServer', { userId, serverId, blockUntil });
  ipc.socket.send('terminateMember', { userId, serverId });
}

export function broadcastChannel(serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], preset: Partial<Types.PromptMessage>) {
  ipc.socket.send('actionMessage', { serverId, channelId, preset });
}

export function broadcastServer(serverId: Types.Server['serverId'], preset: Partial<Types.PromptMessage>) {
  ipc.socket.send('actionMessage', { serverId, preset });
}

export function clearQueue(serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) {
  openAlertDialog(t('confirm-clear-queue'), () => ipc.socket.send('clearQueue', { serverId, channelId }));
}

export function connectChannel(serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], canJoin: boolean, isPasswordNeeded: boolean) {
  if (!canJoin) return;
  if (isPasswordNeeded) openChannelPassword((password) => ipc.socket.send('connectChannel', { serverId, channelId, password }));
  else ipc.socket.send('connectChannel', { serverId, channelId });
}

export function controlQueue(serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) {
  ipc.socket.send('controlQueue', { serverId, channelId });
}

export function createChannel(serverId: Types.Server['serverId'], preset: Partial<Types.Channel>) {
  ipc.socket.send('createChannel', { serverId, preset });
}

export function createServer(preset: Partial<Types.Server>) {
  ipc.socket.send('createServer', { preset });
}

export function deleteChannel(serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], channelName: Types.Channel['name']) {
  openAlertDialog(t('confirm-delete-channel', { '0': channelName }), () => ipc.socket.send('deleteChannel', { serverId, channelId }));
}

export function deleteFriend(targetId: Types.User['userId'], targetName: Types.User['name']) {
  openAlertDialog(t('confirm-delete-friend', { '0': targetName }), () => ipc.socket.send('deleteFriend', { targetId }));
}

export function deleteFriendApplication(receiverId: Types.User['userId']) {
  openAlertDialog(t('confirm-delete-friend-application'), () => ipc.socket.send('deleteFriendApplication', { receiverId }));
}

export function deleteFriendGroup(friendGroupId: Types.FriendGroup['friendGroupId'], friendGroupName: Types.FriendGroup['name']) {
  openAlertDialog(t('confirm-delete-friend-group', { '0': friendGroupName }), () => ipc.socket.send('deleteFriendGroup', { friendGroupId }));
}

export function editChannel(serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], update: Partial<Types.Channel>) {
  ipc.socket.send('editChannel', { serverId, channelId, update });
}

export function editChannelPermission(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], update: Partial<Types.Channel>) {
  ipc.socket.send('editChannelPermission', { userId, serverId, channelId, update });
}

export function editChannels(serverId: Types.Server['serverId'], updates: Partial<Types.Channel>[]) {
  ipc.socket.send('editChannel', ...updates.map((update) => ({ serverId, channelId: update.channelId!, update })));
}

export function editFriend(targetId: Types.User['userId'], update: Partial<Types.Friend>) {
  ipc.socket.send('editFriend', { targetId, update });
}

export function editFriendApplication(receiverId: Types.User['userId'], update: Partial<Types.FriendApplication>) {
  ipc.socket.send('editFriendApplication', { receiverId, update });
}

export function editFriendGroup(friendGroupId: Types.FriendGroup['friendGroupId'], update: Partial<Types.FriendGroup>) {
  ipc.socket.send('editFriendGroup', { friendGroupId, update });
}

export function editMember(userId: Types.User['userId'], serverId: Types.Server['serverId'], update: Partial<Types.Member>) {
  ipc.socket.send('editMember', { userId, serverId, update });
}

export function editMemberApplication(serverId: Types.Server['serverId'], update: Partial<Types.MemberApplication>) {
  ipc.socket.send('editMemberApplication', { serverId, update });
}

export function editMemberInvitation(receiverId: Types.Member['userId'], serverId: Types.Server['serverId'], update: Partial<Types.MemberInvitation>) {
  ipc.socket.send('editMemberInvitation', { receiverId, serverId, update });
}

export function editServer(serverId: Types.Server['serverId'], update: Partial<Types.Server>) {
  ipc.socket.send('editServer', { serverId, update });
}

export function editServerPermission(userId: Types.User['userId'], serverId: Types.Server['serverId'], update: Partial<Types.Server>) {
  ipc.socket.send('editServerPermission', { userId, serverId, update });
}

export function editUser(update: Partial<Types.User>) {
  ipc.socket.send('editUser', { update });
}

export function editUserStatus(status: Types.User['status']) {
  ipc.socket.send('editUser', { update: { status } });
}

export function favoriteServer(serverId: Types.Server['serverId']) {
  ipc.socket.send('favoriteServer', { serverId });
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

export function joinQueue(serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], position?: number) {
  ipc.socket.send('joinQueue', { serverId, channelId, position });
}

export function kickUserFromChannel(userId: Types.User['userId'], channelId: Types.Channel['channelId'], serverId: Types.Server['serverId'], userName: Types.User['name']) {
  openAlertDialog(t('confirm-kick-user', { '0': userName }), () => ipc.socket.send('blockUserFromChannel', { userId, serverId, channelId }));
}

export function kickUserFromServer(userId: Types.User['userId'], serverId: Types.Server['serverId'], userName: Types.User['name']) {
  openAlertDialog(t('confirm-kick-user', { '0': userName }), () => ipc.socket.send('blockUserFromServer', { userId, serverId }));
}

export function kickUsersFromServer(userIds: Types.User['userId'][], serverId: Types.Server['serverId']) {
  openAlertDialog(t('confirm-kick-users-from-server', { '0': userIds.length }), () => ipc.socket.send('blockUserFromServer', ...userIds.map((userId) => ({ userId, serverId }))));
}

export function leaveQueue(serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) {
  ipc.socket.send('leaveQueue', { serverId, channelId });
}

export function leaveServer(serverId: Types.Server['serverId']) {
  ipc.socket.send('disconnectServer', { serverId });
}

export function moveAllUsersToChannel(userIds: Types.User['userId'][], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) {
  openAlertDialog(t('confirm-move-members-to-channel', { '0': userIds.length }), () => ipc.socket.send('moveUserToChannel', ...userIds.map((userId) => ({ userId, serverId, channelId }))));
}

export function moveUserQueuePositionDown(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], position: number) {
  ipc.socket.send('moveUserQueuePosition', { serverId, channelId, userId, position });
}

export function moveUserQueuePositionUp(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], position: number) {
  ipc.socket.send('moveUserQueuePosition', { serverId, channelId, userId, position });
}

export function moveUserToChannel(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) {
  openAlertDialog(t('confirm-move-members-to-channel', { '0': 1 }), () => ipc.socket.send('moveUserToChannel', { userId, serverId, channelId }));
}

export function openAboutUs() {
  ipc.popup.open('aboutus', 'aboutUs');
}

export function openAlertDialog(message: string, callback: () => void) {
  ipc.popup.open('dialogAlert', 'dialogAlert', { message });
  ipc.popup.onSubmit('dialogAlert', callback);
}

export async function openApplyFriend(senderId: Types.User['userId'], receiverId: Types.User['userId']) {
  await ipc.api.fetchFriendApplication({ receiverId, senderId }).then((receivedFriendApplication) => {
    if (receivedFriendApplication) {
      ipc.popup.open('approveFriend', 'approveFriend', { senderId, receiverId });
    } else {
      ipc.popup.open('applyFriend', 'applyFriend', { senderId, receiverId });
    }
  });
}

export function openApplyMember(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  ipc.popup.open('applyMember', 'applyMember', { userId, serverId });
}

export function openApproveFriend(receiverId: Types.User['userId'], senderId: Types.User['userId']) {
  ipc.popup.open('approveFriend', 'approveFriend', { receiverId, senderId });
}

export function openBlockMember(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  ipc.popup.open('blockMember', `blockMember`, { userId, serverId });
}

export function openChangeTheme() {
  ipc.popup.open('changeTheme', 'changeTheme');
}

export function openChannelEvent() {
  ipc.popup.open('channelEvent', 'channelEvent');
}

export function openChannelPassword(onSubmit: (password: string) => void) {
  ipc.popup.open('channelPassword', 'channelPassword');
  ipc.popup.onSubmit('channelPassword', onSubmit);
}

export function openChannelSetting(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) {
  ipc.popup.open('channelSetting', 'channelSetting', { userId, serverId, channelId });
}

export function openChatHistory(userId: Types.User['userId'], targetId: Types.User['userId']) {
  ipc.popup.open('chatHistory', 'chatHistory', { userId, targetId });
}

export function openCreateChannel(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId?: Types.Channel['channelId']) {
  ipc.popup.open('createChannel', 'createChannel', { userId, serverId, channelId });
}

export function openCreateFriendGroup() {
  ipc.popup.open('createFriendGroup', 'createFriendGroup');
}

export function openCreateServer() {
  ipc.popup.open('createServer', 'createServer');
}

export function openDirectMessage(userId: Types.User['userId'], targetId: Types.User['userId']) {
  ipc.popup.open('directMessage', `directMessage-${targetId}`, { userId, targetId });
}

export function openEditChannelName(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) {
  ipc.popup.open('editChannelName', 'editChannelName', { userId, serverId, channelId });
}

export function openEditChannelOrder(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  ipc.popup.open('editChannelOrder', 'editChannelOrder', { serverId, userId });
}

export function openEditFriendGroupName(userId: Types.User['userId'], friendGroupId: Types.FriendGroup['friendGroupId']) {
  ipc.popup.open('editFriendGroupName', 'editFriendGroupName', { userId, friendGroupId });
}

export function openEditFriendNote(userId: Types.User['userId'], targetId: Types.User['userId']) {
  ipc.popup.open('editFriendNote', 'editFriendNote', { userId, targetId });
}

export function openEditNickname(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  ipc.popup.open('editNickname', 'editNickname', { serverId, userId });
}

export function openErrorDialog(error: Error, callback: () => void) {
  ipc.popup.open('dialogError', 'dialogError', { error });
  ipc.popup.onSubmit('dialogError', callback);
}

export function openFriendVerification() {
  ipc.popup.open('friendVerification', 'friendVerification');
}

export function openImageCropper(imageUnit8Array: Uint8Array, onSubmit: (imageUnit8Array: Uint8Array) => void) {
  ipc.popup.open('imageCropper', 'imageCropper', { imageUnit8Array });
  ipc.popup.onSubmit('imageCropper', onSubmit);
}

export function openInviteFriend(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  ipc.popup.open('inviteFriend', `inviteFriend`, { userId, serverId });
}

export function openInviteMember(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  ipc.popup.open('inviteMember', `inviteMember`, { userId, serverId });
}

export function openKickMemberFromChannel(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) {
  ipc.popup.open('kickMemberFromChannel', `kickMemberFromChannel`, { userId, serverId, channelId });
}

export function openKickMemberFromServer(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  ipc.popup.open('kickMemberFromServer', `kickMemberFromServer`, { userId, serverId });
}

export function openMemberApplicationSetting(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  ipc.popup.open('memberApplicationSetting', 'memberApplicationSetting', { userId, serverId });
}

export function openMemberInvitation() {
  ipc.popup.open('memberInvitation', 'memberInvitation');
}

export function openNetworkDiagnosis() {
  ipc.popup.open('networkDiagnosis', 'networkDiagnosis');
}

export function openSearchUser() {
  ipc.popup.open('searchUser', 'searchUser');
}

export function openServerAnnouncement(serverAnnouncement: Types.Server['announcement']) {
  ipc.popup.open('serverAnnouncement', 'serverAnnouncement', { serverAnnouncement });
}

export function openServerApplication(userId: Types.User['userId'], serverId: Types.Server['serverId'], onSubmit: (action: string) => void) {
  ipc.popup.open('serverApplication', 'serverApplication', { userId, serverId });
  ipc.popup.onSubmit('serverApplication', onSubmit);
}

export function openServerBroadcast(serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) {
  ipc.popup.open('serverBroadcast', 'serverBroadcast', { serverId, channelId });
}

export function openServerSetting(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  ipc.popup.open('serverSetting', 'serverSetting', { userId, serverId });
}

export function openSystemSetting(userId: Types.User['userId']) {
  ipc.popup.open('systemSetting', 'systemSetting', { userId });
}

export function openUserInfo(userId: Types.User['userId'], targetId: Types.User['userId']) {
  ipc.popup.open('userInfo', `userInfo-${targetId}`, { userId, targetId });
}

export function rejectAllFriendApplication(friendApplications: Types.FriendApplication[]) {
  if (friendApplications.length === 0) return;
  openAlertDialog(t('confirm-reject-all-friend-application'), () => ipc.socket.send('rejectFriendApplication', ...friendApplications.map((item) => ({ senderId: item.senderId }))));
}

export function rejectAllMemberInvitation(memberInvitations: Types.MemberInvitation[]) {
  if (memberInvitations.length === 0) return;
  openAlertDialog(t('confirm-reject-all-member-invitation'), () => ipc.socket.send('rejectMemberInvitation', ...memberInvitations.map((item) => ({ serverId: item.serverId }))));
}

export function rejectFriendApplication(senderId: Types.User['userId'], senderName: Types.FriendApplication['name']) {
  openAlertDialog(t('confirm-reject-friend-application', { 0: senderName }), () => ipc.socket.send('rejectFriendApplication', { senderId }));
}

export function rejectMemberApplication(userId: Types.User['userId'], serverId: Types.Server['serverId']) {
  ipc.socket.send('rejectMemberApplication', { userId, serverId });
}

export function rejectMemberInvitation(serverId: Types.Server['serverId']) {
  ipc.socket.send('rejectMemberInvitation', { serverId });
}

export function removeUserFromQueue(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], userName: Types.User['name']) {
  openAlertDialog(t('confirm-remove-from-queue', { '0': userName }), () => ipc.socket.send('removeUserFromQueue', { serverId, channelId, userId }));
}

export function sendChannelMessage(serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], preset: Partial<Types.ChannelMessage>) {
  ipc.socket.send('channelMessage', { serverId, channelId, preset });
}

export function sendFriendApplication(receiverId: Types.User['userId'], preset: Partial<Types.FriendApplication>, friendGroupId: Types.FriendGroup['friendGroupId'] | null) {
  ipc.socket.send('sendFriendApplication', { receiverId, preset, friendGroupId });
}

export function sendMemberApplication(serverId: Types.Server['serverId'], preset: Partial<Types.MemberApplication>) {
  ipc.socket.send('sendMemberApplication', { serverId, preset });
}

export function sendMemberInvitation(receiverId: Types.Member['userId'], serverId: Types.Server['serverId'], preset: Partial<Types.MemberInvitation>) {
  ipc.socket.send('sendMemberInvitation', { receiverId, serverId, preset });
}

export function sendMessage(targetId: Types.User['userId'], preset: Partial<Types.DirectMessage>) {
  ipc.socket.send('directMessage', { targetId, preset });
}

export function terminateMember(userId: Types.User['userId'], serverId: Types.Server['serverId'], userName: Types.User['name']) {
  openAlertDialog(t('confirm-terminate-membership', { '0': userName }), () => ipc.socket.send('terminateMember', { userId, serverId }));
}

export function unblockUser(targetId: Types.User['userId'], targetName: Types.User['name']) {
  openAlertDialog(t('confirm-unblock-user', { '0': targetName }), () => ipc.socket.send('unblockUser', { targetId }));
}

export function unblockUserFromChannel(userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], userName: Types.User['name']) {
  openAlertDialog(t('confirm-unblock-user', { '0': userName }), () => ipc.socket.send('unblockUserFromChannel', { userId, serverId, channelId }));
}

export function unblockUserFromServer(userId: Types.User['userId'], serverId: Types.Server['serverId'], userName: Types.User['name']) {
  openAlertDialog(t('confirm-unblock-user', { '0': userName }), () => ipc.socket.send('unblockUserFromServer', { userId, serverId }));
}

type fetchUserParams = {
  userId: string;
};

export async function fetchUser(params: fetchUserParams): Promise<Types.User | null> {
  return await get(`/user?${new URLSearchParams(params).toString()}`);
}

type fetchUserSettingsParams = {
  userId: string;
};

export async function fetchUserSettings(params: fetchUserSettingsParams): Promise<Types.UserSetting | null> {
  return await get(`/user?${new URLSearchParams(params).toString()}`);
}

type fetchFriendParams = {
  userId: string;
  targetId: string;
};

export async function fetchFriend(params: fetchFriendParams): Promise<Types.Friend | null> {
  return await get(`/friend?${new URLSearchParams(params).toString()}`);
}

type fetchFriendsParams = {
  userId: string;
};

export async function fetchFriends(params: fetchFriendsParams): Promise<Types.Friend[]> {
  return (await get(`/friends?${new URLSearchParams(params).toString()}`)) ?? [];
}

type fetchFriendActivitiesParams = {
  userId: string;
};

export async function fetchFriendActivities(params: fetchFriendActivitiesParams): Promise<Types.FriendActivity[]> {
  return (await get(`/friendActivities?${new URLSearchParams(params).toString()}`)) ?? [];
}

type fetchFriendGroupParams = {
  userId: string;
  friendGroupId: string;
};

export async function fetchFriendGroup(params: fetchFriendGroupParams): Promise<Types.FriendGroup | null> {
  return await get(`/friendGroup?${new URLSearchParams(params).toString()}`);
}

type fetchFriendGroupsParams = {
  userId: string;
};

export async function fetchFriendGroups(params: fetchFriendGroupsParams): Promise<Types.FriendGroup[]> {
  return (await get(`/friendGroups?${new URLSearchParams(params).toString()}`)) ?? [];
}

type fetchFriendApplicationParams = {
  receiverId: string;
  senderId: string;
};

export async function fetchFriendApplication(params: fetchFriendApplicationParams): Promise<Types.FriendApplication | null> {
  return await get(`/friendApplication?${new URLSearchParams(params).toString()}`);
}

type fetchFriendApplicationsParams = {
  receiverId: string;
};

export async function fetchFriendApplications(params: fetchFriendApplicationsParams): Promise<Types.FriendApplication[]> {
  return (await get(`/friendApplications?${new URLSearchParams(params).toString()}`)) ?? [];
}

type fetchServerParams = {
  userId: string;
  serverId: string;
};

export async function fetchServer(params: fetchServerParams): Promise<Types.Server | null> {
  return await get(`/server?${new URLSearchParams(params).toString()}`);
}

type fetchServersParams = {
  userId: string;
};

export async function fetchServers(params: fetchServersParams): Promise<Types.Server[]> {
  return (await get(`/servers?${new URLSearchParams(params).toString()}`)) ?? [];
}

type fetchServerMembersParams = {
  serverId: string;
};

export async function fetchServerMembers(params: fetchServerMembersParams): Promise<Types.Member[]> {
  return (await get(`/serverMembers?${new URLSearchParams(params).toString()}`)) ?? [];
}

type fetchServerOnlineMembersParams = {
  serverId: string;
};

export async function fetchServerOnlineMembers(params: fetchServerOnlineMembersParams): Promise<Types.OnlineMember[]> {
  return (await get(`/serverOnlineMembers?${new URLSearchParams(params).toString()}`)) ?? [];
}

type fetchChannelParams = {
  userId: string;
  serverId: string;
  channelId: string;
};

export async function fetchChannel(params: fetchChannelParams): Promise<Types.Channel | null> {
  return await get(`/channel?${new URLSearchParams(params).toString()}`);
}

type fetchChannelsParams = {
  userId: string;
  serverId: string;
};

export async function fetchChannels(params: fetchChannelsParams): Promise<Types.Channel[]> {
  return (await get(`/channels?${new URLSearchParams(params).toString()}`)) ?? [];
}

type fetchChannelMembersParams = {
  serverId: string;
  channelId: string;
};

export async function fetchChannelMembers(params: fetchChannelMembersParams): Promise<Types.Member[]> {
  return (await get(`/channelMembers?${new URLSearchParams(params).toString()}`)) ?? [];
}

type fetchMemberParams = {
  userId: string;
  serverId: string;
  channelId?: string;
};

export async function fetchMember(params: fetchMemberParams): Promise<Types.Member | null> {
  return await get(`/member?${new URLSearchParams(params).toString()}`);
}

type fetchMemberApplicationParams = {
  userId: string;
  serverId: string;
};

export async function fetchMemberApplication(params: fetchMemberApplicationParams): Promise<Types.MemberApplication | null> {
  return await get(`/memberApplication?${new URLSearchParams(params).toString()}`);
}

type fetchMemberApplicationsParams = {
  serverId: string;
};

export async function fetchMemberApplications(params: fetchMemberApplicationsParams): Promise<Types.MemberApplication[]> {
  return (await get(`/memberApplications?${new URLSearchParams(params).toString()}`)) ?? [];
}

type fetchMemberInvitationParams = {
  receiverId: string;
  serverId: string;
};

export async function fetchMemberInvitation(params: fetchMemberInvitationParams): Promise<Types.MemberInvitation | null> {
  return await get(`/memberInvitation?${new URLSearchParams(params).toString()}`);
}

type fetchMemberInvitationsParams = {
  receiverId: string;
};

export async function fetchMemberInvitations(params: fetchMemberInvitationsParams): Promise<Types.MemberInvitation[]> {
  return (await get(`/memberInvitations?${new URLSearchParams(params).toString()}`)) ?? [];
}

type fetchNotificationsParams = {
  region: string;
};

export async function fetchNotifications(params: fetchNotificationsParams): Promise<Types.Notification[]> {
  return (await get(`/notifications?${new URLSearchParams(params).toString()}`)) ?? [];
}

type fetchAnnouncementsParams = {
  region: string;
};

export async function fetchAnnouncements(params: fetchAnnouncementsParams): Promise<Types.Announcement[]> {
  return (await get(`/announcements?${new URLSearchParams(params).toString()}`)) ?? [];
}

type fetchRecommendServersParams = {
  region: string;
};

export async function fetchRecommendServers(params: fetchRecommendServersParams): Promise<Types.RecommendServer[]> {
  return (await get(`/recommendServers?${new URLSearchParams(params).toString()}`)) ?? [];
}

type uploadImageParams = {
  folder: string;
  imageName: string;
  imageUnit8Array: Uint8Array;
};

export async function uploadImage(params: uploadImageParams): Promise<{ imageName: string; imageUrl: string } | null> {
  const form = new FormData();
  form.append('folder', params.folder);
  form.append('imageName', params.imageName);
  form.append('image', new Blob([params.imageUnit8Array], { type: 'image/webp' }), `${params.imageName}.svg`);
  return await post('/upload/image', form);
}

type searchServerParams = {
  query: string;
};

export async function searchServer(params: searchServerParams): Promise<Types.Server[]> {
  return (await get(`/server/search?${new URLSearchParams(params).toString()}`)) ?? [];
}

type searchUserParams = {
  query: string;
};

export async function searchUser(params: searchUserParams): Promise<Types.User[]> {
  return (await get(`/user/search?${new URLSearchParams(params).toString()}`)) ?? [];
}

type RegisterForm = {
  account: string;
  password: string;
  email: string;
  username: string;
  locale: string;
};

export async function register(formData: RegisterForm): Promise<{ success: true; message: string } | { success: false }> {
  const res = await post('/account/register', formData);
  if (!res || typeof res !== 'object' || !('message' in res) || typeof res.message !== 'string') return { success: false };

  return { success: true, message: res.message };
}

type LoginForm = {
  account: string;
  password: string;
};

export async function login(formData: LoginForm): Promise<{ success: true; token: string } | { success: false }> {
  const res = await post('/account/login', { ...formData, version: packageJson.version });
  if (!res || typeof res !== 'object' || !('token' in res) || typeof res.token !== 'string') return { success: false };

  return { success: true, token: res.token };
}

export async function autoLogin(token: string): Promise<{ success: true; token: string } | { success: false }> {
  const res = await post('/token/verify', { token, version: packageJson.version });
  if (!res || typeof res !== 'object' || !('token' in res) || typeof res.token !== 'string') return { success: false };

  return { success: true, token: res.token };
}


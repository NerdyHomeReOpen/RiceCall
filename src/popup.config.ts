/**
 * Unified Popup Configuration
 *
 * This file defines all popup settings used by both Electron (main.ts) and Web (InAppPopupHost.tsx).
 * Changes here will automatically apply to both platforms.
 */

import type * as Types from '@/types';

// ============================================================================
// Popup Size Configuration
// ============================================================================

export interface PopupSizeConfig {
  width: number;
  height: number;
}

export const POPUP_SIZES: Record<Types.PopupType, PopupSizeConfig> = {
  aboutus: { width: 500, height: 750 },
  applyFriend: { width: 490, height: 375 },
  approveFriend: { width: 400, height: 250 },
  applyMember: { width: 490, height: 300 },
  blockMember: { width: 400, height: 250 },
  channelEvent: { width: 500, height: 400 },
  channelSetting: { width: 600, height: 520 },
  channelPassword: { width: 380, height: 200 },
  changeTheme: { width: 480, height: 335 },
  chatHistory: { width: 714, height: 547 },
  createServer: { width: 478, height: 436 },
  createChannel: { width: 380, height: 200 },
  createFriendGroup: { width: 380, height: 200 },
  directMessage: { width: 650, height: 550 },
  dialogAlert: { width: 380, height: 200 },
  dialogAlert2: { width: 380, height: 200 },
  dialogSuccess: { width: 380, height: 200 },
  dialogWarning: { width: 380, height: 200 },
  dialogError: { width: 380, height: 200 },
  dialogInfo: { width: 380, height: 200 },
  editChannelOrder: { width: 500, height: 550 },
  editChannelName: { width: 380, height: 200 },
  editNickname: { width: 380, height: 200 },
  editFriendNote: { width: 380, height: 200 },
  editFriendGroupName: { width: 380, height: 200 },
  friendVerification: { width: 500, height: 550 },
  imageCropper: { width: 610, height: 520 },
  inviteMember: { width: 490, height: 300 },
  kickMemberFromChannel: { width: 400, height: 250 },
  kickMemberFromServer: { width: 400, height: 250 },
  memberApplicationSetting: { width: 380, height: 220 },
  memberInvitation: { width: 500, height: 550 },
  searchUser: { width: 380, height: 200 },
  serverApplication: { width: 320, height: 150 },
  serverSetting: { width: 600, height: 520 },
  serverBroadcast: { width: 450, height: 300 },
  systemSetting: { width: 600, height: 520 },
  userInfo: { width: 440, height: 630 },
  userSetting: { width: 500, height: 700 },
};

// ============================================================================
// Popup Header Configuration
// ============================================================================

export type PopupHeaderButton = 'minimize' | 'maxsize' | 'close';

export interface PopupHeaderConfig {
  buttons: PopupHeaderButton[];
  hideHeader: boolean;
}

export const POPUP_HEADERS: Record<Types.PopupType, PopupHeaderConfig> = {
  aboutus: { buttons: ['close'], hideHeader: false },
  applyFriend: { buttons: ['close'], hideHeader: false },
  applyMember: { buttons: ['close'], hideHeader: false },
  approveFriend: { buttons: ['close'], hideHeader: false },
  blockMember: { buttons: ['close'], hideHeader: false },
  channelEvent: { buttons: ['close'], hideHeader: false },
  changeTheme: { buttons: ['close'], hideHeader: false },
  channelPassword: { buttons: ['close'], hideHeader: false },
  channelSetting: { buttons: ['close'], hideHeader: false },
  chatHistory: { buttons: ['close'], hideHeader: false },
  createServer: { buttons: ['close'], hideHeader: false },
  createChannel: { buttons: ['close'], hideHeader: false },
  createFriendGroup: { buttons: ['close'], hideHeader: false },
  dialogAlert: { buttons: ['close'], hideHeader: false },
  dialogAlert2: { buttons: ['close'], hideHeader: false },
  dialogError: { buttons: ['close'], hideHeader: false },
  dialogInfo: { buttons: ['close'], hideHeader: false },
  dialogSuccess: { buttons: ['close'], hideHeader: false },
  dialogWarning: { buttons: ['close'], hideHeader: false },
  directMessage: { buttons: ['close', 'minimize', 'maxsize'], hideHeader: false },
  editChannelOrder: { buttons: ['close'], hideHeader: false },
  editChannelName: { buttons: ['close'], hideHeader: false },
  editFriendNote: { buttons: ['close'], hideHeader: false },
  editFriendGroupName: { buttons: ['close'], hideHeader: false },
  editNickname: { buttons: ['close'], hideHeader: false },
  friendVerification: { buttons: ['close'], hideHeader: false },
  imageCropper: { buttons: ['close'], hideHeader: false },
  inviteMember: { buttons: ['close'], hideHeader: false },
  kickMemberFromChannel: { buttons: ['close'], hideHeader: false },
  kickMemberFromServer: { buttons: ['close'], hideHeader: false },
  memberApplicationSetting: { buttons: ['close'], hideHeader: false },
  memberInvitation: { buttons: ['close'], hideHeader: false },
  searchUser: { buttons: ['close'], hideHeader: false },
  serverApplication: { buttons: ['close'], hideHeader: false },
  serverBroadcast: { buttons: ['close'], hideHeader: false },
  serverSetting: { buttons: ['close'], hideHeader: false },
  systemSetting: { buttons: ['close'], hideHeader: false },
  userInfo: { buttons: ['close'], hideHeader: true },
  userSetting: { buttons: ['close'], hideHeader: false },
};

// ============================================================================
// Popup Title Keys (i18n)
// ============================================================================

export const POPUP_TITLE_KEYS: Record<Types.PopupType, string> = {
  aboutus: 'about-ricecall',
  applyFriend: 'apply-friend',
  applyMember: 'apply-member',
  approveFriend: 'approve-friend',
  blockMember: 'block',
  channelEvent: 'channel-event',
  changeTheme: 'change-theme',
  channelPassword: 'please-enter-the-channel-password',
  channelSetting: 'edit-channel',
  chatHistory: 'chat-history',
  createServer: 'create-server',
  createChannel: 'create-channel',
  createFriendGroup: 'create-friend-group',
  dialogAlert: 'alert',
  dialogAlert2: 'alert',
  dialogError: 'error',
  dialogInfo: 'info',
  dialogSuccess: 'success',
  dialogWarning: 'warning',
  directMessage: 'direct-message',
  editChannelOrder: 'edit-channel-order',
  editChannelName: 'edit-channel-name',
  editFriendNote: 'edit-friend-note',
  editFriendGroupName: 'edit-friend-group-name',
  editNickname: 'edit-nickname',
  friendVerification: 'friend-verification',
  imageCropper: 'image-cropper',
  inviteMember: 'invite-member',
  kickMemberFromChannel: 'kick-channel',
  kickMemberFromServer: 'kick-server',
  memberApplicationSetting: 'member-application-setting',
  memberInvitation: 'member-invitation',
  searchUser: 'search-user',
  serverApplication: 'server-application',
  serverBroadcast: 'server-broadcast',
  serverSetting: 'server-setting',
  systemSetting: 'system-setting',
  userInfo: 'user-info',
  userSetting: 'user-setting',
};

// ============================================================================
// Popup Behavior Configuration
// ============================================================================

export interface PopupBehaviorConfig {
  /** Whether the popup can be resized */
  resizable: boolean;
  /** Whether the popup can be maximized */
  maximizable: boolean;
  /** Whether the popup can go fullscreen */
  fullscreenable: boolean;
}

export const POPUP_BEHAVIORS: Record<Types.PopupType, PopupBehaviorConfig> = {
  aboutus: { resizable: false, maximizable: false, fullscreenable: false },
  applyFriend: { resizable: false, maximizable: false, fullscreenable: false },
  approveFriend: { resizable: false, maximizable: false, fullscreenable: false },
  applyMember: { resizable: false, maximizable: false, fullscreenable: false },
  blockMember: { resizable: false, maximizable: false, fullscreenable: false },
  channelEvent: { resizable: false, maximizable: false, fullscreenable: false },
  channelSetting: { resizable: false, maximizable: false, fullscreenable: false },
  channelPassword: { resizable: false, maximizable: false, fullscreenable: false },
  changeTheme: { resizable: false, maximizable: false, fullscreenable: false },
  chatHistory: { resizable: false, maximizable: false, fullscreenable: false },
  createServer: { resizable: false, maximizable: false, fullscreenable: false },
  createChannel: { resizable: false, maximizable: false, fullscreenable: false },
  createFriendGroup: { resizable: false, maximizable: false, fullscreenable: false },
  directMessage: { resizable: true, maximizable: true, fullscreenable: true },
  dialogAlert: { resizable: false, maximizable: false, fullscreenable: false },
  dialogAlert2: { resizable: false, maximizable: false, fullscreenable: false },
  dialogSuccess: { resizable: false, maximizable: false, fullscreenable: false },
  dialogWarning: { resizable: false, maximizable: false, fullscreenable: false },
  dialogError: { resizable: false, maximizable: false, fullscreenable: false },
  dialogInfo: { resizable: false, maximizable: false, fullscreenable: false },
  editChannelOrder: { resizable: false, maximizable: false, fullscreenable: false },
  editChannelName: { resizable: false, maximizable: false, fullscreenable: false },
  editNickname: { resizable: false, maximizable: false, fullscreenable: false },
  editFriendNote: { resizable: false, maximizable: false, fullscreenable: false },
  editFriendGroupName: { resizable: false, maximizable: false, fullscreenable: false },
  friendVerification: { resizable: false, maximizable: false, fullscreenable: false },
  imageCropper: { resizable: false, maximizable: false, fullscreenable: false },
  inviteMember: { resizable: false, maximizable: false, fullscreenable: false },
  kickMemberFromChannel: { resizable: false, maximizable: false, fullscreenable: false },
  kickMemberFromServer: { resizable: false, maximizable: false, fullscreenable: false },
  memberApplicationSetting: { resizable: false, maximizable: false, fullscreenable: false },
  memberInvitation: { resizable: false, maximizable: false, fullscreenable: false },
  searchUser: { resizable: false, maximizable: false, fullscreenable: false },
  serverApplication: { resizable: false, maximizable: false, fullscreenable: false },
  serverSetting: { resizable: false, maximizable: false, fullscreenable: false },
  serverBroadcast: { resizable: false, maximizable: false, fullscreenable: false },
  systemSetting: { resizable: false, maximizable: false, fullscreenable: false },
  userInfo: { resizable: false, maximizable: false, fullscreenable: false },
  userSetting: { resizable: false, maximizable: false, fullscreenable: false },
};

// ============================================================================
// Popup Component Mapping
// ============================================================================

/**
 * Map popup types to their component file names (without extension).
 * This is used by the code generator to create imports.
 */
export const POPUP_COMPONENTS: Record<Types.PopupType, string> = {
  aboutus: 'About',
  applyFriend: 'ApplyFriend',
  approveFriend: 'ApproveFriend',
  applyMember: 'ApplyMember',
  blockMember: 'BlockMember',
  channelEvent: 'ChannelEvent',
  changeTheme: 'ChangeTheme',
  channelPassword: 'ChannelPassword',
  channelSetting: 'ChannelSetting',
  chatHistory: 'chatHistory',
  createServer: 'CreateServer',
  createChannel: 'CreateChannel',
  createFriendGroup: 'CreateFriendGroup',
  directMessage: 'DirectMessage',
  dialogAlert: 'Dialog',
  dialogAlert2: 'Dialog',
  dialogSuccess: 'Dialog',
  dialogWarning: 'Dialog',
  dialogError: 'Dialog',
  dialogInfo: 'Dialog',
  editChannelOrder: 'EditChannelOrder',
  editChannelName: 'EditChannelName',
  editNickname: 'EditNickname',
  editFriendNote: 'EditFriendNote',
  editFriendGroupName: 'EditFriendGroupName',
  friendVerification: 'FriendVerification',
  imageCropper: 'ImageCropper',
  inviteMember: 'InviteMember',
  kickMemberFromChannel: 'KickMemberFromChannel',
  kickMemberFromServer: 'KickMemberFromServer',
  memberApplicationSetting: 'MemberApplicationSetting',
  memberInvitation: 'MemberInvitation',
  searchUser: 'SearchUser',
  serverApplication: 'ServerApplication',
  serverSetting: 'ServerSetting',
  serverBroadcast: 'ServerBroadcast',
  systemSetting: 'SystemSetting',
  userInfo: 'UserInfo',
  userSetting: 'UserSetting',
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the full popup configuration for a given type.
 */
export function getPopupConfig(type: Types.PopupType) {
  return {
    size: POPUP_SIZES[type],
    header: POPUP_HEADERS[type],
    titleKey: POPUP_TITLE_KEYS[type],
    behavior: POPUP_BEHAVIORS[type],
    component: POPUP_COMPONENTS[type],
  };
}

/**
 * Get all popup types.
 */
export function getAllPopupTypes(): Types.PopupType[] {
  return Object.keys(POPUP_SIZES) as Types.PopupType[];
}

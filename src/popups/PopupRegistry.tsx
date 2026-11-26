import React from 'react';

import type * as Types from '@/types';

import { POPUP_CONFIGS } from '@/configs/popup';

import About from '@/popups/about';
import ApplyFriend from '@/popups/apply-friend';
import ApproveFriend from '@/popups/approve-friend';
import ApplyMember from '@/popups/apply-member';
import BlockMember from '@/popups/block-member';
import ChangeTheme from '@/popups/change-theme';
import ChannelEvent from '@/popups/channel-event';
import ChannelPassword from '@/popups/channel-password';
import ChannelSetting from '@/popups/channel-setting';
import ChatHistory from '@/popups/chat-history';
import CreateChannel from '@/popups/create-channel';
import CreateFriendGroup from '@/popups/create-friend-group';
import CreateServer from '@/popups/create-server';
import Dialog from '@/popups/dialog';
import DirectMessage from '@/popups/direct-message';
import EditChannelName from '@/popups/edit-channel-name';
import EditChannelOrder from '@/popups/edit-channel-order';
import EditNickname from '@/popups/edit-nickname';
import EditFriendNote from '@/popups/edit-friend-note';
import EditFriendGroupName from '@/popups/edit-friend-group-name';
import FriendVerification from '@/popups/friend-verification';
import KickMemberFromChannel from '@/popups/kick-member-from-channel';
import KickMemberFromServer from '@/popups/kick-member-from-server';
import MemberApplicationSetting from '@/popups/member-application-setting';
import MemberInvitation from '@/popups/member-invitation';
import NetworkDiagnosis from '@/popups/network-diagnosis';
import RTCDisconnect from '@/popups/rtc-disconnect';
import ImageCropper from '@/popups/image-cropper';
import InviteFriend from '@/popups/invite-friend';
import InviteMember from '@/popups/invite-member';
import SearchUser from '@/popups/search-user';
import ServerAnnouncement from '@/popups/server-announcement';
import ServerApplication from '@/popups/server-application';
import ServerSetting from '@/popups/server-setting';
import ServerBroadcast from '@/popups/server-broadcast';
import SystemSetting from '@/popups/system-setting';
import UserInfo from '@/popups/user-info';

const POPUP_NODES: { [T in Types.PopupType]: (id: string, data: Types.PopupInitialData[T]) => React.ReactNode } = {
  aboutus: (id, data) => <About id={id} {...data} />,
  applyFriend: (id, data) => <ApplyFriend id={id} {...data} />,
  applyMember: (id, data) => <ApplyMember id={id} {...data} />,
  approveFriend: (id, data) => <ApproveFriend id={id} {...data} />,
  blockMember: (id, data) => <BlockMember id={id} {...data} />,
  changeTheme: () => <ChangeTheme />,
  channelEvent: () => <ChannelEvent />,
  channelPassword: (id, data) => <ChannelPassword id={id} {...data} />,
  channelSetting: (id, data) => <ChannelSetting id={id} {...data} />,
  chatHistory: (id, data) => <ChatHistory id={id} {...data} />,
  createChannel: (id, data) => <CreateChannel id={id} {...data} />,
  createFriendGroup: (id, data) => <CreateFriendGroup id={id} {...data} />,
  createServer: (id, data) => <CreateServer id={id} {...data} />,
  dialogAlert: (id, data) => <Dialog id={id} iconType="ALERT" {...data} />,
  dialogAlert2: (id, data) => <Dialog id={id} iconType="ALERT" {...data} />,
  dialogError: (id, data) => <Dialog id={id} iconType="ERROR" {...data} />,
  dialogInfo: (id, data) => <Dialog id={id} iconType="INFO" {...data} />,
  dialogSuccess: (id, data) => <Dialog id={id} iconType="SUCCESS" {...data} />,
  dialogWarning: (id, data) => <Dialog id={id} iconType="WARNING" {...data} />,
  directMessage: (_id, data) => <DirectMessage {...data} />,
  editChannelOrder: (id, data) => <EditChannelOrder id={id} {...data} />,
  editChannelName: (id, data) => <EditChannelName id={id} {...data} />,
  editFriendNote: (id, data) => <EditFriendNote id={id} {...data} />,
  editFriendGroupName: (id, data) => <EditFriendGroupName id={id} {...data} />,
  editNickname: (id, data) => <EditNickname id={id} {...data} />,
  friendVerification: () => <FriendVerification />,
  imageCropper: (id, data) => <ImageCropper id={id} {...data} />,
  inviteFriend: (id, data) => <InviteFriend id={id} {...data} />,
  inviteMember: (id, data) => <InviteMember id={id} {...data} />,
  kickMemberFromChannel: (id, data) => <KickMemberFromChannel id={id} {...data} />,
  kickMemberFromServer: (id, data) => <KickMemberFromServer id={id} {...data} />,
  memberApplicationSetting: (id, data) => <MemberApplicationSetting id={id} {...data} />,
  memberInvitation: () => <MemberInvitation />,
  networkDiagnosis: (id, data) => <NetworkDiagnosis id={id} {...data} />,
  rtcDisconnect: (id, data) => <RTCDisconnect id={id} {...data} />,
  searchUser: (id, data) => <SearchUser id={id} {...data} />,
  serverAnnouncement: (id, data) => <ServerAnnouncement id={id} {...data} />,
  serverApplication: (id, data) => <ServerApplication id={id} {...data} />,
  serverBroadcast: (id, data) => <ServerBroadcast id={id} {...data} />,
  serverSetting: (id, data) => <ServerSetting id={id} {...data} />,
  systemSetting: (id, data) => <SystemSetting id={id} {...data} />,
  userInfo: (id, data) => <UserInfo id={id} {...data} />,
  userSetting: (id, data) => <UserInfo id={id} {...data} />,
};

function getPopupTitle(popup: Types.PopupData, fallback: string): string {
  switch (popup.type) {
    case 'channelSetting':
      return popup.data.channel.name || fallback;
    case 'directMessage':
    case 'userInfo':
      return popup.data.target.name || fallback;
    case 'serverSetting':
      return popup.data.server.name || fallback;
    default:
      return fallback;
  }
}

export function buildPopup(id: string, popup: Types.PopupData): Types.Popup {
  const config = POPUP_CONFIGS[popup.type];
  const render = POPUP_NODES[popup.type] as (id: string, data: Types.PopupInitialData[typeof popup.type]) => React.ReactNode;

  return {
    id,
    type: popup.type,
    position: { top: 0, left: 0 },
    ...config,
    title: getPopupTitle(popup, config.title),
    node: () => render(id, popup.data),
  };
}

'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState, useCallback } from 'react';

import type * as Types from '@/types';

import * as ipc from '@/main/ipc';

import { POPUP_CONFIGS } from '@/configs/popup';

import StoreSyncer from '@/components/store-syncer';
import PopupHeader from '@/components/popup-header';

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

const PopupPageComponent: React.FC = React.memo(() => {
  const [popup, setPopup] = useState<Types.Popup | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getPopup = useCallback((type: Types.PopupType, id: string, initialData: any): Types.Popup => {
    const node: Record<Types.PopupType, () => React.ReactNode> = {
      aboutus: () => <About id={id} {...initialData} />,
      applyFriend: () => <ApplyFriend id={id} {...initialData} />,
      applyMember: () => <ApplyMember id={id} {...initialData} />,
      approveFriend: () => <ApproveFriend id={id} {...initialData} />,
      blockMember: () => <BlockMember id={id} {...initialData} />,
      changeTheme: () => <ChangeTheme id={id} {...initialData} />,
      channelEvent: () => <ChannelEvent id={id} {...initialData} />,
      channelPassword: () => <ChannelPassword id={id} {...initialData} />,
      channelSetting: () => <ChannelSetting id={id} {...initialData} />,
      chatHistory: () => <ChatHistory id={id} {...initialData} />,
      createChannel: () => <CreateChannel id={id} {...initialData} />,
      createFriendGroup: () => <CreateFriendGroup id={id} {...initialData} />,
      createServer: () => <CreateServer id={id} {...initialData} />,
      dialogAlert: () => <Dialog id={id} iconType="ALERT" {...initialData} />,
      dialogAlert2: () => <Dialog id={id} iconType="ALERT" {...initialData} />,
      dialogError: () => <Dialog id={id} iconType="ERROR" {...initialData} />,
      dialogInfo: () => <Dialog id={id} iconType="INFO" {...initialData} />,
      dialogSuccess: () => <Dialog id={id} iconType="SUCCESS" {...initialData} />,
      dialogWarning: () => <Dialog id={id} iconType="WARNING" {...initialData} />,
      directMessage: () => <DirectMessage id={id} {...initialData} />,
      editChannelOrder: () => <EditChannelOrder id={id} {...initialData} />,
      editChannelName: () => <EditChannelName id={id} {...initialData} />,
      editFriendNote: () => <EditFriendNote id={id} {...initialData} />,
      editFriendGroupName: () => <EditFriendGroupName id={id} {...initialData} />,
      editNickname: () => <EditNickname id={id} {...initialData} />,
      friendVerification: () => <FriendVerification id={id} {...initialData} />,
      imageCropper: () => <ImageCropper id={id} {...initialData} />,
      inviteFriend: () => <InviteFriend id={id} {...initialData} />,
      inviteMember: () => <InviteMember id={id} {...initialData} />,
      kickMemberFromChannel: () => <KickMemberFromChannel id={id} {...initialData} />,
      kickMemberFromServer: () => <KickMemberFromServer id={id} {...initialData} />,
      memberApplicationSetting: () => <MemberApplicationSetting id={id} {...initialData} />,
      memberInvitation: () => <MemberInvitation id={id} {...initialData} />,
      networkDiagnosis: () => <NetworkDiagnosis id={id} {...initialData} />,
      rtcDisconnect: () => <RTCDisconnect id={id} {...initialData} />,
      searchUser: () => <SearchUser id={id} {...initialData} />,
      serverAnnouncement: () => <ServerAnnouncement id={id} {...initialData} />,
      serverApplication: () => <ServerApplication id={id} {...initialData} />,
      serverBroadcast: () => <ServerBroadcast id={id} {...initialData} />,
      serverSetting: () => <ServerSetting id={id} {...initialData} />,
      systemSetting: () => <SystemSetting id={id} {...initialData} />,
      userInfo: () => <UserInfo id={id} {...initialData} />,
      userSetting: () => <UserInfo id={id} {...initialData} />,
    };

    const config = POPUP_CONFIGS[type];

    switch (type) {
      case 'channelSetting':
        config.title = initialData?.channel?.name ?? config.title;
        break;
      case 'directMessage':
        config.title = initialData?.target?.name ?? config.title;
        break;
      case 'userInfo':
        config.title = initialData?.target?.name ?? config.title;
        break;
      case 'serverSetting':
        config.title = initialData?.server?.name ?? config.title;
        break;
    }

    return {
      id,
      type,
      position: { top: 0, left: 0 },
      ...config,
      node: node[type as keyof typeof node],
    };
  }, []);

  const handleMaximize = () => {
    if (isFullscreen) return;
    ipc.window.maximize();
  };

  const handleUnmaximize = () => {
    if (!isFullscreen) return;
    ipc.window.unmaximize();
  };

  const handleMinimize = () => {
    if (!popup?.id) return;
    ipc.window.minimize(popup.id);
  };

  const handleClose = () => {
    if (!popup?.id) return;
    ipc.popup.close(popup.id);
  };

  useEffect(() => {
    const unsubs = [ipc.window.onUnmaximize(() => setIsFullscreen(false)), ipc.window.onMaximize(() => setIsFullscreen(true))];
    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  useEffect(() => {
    if (window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const type = params.get('type') as Types.PopupType;
      const id = params.get('id') as string;
      const initialData = ipc.initialData.get(id);

      const popup = getPopup(type, id, initialData);

      setPopup(popup);
    }
  }, [getPopup]);

  return (
    <>
      <StoreSyncer.Slave />
      {popup && !popup.hideHeader && (
        <PopupHeader
          title={popup.title}
          buttons={popup.buttons}
          popupType={popup.type}
          isFullscreen={isFullscreen}
          onMinimize={handleMinimize}
          onMaximize={handleMaximize}
          onRestore={handleUnmaximize}
          onClose={handleClose}
        />
      )}
      {popup && popup.node()}
    </>
  );
});

PopupPageComponent.displayName = 'PopupPageComponent';

const PopupPage = dynamic(() => Promise.resolve(PopupPageComponent), { ssr: false });

export default PopupPage;

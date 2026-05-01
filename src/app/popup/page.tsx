'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState, useCallback } from 'react';

import type * as Types from '@/types';

import * as ipc from '@/main/ipc';

import { POPUP_CONFIGS } from '@/configs/popup';

import StoreSyncer from '@/components/StoreSyncer';
import PopupHeader from '@/components/PopupHeader';

import About from '@/popups/About';
import ApplyFriend from '@/popups/ApplyFriend';
import ApproveFriend from '@/popups/ApproveFriend';
import ApplyMember from '@/popups/ApplyMember';
import BlockMember from '@/popups/BlockMember';
import ChangeTheme from '@/popups/ChangeTheme';
import ChannelEvent from '@/popups/ChannelEvent';
import ChannelPassword from '@/popups/ChannelPassword';
import ChannelSetting from '@/popups/ChannelSetting';
import ChatHistory from '@/popups/ChatHistory';
import CreateChannel from '@/popups/CreateChannel';
import CreateFriendGroup from '@/popups/CreateFriendGroup';
import CreateServer from '@/popups/CreateServer';
import Dialog from '@/popups/Dialog';
import DirectMessage from '@/popups/DirectMessage';
import EditChannelName from '@/popups/EditChannelName';
import EditChannelOrder from '@/popups/EditChannelOrder';
import EditNickname from '@/popups/EditNickname';
import EditFriendNote from '@/popups/EditFriendNote';
import EditFriendGroupName from '@/popups/EditFriendGroupName';
import FriendVerification from '@/popups/FriendVerification';
import KickMemberFromChannel from '@/popups/KickMemberFromChannel';
import KickMemberFromServer from '@/popups/KickMemberFromServer';
import MemberApplicationSetting from '@/popups/MemberApplicationSetting';
import MemberInvitation from '@/popups/MemberInvitation';
import NetworkDiagnosis from '@/popups/NetworkDiagnosis';
import RTCDisconnect from '@/popups/RTCDisconnect';
import ImageCropper from '@/popups/ImageCropper';
import InviteFriend from '@/popups/InviteFriend';
import InviteMember from '@/popups/InviteMember';
import SearchUser from '@/popups/SearchUser';
import ServerAnnouncement from '@/popups/ServerAnnouncement';
import ServerApplication from '@/popups/ServerApplication';
import ServerSetting from '@/popups/ServerSetting';
import ServerBroadcast from '@/popups/ServerBroadcast';
import SystemSetting from '@/popups/SystemSetting';
import UserInfo from '@/popups/UserInfo';

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

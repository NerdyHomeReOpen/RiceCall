'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import ipc from '@/ipc';

import type * as Types from '@/types';

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

import { getPopupConfigs } from '@/configs/popup';

import SocketManager from '@/components/SocketManager';

import headerStyle from '@/styles/header.module.css';

interface HeaderProps {
  id: string;
  title: string;
  buttons: ('minimize' | 'maxsize' | 'close')[];
  titleBoxIcon?: string;
}

const Header: React.FC<HeaderProps> = React.memo(({ id, title, buttons, titleBoxIcon }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handlers
  const handleMaximizeBtnClick = () => {
    if (isFullscreen) return;
    ipc.window.maximize();
  };

  const handleUnmaximizeBtnClick = () => {
    if (!isFullscreen) return;
    ipc.window.unmaximize();
  };

  const handleMinimizeBtnClick = () => {
    ipc.window.minimize(id);
  };

  const handleCloseBtnClick = () => {
    ipc.popup.close(id);
  };

  // Effects
  useEffect(() => {
    const unsubs = [ipc.window.onUnmaximize(() => setIsFullscreen(false)), ipc.window.onMaximize(() => setIsFullscreen(true))];
    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  return (
    <header className={`${headerStyle['header']} ${headerStyle['popup']}`}>
      <div className={headerStyle['title-wrapper']}>
        <div className={`${headerStyle['title-box']} ${titleBoxIcon}`}>
          <div className={headerStyle['title']}>{t(title)}</div>
        </div>
        <div className={headerStyle['buttons']}>
          {buttons.includes('minimize') && <div className={headerStyle['minimize']} onClick={handleMinimizeBtnClick} />}
          {buttons.includes('maxsize') &&
            (isFullscreen ? <div className={headerStyle['restore']} onClick={handleUnmaximizeBtnClick} /> : <div className={headerStyle['maxsize']} onClick={handleMaximizeBtnClick} />)}
          {buttons.includes('close') && <div className={headerStyle['close']} onClick={handleCloseBtnClick} />}
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

const PopupPageComponent: React.FC = React.memo(() => {
  // States
  const [popup, setPopup] = useState<Types.Popup | null>(null);

  // Functions
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

    const configs = getPopupConfigs(type);

    switch (type) {
      case 'channelSetting':
        configs.title = initialData?.channel?.name ?? configs.title;
        break;
      case 'directMessage':
        configs.title = initialData?.target?.name ?? configs.title;
        break;
      case 'userInfo':
        configs.title = initialData?.target?.name ?? configs.title;
        break;
      case 'serverSetting':
        configs.title = initialData?.server?.name ?? configs.title;
        break;
    }

    return {
      id,
      type,
      position: { top: 0, left: 0 },
      ...configs,
      node: node[type as keyof typeof node],
    };
  }, []);

  // Effects
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
      <SocketManager />
      {popup && !popup.hideHeader && (
        <Header
          id={popup.id}
          title={popup.title}
          buttons={popup.buttons}
          titleBoxIcon={popup.type === 'changeTheme' ? headerStyle['title-box-skin-icon'] : popup.type === 'directMessage' ? headerStyle['title-box-direct-message-icon'] : undefined}
        />
      )}
      {popup && popup.node()}
    </>
  );
});

PopupPageComponent.displayName = 'PopupPageComponent';

const PopupPage = dynamic(() => Promise.resolve(PopupPageComponent), { ssr: false });

export default PopupPage;

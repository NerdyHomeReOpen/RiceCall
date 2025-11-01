/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useMemo } from 'react';

// CSS
import header from '@/styles/header.module.css';

// Types
import type { PopupType } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// Components
import About from '@/popups/About';
import ApplyFriend from '@/popups/ApplyFriend';
import ApproveFriend from '@/popups/ApproveFriend';
import ApplyMember from '@/popups/ApplyMember';
import BlockMember from '@/popups/BlockMember';
import ChangeTheme from '@/popups/ChangeTheme';
import ChannelPassword from '@/popups/ChannelPassword';
import ChannelSetting from '@/popups/ChannelSetting';
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
import MemberApplicationSetting from '@/popups/MemberApplicationSetting';
import MemberInvitation from '@/popups/MemberInvitation';
import ImageCropper from '@/popups/ImageCropper';
import InviteMember from '@/popups/InviteMember';
import SearchUser from '@/popups/SearchUser';
import ServerSetting from '@/popups/ServerSetting';
import ServerBroadcast from '@/popups/ServerBroadcast';
import SystemSetting from '@/popups/SystemSetting';
import UserInfo from '@/popups/UserInfo';
import ChatHistory from '@/popups/chatHistory';

// Services
import ipc from '@/services/ipc.service';

interface HeaderProps {
  title: string;
  buttons: ('minimize' | 'maxsize' | 'close')[];
  titleBoxIcon?: string;
}

const Header: React.FC<HeaderProps> = React.memo(({ title, buttons, titleBoxIcon }) => {
  // States
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handlers
  const handleFullscreen = () => {
    if (isFullscreen) ipc.window.unmaximize();
    else ipc.window.maximize();
  };

  const handleMinimize = () => {
    ipc.window.minimize();
  };

  const handleClose = () => {
    ipc.window.close();
  };

  // Effects
  useEffect(() => {
    const unsubscribe = [ipc.window.onUnmaximize(() => setIsFullscreen(false)), ipc.window.onMaximize(() => setIsFullscreen(true))];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, []);

  return (
    <header className={`${header['header']} ${header['popup']}`}>
      <div className={header['title-wrapper']}>
        <div className={`${header['title-box']} ${titleBoxIcon}`}>
          <div className={header['title']}>{title}</div>
        </div>
        <div className={header['buttons']}>
          {buttons.includes('minimize') && <div className={header['minimize']} onClick={handleMinimize} />}
          {buttons.includes('maxsize') && <div className={isFullscreen ? header['restore'] : header['maxsize']} onClick={handleFullscreen} />}
          {buttons.includes('close') && <div className={header['close']} onClick={handleClose} />}
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

const Popup = React.memo(() => {
  // Language
  const { t } = useTranslation();

  // States
  const [id, setId] = useState<string | null>(null);
  const [type, setType] = useState<PopupType | null>(null);
  const [initialData, setInitialData] = useState<any | null>(null);

  // Memos
  const { title, buttons, node, hideHeader } = useMemo<{ title: string; buttons: ('close' | 'minimize' | 'maxsize')[]; node: React.ReactNode | null; hideHeader: boolean }>(() => {
    if (!type || !initialData) return { title: '', buttons: [], node: null, hideHeader: true };

    switch (type) {
      case 'aboutus':
        return { title: t('about-ricecall'), buttons: ['close'], node: <About {...initialData} />, hideHeader: false };
      case 'applyMember':
        return { title: t('apply-member'), buttons: ['close'], node: <ApplyMember {...initialData} />, hideHeader: false };
      case 'applyFriend':
        return { title: t('apply-friend'), buttons: ['close'], node: <ApplyFriend {...initialData} />, hideHeader: false };
      case 'approveFriend':
        return { title: t('apply-friend'), buttons: ['close'], node: <ApproveFriend {...initialData} />, hideHeader: false };
      case 'imageCropper':
        return { title: t('image-cropper'), buttons: ['close'], node: <ImageCropper {...initialData} />, hideHeader: false };
      case 'blockMember':
        return { title: t('block'), buttons: ['close'], node: <BlockMember {...initialData} />, hideHeader: false };
      case 'changeTheme':
        return { title: t('change-theme'), buttons: ['close'], node: <ChangeTheme {...initialData} />, hideHeader: false };
      case 'channelPassword':
        return { title: t('please-enter-the-channel-password'), buttons: ['close'], node: <ChannelPassword {...initialData} />, hideHeader: false };
      case 'channelSetting':
        return { title: initialData?.channel.name || t('edit-channel'), buttons: ['close'], node: <ChannelSetting {...initialData} />, hideHeader: false };
      case 'createServer':
        return { title: t('create-server'), buttons: ['close'], node: <CreateServer {...initialData} />, hideHeader: false };
      case 'createChannel':
        return { title: t('create-channel'), buttons: ['close'], node: <CreateChannel {...initialData} />, hideHeader: false };
      case 'createFriendGroup':
        return { title: t('create-friend-group'), buttons: ['close'], node: <CreateFriendGroup {...initialData} />, hideHeader: false };
      case 'dialogAlert':
      case 'dialogAlert2':
        return { title: t('alert'), buttons: ['close'], node: <Dialog {...{ ...initialData, iconType: 'ALERT' }} />, hideHeader: false };
      case 'dialogSuccess':
        return { title: t('success'), buttons: ['close'], node: <Dialog {...{ ...initialData, iconType: 'SUCCESS' }} />, hideHeader: false };
      case 'dialogWarning':
        return { title: t('warning'), buttons: ['close'], node: <Dialog {...{ ...initialData, iconType: 'WARNING' }} />, hideHeader: false };
      case 'dialogError':
        return { title: t('error'), buttons: ['close'], node: <Dialog {...{ ...initialData, iconType: 'ERROR' }} />, hideHeader: false };
      case 'dialogInfo':
        return { title: t('info'), buttons: ['close'], node: <Dialog {...{ ...initialData, iconType: 'INFO' }} />, hideHeader: false };
      case 'directMessage':
        return { title: initialData?.target.name || t('direct-message'), buttons: ['close', 'minimize', 'maxsize'], node: <DirectMessage {...initialData} />, hideHeader: false };
      case 'editChannelOrder':
        return { title: t('edit-channel-order'), buttons: ['close'], node: <EditChannelOrder {...initialData} />, hideHeader: false };
      case 'editChannelName':
        return { title: t('edit-channel-name'), buttons: ['close'], node: <EditChannelName {...initialData} />, hideHeader: false };
      case 'editFriendNote':
        return { title: t('edit-friend-note'), buttons: ['close'], node: <EditFriendNote {...initialData} />, hideHeader: false };
      case 'editFriendGroupName':
        return { title: t('edit-friend-group-name'), buttons: ['close'], node: <EditFriendGroupName {...initialData} />, hideHeader: false };
      case 'editNickname':
        return { title: t('edit-nickname'), buttons: ['close'], node: <EditNickname {...initialData} />, hideHeader: false };
      case 'friendVerification':
        return { title: t('friend-verification'), buttons: ['close'], node: <FriendVerification {...initialData} />, hideHeader: false };
      case 'inviteMember':
        return { title: t('invite-member'), buttons: ['close'], node: <InviteMember {...initialData} />, hideHeader: false };
      case 'memberApplicationSetting':
        return { title: t('member-application-setting'), buttons: ['close'], node: <MemberApplicationSetting {...initialData} />, hideHeader: false };
      case 'memberInvitation':
        return { title: t('member-invitation'), buttons: ['close'], node: <MemberInvitation {...initialData} />, hideHeader: false };
      case 'searchUser':
        return { title: t('search-user'), buttons: ['close'], node: <SearchUser {...initialData} />, hideHeader: false };
      case 'serverBroadcast':
        return { title: t('server-broadcast'), buttons: ['close'], node: <ServerBroadcast {...initialData} />, hideHeader: false };
      case 'serverSetting':
        return { title: initialData?.server.name || t('server-setting'), buttons: ['close'], node: <ServerSetting {...initialData} />, hideHeader: false };
      case 'systemSetting':
        return { title: t('system-setting'), buttons: ['close'], node: <SystemSetting {...initialData} />, hideHeader: false };
      case 'userInfo':
        return { title: t('user-info'), buttons: ['close'], node: <UserInfo {...initialData} />, hideHeader: true };
      case 'chatHistory':
        return { title: t('chat-history'), buttons: ['close'], node: <ChatHistory {...initialData} />, hideHeader: false };
      default:
        return { title: '', buttons: [], node: null, hideHeader: true };
    }
  }, [type, initialData, t]);

  // Effects
  useEffect(() => {
    if (window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const type = params.get('type') as PopupType;
      const id = params.get('id') as string;
      setId(id || null);
      setType(type || null);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    setInitialData(ipc.initialData.get(id));
  }, [id]);

  useEffect(() => {
    history.pushState = () => {};
    history.back = () => {};
    history.forward = () => {};
  }, []);

  return (
    <>
      {!hideHeader && (
        <Header
          title={title}
          buttons={buttons}
          titleBoxIcon={type === 'changeTheme' ? header['title-box-skin-icon'] : type === 'directMessage' ? header['title-box-direct-message-icon'] : undefined}
        />
      )}
      {node}
    </>
  );
});

Popup.displayName = 'Popup';

export default Popup;

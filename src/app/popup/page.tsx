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
import About from '@/components/popups/About';
import ApplyFriend from '@/components/popups/ApplyFriend';
import ApplyMember from '@/components/popups/ApplyMember';
import AvatarCropper from '@/components/popups/AvatarCropper';
import BlockMember from '@/components/popups/BlockMember';
import ChangeTheme from '@/components/popups/ChangeTheme';
import ChannelPassword from '@/components/popups/ChannelPassword';
import ChannelSetting from '@/components/popups/ChannelSetting';
import CreateChannel from '@/components/popups/CreateChannel';
import CreateFriendGroup from '@/components/popups/CreateFriendGroup';
import CreateServer from '@/components/popups/CreateServer';
import Dialog from '@/components/popups/Dialog';
import DirectMessage from '@/components/popups/DirectMessage';
import EditChannelName from '@/components/popups/EditChannelName';
import EditChannelOrder from '@/components/popups/EditChannelOrder';
import EditNickname from '@/components/popups/EditNickname';
import EditFriendGroup from '@/components/popups/EditFriendGroup';
import EditFriend from '@/components/popups/EditFriend';
import FriendVerification from '@/components/popups/FriendVerification';
import MemberInvitation from '@/components/popups/MemberInvitation';
import MemberApplySetting from '@/components/popups/MemberApplySetting';
import InviteMember from '@/components/popups/InviteMember';
import SearchUser from '@/components/popups/SearchUser';
import ServerSetting from '@/components/popups/ServerSetting';
import ServerBroadcast from '@/components/popups/ServerBroadcast';
import SystemSetting from '@/components/popups/SystemSetting';
import UserSetting from '@/components/popups/UserSetting';

// Services
import ipcService from '@/services/ipc.service';

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
    if (isFullscreen) ipcService.window.unmaximize();
    else ipcService.window.maximize();
  };

  const handleMinimize = () => {
    ipcService.window.minimize();
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  // Effects
  useEffect(() => {
    const unsubscribe = [ipcService.window.onUnmaximize(() => setIsFullscreen(false)), ipcService.window.onMaximize(() => setIsFullscreen(true))];
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
  const [type, setType] = useState<PopupType | null>(null);
  const [initialData, setInitialData] = useState<any | null>(null);

  // Memos
  const { title, buttons, node, hideHeader } = useMemo<{ title: string; buttons: ('close' | 'minimize' | 'maxsize')[]; node: React.ReactNode | null; hideHeader: boolean }>(() => {
    if (!type) return { title: '', buttons: [], node: null, hideHeader: true };

    switch (type) {
      case 'aboutus':
        return { title: t('about-ricecall'), buttons: ['close'], node: <About {...initialData} />, hideHeader: false };
      case 'applyMember':
        return { title: t('apply-member'), buttons: ['close'], node: <ApplyMember {...initialData} />, hideHeader: false };
      case 'applyFriend':
        return { title: t('apply-friend'), buttons: ['close'], node: <ApplyFriend {...initialData} />, hideHeader: false };
      case 'avatarCropper':
        return { title: t('avatar-cropper'), buttons: ['close'], node: <AvatarCropper {...initialData} />, hideHeader: false };
      case 'blockMember':
        return { title: t('block'), buttons: ['close'], node: <BlockMember {...initialData} />, hideHeader: false };
      case 'changeTheme':
        return { title: t('change-theme'), buttons: ['close'], node: <ChangeTheme {...initialData} />, hideHeader: false };
      case 'channelPassword':
        return { title: t('please-enter-the-channel-password'), buttons: ['close'], node: <ChannelPassword {...initialData} />, hideHeader: false };
      case 'channelSetting':
        return { title: t('edit-channel'), buttons: ['close'], node: <ChannelSetting {...initialData} />, hideHeader: false };
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
        return { title: initialData?.targetName || t('direct-message'), buttons: ['close', 'minimize', 'maxsize'], node: <DirectMessage {...initialData} />, hideHeader: false };
      case 'editChannelOrder':
        return { title: t('edit-channel-order'), buttons: ['close'], node: <EditChannelOrder {...initialData} />, hideHeader: false };
      case 'editChannelName':
        return { title: t('edit-channel-name'), buttons: ['close'], node: <EditChannelName {...initialData} />, hideHeader: false };
      case 'editFriendGroup':
        return { title: t('edit-friend-group'), buttons: ['close'], node: <EditFriendGroup {...initialData} />, hideHeader: false };
      case 'editFriend':
        return { title: t('edit-friend'), buttons: ['close'], node: <EditFriend {...initialData} />, hideHeader: false };
      case 'editNickname':
        return { title: t('edit-nickname'), buttons: ['close'], node: <EditNickname {...initialData} />, hideHeader: false };
      case 'friendVerification':
        return { title: t('friend-verification'), buttons: ['close'], node: <FriendVerification {...initialData} />, hideHeader: false };
      case 'inviteMember':
        return { title: t('invite-member'), buttons: ['close'], node: <InviteMember {...initialData} />, hideHeader: false };
      case 'memberApplySetting':
        return { title: t('member-apply-setting'), buttons: ['close'], node: <MemberApplySetting {...initialData} />, hideHeader: false };
      case 'memberInvitation':
        return { title: t('member-invitation'), buttons: ['close'], node: <MemberInvitation {...initialData} />, hideHeader: false };
      case 'searchUser':
        return { title: t('add-friend'), buttons: ['close'], node: <SearchUser {...initialData} />, hideHeader: false };
      case 'serverBroadcast':
        return { title: t('server-broadcast'), buttons: ['close'], node: <ServerBroadcast {...initialData} />, hideHeader: false };
      case 'serverSetting':
        return { title: t('server-setting'), buttons: ['close'], node: <ServerSetting {...initialData} />, hideHeader: false };
      case 'systemSetting':
        return { title: t('system-setting'), buttons: ['close'], node: <SystemSetting {...initialData} />, hideHeader: false };
      case 'userInfo':
        return { title: t('user-info'), buttons: ['close'], node: <UserSetting {...initialData} />, hideHeader: true };
      case 'userSetting':
        return { title: t('user-setting'), buttons: ['close'], node: <UserSetting {...initialData} />, hideHeader: false };
      default:
        return { title: '', buttons: [], node: null, hideHeader: true };
    }
  }, [type, initialData, t]);

  // Effects
  useEffect(() => {
    if (window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const type = params.get('type') as PopupType;
      setType(type || null);
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') ipcService.window.close();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    ipcService.initialData.get((data) => setInitialData(data));
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

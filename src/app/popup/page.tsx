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
import KickMemberFromChannel from '@/popups/KickMemberFromChannel';
import KickMemberFromServer from '@/popups/KickMemberFromServer';
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

const defaultPopup: Record<PopupType, Omit<Popup, 'id' | 'node' | 'title'>> = {
  aboutus: {
    type: 'aboutus',
    buttons: ['close'],
    hideHeader: false,
  },
  applyFriend: {
    type: 'applyFriend',
    buttons: ['close'],
    hideHeader: false,
  },
  applyMember: {
    type: 'applyMember',
    buttons: ['close'],
    hideHeader: false,
  },
  approveFriend: {
    type: 'approveFriend',
    buttons: ['close'],
    hideHeader: false,
  },
  blockMember: {
    type: 'blockMember',
    buttons: ['close'],
    hideHeader: false,
  },
  changeTheme: {
    type: 'changeTheme',
    buttons: ['close'],
    hideHeader: false,
  },
  channelPassword: {
    type: 'channelPassword',
    buttons: ['close'],
    hideHeader: false,
  },
  channelSetting: {
    type: 'channelSetting',
    buttons: ['close'],
    hideHeader: false,
  },
  createServer: {
    type: 'createServer',
    buttons: ['close'],
    hideHeader: false,
  },
  createChannel: {
    type: 'createChannel',
    buttons: ['close'],
    hideHeader: false,
  },
  createFriendGroup: {
    type: 'createFriendGroup',
    buttons: ['close'],
    hideHeader: false,
  },
  dialogAlert: {
    type: 'dialogAlert',
    buttons: ['close'],
    hideHeader: false,
  },
  dialogAlert2: {
    type: 'dialogAlert2',
    buttons: ['close'],
    hideHeader: false,
  },
  dialogError: {
    type: 'dialogError',
    buttons: ['close'],
    hideHeader: false,
  },
  dialogInfo: {
    type: 'dialogInfo',
    buttons: ['close'],
    hideHeader: false,
  },
  dialogSuccess: {
    type: 'dialogSuccess',
    buttons: ['close'],
    hideHeader: false,
  },
  dialogWarning: {
    type: 'dialogWarning',
    buttons: ['close'],
    hideHeader: false,
  },
  directMessage: {
    type: 'directMessage',
    buttons: ['close', 'minimize', 'maxsize'],
    hideHeader: false,
  },
  editChannelOrder: {
    type: 'editChannelOrder',
    buttons: ['close'],
    hideHeader: false,
  },
  editChannelName: {
    type: 'editChannelName',
    buttons: ['close'],
    hideHeader: false,
  },
  editFriendNote: {
    type: 'editFriendNote',
    buttons: ['close'],
    hideHeader: false,
  },
  editFriendGroupName: {
    type: 'editFriendGroupName',
    buttons: ['close'],
    hideHeader: false,
  },
  editNickname: {
    type: 'editNickname',
    buttons: ['close'],
    hideHeader: false,
  },
  friendVerification: {
    type: 'friendVerification',
    buttons: ['close'],
    hideHeader: false,
  },
  imageCropper: {
    type: 'imageCropper',
    buttons: ['close'],
    hideHeader: false,
  },
  inviteMember: {
    type: 'inviteMember',
    buttons: ['close'],
    hideHeader: false,
  },
  kickMemberFromChannel: {
    type: 'kickMemberFromChannel',
    buttons: ['close'],
    hideHeader: false,
  },
  kickMemberFromServer: {
    type: 'kickMemberFromServer',
    buttons: ['close'],
    hideHeader: false,
  },
  memberApplicationSetting: {
    type: 'memberApplicationSetting',
    buttons: ['close'],
    hideHeader: false,
  },
  memberInvitation: {
    type: 'memberInvitation',
    buttons: ['close'],
    hideHeader: false,
  },
  searchUser: {
    type: 'searchUser',
    buttons: ['close'],
    hideHeader: false,
  },
  serverBroadcast: {
    type: 'serverBroadcast',
    buttons: ['close'],
    hideHeader: false,
  },
  serverSetting: {
    type: 'serverSetting',
    buttons: ['close'],
    hideHeader: false,
  },
  systemSetting: {
    type: 'systemSetting',
    buttons: ['close'],
    hideHeader: false,
  },
  userInfo: {
    type: 'userInfo',
    buttons: ['close'],
    hideHeader: true,
  },
  userSetting: {
    type: 'userSetting',
    buttons: ['close'],
    hideHeader: false,
  },
  chatHistory: {
    type: 'chatHistory',
    buttons: ['close'],
    hideHeader: false,
  },
};

type Popup = {
  id: string;
  type: PopupType;
  title: string;
  buttons: ('close' | 'minimize' | 'maxsize')[];
  node: () => React.ReactNode | null;
  hideHeader: boolean;
};

const Popup = React.memo(() => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [id, setId] = useState<string | null>(null);
  const [type, setType] = useState<PopupType | null>(null);
  const [initialData, setInitialData] = useState<any | null>(null);

  // Memos
  const { title, buttons, node, hideHeader } = useMemo<Popup>(() => {
    if (!id || !type || !initialData) return { id: '', type: 'dialogAlert', title: '', buttons: ['close'], node: () => null, hideHeader: true };

    const title = {
      aboutus: t('about-ricecall'),
      applyFriend: t('apply-friend'),
      applyMember: t('apply-member'),
      approveFriend: t('approve-friend'),
      blockMember: t('block'),
      changeTheme: t('change-theme'),
      channelPassword: t('please-enter-the-channel-password'),
      channelSetting: initialData?.channel?.name || t('edit-channel'),
      createServer: t('create-server'),
      createChannel: t('create-channel'),
      createFriendGroup: t('create-friend-group'),
      dialogAlert: t('alert'),
      dialogAlert2: t('alert'),
      dialogError: t('error'),
      dialogInfo: t('info'),
      dialogSuccess: t('success'),
      dialogWarning: t('warning'),
      directMessage: initialData?.target?.name || t('direct-message'),
      editChannelOrder: t('edit-channel-order'),
      editChannelName: t('edit-channel-name'),
      editFriendNote: t('edit-friend-note'),
      editFriendGroupName: t('edit-friend-group-name'),
      editNickname: t('edit-nickname'),
      friendVerification: t('friend-verification'),
      imageCropper: t('image-cropper'),
      inviteMember: t('invite-member'),
      kickMemberFromChannel: t('kick-channel'),
      kickMemberFromServer: t('kick-server'),
      memberApplicationSetting: t('member-application-setting'),
      memberInvitation: t('member-invitation'),
      searchUser: t('search-user'),
      serverBroadcast: t('server-broadcast'),
      serverSetting: initialData?.server?.name || t('server-setting'),
      systemSetting: t('system-setting'),
      userInfo: t('user-info'),
      userSetting: t('user-setting'),
      chatHistory: t('chat-history'),
    };

    const node = {
      aboutus: () => <About {...initialData} />,
      applyFriend: () => <ApplyFriend {...initialData} />,
      applyMember: () => <ApplyMember {...initialData} />,
      approveFriend: () => <ApproveFriend {...initialData} />,
      blockMember: () => <BlockMember {...initialData} />,
      changeTheme: () => <ChangeTheme {...initialData} />,
      channelPassword: () => <ChannelPassword {...initialData} />,
      channelSetting: () => <ChannelSetting {...initialData} />,
      createChannel: () => <CreateChannel {...initialData} />,
      createFriendGroup: () => <CreateFriendGroup {...initialData} />,
      createServer: () => <CreateServer {...initialData} />,
      dialogAlert: () => <Dialog {...{ ...initialData, iconType: 'ALERT' }} />,
      dialogAlert2: () => <Dialog {...{ ...initialData, iconType: 'ALERT' }} />,
      dialogError: () => <Dialog {...{ ...initialData, iconType: 'ERROR' }} />,
      dialogInfo: () => <Dialog {...{ ...initialData, iconType: 'INFO' }} />,
      dialogSuccess: () => <Dialog {...{ ...initialData, iconType: 'SUCCESS' }} />,
      dialogWarning: () => <Dialog {...{ ...initialData, iconType: 'WARNING' }} />,
      directMessage: () => <DirectMessage {...initialData} />,
      editChannelOrder: () => <EditChannelOrder {...initialData} />,
      editChannelName: () => <EditChannelName {...initialData} />,
      editFriendNote: () => <EditFriendNote {...initialData} />,
      editFriendGroupName: () => <EditFriendGroupName {...initialData} />,
      editNickname: () => <EditNickname {...initialData} />,
      friendVerification: () => <FriendVerification {...initialData} />,
      imageCropper: () => <ImageCropper {...initialData} />,
      inviteMember: () => <InviteMember {...initialData} />,
      kickMemberFromChannel: () => <KickMemberFromChannel {...initialData} />,
      kickMemberFromServer: () => <KickMemberFromServer {...initialData} />,
      memberApplicationSetting: () => <MemberApplicationSetting {...initialData} />,
      memberInvitation: () => <MemberInvitation {...initialData} />,
      searchUser: () => <SearchUser {...initialData} />,
      serverBroadcast: () => <ServerBroadcast {...initialData} />,
      serverSetting: () => <ServerSetting {...initialData} />,
      systemSetting: () => <SystemSetting {...initialData} />,
      userInfo: () => <UserInfo {...initialData} />,
      userSetting: () => <UserInfo {...initialData} />,
      chatHistory: () => <ChatHistory {...initialData} />,
    };

    return {
      ...defaultPopup[type],
      id,
      title: title[type],
      node: node[type],
    };
  }, [id, type, initialData, t]);

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
      {node && node()}
    </>
  );
});

Popup.displayName = 'Popup';

export default Popup;

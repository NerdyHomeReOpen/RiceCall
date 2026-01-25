/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import About from '@/popups/About';
import ApplyFriend from '@/popups/ApplyFriend';
import ApproveFriend from '@/popups/ApproveFriend';
import ApplyMember from '@/popups/ApplyMember';
import BlockMember from '@/popups/BlockMember';
import ChannelEvent from '@/popups/ChannelEvent';
import ChangeTheme from '@/popups/ChangeTheme';
import ChannelPassword from '@/popups/ChannelPassword';
import ChannelSetting from '@/popups/ChannelSetting';
import ChatHistory from '@/popups/chatHistory';
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
import ServerApplication from '@/popups/ServerApplication';
import ServerSetting from '@/popups/ServerSetting';
import ServerBroadcast from '@/popups/ServerBroadcast';
import SystemSetting from '@/popups/SystemSetting';
import UserInfo from '@/popups/UserInfo';

import header from '@/styles/header.module.css';

async function hydrateUserInfoInitialData(initialData: any): Promise<any> {
  // UserInfo/UserSetting popups expect `target` and `targetServers`.
  // On Electron those are often passed eagerly; on web we may only have ids.
  if (!initialData || typeof initialData !== 'object') return initialData;

  const userId = initialData.userId;
  const targetId = initialData.targetId;
  if (!userId || !targetId) return initialData;

  const hasTarget = initialData.target && typeof initialData.target === 'object';
  const hasTargetServers = Array.isArray(initialData.targetServers);
  if (hasTarget && hasTargetServers) return initialData;

  try {
    const [target, targetServers] = await Promise.all([
      hasTarget ? Promise.resolve(initialData.target) : ipc.data.user({ userId: targetId }),
      hasTargetServers ? Promise.resolve(initialData.targetServers) : ipc.data.servers({ userId: targetId }),
    ]);

    // Don't replace existing values with null-ish results.
    return {
      ...initialData,
      target: target ?? initialData.target ?? null,
      targetServers: targetServers ?? initialData.targetServers ?? [],
    };
  } catch {
    return {
      ...initialData,
      target: initialData.target ?? null,
      targetServers: initialData.targetServers ?? [],
    };
  }
}

function getWebInitialData(id: string): any | null {
  try {
    const key = `ricecall:popup:initialData:${id}`;
    // New tab/window does not share sessionStorage with the opener.
    const raw = sessionStorage.getItem(key) ?? localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Best-effort cleanup to avoid stale data reuse.
    try {
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
    return parsed;
  } catch {
    return null;
  }
}

interface HeaderProps {
  title: string;
  buttons: ('minimize' | 'maxsize' | 'close')[];
  titleBoxIcon?: string;
}

const Header: React.FC<HeaderProps> = React.memo(({ title, buttons, titleBoxIcon }) => {
  // States
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handlers
  const handleMaximize = () => {
    if (isFullscreen) return;
    ipc.window.maximize();
  };

  const handleUnmaximize = () => {
    if (!isFullscreen) return;
    ipc.window.unmaximize();
  };

  const handleMinimize = () => {
    ipc.window.minimize();
  };

  const handleClose = () => {
    ipc.window.close();
  };

  // Effects
  useEffect(() => {
    const unsub = ipc.window.onUnmaximize(() => setIsFullscreen(false));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.window.onMaximize(() => setIsFullscreen(true));
    return () => unsub();
  }, []);

  return (
    <header className={`${header['header']} ${header['popup']}`}>
      <div className={header['title-wrapper']}>
        <div className={`${header['title-box']} ${titleBoxIcon}`}>
          <div className={header['title']}>{title}</div>
        </div>
        <div className={header['buttons']}>
          {buttons.includes('minimize') && <div className={header['minimize']} onClick={handleMinimize} />}
          {buttons.includes('maxsize') && (isFullscreen ? <div className={header['restore']} onClick={handleUnmaximize} /> : <div className={header['maxsize']} onClick={handleMaximize} />)}
          {buttons.includes('close') && <div className={header['close']} onClick={handleClose} />}
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

const defaultPopup: Record<Types.PopupType, Omit<Popup, 'id' | 'node' | 'title'>> = {
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
  channelEvent: {
    type: 'channelEvent',
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

  chatHistory: {
    type: 'chatHistory',
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
  serverApplication: {
    type: 'serverApplication',
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
};

type Popup = {
  id: string;
  type: Types.PopupType;
  title: string;
  buttons: ('close' | 'minimize' | 'maxsize')[];
  node: () => React.ReactNode | null;
  hideHeader: boolean;
};

const PopupPageComponent: React.FC = React.memo(() => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [id, setId] = useState<string | null>(null);
  const [type, setType] = useState<Types.PopupType | null>(null);
  const [initialData, setInitialData] = useState<any | null>(null);

  // Variables
  const { title, buttons, node, hideHeader } = useMemo<Popup>(() => {
    if (!id || !type || !initialData) return { id: '', type: 'dialogAlert', title: '', buttons: ['close'], node: () => null, hideHeader: true };

    const title = {
      aboutus: t('about-ricecall'),
      applyFriend: t('apply-friend'),
      applyMember: t('apply-member'),
      approveFriend: t('approve-friend'),
      blockMember: t('block'),
      channelEvent: t('channel-event'),
      changeTheme: t('change-theme'),
      channelPassword: t('please-enter-the-channel-password'),
      channelSetting: initialData?.channel?.name || t('edit-channel'),
      chatHistory: t('chat-history'),
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
      serverApplication: t('server-application'),
      serverBroadcast: t('server-broadcast'),
      serverSetting: initialData?.server?.name || t('server-setting'),
      systemSetting: t('system-setting'),
      userInfo: t('user-info'),
      userSetting: t('user-setting'),
    };

    const node = {
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
      inviteMember: () => <InviteMember id={id} {...initialData} />,
      kickMemberFromChannel: () => <KickMemberFromChannel id={id} {...initialData} />,
      kickMemberFromServer: () => <KickMemberFromServer id={id} {...initialData} />,
      memberApplicationSetting: () => <MemberApplicationSetting id={id} {...initialData} />,
      memberInvitation: () => <MemberInvitation id={id} {...initialData} />,
      searchUser: () => <SearchUser id={id} {...initialData} />,
      serverApplication: () => <ServerApplication id={id} {...initialData} />,
      serverBroadcast: () => <ServerBroadcast id={id} {...initialData} />,
      serverSetting: () => <ServerSetting id={id} {...initialData} />,
      systemSetting: () => <SystemSetting id={id} {...initialData} />,
      userInfo: () => <UserInfo id={id} {...initialData} />,
      userSetting: () => <UserInfo id={id} {...initialData} />,
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
      const type = params.get('type') as Types.PopupType;
      const id = params.get('id') as string;
      setId(id || null);
      setType(type || null);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    const isElectron = typeof (window as any).require === 'function';
    const raw = isElectron ? ipc.initialData.get(id) : getWebInitialData(id);
    // Some popups (notably userInfo/userSetting) need extra data beyond ids.
    if ((type === 'userInfo' || type === 'userSetting') && !isElectron) {
      hydrateUserInfoInitialData(raw).then((hydrated) => setInitialData(hydrated));
    } else {
      setInitialData(raw);
    }
  }, [id, type]);

  const missingInitialData = useMemo(() => {
    // Most popups expect an object to spread as props; null/undefined will crash.
    // In web mode, opening in a new tab + refresh can make initialData unavailable.
    if (!type || !id) return false;
    return initialData == null || typeof initialData !== 'object';
  }, [type, id, initialData]);

  return (
    <>
      {!hideHeader && (
        <Header
          title={title}
          buttons={buttons}
          titleBoxIcon={type === 'changeTheme' ? header['title-box-skin-icon'] : type === 'directMessage' ? header['title-box-direct-message-icon'] : undefined}
        />
      )}
      {missingInitialData ? (
        <div style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
          <h3 style={{ margin: '0 0 8px 0' }}>Popup data missing</h3>
          <div style={{ opacity: 0.85, lineHeight: 1.4 }}>
            This popup was opened in a new tab/window, but its initial data wasn’t available.
            <br />
            Please close this tab and try opening the popup again.
          </div>
        </div>
      ) : (
        node && node()
      )}
    </>
  );
});

PopupPageComponent.displayName = 'PopupPageComponent';

const PopupPage = dynamic(() => Promise.resolve(PopupPageComponent), { ssr: false });

export default PopupPage;

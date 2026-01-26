/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';
import { POPUP_HEADERS } from '@/popup.config';
import { renderPopup } from '@/platform/popup/popupComponents.generated';

import SocketManager from '@/components/SocketManager';

import header from '@/styles/header.module.css';
import { isElectron } from '@/platform/ipc';

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
  const handleMaximizeBtnClick = () => {
    if (isFullscreen) return;
    ipc.window.maximize();
  };

  const handleUnmaximizeBtnClick = () => {
    if (!isFullscreen) return;
    ipc.window.unmaximize();
  };

  const handleMinimizeBtnClick = () => {
    ipc.window.minimize();
  };

  const handleCloseBtnClick = () => {
    ipc.window.close();
  };

  // Effects
  useEffect(() => {
    const unsubs = [ipc.window.onUnmaximize(() => setIsFullscreen(false)), ipc.window.onMaximize(() => setIsFullscreen(true))];
    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  return (
    <header className={`${header['header']} ${header['popup']}`}>
      <div className={header['title-wrapper']}>
        <div className={`${header['title-box']} ${titleBoxIcon}`}>
          <div className={header['title']}>{title}</div>
        </div>
        <div className={header['buttons']}>
          {buttons.includes('minimize') && <div className={header['minimize']} onClick={handleMinimizeBtnClick} />}
          {buttons.includes('maxsize') &&
            (isFullscreen ? <div className={header['restore']} onClick={handleUnmaximizeBtnClick} /> : <div className={header['maxsize']} onClick={handleMaximizeBtnClick} />)}
          {buttons.includes('close') && <div className={header['close']} onClick={handleCloseBtnClick} />}
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';



const PopupPageComponent: React.FC = React.memo(() => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [id, setId] = useState<string | null>(null);
  const [type, setType] = useState<Types.PopupType | null>(null);
  const [initialData, setInitialData] = useState<any | null>(null);

  // Variables
  const { buttons, hideHeader } = useMemo(() => {
    if (!type) return { buttons: [], hideHeader: true };
    return POPUP_HEADERS[type] ?? { buttons: ['close'], hideHeader: false };
  }, [type]);

  const title = useMemo(() => {
    if (!type) return '';
    return {
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
      inviteFriend: t('invite-friend-to-server'),
      inviteMember: t('invite-member'),
      kickMemberFromChannel: t('kick-channel'),
      kickMemberFromServer: t('kick-server'),
      memberApplicationSetting: t('member-application-setting'),
      memberInvitation: t('member-invitation'),
      searchUser: t('search-user'),
      serverAnnouncement: t('announcement'),
      serverApplication: t('server-application'),
      serverBroadcast: t('server-broadcast'),
      serverSetting: initialData?.server?.name || t('server-setting'),
      systemSetting: t('system-setting'),
      userInfo: t('user-info'),
      userSetting: t('user-setting'),
    }[type];
  }, [type, initialData, t]);

  const node = useMemo<() => React.ReactNode | null>(() => {
    if (!type || !initialData) return () => null;
    return () => renderPopup(type, id!, initialData);
  }, [id, type, initialData]);

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
      {/* SocketManager is provided by the RootPage in web in-app mode. 
          Only include it if we might be in a standalone popup window. */}
      {isElectron() && <SocketManager />}
      {!isElectron() && typeof window !== 'undefined' && window.opener && <SocketManager />}
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

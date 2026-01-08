'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import ipc from '@/ipc';

import type * as Types from '@/types';

import { setIsSocketConnected } from '@/store/slices/socketSlice';
import { setUser } from '@/store/slices/userSlice';

import SocketManager from '@/components/SocketManager';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NotificationToaster from '@/components/NotificationToaster';

import FriendPage from '@/pages/Friend';
import HomePage from '@/pages/Home';
import ServerPage from '@/pages/Server';

import WebRTCProvider from '@/providers/WebRTC';
import ActionScannerProvider from '@/providers/ActionScanner';
import ExpandedProvider from '@/providers/FindMe';
import { useContextMenu } from '@/providers/ContextMenu';
import { useMainTab } from '@/providers/MainTab';
import { useLoading } from '@/providers/Loading';
import { useActionScanner } from '@/providers/ActionScanner';

import * as Popup from '@/utils/popup';
import CtxMenuBuilder from '@/utils/ctxMenuBuilder';

import { LANGUAGES } from '@/constant';

import headerStyles from '@/styles/header.module.css';

type Tab = {
  id: 'home' | 'friends' | 'server';
  label: string;
};

const Header: React.FC = React.memo(() => {
  // Hooks
  const { t, i18n } = useTranslation();
  const { showStatusDropdown, showContextMenu, showNotificationMenu } = useContextMenu();
  const { isIdling, isManualIdling, setIsManualIdling } = useActionScanner();

  // Selectors
  const user = useAppSelector((state) => state.user.data);
  const currentServer = useAppSelector((state) => state.currentServer.data);
  const friendApplications = useAppSelector((state) => state.friendApplications.data);
  const memberInvitations = useAppSelector((state) => state.memberInvitations.data);
  const systemNotifications = useAppSelector((state) => state.systemNotifications.data);

  // States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCloseToTray, setIsCloseToTray] = useState(true);

  // Variables
  const { userId, name: userName, status: userStatus } = user;
  const { serverId: currentServerId, name: currentServerName } = currentServer;
  const hasNotification = friendApplications.length !== 0 || memberInvitations.length !== 0 || systemNotifications.length !== 0;
  const hasFriendApplication = friendApplications.length !== 0;
  const hasMemberInvitation = memberInvitations.length !== 0;
  const hasSystemNotification = systemNotifications.length !== 0;

  const mainTabs: Tab[] = useMemo(
    () => [
      { id: 'home', label: t('home') },
      { id: 'friends', label: t('friends') },
      { id: 'server', label: currentServerName },
    ],
    [currentServerName, t],
  );

  // Functions
  const logout = () => {
    ipc.auth.logout();
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
  };

  const exit = () => {
    ipc.exit();
  };

  const changeLanguage = (language: Types.LanguageKey) => {
    ipc.language.set(language);
    i18n.changeLanguage(language);
  };

  const getContextMenuItems = () =>
    new CtxMenuBuilder()
      .addSystemSettingOption(() => Popup.openSystemSetting(userId))
      .addChangeThemeOption(() => Popup.openChangeTheme())
      .addFeedbackOption(() => window.open('https://forms.gle/AkBTqsZm9NGr5aH46', '_blank'))
      .addLanguageSelectOption({ languages: LANGUAGES }, (code) => (code ? changeLanguage(code) : null))
      .addHelpCenterOption(
        {
          onFaqClick: () => window.open('https://ricecall.com.tw/#faq', '_blank'),
          onAgreementClick: () => window.open('https://ricecall.com.tw/terms', '_blank'),
          onSpecificationClick: () => window.open('https://ricecall.com.tw/specification', '_blank'),
          onContactUsClick: () => window.open('https://ricecall.com.tw/contact', '_blank'),
          onAboutUsClick: () => Popup.openAboutUs,
        },
        () => {},
      )
      .addLogoutOption(() => logout())
      .addExitOption(() => exit())
      .build();

  // TODO: Make a NotificationMenuBuilder
  const getNotificationMenuItems = () => [
    {
      id: 'no-unread-notify',
      label: t('no-unread-notify'),
      show: !hasNotification,
      className: 'readonly',
    },
    {
      id: 'friend-verification',
      label: t('friend-verification'),
      icon: 'notification',
      show: hasFriendApplication,
      contentType: 'image',
      showContentLength: true,
      showContent: true,
      contents: friendApplications.map((fa) => fa.avatarUrl),
      onClick: () => Popup.openFriendVerification(userId),
    },
    {
      id: 'member-invitation',
      label: t('member-invitation'),
      icon: 'notification',
      show: hasMemberInvitation,
      contentType: 'image',
      showContentLength: true,
      showContent: true,
      contents: memberInvitations.map((mi) => mi.avatarUrl),
      onClick: () => Popup.openMemberInvitation(userId),
    },
    {
      id: 'system-notify',
      label: t('system-notify'),
      icon: 'notification',
      show: hasSystemNotification,
      showContentLength: true,
      showContent: false,
      contents: memberInvitations.map((mi) => mi.avatarUrl),
      onClick: () => {},
    },
  ];

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
    if (isCloseToTray) ipc.window.close();
    else ipc.exit();
  };

  const handleStatusDropdownClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { left: x, bottom: y } = e.currentTarget.getBoundingClientRect();
    showStatusDropdown(x, y, 'right-bottom', (status) => {
      setIsManualIdling(status !== 'online');
      Popup.editUserStatus(status);
    });
  };

  const handleMenuClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { right: x, bottom: y } = e.currentTarget.getBoundingClientRect();
    showContextMenu(x + 50, y, 'left-bottom', getContextMenuItems());
  };

  const handleNotificationMenuClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { left: x, bottom: y } = e.currentTarget.getBoundingClientRect();
    showNotificationMenu(x, y, 'right-bottom', getNotificationMenuItems());
  };

  const handleNameClick = () => {
    Popup.openUserInfo(userId, userId);
  };

  // Effects
  useEffect(() => {
    const next = isIdling ? 'idle' : 'online';
    if (user.status !== next && !isManualIdling) {
      Popup.editUserStatus(next);
    }
  }, [isIdling, isManualIdling, user.status]);

  useEffect(() => {
    const changeCloseToTray = (enable: boolean) => {
      setIsCloseToTray(enable);
    };

    changeCloseToTray(ipc.systemSettings.closeToTray.get());

    const unsubs = [ipc.systemSettings.closeToTray.onUpdate(changeCloseToTray), ipc.window.onMaximize(() => setIsFullscreen(true)), ipc.window.onUnmaximize(() => setIsFullscreen(false))];
    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  return (
    <header className={`${headerStyles['header']} ${headerStyles['big']}`}>
      <div className={headerStyles['title-box']}>
        <div className={headerStyles['name-box']} onClick={handleNameClick}>
          {userName}
        </div>
        <div className={headerStyles['status-box']} onClick={handleStatusDropdownClick}>
          <div className={headerStyles['status-display']} datatype={userStatus} />
          <div className={headerStyles['status-triangle']} />
        </div>
      </div>
      <div className={headerStyles['main-tabs']}>
        {mainTabs.map((tab) => (
          <TabItem key={tab.id} tab={tab} currentServerId={currentServerId} />
        ))}
      </div>
      <div className={headerStyles['buttons']}>
        <div className={headerStyles['gift']} />
        <div className={headerStyles['game']} />
        <div className={headerStyles['notice']} onClick={handleNotificationMenuClick}>
          <div className={`${headerStyles['overlay']} ${hasNotification && headerStyles['new']}`} />
        </div>
        <div className={headerStyles['spliter']} />
        <div className={headerStyles['menu']} onClick={handleMenuClick} />
        <div className={headerStyles['minimize']} onClick={handleMinimizeBtnClick} />
        {isFullscreen ? <div className={headerStyles['restore']} onClick={handleUnmaximizeBtnClick} /> : <div className={headerStyles['maxsize']} onClick={handleMaximizeBtnClick} />}
        <div className={headerStyles['close']} onClick={handleCloseBtnClick} />
      </div>
    </header>
  );
});

Header.displayName = 'Header';

interface TabItemProps {
  tab: Tab;
  currentServerId: string;
}

const TabItem = React.memo(({ tab, currentServerId }: TabItemProps) => {
  // Hooks
  const { selectedTabId, selectTab } = useMainTab();

  // Variables
  const { id: tabId, label: tabLabel } = tab;
  const isSelected = tabId === selectedTabId;

  // Handlers
  const handleTabClick = () => {
    selectTab(tabId);
  };

  const handleCloseButtonClick = (e: React.MouseEvent<SVGSVGElement>) => {
    e.stopPropagation();
    Popup.leaveServer(currentServerId);
  };

  if (tabId === 'server' && !currentServerId) return null;
  return (
    <div key={`tabs-${tabId}`} data-tab-id={tabId} className={`${headerStyles['tab']} ${isSelected ? headerStyles['selected'] : ''}`} onClick={handleTabClick}>
      <div className={headerStyles['tab-lable']}>{tabLabel}</div>
      <div className={headerStyles['tab-bg']} />
      {tabId === 'server' && (
        <svg className={`${headerStyles['tab-close']} themeTabClose`} onClick={handleCloseButtonClick} xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="12" fill="var(--main-color, rgb(55 144 206))" />
          <path d="M17 7L7 17M7 7l10 10" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
});

TabItem.displayName = 'TabItem';

const RootPageComponent: React.FC = React.memo(() => {
  // Hooks
  const { t } = useTranslation();
  const { selectedTabId, selectTab } = useMainTab();
  const { isLoading, loadServer, stopLoading } = useLoading();
  const dispatch = useAppDispatch();

  // Refs
  const selectedTabIdRef = useRef<'home' | 'friends' | 'server'>(selectedTabId);

  // Selectors
  const user = useAppSelector((state) => state.user.data);
  const currentServer = useAppSelector((state) => state.currentServer.data);
  const serverOnlineMembers = useAppSelector((state) => state.onlineMembers.data);
  const isSocketConnected = useAppSelector((state) => state.socket.isSocketConnected);

  // Variables
  const { userId, name: userName, currentServerId } = user;
  const { name: currentServerName } = currentServer;
  const isSelectedHomePage = useMemo(() => selectedTabId === 'home', [selectedTabId]);
  const isSelectedFriendsPage = useMemo(() => selectedTabId === 'friends', [selectedTabId]);
  const isSelectedServerPage = useMemo(() => selectedTabId === 'server', [selectedTabId]);

  // Effects
  useEffect(() => {
    ipc.tray.title.set(user.name);
  }, [user.name]);

  useEffect(() => {
    selectedTabIdRef.current = selectedTabId;
  }, [selectedTabId]);

  useEffect(() => {
    if (user.userId) return;

    const userId = localStorage.getItem('userId');
    if (!userId) return;

    ipc.data.userHotReload({ userId }).then((user) => {
      if (user) {
        dispatch(setUser(user));
        dispatch(setIsSocketConnected(true));
      }
    });
  }, [user, dispatch]);

  useEffect(() => {
    if (currentServerId && selectedTabIdRef.current !== 'server') selectTab('server');
    else if (!currentServerId && selectedTabIdRef.current === 'server') selectTab('home');
    stopLoading();
  }, [currentServerId, stopLoading, selectTab]);

  useEffect(() => {
    const onTriggerHandleServerSelect = ({ key, newValue }: StorageEvent) => {
      if (key !== 'trigger-handle-server-select' || !newValue) return;
      const { serverDisplayId, serverId } = JSON.parse(newValue);
      if (isLoading) return;
      if (serverId === currentServerId) {
        selectTab('server');
        return;
      }
      loadServer(serverDisplayId);
      ipc.socket.send('connectServer', { serverId });
    };
    window.addEventListener('storage', onTriggerHandleServerSelect);
    return () => window.removeEventListener('storage', onTriggerHandleServerSelect);
  }, [currentServerId, isLoading, loadServer, selectTab]);

  useEffect(() => {
    switch (selectedTabId) {
      case 'home':
        ipc.discord.updatePresence({
          details: t('rpc:viewing-home-page'),
          state: `${t('rpc:user', { '0': userName })}`,
          largeImageKey: 'app_icon',
          largeImageText: 'RC Voice',
          smallImageKey: 'home_icon',
          smallImageText: t('rpc:home-page'),
          timestamp: Date.now(),
          buttons: [{ label: t('rpc:join-discord-server'), url: 'https://discord.gg/adCWzv6wwS' }],
        });
        break;
      case 'friends':
        ipc.discord.updatePresence({
          details: t('rpc:viewing-friend-page'),
          state: `${t('rpc:user', { '0': userName })}`,
          largeImageKey: 'app_icon',
          largeImageText: 'RC Voice',
          smallImageKey: 'home_icon',
          smallImageText: t('rpc:vewing-friend-page'),
          timestamp: Date.now(),
          buttons: [{ label: t('rpc:join-discord-server'), url: 'https://discord.gg/adCWzv6wwS' }],
        });
        break;
      case 'server':
        ipc.discord.updatePresence({
          details: `${t('in')} ${currentServerName}`,
          state: `${t('rpc:chat-with-members', { '0': serverOnlineMembers.length.toString() })}`,
          largeImageKey: 'app_icon',
          largeImageText: 'RC Voice',
          smallImageKey: 'home_icon',
          smallImageText: t('rpc:viewing-server-page'),
          timestamp: Date.now(),
          buttons: [{ label: t('rpc:join-discord-server'), url: 'https://discord.gg/adCWzv6wwS' }],
        });
        break;
    }
  }, [selectedTabId, userName, currentServerName, serverOnlineMembers.length, t]);

  return (
    <WebRTCProvider>
      <ActionScannerProvider>
        <ExpandedProvider>
          <SocketManager />
          <Header />
          {!userId || !isSocketConnected ? (
            <LoadingSpinner />
          ) : (
            <>
              <HomePage display={isSelectedHomePage} />
              <FriendPage display={isSelectedFriendsPage} />
              <ServerPage display={isSelectedServerPage} />
              <NotificationToaster />
            </>
          )}
        </ExpandedProvider>
      </ActionScannerProvider>
    </WebRTCProvider>
  );
});

RootPageComponent.displayName = 'RootPageComponent';

const RootPage = dynamic(() => Promise.resolve(RootPageComponent), { ssr: false });

export default RootPage;

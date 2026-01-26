'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState, useMemo } from 'react';
import { shallowEqual } from 'react-redux';
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
import LoginPage from '@/pages/Login';

import WebRTCProvider from '@/providers/WebRTC';
import ActionScannerProvider from '@/providers/ActionScanner';
import ExpandedProvider from '@/providers/FindMe';
import { useContextMenu } from '@/providers/ContextMenu';
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

interface HeaderProps {
  selectedTab: 'home' | 'friends' | 'server';
  onTabSelect: (tabId: 'home' | 'friends' | 'server') => void;
}

const Header: React.FC<HeaderProps> = React.memo(({ selectedTab, onTabSelect }) => {
  // Hooks
  const { t, i18n } = useTranslation();
  const { showStatusDropdown, showContextMenu, showNotificationMenu } = useContextMenu();
  const { isIdling, isManualIdling, setIsManualIdling } = useActionScanner();

  // Selectors
  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
      name: state.user.data.name,
      status: state.user.data.status,
      currentServerId: state.currentServer.data.serverId,
    }),
    shallowEqual,
  );

  const currentServer = useAppSelector(
    (state) => ({
      name: state.currentServer.data.name,
    }),
    shallowEqual,
  );

  const friendApplications = useAppSelector((state) => state.friendApplications.data, shallowEqual);
  const memberInvitations = useAppSelector((state) => state.memberInvitations.data, shallowEqual);
  const systemNotifications = useAppSelector((state) => state.systemNotifications.data, shallowEqual);

  // States
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Variables
  // Guard here to avoid hard crashes like "Cannot read properties of undefined (reading 'length')".
  const safeFriendApplications = friendApplications ?? [];
  const safeMemberInvitations = memberInvitations ?? [];
  const safeSystemNotifications = systemNotifications ?? [];
  const hasNotification = !!safeFriendApplications.length || !!safeMemberInvitations.length || !!safeSystemNotifications.length;
  const hasFriendApplication = !!safeFriendApplications.length;
  const hasMemberInvitation = !!safeMemberInvitations.length;
  const hasSystemNotification = !!safeSystemNotifications.length;

  const mainTabs: Tab[] = useMemo(
    () => [
      { id: 'home', label: t('home') },
      { id: 'friends', label: t('friends') },
      { id: 'server', label: currentServer.name },
    ],
    [currentServer.name, t],
  );

  // Functions
  const logout = () => {
    ipc.auth.logout();
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
      .addSystemSettingOption(() => Popup.openSystemSetting(user.userId))
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
      contents: safeFriendApplications.map((fa) => fa.avatarUrl),
      onClick: () => Popup.openFriendVerification(user.userId),
    },
    {
      id: 'member-invitation',
      label: t('member-invitation'),
      icon: 'notification',
      show: hasMemberInvitation,
      contentType: 'image',
      showContentLength: true,
      showContent: true,
      contents: safeMemberInvitations.map((mi) => mi.avatarUrl),
      onClick: () => Popup.openMemberInvitation(user.userId),
    },
    {
      id: 'system-notify',
      label: t('system-notify'),
      icon: 'notification',
      show: hasSystemNotification,
      showContentLength: true,
      showContent: false,
      contents: safeSystemNotifications.map((sn) => sn),
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
    const isCloseToTray = ipc.systemSettings.closeToTray.get();
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
    Popup.openUserInfo(user.userId, user.userId);
  };

  const handleTabSelect = (tabId: 'home' | 'friends' | 'server') => {
    onTabSelect(tabId);
  };

  // Effects
  useEffect(() => {
    const next = isIdling ? 'idle' : 'online';
    if (user.status !== next && !isManualIdling) {
      Popup.editUserStatus(next);
    }
  }, [isIdling, isManualIdling, user.status]);

  useEffect(() => {
    const unsubs = [ipc.window.onMaximize(() => setIsFullscreen(true)), ipc.window.onUnmaximize(() => setIsFullscreen(false))];
    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  return (
    <header className={`${headerStyles['header']} ${headerStyles['big']}`}>
      <div className={headerStyles['title-box']}>
        <div className={headerStyles['name-box']} onClick={handleNameClick}>
          {user.name}
        </div>
        <div className={headerStyles['status-box']} onClick={handleStatusDropdownClick}>
          <div className={headerStyles['status-display']} datatype={user.status} />
          <div className={headerStyles['status-triangle']} />
        </div>
      </div>
      <div className={headerStyles['main-tabs']}>
        {mainTabs.map((tab) => (
          <TabItem key={tab.id} tab={tab} currentServerId={user.currentServerId} isSelected={selectedTab === tab.id} onTabSelect={handleTabSelect} />
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
  currentServerId: string | null;
  isSelected: boolean;
  onTabSelect: (tabId: 'home' | 'friends' | 'server') => void;
}

const TabItem = React.memo(({ tab, currentServerId, isSelected, onTabSelect }: TabItemProps) => {
  // Handlers
  const handleTabClick = () => {
    onTabSelect(tab.id);
  };

  const handleCloseButtonClick = (e: React.MouseEvent<SVGSVGElement>) => {
    e.stopPropagation();
    if (!currentServerId) return;
    Popup.leaveServer(currentServerId);
  };

  if (tab.id === 'server' && !currentServerId) return null;
  return (
    <div key={`tabs-${tab.id}`} data-tab-id={tab.id} className={`${headerStyles['tab']} ${isSelected ? headerStyles['selected'] : ''}`} onClick={handleTabClick}>
      <div className={headerStyles['tab-lable']}>{tab.label}</div>
      <div className={headerStyles['tab-bg']} />
      {tab.id === 'server' && (
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
  const { getIsLoading, loadServer, stopLoading } = useLoading();
  const dispatch = useAppDispatch();

  // States
  const [selectedTab, setSelectedTab] = useState<'home' | 'friends' | 'server'>('home');

  // Selectors
  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
      name: state.user.data.name,
      currentServerId: state.currentServer.data.serverId,
    }),
    shallowEqual,
  );

  const currentServer = useAppSelector(
    (state) => ({
      name: state.currentServer.data.name,
    }),
    shallowEqual,
  );

  const onlineMembersLength = useAppSelector((state) => state.onlineMembers.data.length, shallowEqual);
  const isSocketConnected = useAppSelector((state) => state.socket.isSocketConnected, shallowEqual);

  // Variables
  const isWebMode = typeof window !== 'undefined' && !(window as any).require;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const isSelectedHomePage = selectedTab === 'home';
  const isSelectedFriendsPage = selectedTab === 'friends';
  const isSelectedServerPage = selectedTab === 'server';

  // Handlers
  const handleTabSelect = (tabId: 'home' | 'friends' | 'server') => {
    setSelectedTab(tabId);
  };

  // Effects
  useEffect(() => {
    ipc.tray.title.set(user.name);
  }, [user.name]);

  // Web-mode: establish socket.io connection directly (Electron does this in main process).
  useEffect(() => {
    if (!isWebMode) return;
    if (!token) return;
    ipc.socketClient?.connect(token);
    return () => {
      ipc.socketClient?.disconnect();
    };
  }, [isWebMode, token]);

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
    if (user.currentServerId) setSelectedTab('server');
    else if (!user.currentServerId) setSelectedTab('home');
    stopLoading();
  }, [user.currentServerId, stopLoading]);

  useEffect(() => {
    const onTriggerHandleServerSelect = ({ key, newValue }: StorageEvent) => {
      if (key !== 'trigger-handle-server-select' || !newValue) return;
      const { serverDisplayId, serverId } = JSON.parse(newValue);
      if (getIsLoading() || user.currentServerId === serverId) return;
      loadServer(serverDisplayId);
      ipc.socket.send('connectServer', { serverId });
    };
    window.addEventListener('storage', onTriggerHandleServerSelect);
    return () => window.removeEventListener('storage', onTriggerHandleServerSelect);
  }, [user.currentServerId, getIsLoading, loadServer]);

  useEffect(() => {
    switch (selectedTab) {
      case 'home':
        ipc.discord.updatePresence({
          details: t('rpc:viewing-home-page'),
          state: `${t('rpc:user', { '0': user.name })}`,
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
          state: `${t('rpc:user', { '0': user.name })}`,
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
          details: `${t('in')} ${currentServer.name}`,
          state: `${t('rpc:chat-with-members', { '0': onlineMembersLength.toString() })}`,
          largeImageKey: 'app_icon',
          largeImageText: 'RC Voice',
          smallImageKey: 'home_icon',
          smallImageText: t('rpc:viewing-server-page'),
          timestamp: Date.now(),
          buttons: [{ label: t('rpc:join-discord-server'), url: 'https://discord.gg/adCWzv6wwS' }],
        });
        break;
    }
  }, [selectedTab, user.name, currentServer.name, onlineMembersLength, t]);

  return (
    <WebRTCProvider>
      <ActionScannerProvider>
        <ExpandedProvider>
          <SocketManager />
          <Header selectedTab={selectedTab} onTabSelect={handleTabSelect} />
          {!user.userId || !isSocketConnected ? (
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

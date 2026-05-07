import React, { useState, useMemo, useEffect } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import * as ipc from '@/main/ipc';

import { editUserStatus, openUserInfo, openFriendVerification, openMemberInvitation } from '@/services';

import { useContextMenu } from '@/providers/ContextMenu';
import { useActionScanner } from '@/providers/ActionScanner';

import { useAppSelector } from '@/hooks/Store';
import { useHeaderContextMenu } from '@/hooks/ContextMenus/Header';

import MainTabItem from './MainTabItem';

import styles from './Header.module.css';

interface HeaderProps {
  selectedTab: 'home' | 'friends' | 'server';
  onTabSelect: (tabId: 'home' | 'friends' | 'server') => void;
}

const Header: React.FC<HeaderProps> = React.memo(({ selectedTab, onTabSelect }) => {
  const { t } = useTranslation();
  const { showStatusDropdown, showContextMenu, showNotificationMenu } = useContextMenu();
  const { isIdling, isManualIdling, setIsManualIdling } = useActionScanner();

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

  const [isFullscreen, setIsFullscreen] = useState(false);

  const safeFriendApplications = friendApplications ?? [];
  const safeMemberInvitations = memberInvitations ?? [];
  const safeSystemNotifications = systemNotifications ?? [];
  const hasNotification = !!safeFriendApplications.length || !!safeMemberInvitations.length || !!safeSystemNotifications.length;
  const hasFriendApplication = !!safeFriendApplications.length;
  const hasMemberInvitation = !!safeMemberInvitations.length;
  const hasSystemNotification = !!safeSystemNotifications.length;

  const mainTabs = useMemo(
    () => [
      { id: 'home' as const, label: t('home') },
      { id: 'friends' as const, label: t('friends') },
      { id: 'server' as const, label: currentServer.name },
    ],
    [currentServer.name, t],
  );

  const logout = () => {
    ipc.auth.logout();
  };

  const exit = () => {
    ipc.exit();
  };

  const changeLanguage = (language: Types.LanguageKey) => {
    ipc.systemSettings.language.set(language);
  };

  const { buildContextMenu: buildHeaderContextMenu } = useHeaderContextMenu({
    user,
    onChangeLanguage: changeLanguage,
    onLogout: logout,
    onExit: exit,
  });

  // TODO: Make a NotificationMenuBuilder
  const buildNotificationMenuItems = () => [
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
      onClick: () => openFriendVerification(),
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
      onClick: () => openMemberInvitation(),
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
      editUserStatus(status);
    });
  };

  const handleMenuClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { right: x, bottom: y } = e.currentTarget.getBoundingClientRect();
    showContextMenu(x + 50, y, 'left-bottom', buildHeaderContextMenu());
  };

  const handleNotificationMenuClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { left: x, bottom: y } = e.currentTarget.getBoundingClientRect();
    showNotificationMenu(x, y, 'right-bottom', buildNotificationMenuItems());
  };

  const handleNameClick = () => {
    openUserInfo(user.userId, user.userId);
  };

  const handleTabSelect = (tabId: 'home' | 'friends' | 'server') => {
    onTabSelect(tabId);
  };

  useEffect(() => {
    const next = isIdling ? 'idle' : 'online';
    if (user.status !== next && !isManualIdling) {
      editUserStatus(next);
    }
  }, [isIdling, isManualIdling, user.status]);

  useEffect(() => {
    const unsubs = [ipc.window.onMaximize(() => setIsFullscreen(true)), ipc.window.onUnmaximize(() => setIsFullscreen(false))];
    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  return (
    <header className={styles['header']}>
      <div className={styles['title-box']}>
        <div className={styles['name-box']} onClick={handleNameClick}>
          {user.name}
        </div>
        <div className={styles['status-box']} onClick={handleStatusDropdownClick}>
          <div className={styles['status-display']} datatype={user.status} />
          <div className={styles['status-triangle']} />
        </div>
      </div>
      <div className={styles['main-tabs']}>
        {mainTabs.map((tab) => (
          <MainTabItem key={tab.id} tab={tab} currentServerId={user.currentServerId} isSelected={selectedTab === tab.id} onTabSelect={handleTabSelect} />
        ))}
      </div>
      <div className={styles['buttons']}>
        <div className={styles['gift-button']} />
        <div className={styles['game-button']} />
        <div className={styles['notice-button']} onClick={handleNotificationMenuClick}>
          <div className={`${styles['notice-overlay']} ${hasNotification && styles['new']}`} />
        </div>
        <div className={styles['spliter']} />
        <div className={styles['menu-button']} onClick={handleMenuClick} />
        <div className={styles['minimize-button']} onClick={handleMinimizeBtnClick} />
        {isFullscreen ? <div className={styles['restore-button']} onClick={handleUnmaximizeBtnClick} /> : <div className={styles['maxsize-button']} onClick={handleMaximizeBtnClick} />}
        <div className={styles['close-button']} onClick={handleCloseBtnClick} />
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;

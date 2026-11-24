import React, { useState, useMemo, useEffect } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import * as ipc from '@/main/ipc';

import { editUserStatus, openUserInfo, openFriendVerification, openMemberInvitation } from '@/services';

import { useContextMenu } from '@/providers/ContextMenu';
import { useActionScanner } from '@/providers/ActionScanner';

import { useAppSelector } from '@/hooks/useStore';
import { useHeaderCtxMenu } from '@/hooks/context-menus/useHeaderCtxMenu';

import MainTabItem from './MainTabItem';

import { DEFAULT_SERVER_AVATAR_URL, DEFAULT_USER_AVATAR_URL } from '@/constants';

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

  const changeLanguage = (language: Types.Locale) => {
    ipc.systemSettings.language.set(language);
  };

  const { buildContextMenu: buildHeaderContextMenu } = useHeaderCtxMenu({
    user,
    onChangeLanguage: changeLanguage,
    onLogout: logout,
    onExit: exit,
  });

  // TODO(backlog#7): Make a NotificationMenuBuilder
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
      contents: safeFriendApplications.map((fa) => fa.avatarUrl || DEFAULT_USER_AVATAR_URL),
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
      contents: safeMemberInvitations.map((mi) => mi.avatarUrl || DEFAULT_SERVER_AVATAR_URL),
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
    openUserInfo(user.userId);
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
    <header className="z-10 flex justify-between min-h-[40px] text-secondary-color bg-main-color bg-(image:--header-image) bg-no-repeat bg-position-[0_0] bg-cover border-none [-webkit-app-region:drag]">
      <div className="flex flex-row gap-[5px] items-center justify-between px-[10px] before:inline-block before:min-w-[18px] before:min-h-[18px] before:content-[''] before:bg-[url('/rc_logo_small.svg')] before:bg-no-repeat before:bg-center before:bg-auto">
        <div
          className="max-w-[150px] max-h-[26px] px-[2px] truncate text-[0.9rem] font-bold leading-[16px] text-text-color [text-shadow:0_0_4px_#fff9] [-webkit-app-region:no-drag] cursor-pointer hover:[text-shadow:0_0_4px_#fff] hover:bg-[#ffffff1f] hover:rounded-[3px] active:[text-shadow:0_0_4px_#fff] active:bg-[#ffffff36]"
          onClick={handleNameClick}
        >
          {user.name}
        </div>
        <div
          className="group/status relative flex h-fit p-[2px] [-webkit-app-region:no-drag] cursor-pointer hover:[text-shadow:0_0_4px_#fff] hover:bg-[#ffffff1f] hover:rounded-[3px] active:[text-shadow:0_0_4px_#fff] active:bg-[#ffffff36]"
          onClick={handleStatusDropdownClick}
        >
          <div
            className="inline-block min-w-[13px] min-h-[13px] bg-[url('/user_state.svg')] bg-no-repeat bg-position-[0_0] [&[datatype=dnd]]:bg-position-[-13px_0] [&[datatype=idle]]:bg-position-[-26px_0] [&[datatype=gn]]:bg-position-[-39px_0]"
            datatype={user.status}
          />
          <div className="inline-block min-w-[8px] min-h-[13px] ml-[5px] bg-[url('/state_triangle.svg')] bg-no-repeat bg-position-[0_4px] group-hover/status:bg-position-[-9px_4px] group-active/status:bg-position-[-18px_4px]" />
        </div>
      </div>
      <div className="flex items-end mr-auto ml-[5%]">
        {mainTabs.map((tab) => (
          <MainTabItem key={tab.id} tab={tab} currentServerId={user.currentServerId} isSelected={selectedTab === tab.id} onTabSelect={handleTabSelect} />
        ))}
      </div>
      <div className="flex gap-[5px] items-center justify-end min-w-fit mr-[10px] [-webkit-app-region:no-drag] cursor-pointer">
        <div className="inline-block cursor-pointer bg-no-repeat bg-cover bg-position-[0_0] min-w-[28px] min-h-[28px] bg-[url('/gift.svg')] hover:bg-position-[-28px_0] active:bg-position-[-56px_0]" />
        <div className="inline-block cursor-pointer bg-no-repeat bg-cover bg-position-[0_0] min-w-[28px] min-h-[28px] bg-[url('/game.svg')] hover:bg-position-[-28px_0] active:bg-position-[-56px_0]" />
        <div
          className="inline-block cursor-pointer bg-no-repeat bg-cover bg-position-[0_0] min-w-[24px] min-h-[24px] bg-[url('/icon_notice.svg')] hover:bg-position-[-24px_0] active:bg-position-[-48px_0]"
          onClick={handleNotificationMenuClick}
        >
          <div
            className={`absolute inline-block min-w-[24px] min-h-[24px] cursor-pointer bg-[url('/icon_notice_overlay.svg')] bg-no-repeat bg-cover ${hasNotification ? 'bg-position-[-24px_0]' : 'bg-position-[0_0]'}`}
          />
        </div>
        <div className="inline-block min-w-[2px] min-h-[19px] cursor-pointer bg-[url('/mf_spliter.svg')] bg-no-repeat bg-position-[0_0] bg-cover" />
        <div
          className="inline-block cursor-pointer bg-no-repeat bg-cover bg-position-[0_0] min-w-[20px] min-h-[20px] bg-[url('/BtnMenu.svg')] hover:bg-position-[-20px_0] active:bg-position-[-40px_0]"
          onClick={handleMenuClick}
        />
        <div
          className="inline-block cursor-pointer bg-no-repeat bg-cover bg-position-[0_0] min-w-[20px] min-h-[20px] bg-[url('/Button_Minsize.svg')] hover:bg-position-[-20px_0] active:bg-position-[-40px_0]"
          onClick={handleMinimizeBtnClick}
        />
        {isFullscreen ? (
          <div
            className="inline-block cursor-pointer bg-no-repeat bg-cover bg-position-[0_0] min-w-[20px] min-h-[20px] bg-[url('/Button_Restore.svg')] hover:bg-position-[-20px_0] active:bg-position-[-40px_0]"
            onClick={handleUnmaximizeBtnClick}
          />
        ) : (
          <div
            className="inline-block cursor-pointer bg-no-repeat bg-cover bg-position-[0_0] min-w-[20px] min-h-[20px] bg-[url('/Button_Maxsize.svg')] hover:bg-position-[-20px_0] active:bg-position-[-40px_0]"
            onClick={handleMaximizeBtnClick}
          />
        )}
        <div
          className="inline-block cursor-pointer bg-no-repeat bg-cover bg-position-[0_0] min-w-[20px] min-h-[20px] bg-[url('/Button_Close.svg')] hover:bg-position-[-20px_0] active:bg-position-[-40px_0]"
          onClick={handleCloseBtnClick}
        />
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;

import React, { useMemo, useEffect } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import * as Types from '@/types';

import * as ipc from '@/main/ipc';

import { editUserStatus, openUserInfo, openFriendVerification, openMemberInvitation, openNetworkDiagnosis, openAboutUs, openChangeTheme, openSystemSetting } from '@/services';

import { useContextMenu } from '@/providers/ContextMenu';
import { useActionScanner } from '@/providers/ActionScanner';

import { useAppSelector } from '@/hooks/useStore';

import MainTabItem from './MainTabItem';

import { DEFAULT_SERVER_AVATAR_URL, DEFAULT_USER_AVATAR_URL, LANGUAGES } from '@/constants';

import ContextMenu from '@/utils/contextMenu';

import styles from './Header.module.css';

interface HeaderProps {
  activeTab: 'home' | 'friends' | 'server';
  isFullscreen: boolean;
  onTabSelect: (tab: 'home' | 'friends' | 'server') => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onUnmaximize: () => void;
  onClose: () => void;
}

const Header: React.FC<HeaderProps> = React.memo(({ activeTab, isFullscreen, onTabSelect, onMinimize, onMaximize, onUnmaximize, onClose }) => {
  const { t } = useTranslation();
  const { showStatusDropdown, showContextMenu, showNotificationMenu } = useContextMenu();
  const { isIdling, isManualIdling, setIsManualIdling } = useActionScanner();

  const userId = useAppSelector((state) => state.user.data.userId);
  const userName = useAppSelector((state) => state.user.data.name);
  const userStatus = useAppSelector((state) => state.user.data.status);
  const currentServerId = useAppSelector((state) => state.currentServer.data.serverId);
  const currentServerName = useAppSelector((state) => state.currentServer.data.name);
  const friendApplications = useAppSelector((state) => state.friendApplications.data, shallowEqual);
  const memberInvitations = useAppSelector((state) => state.memberInvitations.data, shallowEqual);
  const systemNotifications = useAppSelector((state) => state.systemNotifications.data, shallowEqual);

  const hasNotification = !!friendApplications.length || !!memberInvitations.length || !!systemNotifications.length;
  const hasFriendApplication = !!friendApplications.length;
  const hasMemberInvitation = !!memberInvitations.length;
  const hasSystemNotification = !!systemNotifications.length;

  const mainTabs = useMemo(
    () => [
      { id: 'home' as const, label: t('home') },
      { id: 'friends' as const, label: t('friends') },
      { id: 'server' as const, label: currentServerName },
    ],
    [currentServerName, t],
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

  const handleNameClick = () => {
    openUserInfo(userId, userId);
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

    const contextMenu = new ContextMenu()
      .addSystemSettingOption(() => {
        openSystemSetting(userId);
      })
      .addChangeThemeOption(() => {
        openChangeTheme();
      })
      .addFeedbackOption(() => {
        window.open('https://ricecall.com/feedback', '_blank');
      })
      .addLanguageSelectOption({ languages: LANGUAGES }, (code) => {
        if (code) changeLanguage(code);
      })
      .addHelpCenterOption(
        {
          onFaqClick: () => {
            window.open('https://ricecall.com/#faq', '_blank');
          },
          onAgreementClick: () => {
            window.open('https://ricecall.com/terms', '_blank');
          },
          onSpecificationClick: () => {
            window.open('https://ricecall.com/specification', '_blank');
          },
          onContactUsClick: () => {
            window.open('https://ricecall.com/contact', '_blank');
          },
          onAboutUsClick: () => {
            openAboutUs();
          },
        },
        () => {},
      )
      .addNetworkDiagnosisOption(() => {
        openNetworkDiagnosis();
      })
      .addLogoutOption(() => {
        logout();
      })
      .addExitOption(() => {
        exit();
      })
      .build();

    showContextMenu(x + 50, y, 'left-bottom', contextMenu);
  };

  const handleNotificationMenuClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const { left: x, bottom: y } = e.currentTarget.getBoundingClientRect();

    const notificationMenu = [
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
        contents: friendApplications.map((fa) => fa.avatarUrl || DEFAULT_USER_AVATAR_URL),
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
        contents: memberInvitations.map((mi) => mi.avatarUrl || DEFAULT_SERVER_AVATAR_URL),
        onClick: () => openMemberInvitation(),
      },
      {
        id: 'system-notify',
        label: t('system-notify'),
        icon: 'notification',
        show: hasSystemNotification,
        showContentLength: true,
        showContent: false,
        contents: systemNotifications.map((sn) => sn),
        onClick: () => {},
      },
    ];

    showNotificationMenu(x, y, 'right-bottom', notificationMenu);
  };

  useEffect(() => {
    const next = isIdling ? 'idle' : 'online';

    if (userStatus !== next && !isManualIdling) {
      editUserStatus(next);
    }
  }, [isIdling, isManualIdling, userStatus]);

  return (
    <header className={styles['header']}>
      <div className={styles['title-box']}>
        <div className={styles['name-box']} onClick={handleNameClick}>
          {userName}
        </div>
        <div className={styles['status-box']} onClick={handleStatusDropdownClick}>
          <div className={styles['status-display']} datatype={userStatus} />
          <div className={styles['status-triangle']} />
        </div>
      </div>
      <div className={styles['tabs']}>
        {mainTabs.map((tab) => (
          <MainTabItem key={tab.id} tab={tab} currentServerId={currentServerId} isActive={activeTab === tab.id} onSelect={onTabSelect} />
        ))}
      </div>
      <div className={styles['buttons']}>
        <div className={styles['gift-button']} />
        <div className={styles['game-button']} />
        <div className={styles['notice-button']} onClick={handleNotificationMenuClick}>
          <div className={`${styles['notice-overlay']} ${hasNotification && styles['new']}`} />
        </div>
        <div className={styles['splitter']} />
        <div className={styles['menu-button']} onClick={handleMenuClick} />
        <div className={styles['minimize-button']} onClick={onMinimize} />
        {isFullscreen ? <div className={styles['restore-button']} onClick={onUnmaximize} /> : <div className={styles['maxsize-button']} onClick={onMaximize} />}
        <div className={styles['close-button']} onClick={onClose} />
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;

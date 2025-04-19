/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useRef, useState } from 'react';

// CSS
import header from '@/styles/header.module.css';

// Types
import {
  PopupType,
  SocketServerEvent,
  LanguageKey,
  Server,
  User,
  Channel,
} from '@/types';

// Pages
import FriendPage from '@/components/pages/Friend';
import HomePage from '@/components/pages/Home';
import ServerPage from '@/components/pages/Server';

// Components
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Utils
import { createDefault } from '@/utils/createDefault';
import { StandardizedError } from '@/utils/errorHandler';
import { errorHandler } from '@/utils/errorHandler';

// Providers
import WebRTCProvider from '@/providers/WebRTC';
import ExpandedProvider from '@/providers/Expanded';
import { useSocket } from '@/providers/Socket';
import { useLanguage } from '@/providers/Language';
import { useContextMenu } from '@/providers/ContextMenu';
import { useMainTab } from '@/providers/MainTab';

// Services
import ipcService from '@/services/ipc.service';
import authService from '@/services/auth.service';

interface HeaderProps {
  userId: User['userId'];
  userName: User['name'];
  userStatus: User['status'];
  serverId: Server['serverId'];
  serverName: Server['name'];
}

const Header: React.FC<HeaderProps> = React.memo(
  ({ userId, userName, userStatus, serverId, serverName }) => {
    // Hooks
    const socket = useSocket();
    const lang = useLanguage();
    const contextMenu = useContextMenu();
    const mainTab = useMainTab();

    // States
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);

    // Constants
    const MAIN_TABS = [
      { id: 'home', label: lang.tr.home },
      { id: 'friends', label: lang.tr.friends },
      { id: 'server', label: serverName },
    ];
    const STATUS_OPTIONS = [
      { status: 'online', label: lang.tr.online },
      { status: 'dnd', label: lang.tr.dnd },
      { status: 'idle', label: lang.tr.idle },
      { status: 'gn', label: lang.tr.gn },
    ];

    // Handlers
    const handleLeaveServer = (
      userId: User['userId'],
      serverId: Server['serverId'],
    ) => {
      if (!socket) return;
      socket.send.disconnectServer({ userId, serverId });
    };

    const handleUpdateStatus = (
      status: User['status'],
      userId: User['userId'],
    ) => {
      if (!socket) return;
      socket.send.updateUser({ user: { status }, userId });
    };

    const handleLogout = () => {
      authService.logout();
    };

    const handleFullscreen = () => {
      if (isFullscreen) ipcService.window.unmaximize();
      else ipcService.window.maximize();
      setIsFullscreen(!isFullscreen);
    };

    const handleMinimize = () => {
      ipcService.window.minimize();
    };

    const handleClose = () => {
      ipcService.window.close();
    };

    const handleLanguageChange = (language: LanguageKey) => {
      lang.set(language);
      localStorage.setItem('language', language);
    };

    const handleOpenUserSetting = (userId: User['userId']) => {
      const targetId = userId;
      ipcService.popup.open(PopupType.USER_INFO);
      ipcService.initialData.onRequest(PopupType.USER_INFO, {
        userId,
        targetId,
      });
    };

    const handleOpenSystemSetting = () => {
      ipcService.popup.open(PopupType.SYSTEM_SETTING);
      ipcService.initialData.onRequest(PopupType.SYSTEM_SETTING, {});
    };

    return (
      <div className={header['header']}>
        {/* Title */}
        <div className={`${header['titleBox']} ${header['big']}`}></div>
        {/* User Status */}
        <div className={header['userStatus']}>
          <div
            className={header['nameDisplay']}
            onClick={() => handleOpenUserSetting(userId)}
          >
            {userName}
          </div>
          <div
            className={header['statusBox']}
            onClick={() => {
              setShowStatusDropdown(!showStatusDropdown);
            }}
          >
            <div className={header['statusDisplay']} datatype={userStatus} />
            <div className={header['statusTriangle']} />
            <div
              className={`${header['statusDropdown']} ${
                showStatusDropdown ? '' : header['hidden']
              }`}
            >
              {STATUS_OPTIONS.map((option) => (
                <div
                  key={option.status}
                  className={header['option']}
                  datatype={option.status}
                  onClick={() => {
                    handleUpdateStatus(option.status as User['status'], userId);
                    setShowStatusDropdown(false);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        {/* Main Tabs */}
        <div className={header['mainTabs']}>
          {MAIN_TABS.map((Tab) => {
            const TabId = Tab.id;
            const TabLable = Tab.label;
            const TabClose = TabId === 'server';
            if (TabId === 'server' && !serverId) return null;
            return (
              <div
                key={`Tabs-${TabId}`}
                className={`${header['tab']} ${
                  TabId === mainTab.selectedTabId ? header['selected'] : ''
                }`}
                onClick={() =>
                  mainTab.setSelectedTabId(
                    TabId as 'home' | 'friends' | 'server',
                  )
                }
              >
                <div className={header['tabLable']}>{TabLable}</div>
                <div className={header['tabBg']} />
                {TabClose && (
                  <div
                    className={header['tabClose']}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLeaveServer(userId, serverId);
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
        {/* Buttons */}
        <div className={header['buttons']}>
          <div className={header['gift']} />
          <div className={header['game']} />
          <div className={header['notice']} />
          <div className={header['spliter']} />
          <div
            className={header['menu']}
            onClick={(e) =>
              contextMenu.showContextMenu(e.clientX, e.clientY, [
                {
                  id: 'system-setting',
                  label: lang.tr.systemSettings,
                  icon: 'setting',
                  onClick: () => handleOpenSystemSetting(),
                },
                // {
                //   id: 'message-history',
                //   label: lang.tr.messageHistory,
                //   icon: 'message',
                //   onClick: () => {},
                // },
                // {
                //   id: 'change-theme',
                //   label: lang.tr.changeTheme,
                //   icon: 'skin',
                //   onClick: () => {},
                // },
                {
                  id: 'feedback',
                  label: lang.tr.feedback,
                  icon: 'feedback',
                  onClick: () => {
                    window.open(
                      'https://forms.gle/AkBTqsZm9NGr5aH46',
                      '_blank',
                    );
                  },
                },
                {
                  id: 'language-select',
                  label: lang.tr.languageSelect,
                  icon: 'submenu',
                  hasSubmenu: true,
                  submenuItems: [
                    {
                      id: 'language-select-tw',
                      label: '繁體中文',
                      onClick: () => handleLanguageChange('tw'),
                    },
                    {
                      id: 'language-select-cn',
                      label: '簡體中文',
                      onClick: () => handleLanguageChange('cn'),
                    },
                    {
                      id: 'language-select-en',
                      label: 'English',
                      onClick: () => handleLanguageChange('en'),
                    },
                    {
                      id: 'language-select-jp',
                      label: '日本語',
                      onClick: () => handleLanguageChange('jp'),
                    },
                  ],
                },
                {
                  id: 'logout',
                  label: lang.tr.logout,
                  icon: 'logout',
                  onClick: () => handleLogout(),
                },
                {
                  id: 'exit',
                  label: lang.tr.exit,
                  icon: 'exit',
                  onClick: () => handleClose(),
                },
              ])
            }
          />
          <div
            className={header['minimize']}
            onClick={() => handleMinimize()}
          />
          <div
            className={isFullscreen ? header['restore'] : header['maxsize']}
            onClick={() => handleFullscreen()}
          />
          <div className={header['close']} onClick={() => handleClose()} />
        </div>
      </div>
    );
  },
);

Header.displayName = 'Header';

const RootPageComponent = () => {
  // Hooks
  const socket = useSocket();
  const lang = useLanguage();
  const mainTab = useMainTab();

  // Refs
  const joinAudioRef = useRef<HTMLAudioElement>(null);
  joinAudioRef.current = new Audio('./sounds/Yconnect.wav');
  joinAudioRef.current.volume = 0.5;
  const leaveAudioRef = useRef<HTMLAudioElement>(null);
  leaveAudioRef.current = new Audio('./sounds/Ydisconnect.wav');
  leaveAudioRef.current.volume = 0.5;
  const recieveAudioRef = useRef<HTMLAudioElement>(null);
  recieveAudioRef.current = new Audio('./sounds/ReceiveChannelMsg.wav');
  recieveAudioRef.current.volume = 0.5;

  // States
  const [user, setUser] = useState<User>(createDefault.user());
  const [server, setServer] = useState<Server>(createDefault.server());
  const [channel, setChannel] = useState<Channel>(createDefault.channel());

  // Variables
  const { userId, name: userName, status: userStatus } = user;
  const { serverId, name: serverName } = server;

  // Handlers
  const handleUserUpdate = (data: Partial<User> | null) => {
    if (!data) data = createDefault.user();
    setUser((prev) => ({ ...prev, ...data }));
  };

  const handleServerUpdate = (data: Partial<Server> | null) => {
    if (data != null) {
      if (data.serverId) mainTab.setSelectedTabId('server');
    } else {
      mainTab.setSelectedTabId('home');
    }
    if (!data) data = createDefault.server();
    setServer((prev) => ({ ...prev, ...data }));
  };

  const handleCurrentChannelUpdate = (data: Partial<Channel> | null) => {
    if (!data) data = createDefault.channel();
    setChannel((prev) => ({ ...prev, ...data }));
  };

  const handlePlaySound = (sound: string) => {
    switch (sound) {
      case 'leave':
        leaveAudioRef.current?.play();
        break;
      case 'join':
        joinAudioRef.current?.play();
        break;
      case 'recieveChannelMessage':
        recieveAudioRef.current?.play();
        break;
    }
  };

  const handleError = (error: StandardizedError) => {
    new errorHandler(error).show();
  };

  const handleOpenPopup = (data: { type: PopupType; initialData: any }) => {
    ipcService.popup.open(data.type);
    ipcService.initialData.onRequest(data.type, data.initialData);
    ipcService.popup.onSubmit(data.type, () => {
      switch (data.type) {
        case PopupType.DIALOG_ALERT:
          ipcService.auth.logout();
          break;
      }
    });
  };

  // Effects
  useEffect(() => {
    if (!socket) return;

    const eventHandlers = {
      [SocketServerEvent.USER_UPDATE]: handleUserUpdate,
      [SocketServerEvent.SERVER_UPDATE]: handleServerUpdate,
      [SocketServerEvent.CHANNEL_UPDATE]: handleCurrentChannelUpdate,
      [SocketServerEvent.PLAY_SOUND]: handlePlaySound,
      [SocketServerEvent.ERROR]: handleError,
      [SocketServerEvent.OPEN_POPUP]: handleOpenPopup,
    };
    const unsubscribe: (() => void)[] = [];

    Object.entries(eventHandlers).map(([event, handler]) => {
      const unsub = socket.on[event as SocketServerEvent](handler);
      unsubscribe.push(unsub);
    });

    return () => {
      unsubscribe.forEach((unsub) => unsub());
    };
  }, [socket]);

  useEffect(() => {
    if (socket.isConnected) {
      mainTab.setSelectedTabId('home');
    } else {
      mainTab.setSelectedTabId('home');
      setUser(createDefault.user());
      setServer(createDefault.server());
      setChannel(createDefault.channel());
    }
  }, [socket.isConnected]);

  useEffect(() => {
    if (!lang) return;
    const language = localStorage.getItem('language');
    if (language) lang.set(language as LanguageKey);
  }, [lang]);

  const getMainContent = () => {
    if (!socket.isConnected) return <LoadingSpinner />;
    return (
      <>
        <HomePage
          user={user}
          server={server}
          display={mainTab.selectedTabId === 'home'}
        />
        <FriendPage user={user} display={mainTab.selectedTabId === 'friends'} />
        <ExpandedProvider>
          <ServerPage
            user={user}
            server={server}
            channel={channel}
            display={mainTab.selectedTabId === 'server'}
          />
        </ExpandedProvider>
      </>
    );
  };

  return (
    <WebRTCProvider>
      <div className="wrapper">
        <Header
          userId={userId}
          userName={userName}
          userStatus={userStatus}
          serverId={serverId}
          serverName={serverName}
        />
        {/* Main Content */}
        <div className="content">{getMainContent()}</div>
      </div>
    </WebRTCProvider>
  );
};

RootPageComponent.displayName = 'RootPageComponent';

// use dynamic import to disable SSR
const RootPage = dynamic(() => Promise.resolve(RootPageComponent), {
  ssr: false,
});

export default RootPage;

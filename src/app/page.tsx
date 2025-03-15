/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-expressions */
'use client';

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { CircleX } from 'lucide-react';

// CSS
import header from '@/styles/common/header.module.css';

// Types
import { Channel, Server, User, SocketServerEvent, LanguageKey } from '@/types';

// Pages
import FriendPage from '@/components/pages/FriendPage';
import HomePage from '@/components/pages/HomePage';
import ServerPage from '@/components/pages/ServerPage';

// Components
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Utils
import { errorHandler, StandardizedError } from '@/utils/errorHandler';

// Providers
import WebRTCProvider from '@/providers/WebRTCProvider';
import { useSocket } from '@/providers/SocketProvider';
import { useLanguage } from '@/providers/LanguageProvider';

// Services
import { ipcService } from '@/services/ipc.service';
import authService from '@/services/auth.service';

// Redux
import store from '@/redux/store';
import { clearServer, setServer } from '@/redux/serverSlice';
import { clearUser, setUser } from '@/redux/userSlice';
import { clearChannel, setChannel } from '@/redux/channelSlice';

interface HeaderProps {
  selectedId?: number;
  setSelectedTabId?: (tabId: number) => void;
}

const Header: React.FC<HeaderProps> = React.memo(
  ({ selectedId = 1, setSelectedTabId }) => {
    // Redux
    const user = useSelector((state: { user: User }) => state.user);
    const server = useSelector((state: { server: Server }) => state.server);

    // Variables
    const userCurrentServerId = user.currentServerId;
    const userName = user.name;
    const userStatus = user.status;

    // Socket
    const socket = useSocket();

    // Language
    const lang = useLanguage();

    // Fullscreen Control
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Menu Control
    const [showMenu, setShowMenu] = useState(false);

    // Status Dropdown Control
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);

    // Tab Control
    const MAIN_TABS = React.useMemo(() => {
      const tabs = [
        {
          id: 1,
          label: lang.tr.home,
          onClick: () => {},
        },
        {
          id: 2,
          label: lang.tr.friends,
          onClick: () => {},
        },
      ];
      if (server.id) {
        tabs.push({
          id: 3,
          label: server.name,
          onClick: () => {},
        });
      }
      return tabs;
    }, [user, server, lang]);

    // Status Dropdown Control
    const STATUS_OPTIONS = [
      { status: 'online', label: lang.tr.online },
      { status: 'dnd', label: lang.tr.dnd },
      { status: 'idle', label: lang.tr.idle },
      { status: 'gn', label: lang.tr.gn },
    ];

    // Handlers
    const handleLogout = () => {
      store.dispatch(clearChannel());
      store.dispatch(clearServer());
      store.dispatch(clearUser());
      authService.logout();
    };

    const handleLeaveServer = (serverId: string) => {
      socket?.send.disconnectServer({ serverId: serverId });
    };

    const handleUpdateStatus = (status: User['status']) => {
      socket?.send.updateUser({ user: { status } });
    };

    const handleCreateError = (error: StandardizedError) => {
      new errorHandler(error).show();
    };

    const handleFullscreen = () => {
      isFullscreen
        ? ipcService.window.unmaximize()
        : ipcService.window.maximize();
      setIsFullscreen(!isFullscreen);
    };

    const handleMinimize = () => {
      ipcService.window.minimize();
    };

    const handleClose = () => {
      ipcService.window.close();
    };

    const handleOpenDevtool = () => {
      ipcService.window.openDevtool();
    };

    const handleLanguageChange = (language: LanguageKey) => {
      lang.set(language);
    };

    return (
      <div className={header['header']}>
        {/* Title */}
        <div className={`${header['titleBox']} ${header['big']}`}></div>
        {/* User Status */}
        <div className={header['userStatus']}>
          <div className={header['nameDisplay']}>{userName}</div>
          <div
            className={header['statusBox']}
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
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
                    handleUpdateStatus(option.status as User['status']);
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

            return (
              <div
                key={`Tabs-${TabId}`}
                className={`${header['tab']} ${
                  TabId === selectedId ? header['selected'] : ''
                }`}
                onClick={() => {
                  setSelectedTabId?.(TabId);
                  Tab.onClick();
                }}
              >
                <div className={header['tabLable']}>{TabLable}</div>
                <div className={header['tabBg']}></div>
                {TabId > 2 && (
                  <CircleX
                    onClick={() => {
                      handleLeaveServer(userCurrentServerId);
                    }}
                    size={16}
                    className={header['tabClose']}
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
            onClick={() => setShowMenu(!showMenu)}
          >
            <div
              className={`${header['menuDropDown']} ${
                showMenu ? '' : header['hidden']
              }`}
            >
              <div
                className={`${header['option']} ${header['hasImage']}`}
                data-type="system-setting"
                data-key="30066"
                onClick={() => handleOpenDevtool()}
              >
                {lang.tr.systemSettings}
              </div>
              <div
                className={`${header['option']} ${header['hasImage']}`}
                data-type="message-history"
                data-key="30136"
                onClick={() =>
                  handleCreateError(
                    new StandardizedError(
                      '此頁面尚未完工',
                      'NotImplementedError',
                      'Page',
                      'PAGE_NOT_IMPLEMENTED',
                      404,
                    ),
                  )
                }
              >
                {lang.tr.messageHistory}
              </div>
              <div
                className={`${header['option']} ${header['hasImage']}`}
                data-type="change-theme"
                data-key="60028"
              >
                {lang.tr.changeTheme}
              </div>
              <div
                className={header['option']}
                data-type="feed-back"
                data-key="30039"
              >
                {lang.tr.feedback}
              </div>
              <div
                className={`${header['option']} ${header['hasImage']} ${header['hasSubmenu']}`}
                data-type="language-select"
              >
                <span data-key="30374">{lang.tr.languageSelect}</span>
                <div
                  className={`${header['menuDropDown']} ${header['hidden']}`}
                >
                  <div
                    className={header['option']}
                    data-lang="tw"
                    onClick={() => handleLanguageChange('tw')}
                  >
                    繁體中文
                  </div>
                  <div
                    className={header['option']}
                    data-lang="cn"
                    onClick={() => handleLanguageChange('cn')}
                  >
                    简体中文
                  </div>
                  <div
                    className={header['option']}
                    data-lang="en"
                    onClick={() => handleLanguageChange('en')}
                  >
                    English
                  </div>
                  <div
                    className={header['option']}
                    data-lang="jp"
                    onClick={() => handleLanguageChange('jp')}
                  >
                    日本語
                  </div>
                  <div
                    className={header['option']}
                    data-lang="ru"
                    onClick={() => handleLanguageChange('ru')}
                  >
                    русский язык
                  </div>
                </div>
              </div>
              <div
                className={header['option']}
                data-type="logout"
                data-key="30060"
                onClick={() => handleLogout()}
              >
                {lang.tr.logout}
              </div>
              <div
                className={`${header['option']} ${header['hasImage']}`}
                data-type="exit"
                data-key="30061"
                onClick={() => handleClose()}
              >
                {lang.tr.exit}
              </div>
            </div>
          </div>
          <div className={header['minimize']} onClick={handleMinimize} />
          <div
            className={isFullscreen ? header['restore'] : header['maxsize']}
            onClick={handleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          />
          <div className={header['close']} onClick={handleClose} />
        </div>
      </div>
    );
  },
);

Header.displayName = 'Header';

const Home = () => {
  // Socket
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const eventHandlers = {
      [SocketServerEvent.CONNECT]: () => handleConnect,
      [SocketServerEvent.DISCONNECT]: () => handleDisconnect,
      [SocketServerEvent.USER_CONNECT]: handleUserConnect,
      [SocketServerEvent.USER_DISCONNECT]: handleUserDisconnect,
      [SocketServerEvent.USER_UPDATE]: handleUserUpdate,
      [SocketServerEvent.SERVER_CONNECT]: handleServerConnect,
      [SocketServerEvent.SERVER_DISCONNECT]: handleServerDisconnect,
      [SocketServerEvent.SERVER_UPDATE]: handleServerUpdate,
      [SocketServerEvent.CHANNEL_CONNECT]: handleChannelConnect,
      [SocketServerEvent.CHANNEL_DISCONNECT]: handleChannelDisconnect,
      [SocketServerEvent.CHANNEL_UPDATE]: handleChannelUpdate,
      [SocketServerEvent.ERROR]: handleError,
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
    const lang = localStorage.getItem('language');
    if (lang) {
      // Apply the language setting to your application
      // This could involve loading language-specific resources, etc.
      console.log(`Language set to: ${lang}`);
    }
  }, []);

  // Tab Control
  const [selectedTabId, setSelectedTabId] = useState<number>(1);

  // Handlers
  const handleConnect = () => {
    console.log('Socket connected');
  };

  const handleDisconnect = () => {
    console.log('Socket disconnected');
  };

  const handleError = (error: StandardizedError) => {
    new errorHandler(error).show();
  };

  const handleUserConnect = (user: any) => {
    console.log('User connected: ', user);
    store.dispatch(setUser(user));
    setSelectedTabId(1);
  };

  const handleUserDisconnect = () => {
    console.log('User disconnected');
    store.dispatch(clearChannel());
    store.dispatch(clearServer());
    store.dispatch(clearUser());
    authService.logout();
  };

  const handleUserUpdate = (data: Partial<User>) => {
    console.log('User update: ', data);
    store.dispatch(setUser(data));
  };

  const handleServerConnect = (server: Server) => {
    console.log('Server connected: ', server);
    store.dispatch(setServer(server));
    setSelectedTabId(3);
  };

  const handleServerDisconnect = () => {
    console.log('Server disconnected');
    store.dispatch(clearServer());
    setSelectedTabId(1);
  };

  const handleServerUpdate = (data: Partial<Server>) => {
    console.log('Server update: ', data);
    store.dispatch(setServer(data));
  };

  const handleChannelConnect = (channel: Channel) => {
    console.log('Channel connected: ', channel);
    store.dispatch(setChannel(channel));
  };

  const handleChannelDisconnect = () => {
    console.log('Channel disconnected');
    store.dispatch(clearChannel());
  };

  const handleChannelUpdate = (data: Partial<Channel>) => {
    console.log('Channel update: ', data);
    store.dispatch(setChannel(data));
  };

  const getMainContent = () => {
    if (!socket) return <LoadingSpinner />;
    switch (selectedTabId) {
      case 1:
        return <HomePage />;
      case 2:
        return <FriendPage />;
      case 3:
        return <ServerPage />;
    }
  };

  return (
    <div className="wrapper">
      <WebRTCProvider>
        <Header
          selectedId={selectedTabId}
          setSelectedTabId={setSelectedTabId}
        />
        {/* Main Content */}
        <div className="content">{getMainContent()}</div>
      </WebRTCProvider>
    </div>
  );
};

Home.displayName = 'Home';

export default Home;

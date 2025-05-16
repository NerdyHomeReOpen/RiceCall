/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';

// CSS
import header from '@/styles/header.module.css';
import '@/styles/viewers/theme.css';

// Types
import {
  PopupType,
  SocketServerEvent,
  LanguageKey,
  Server,
  User,
  Channel,
  UserServer,
  FriendGroup,
  UserFriend,
  ServerMember,
  ChannelMessage,
} from '@/types';

// Pages
import FriendPage from '@/components/pages/Friend';
import HomePage from '@/components/pages/Home';
import ServerPage from '@/components/pages/Server';

// Components
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Utils
import { createDefault } from '@/utils/createDefault';
import StandardizedError, { errorHandler } from '@/utils/errorHandler';
import {
  THEME_CHANGE_EVENT,
  applyThemeToReactState,
} from '@/utils/themeStorage';

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
import refreshService from '@/services/refresh.service';

// Components
import { SoundEffectPlayer } from '@/components/SoundEffectPlayer';

interface HeaderProps {
  user: User;
  userServer: UserServer;
}

const Header: React.FC<HeaderProps> = React.memo(({ user, userServer }) => {
  // Hooks
  const socket = useSocket();
  const lang = useLanguage();
  const contextMenu = useContextMenu();
  const mainTab = useMainTab();

  // States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [themeClass, setThemeClass] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  const { userId, name: userName, status: userStatus } = user;
  const { serverId, name: serverName } = userServer;

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

  const handleOpenUserSetting = (userId: User['userId']) => {
    const targetId = userId;
    ipcService.popup.open(PopupType.USER_INFO, 'userSetting');
    ipcService.initialData.onRequest('userSetting', { userId, targetId });
  };

  const handleOpenSystemSetting = () => {
    ipcService.popup.open(PopupType.SYSTEM_SETTING, 'systemSetting');
    ipcService.initialData.onRequest('systemSetting', {});
  };

  const handleOpenChangeTheme = () => {
    ipcService.popup.open(PopupType.CHANGE_THEME, 'changeTheme');
    ipcService.initialData.onRequest('changeTheme', {});
  };

  const handleLogout = () => {
    authService.logout();
  };

  const handleExit = () => {
    ipcService.exit();
  };

  const handleFullscreen = () => {
    if (isFullscreen) {
      ipcService.window.unmaximize();
    } else {
      ipcService.window.maximize();
    }
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

  // Effects
  useEffect(() => {
    const offMaximize = ipcService.window.onMaximize(() => {
      setIsFullscreen(true);
    });

    const offUnmaximize = ipcService.window.onUnmaximize(() => {
      setIsFullscreen(false);
    });

    return () => {
      offMaximize();
      offUnmaximize();
    };
  }, []);
  useEffect(() => {
    applyThemeToReactState({
      setThemeClass,
      setBackgroundColor,
      setBackgroundImage,
    });
    const onThemeChange = () => {
      applyThemeToReactState({
        setThemeClass,
        setBackgroundColor,
        setBackgroundImage,
      });
    };
    window.addEventListener(THEME_CHANGE_EVENT, onThemeChange);
    window.addEventListener('storage', onThemeChange);
    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, onThemeChange);
      window.removeEventListener('storage', onThemeChange);
    };
  }, []);

  const headerClassName = [header['header'], themeClass]
    .filter(Boolean)
    .join(' ');

  return (
    <header
      className={headerClassName}
      style={{
        backgroundColor: backgroundColor || undefined,
        backgroundImage: backgroundImage
          ? `url(${backgroundImage})`
          : undefined,
      }}
    >
      {/* Title */}
      <div className={`${header['titleBox']} ${header['big']}`}>
        <div
          className={header['nameBox']}
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
                mainTab.setSelectedTabId(TabId as 'home' | 'friends' | 'server')
              }
            >
              <div className={header['tabLable']}>{TabLable}</div>
              <div className={header['tabBg']} />
              {TabClose && (
                <div
                  className={`${header['tabClose']} themeTabClose`}
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
            contextMenu.showContextMenu(
              e.clientX,
              e.clientY,
              [
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
                {
                  id: 'change-theme',
                  label: lang.tr.changeTheme,
                  icon: 'skin',
                  onClick: () => handleOpenChangeTheme(),
                },
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
                      label: '简体中文',
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
                  onClick: () => handleExit(),
                },
              ],
              e.currentTarget as HTMLElement,
            )
          }
        />
        <div className={header['minimize']} onClick={() => handleMinimize()} />
        <div
          className={isFullscreen ? header['restore'] : header['maxsize']}
          onClick={() => handleFullscreen()}
        />
        <div className={header['close']} onClick={() => handleClose()} />
      </div>
    </header>
  );
});

Header.displayName = 'Header';

const RootPageComponent = () => {
  // Hooks
  const socket = useSocket();
  const lang = useLanguage();
  const mainTab = useMainTab();

  // States
  const [user, setUser] = useState<User>(createDefault.user());
  const [servers, setServers] = useState<UserServer[]>([]);
  const [friends, setFriends] = useState<UserFriend[]>([]);
  const [friendGroups, setFriendGroups] = useState<FriendGroup[]>([]);
  const [server, setServer] = useState<UserServer>(createDefault.userServer());
  const [serverMembers, setServerMembers] = useState<ServerMember[]>([]);
  const [serverChannels, setServerChannels] = useState<Channel[]>([]);
  const [channel, setChannel] = useState<Channel>(createDefault.channel());
  const [channelMessages, setChannelMessages] = useState<ChannelMessage[]>([]);

  // Variables
  const { userId } = user;

  // Handlers
  const handleUserUpdate = (user: Partial<User>) => {
    setUser((prev) => ({ ...prev, ...user }));
  };

  const handleServersSet = (servers: UserServer[]) => {
    setServers(servers);
  };

  const handleServerAdd = (server: UserServer) => {
    setServers((prev) => [...prev, server]);
  };

  const handleServerUpdate = (
    id: UserServer['serverId'],
    server: UserServer,
  ) => {
    setServers((prev) =>
      prev.map((item) =>
        item.serverId === id ? { ...item, ...server } : item,
      ),
    );
  };

  const handleServerDelete = (id: UserServer['serverId']) => {
    setServers((prev) => prev.filter((item) => item.serverId !== id));
  };

  const handleFriendsSet = (friends: UserFriend[]) => {
    setFriends(friends);
  };

  const handleFriendAdd = (friend: UserFriend) => {
    setFriends((prev) => [...prev, friend]);
  };

  const handleFriendUpdate = (
    userId: UserFriend['userId'],
    targetId: UserFriend['targetId'],
    friend: Partial<UserFriend>,
  ) => {
    setFriends((prev) =>
      prev.map((item) =>
        item.userId === userId && item.targetId === targetId
          ? { ...item, ...friend }
          : item,
      ),
    );
  };

  const handleFriendDelete = (
    userId: UserFriend['userId'],
    targetId: UserFriend['targetId'],
  ) => {
    setFriends((prev) =>
      prev.filter(
        (item) => !(item.userId === userId && item.targetId === targetId),
      ),
    );
  };

  const handleFriendGroupsSet = (friendGroups: FriendGroup[]) => {
    setFriendGroups(friendGroups);
  };

  const handleFriendGroupAdd = (friendGroup: FriendGroup) => {
    setFriendGroups((prev) => [...prev, friendGroup]);
  };

  const handleFriendGroupUpdate = (
    id: FriendGroup['friendGroupId'],
    friendGroup: Partial<FriendGroup>,
  ) => {
    setFriendGroups((prev) =>
      prev.map((item) =>
        item.friendGroupId === id ? { ...item, ...friendGroup } : item,
      ),
    );
  };

  const handleFriendGroupDelete = (id: FriendGroup['friendGroupId']) => {
    setFriendGroups((prev) => prev.filter((item) => item.friendGroupId !== id));
  };

  const handleServerMembersSet = (members: ServerMember[]) => {
    setServerMembers(members);
  };

  const handleServerMemberAdd = (member: ServerMember): void => {
    setServerMembers((prev) => [...prev, member]);
  };

  const handleServerMemberUpdate = (
    userId: ServerMember['userId'],
    serverId: ServerMember['serverId'],
    member: Partial<ServerMember>,
  ): void => {
    setServerMembers((prev) =>
      prev.map((item) =>
        item.userId === userId && item.serverId === serverId
          ? { ...item, ...member }
          : item,
      ),
    );
  };

  const handleServerMemberDelete = (
    userId: ServerMember['userId'],
    serverId: ServerMember['serverId'],
  ): void => {
    setServerMembers((prev) =>
      prev.filter(
        (item) => !(item.userId === userId && item.serverId === serverId),
      ),
    );
  };

  const handleServerChannelsSet = (channels: Channel[]) => {
    setServerChannels(channels);
  };

  const handleServerChannelAdd = (channel: Channel): void => {
    setServerChannels((prev) => [...prev, channel]);
  };

  const handleServerChannelUpdate = (
    id: Channel['channelId'],
    channel: Partial<Channel>,
  ): void => {
    setServerChannels((prev) =>
      prev.map((item) =>
        item.channelId === id ? { ...item, ...channel } : item,
      ),
    );
  };

  const handleServerChannelDelete = (id: Channel['channelId']): void => {
    setServerChannels((prev) => prev.filter((item) => item.channelId !== id));
  };

  const handleOnMessages = (...channelMessages: ChannelMessage[]): void => {
    setChannelMessages((prev) => [...prev, ...channelMessages]);
  };

  const handleError = (error: StandardizedError) => {
    new errorHandler(error).show();
  };

  const handleConnectError = () => {
    new errorHandler(
      new StandardizedError({
        name: 'ConnectError',
        message: '連線失敗',
        part: 'SOCKET',
        tag: 'CONNECT_ERROR',
        statusCode: 500,
        handler: () => ipcService.auth.logout(),
      }),
    ).show();
  };

  const handleReconnectError = () => {
    new errorHandler(
      new StandardizedError({
        name: 'ReconnectError',
        message: '重新連線失敗',
        part: 'SOCKET',
        tag: 'RECONNECT_ERROR',
        statusCode: 500,
        handler: () => ipcService.auth.logout(),
      }),
    ).show();
  };

  const handleOpenPopup = (popup: {
    type: PopupType;
    id: string; // FIXME: Server didn't return this
    initialData: any;
  }) => {
    ipcService.popup.open(popup.type, popup.id);
    ipcService.initialData.onRequest(popup.id, popup.initialData);
    ipcService.popup.onSubmit(popup.id, () => {
      switch (popup.id) {
        case 'logout':
          ipcService.auth.logout();
          break;
      }
    });
  };

  // Effects
  useEffect(() => {
    if (user.currentServerId) {
      if (mainTab.selectedTabId === 'home') mainTab.setSelectedTabId('server');
    } else {
      if (mainTab.selectedTabId === 'server') mainTab.setSelectedTabId('home');
    }

    setChannelMessages([]);
  }, [user.currentServerId]);

  useEffect(() => {
    const channel =
      serverChannels.find((item) => item.channelId === user.currentChannelId) ||
      createDefault.channel();
    setChannel(channel);
  }, [user.currentChannelId, serverChannels]);

  useEffect(() => {
    const server =
      servers.find((item) => item.serverId === user.currentServerId) ||
      createDefault.userServer();
    setServer(server);
  }, [user.currentServerId, servers]);

  useEffect(() => {
    if (!socket) return;

    const eventHandlers = {
      [SocketServerEvent.USER_UPDATE]: handleUserUpdate,
      [SocketServerEvent.SERVERS_SET]: handleServersSet,
      [SocketServerEvent.SERVER_ADD]: handleServerAdd,
      [SocketServerEvent.SERVER_UPDATE]: handleServerUpdate,
      [SocketServerEvent.SERVER_DELETE]: handleServerDelete,
      [SocketServerEvent.FRIENDS_SET]: handleFriendsSet,
      [SocketServerEvent.FRIEND_ADD]: handleFriendAdd,
      [SocketServerEvent.FRIEND_UPDATE]: handleFriendUpdate,
      [SocketServerEvent.FRIEND_DELETE]: handleFriendDelete,
      [SocketServerEvent.FRIEND_GROUPS_SET]: handleFriendGroupsSet,
      [SocketServerEvent.FRIEND_GROUP_ADD]: handleFriendGroupAdd,
      [SocketServerEvent.FRIEND_GROUP_UPDATE]: handleFriendGroupUpdate,
      [SocketServerEvent.FRIEND_GROUP_DELETE]: handleFriendGroupDelete,
      [SocketServerEvent.SERVER_ONLINE_MEMBERS_SET]: handleServerMembersSet,
      [SocketServerEvent.SERVER_ONLINE_MEMBER_ADD]: handleServerMemberAdd,
      [SocketServerEvent.SERVER_MEMBER_UPDATE]: handleServerMemberUpdate,
      [SocketServerEvent.SERVER_ONLINE_MEMBER_DELETE]: handleServerMemberDelete,
      [SocketServerEvent.SERVER_CHANNELS_SET]: handleServerChannelsSet,
      [SocketServerEvent.SERVER_CHANNEL_ADD]: handleServerChannelAdd,
      [SocketServerEvent.SERVER_CHANNEL_UPDATE]: handleServerChannelUpdate,
      [SocketServerEvent.SERVER_CHANNEL_DELETE]: handleServerChannelDelete,
      [SocketServerEvent.ON_MESSAGE]: handleOnMessages,
      [SocketServerEvent.OPEN_POPUP]: handleOpenPopup,
      [SocketServerEvent.ERROR]: handleError,
      [SocketServerEvent.CONNECT_ERROR]: handleConnectError,
      [SocketServerEvent.RECONNECT_ERROR]: handleReconnectError,
    };
    const unsubscribe: (() => void)[] = [];

    Object.entries(eventHandlers).forEach(([event, handler]) => {
      const unsub = socket.on[event as SocketServerEvent](handler);
      unsubscribe.push(unsub);
    });

    return () => {
      unsubscribe.forEach((unsub) => unsub());
    };
  }, [socket]);

  useEffect(() => {
    if (!userId) return;
    const refresh = async () => {
      Promise.all([
        refreshService.userServers({
          userId: userId,
        }),
        refreshService.userFriends({
          userId: userId,
        }),
        refreshService.userFriendGroups({
          userId: userId,
        }),
      ]).then(([servers, friends, friendGroups]) => {
        if (servers) {
          setServers(servers);
        }
        if (friends) {
          setFriends(friends);
        }
        if (friendGroups) {
          setFriendGroups(friendGroups);
        }
      });
    };
    refresh();
  }, [userId]);

  useEffect(() => {
    if (socket.isConnected) {
      mainTab.setSelectedTabId('home');
    } else {
      mainTab.setSelectedTabId('home');
      setUser(createDefault.user());
      setServer(createDefault.userServer());
      setChannel(createDefault.channel());
    }
  }, [socket.isConnected]);

  useEffect(() => {
    if (!lang) return;
    const language = localStorage.getItem('language');
    if (language) lang.set(language as LanguageKey);
    localStorage.setItem('pageReloadFlag', 'true');
  }, [lang]);

  const getMainContent = () => {
    if (!socket.isConnected) return <LoadingSpinner />;
    return (
      <>
        <SoundEffectPlayer />
        <HomePage
          user={user}
          servers={servers}
          currentServer={server}
          display={mainTab.selectedTabId === 'home'}
        />
        <FriendPage
          user={user}
          friends={friends}
          friendGroups={friendGroups}
          display={mainTab.selectedTabId === 'friends'}
        />
        <ExpandedProvider>
          <ServerPage
            user={user}
            currentServer={server}
            currentChannel={channel}
            friends={friends}
            serverMembers={serverMembers}
            serverChannels={serverChannels}
            channelMessages={channelMessages}
            display={mainTab.selectedTabId === 'server'}
          />
        </ExpandedProvider>
      </>
    );
  };

  return (
    <WebRTCProvider>
      <div className="wrapper">
        <Header user={user} userServer={server} />
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

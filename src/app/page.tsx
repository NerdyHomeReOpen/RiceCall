/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState, useRef } from 'react';

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
  UserServer,
  FriendGroup,
  UserFriend,
  ServerMember,
  ChannelMessage,
  PromptMessage,
  FriendApplication,
} from '@/types';

// Pages
import FriendPage from '@/components/pages/Friend';
import HomePage from '@/components/pages/Home';
import ServerPage from '@/components/pages/Server';

// Components
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Utils
import Default from '@/utils/default';

// Providers
import WebRTCProvider from '@/providers/WebRTC';
import ExpandedProvider from '@/providers/Expanded';
import { useSocket } from '@/providers/Socket';
import { useLanguage } from '@/providers/Language';
import { useContextMenu } from '@/providers/ContextMenu';
import { useMainTab } from '@/providers/MainTab';
import { useLoading } from '@/providers/Loading';

// Services
import ipcService from '@/services/ipc.service';
import authService from '@/services/auth.service';
import getService from '@/services/get.service';

// Components
import { SoundEffectPlayer } from '@/components/SoundEffectPlayer';

interface HeaderProps {
  user: User;
  userServer: UserServer;
  friendApplications: FriendApplication[];
}

const Header: React.FC<HeaderProps> = React.memo(
  ({ user, userServer, friendApplications }) => {
    // Hooks
    const socket = useSocket();
    const lang = useLanguage();
    const contextMenu = useContextMenu();
    const mainTab = useMainTab();

    // Refs
    const menuRef = useRef<HTMLDivElement>(null);

    // States
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);

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

    const handleChangeStatus = (
      status: User['status'],
      userId: User['userId'],
    ) => {
      if (!socket) return;
      socket.send.editUser({ user: { status }, userId });
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

    const handleOpenAboutUs = () => {
      ipcService.popup.open(PopupType.ABOUTUS, 'aboutUs');
      ipcService.initialData.onRequest('aboutUs', {});
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

    const handleOpenFriendVerification = () => {
      ipcService.popup.open(
        PopupType.FRIEND_VERIFICATION,
        'friendVerification',
      );
      ipcService.initialData.onRequest('friendVerification', { userId });
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

    return (
      <header className={header['header']}>
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
              className={`
                ${header['statusDropdown']}
                ${showStatusDropdown ? '' : header['hidden']}
              `}
            >
              {STATUS_OPTIONS.map((option) => (
                <div
                  key={option.status}
                  className={header['option']}
                  datatype={option.status}
                  onClick={() => {
                    handleChangeStatus(option.status as User['status'], userId);
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
                data-tab-id={TabId}
                className={`
                  ${header['tab']}
                  ${TabId === mainTab.selectedTabId ? header['selected'] : ''}
                `}
                onClick={() =>
                  mainTab.setSelectedTabId(
                    TabId as 'home' | 'friends' | 'server',
                  )
                }
              >
                <div className={header['tabLable']}>{TabLable}</div>
                <div className={header['tabBg']} />
                {TabClose && (
                  <svg
                    className={`${header['tabClose']} themeTabClose`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLeaveServer(userId, serverId);
                    }}
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="12"
                      fill="var(--main-color, rgb(55 144 206))"
                    />
                    <path
                      d="M17 7L7 17M7 7l10 10"
                      stroke="#fff"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
        {/* Buttons */}
        <div className={header['buttons']}>
          <div className={header['gift']} />
          <div className={header['game']} />
          <div
            className={header['notice']}
            onClick={() => {
              handleOpenFriendVerification();
            }}
          >
            <div
              className={`
              ${header['overlay']}
              ${friendApplications.length > 0 ? header['new'] : ''}
            `}
            />
          </div>
          <div className={header['spliter']} />
          <div
            ref={menuRef}
            className={header['menu']}
            onClick={() => {
              if (!menuRef.current) return;
              const x = menuRef.current.getBoundingClientRect().left;
              const y =
                menuRef.current.getBoundingClientRect().top +
                menuRef.current.getBoundingClientRect().height;
              contextMenu.showContextMenu(x, y, false, false, [
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
                  id: 'help-center',
                  label: lang.tr.helpCenter,
                  icon: 'submenu',
                  hasSubmenu: true,
                  submenuItems: [
                    {
                      id: 'faq',
                      label: lang.tr.faq,
                      onClick: () => {
                        window.open('https://ricecall.com.tw/faq', '_blank');
                      },
                    },
                    {
                      id: 'agreement',
                      label: lang.tr.agreement,
                      onClick: () => {
                        window.open(
                          'https://ricecall.com.tw/agreement',
                          '_blank',
                        );
                      },
                    },
                    {
                      id: 'specification',
                      label: lang.tr.specification,
                      onClick: () => {
                        window.open(
                          'https://ricecall.com.tw/specification',
                          '_blank',
                        );
                      },
                    },
                    {
                      id: 'contact-us',
                      label: lang.tr.contactUs,
                      onClick: () => {
                        window.open(
                          'https://ricecall.com.tw/contactus',
                          '_blank',
                        );
                      },
                    },
                    {
                      id: 'about-us',
                      label: lang.tr.aboutUs,
                      onClick: () => handleOpenAboutUs(),
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
              ]);
            }}
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
      </header>
    );
  },
);

Header.displayName = 'Header';

const RootPageComponent = () => {
  // Hooks
  const socket = useSocket();
  const lang = useLanguage();
  const mainTab = useMainTab();
  const loadingBox = useLoading();

  // States
  const [user, setUser] = useState<User>(Default.user());
  const [servers, setServers] = useState<UserServer[]>([]);
  const [friends, setFriends] = useState<UserFriend[]>([]);
  const [friendGroups, setFriendGroups] = useState<FriendGroup[]>([]);
  const [friendApplications, setFriendApplications] = useState<
    FriendApplication[]
  >([]);
  const [server, setServer] = useState<UserServer>(Default.userServer());
  const [serverMembers, setServerMembers] = useState<ServerMember[]>([]);
  const [serverChannels, setServerChannels] = useState<Channel[]>([]);
  const [channel, setChannel] = useState<Channel>(Default.channel());
  const [channelMessages, setChannelMessages] = useState<ChannelMessage[]>([]);
  const [actionMessages, setActionMessages] = useState<PromptMessage[]>([]);

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

  const handleServerRemove = (id: UserServer['serverId']) => {
    setServers((prev) => prev.filter((item) => item.serverId !== id));
  };

  const handleFriendsSet = (friends: UserFriend[]) => {
    setFriends(friends);
  };

  const handleFriendAdd = (friend: UserFriend) => {
    setFriends((prev) => [...prev, friend]);
    setFriendApplications((prev) => {
      return prev.filter((item) => item.senderId !== friend.targetId);
    });
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

  const handleFriendApplicationAdd = (friendApplication: FriendApplication) => {
    setFriendApplications((prev) => [...prev, friendApplication]);
  };

  const handleFriendApplicationRemove = (senderId: User['userId']) => {
    setFriendApplications((prev) =>
      prev.filter((item) => item.senderId !== senderId),
    );
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

  const handleChannelMessage = (...channelMessages: ChannelMessage[]): void => {
    setChannelMessages((prev) => [...prev, ...channelMessages]);
  };

  const handleActionMessage = (...actionMessages: PromptMessage[]): void => {
    setActionMessages((prev) => [...prev, ...actionMessages]);
  };

  const handleOpenPopup = (popup: {
    type: PopupType;
    id: string;
    initialData: any;
    force?: boolean;
  }) => {
    loadingBox.setIsLoading(false);
    loadingBox.setLoadingServerId('');
    
    ipcService.popup.open(popup.type, popup.id, popup.force);
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
      if (mainTab.selectedTabId !== 'server') {
        mainTab.setSelectedTabId('server');
      }
    } else {
      if (mainTab.selectedTabId === 'server') {
        mainTab.setSelectedTabId('home');
      }
    }
    setActionMessages([]);
    setChannelMessages([]);

    loadingBox.setIsLoading(false);
    loadingBox.setLoadingServerId('');
  }, [user.currentServerId]);

  useEffect(() => {
    const channel =
      serverChannels.find((item) => item.channelId === user.currentChannelId) ||
      Default.channel();
    setChannel(channel);
  }, [user.currentChannelId, serverChannels]);

  useEffect(() => {
    const server =
      servers.find((item) => item.serverId === user.currentServerId) ||
      Default.userServer();
    setServer(server);
  }, [user.currentServerId, servers]);

  useEffect(() => {
    if (!socket) return;

    const eventHandlers = {
      [SocketServerEvent.USER_UPDATE]: handleUserUpdate,
      [SocketServerEvent.SERVERS_SET]: handleServersSet,
      [SocketServerEvent.SERVER_ADD]: handleServerAdd,
      [SocketServerEvent.SERVER_UPDATE]: handleServerUpdate,
      [SocketServerEvent.SERVER_REMOVE]: handleServerRemove,
      [SocketServerEvent.FRIENDS_SET]: handleFriendsSet,
      [SocketServerEvent.FRIEND_ADD]: handleFriendAdd,
      [SocketServerEvent.FRIEND_UPDATE]: handleFriendUpdate,
      [SocketServerEvent.FRIEND_REMOVE]: handleFriendDelete,
      [SocketServerEvent.FRIEND_GROUPS_SET]: handleFriendGroupsSet,
      [SocketServerEvent.FRIEND_GROUP_ADD]: handleFriendGroupAdd,
      [SocketServerEvent.FRIEND_GROUP_UPDATE]: handleFriendGroupUpdate,
      [SocketServerEvent.FRIEND_GROUP_REMOVE]: handleFriendGroupDelete,
      [SocketServerEvent.FRIEND_APPLICATION_ADD]: handleFriendApplicationAdd,
      [SocketServerEvent.FRIEND_APPLICATION_REMOVE]:
        handleFriendApplicationRemove,
      [SocketServerEvent.SERVER_ONLINE_MEMBERS_SET]: handleServerMembersSet,
      [SocketServerEvent.SERVER_ONLINE_MEMBER_ADD]: handleServerMemberAdd,
      [SocketServerEvent.SERVER_MEMBER_UPDATE]: handleServerMemberUpdate,
      [SocketServerEvent.SERVER_ONLINE_MEMBER_REMOVE]: handleServerMemberDelete,
      [SocketServerEvent.SERVER_CHANNELS_SET]: handleServerChannelsSet,
      [SocketServerEvent.SERVER_CHANNEL_ADD]: handleServerChannelAdd,
      [SocketServerEvent.SERVER_CHANNEL_UPDATE]: handleServerChannelUpdate,
      [SocketServerEvent.SERVER_CHANNEL_REMOVE]: handleServerChannelDelete,
      [SocketServerEvent.CHANNEL_MESSAGE]: handleChannelMessage,
      [SocketServerEvent.ACTION_MESSAGE]: handleActionMessage,
      [SocketServerEvent.OPEN_POPUP]: handleOpenPopup,
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
        getService.userServers({
          userId: userId,
        }),
        getService.userFriends({
          userId: userId,
        }),
        getService.userFriendGroups({
          userId: userId,
        }),
        getService.userFriendApplications({
          userId: userId,
        }),
      ]).then(([servers, friends, friendGroups, friendApplications]) => {
        if (servers) {
          setServers(servers);
        }
        if (friends) {
          setFriends(friends);
        }
        if (friendGroups) {
          setFriendGroups(friendGroups);
        }
        if (friendApplications) {
          setFriendApplications(friendApplications);
        }
      });
    };
    refresh();
  }, [userId]);

  useEffect(() => {
    if (!socket.isConnected) {
      setUser(Default.user());
      setServer(Default.userServer());
      setChannel(Default.channel());
    }
    mainTab.setSelectedTabId('home');
  }, [socket.isConnected]);

  useEffect(() => {
    const handler = ({ key, newValue }: StorageEvent) => {
      if (key !== 'trigger-handle-server-select' || !newValue) return;
      const { serverDisplayId, serverId } = JSON.parse(newValue);
      if (!serverDisplayId || !serverId) return;

      if (serverId === server.serverId) {
        mainTab.setSelectedTabId('server');
        return;
      }

      loadingBox.setIsLoading(true);
      loadingBox.setLoadingServerId(serverDisplayId);

      setTimeout(() => {
        socket.send.connectServer({ userId, serverId });
      }, loadingBox.loadingTimeStamp);
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [mainTab]);

  // useEffect(() => {
  //   if (!loadingBox.isLoading) return;
  //   if (mainTab.selectedTabId == 'server') {
  //     loadingBox.setIsLoading(false);
  //     loadingBox.setLoadingServerId('');
  //   }
  // }, [loadingBox.isLoading, server, mainTab]);

  useEffect(() => {
    if (!lang) return;
    const language = localStorage.getItem('language');
    if (language) lang.set(language as LanguageKey);
  }, [lang]);

  return (
    <WebRTCProvider>
      <div className="wrapper">
        <Header
          user={user}
          userServer={server}
          friendApplications={friendApplications}
        />
        {/* Main Content */}
        <div className="content">
          {!socket.isConnected ? (
            <LoadingSpinner />
          ) : (
            <>
              <SoundEffectPlayer />
              <HomePage
                user={user}
                servers={servers}
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
                  actionMessages={actionMessages}
                  display={mainTab.selectedTabId === 'server'}
                />
              </ExpandedProvider>
            </>
          )}
        </div>
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

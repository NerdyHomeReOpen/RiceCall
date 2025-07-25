/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState, useRef } from 'react';

// CSS
import header from '@/styles/header.module.css';

// Types
import { PopupType, SocketServerEvent, Server, User, Channel, UserServer, FriendGroup, UserFriend, ServerMember, ChannelMessage, PromptMessage, FriendApplication, RecommendedServers } from '@/types';

// i18n
import i18n, { LanguageKey } from '@/i18n';

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
import ExpandedProvider from '@/providers/FindMe';
import { useTranslation } from 'react-i18next';
import { useSocket } from '@/providers/Socket';
import { useContextMenu } from '@/providers/ContextMenu';
import { useMainTab } from '@/providers/MainTab';
import { useLoading } from '@/providers/Loading';
import { useSoundPlayer } from '@/providers/SoundPlayer';

// Services
import ipcService from '@/services/ipc.service';
import authService from '@/services/auth.service';
import getService from '@/services/get.service';

interface HeaderProps {
  user: User;
  userServer: UserServer;
  friendApplications: FriendApplication[];
}

const Header: React.FC<HeaderProps> = React.memo(({ user, userServer, friendApplications }) => {
  // Hooks
  const socket = useSocket();
  const contextMenu = useContextMenu();
  const mainTab = useMainTab();
  const { t } = useTranslation();

  // Refs
  const menuRef = useRef<HTMLDivElement>(null);

  // States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const { userId, name: userName, status: userStatus } = user;
  const { serverId, name: serverName } = userServer;

  // Constants
  const MAIN_TABS = [
    { id: 'home', label: t('home') },
    { id: 'friends', label: t('friends') },
    { id: 'server', label: serverName },
  ];
  const STATUS_OPTIONS = [
    { status: 'online', label: t('online') },
    { status: 'dnd', label: t('dnd') },
    { status: 'idle', label: t('idle') },
    { status: 'gn', label: t('gn') },
  ];

  // Handlers
  const handleLeaveServer = (userId: User['userId'], serverId: Server['serverId']) => {
    if (!socket) return;
    socket.send.disconnectServer({ userId, serverId });
  };

  const handleChangeStatus = (status: User['status'], userId: User['userId']) => {
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
    i18n.changeLanguage(language);
    localStorage.setItem('language', language);
  };

  const handleOpenFriendVerification = () => {
    ipcService.popup.open(PopupType.FRIEND_VERIFICATION, 'friendVerification');
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
    <header className={`${header['header']} ${header['big']}`}>
      {/* Title */}
      <div className={header['title-box']}>
        <div className={header['name-box']} onClick={() => handleOpenUserSetting(userId)}>
          {userName}
        </div>
        <div
          className={header['status-box']}
          onClick={() => {
            setShowStatusDropdown(!showStatusDropdown);
          }}
        >
          <div className={header['status-display']} datatype={userStatus} />
          <div className={header['status-triangle']} />
          <div
            className={`
                ${header['status-dropdown']}
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
      <div className={header['main-tabs']}>
        {MAIN_TABS.map((Tab) => {
          const TabId = Tab.id;
          const TabLable = Tab.label;
          const TabClose = TabId === 'server';
          if (TabId === 'server' && !serverId) return null;
          return (
            <div
              key={`Tabs-${TabId}`}
              data-tab-id={TabId}
              className={`${header['tab']} ${TabId === mainTab.selectedTabId ? header['selected'] : ''}`}
              onClick={() => mainTab.setSelectedTabId(TabId as 'home' | 'friends' | 'server')}
            >
              <div className={header['tab-lable']}>{TabLable}</div>
              <div className={header['tab-bg']} />
              {TabClose && (
                <svg
                  className={`${header['tab-close']} themeTabClose`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLeaveServer(userId, serverId);
                  }}
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="12" fill="var(--main-color, rgb(55 144 206))" />
                  <path d="M17 7L7 17M7 7l10 10" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
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
            const y = menuRef.current.getBoundingClientRect().top + menuRef.current.getBoundingClientRect().height;
            contextMenu.showContextMenu(x, y, false, false, [
              {
                id: 'system-setting',
                label: t('system-setting'),
                icon: 'setting',
                onClick: () => handleOpenSystemSetting(),
              },
              {
                id: 'change-theme',
                label: t('change-theme'),
                icon: 'skin',
                onClick: () => handleOpenChangeTheme(),
              },
              {
                id: 'feedback',
                label: t('feedback'),
                icon: 'feedback',
                onClick: () => {
                  window.open('https://forms.gle/AkBTqsZm9NGr5aH46', '_blank');
                },
              },
              {
                id: 'language-select',
                label: t('language-select'),
                icon: 'submenu',
                hasSubmenu: true,
                submenuItems: [
                  {
                    id: 'language-select-tw',
                    label: '繁體中文',
                    onClick: () => handleLanguageChange('zh-TW'),
                  },
                  {
                    id: 'language-select-cn',
                    label: '简体中文',
                    onClick: () => handleLanguageChange('zh-CN'),
                  },
                  {
                    id: 'language-select-en',
                    label: 'English',
                    onClick: () => handleLanguageChange('en'),
                  },
                  {
                    id: 'language-select-jp',
                    label: '日本語',
                    onClick: () => handleLanguageChange('ja'),
                  },
                  {
                    id: 'language-select-fa',
                    label: 'فارسی',
                    onClick: () => handleLanguageChange('fa'),
                  },
                  {
                    id: 'language-select-br',
                    label: 'Português',
                    onClick: () => handleLanguageChange('pt-BR'),
                  },
                  {
                    id: 'language-select-ru',
                    label: 'Русский',
                    onClick: () => handleLanguageChange('ru'),
                  },
                  {
                    id: 'language-select-es',
                    label: 'Español',
                    onClick: () => handleLanguageChange('es-ES'),
                  },
                ],
              },
              {
                id: 'help-center',
                label: t('help-center'),
                icon: 'submenu',
                hasSubmenu: true,
                submenuItems: [
                  {
                    id: 'faq',
                    label: t('faq'),
                    onClick: () => {
                      window.open('https://ricecall.com.tw/faq', '_blank');
                    },
                  },
                  {
                    id: 'agreement',
                    label: t('agreement'),
                    onClick: () => {
                      window.open('https://ricecall.com.tw/agreement', '_blank');
                    },
                  },
                  {
                    id: 'specification',
                    label: t('specification'),
                    onClick: () => {
                      window.open('https://ricecall.com.tw/specification', '_blank');
                    },
                  },
                  {
                    id: 'contact-us',
                    label: t('contact-us'),
                    onClick: () => {
                      window.open('https://ricecall.com.tw/contactus', '_blank');
                    },
                  },
                  {
                    id: 'about-us',
                    label: t('about-ricecall'),
                    onClick: () => handleOpenAboutUs(),
                  },
                ],
              },
              {
                id: 'logout',
                label: t('logout'),
                icon: 'logout',
                onClick: () => handleLogout(),
              },
              {
                id: 'exit',
                label: t('exit'),
                icon: 'exit',
                onClick: () => handleExit(),
              },
            ]);
          }}
        />
        <div className={header['minimize']} onClick={() => handleMinimize()} />
        <div className={isFullscreen ? header['restore'] : header['maxsize']} onClick={() => handleFullscreen()} />
        <div className={header['close']} onClick={() => handleClose()} />
      </div>
    </header>
  );
});

Header.displayName = 'Header';

const RootPageComponent = () => {
  // Hooks
  const socket = useSocket();
  const mainTab = useMainTab();
  const loadingBox = useLoading();
  const soundPlayer = useSoundPlayer();

  // States
  const [user, setUser] = useState<User>(Default.user());
  const [servers, setServers] = useState<UserServer[]>([]);
  const [recommendedServers, setRecommendedServers] = useState<RecommendedServers>({});
  const [friends, setFriends] = useState<UserFriend[]>([]);
  const [friendGroups, setFriendGroups] = useState<FriendGroup[]>([]);
  const [friendApplications, setFriendApplications] = useState<FriendApplication[]>([]);
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

  const handleServerUpdate = (id: UserServer['serverId'], server: UserServer) => {
    setServers((prev) => prev.map((item) => (item.serverId === id ? { ...item, ...server } : item)));
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

  const handleFriendUpdate = (userId: UserFriend['userId'], targetId: UserFriend['targetId'], friend: Partial<UserFriend>) => {
    setFriends((prev) => prev.map((item) => (item.userId === userId && item.targetId === targetId ? { ...item, ...friend } : item)));
  };

  const handleFriendDelete = (userId: UserFriend['userId'], targetId: UserFriend['targetId']) => {
    setFriends((prev) => prev.filter((item) => !(item.userId === userId && item.targetId === targetId)));
  };

  const handleFriendGroupsSet = (friendGroups: FriendGroup[]) => {
    setFriendGroups(friendGroups);
  };

  const handleFriendGroupAdd = (friendGroup: FriendGroup) => {
    setFriendGroups((prev) => [...prev, friendGroup]);
  };

  const handleFriendGroupUpdate = (id: FriendGroup['friendGroupId'], friendGroup: Partial<FriendGroup>) => {
    setFriendGroups((prev) => prev.map((item) => (item.friendGroupId === id ? { ...item, ...friendGroup } : item)));
  };

  const handleFriendGroupDelete = (id: FriendGroup['friendGroupId']) => {
    setFriendGroups((prev) => prev.filter((item) => item.friendGroupId !== id));
  };

  const handleFriendApplicationAdd = (friendApplication: FriendApplication) => {
    setFriendApplications((prev) => [...prev, friendApplication]);
  };

  const handleFriendApplicationRemove = (senderId: User['userId']) => {
    setFriendApplications((prev) => prev.filter((item) => item.senderId !== senderId));
  };

  const handleServerMembersSet = (members: ServerMember[]) => {
    setServerMembers(members);
  };

  const handleServerMemberAdd = (member: ServerMember): void => {
    setServerMembers((prev) => {
      const index = prev.findIndex((m) => m.userId === member.userId);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = { ...updated[index], ...member };
        return updated;
      } else {
        return [...prev, member];
      }
    });
  };

  const handleServerMemberUpdate = (userId: ServerMember['userId'], serverId: ServerMember['serverId'], member: Partial<ServerMember>): void => {
    setServerMembers((prev) => prev.map((item) => (item.userId === userId && item.serverId === serverId ? { ...item, ...member } : item)));
  };

  const handleServerMemberDelete = (userId: ServerMember['userId'], serverId: ServerMember['serverId']): void => {
    setServerMembers((prev) => prev.filter((item) => !(item.userId === userId && item.serverId === serverId)));
  };

  const handleServerChannelsSet = (channels: Channel[]) => {
    setServerChannels(channels);
  };

  const handleServerChannelAdd = (channel: Channel): void => {
    setServerChannels((prev) => [...prev, channel]);
  };

  const handleServerChannelUpdate = (id: Channel['channelId'], channel: Partial<Channel>): void => {
    setServerChannels((prev) => prev.map((item) => (item.channelId === id ? { ...item, ...channel } : item)));
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

  const handlePlaySound = (sound: 'enterVoiceChannel' | 'leaveVoiceChannel' | 'receiveChannelMessage' | 'receiveDirectMessage' | 'startSpeaking' | 'stopSpeaking') => {
    soundPlayer.playSound(sound);
  };

  const handleOpenPopup = (popup: { type: PopupType; id: string; initialData: any; force?: boolean }) => {
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
    const channel = serverChannels.find((item) => item.channelId === user.currentChannelId) || Default.channel();
    setChannel(channel);
  }, [user.currentChannelId, serverChannels]);

  useEffect(() => {
    const server = servers.find((item) => item.serverId === user.currentServerId) || Default.userServer();
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
      [SocketServerEvent.FRIEND_APPLICATION_REMOVE]: handleFriendApplicationRemove,
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
      [SocketServerEvent.PLAY_SOUND]: handlePlaySound,
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
    loadingBox.setIsLoading(false);
    loadingBox.setLoadingServerId('');
  }, [socket.hasError]);

  useEffect(() => {
    if (!userId) return;
    const refresh = async () => {
      getService.userServers({ userId: userId }).then((servers) => {
        if (servers) setServers(servers);
      });
      getService.userFriends({ userId: userId }).then((friends) => {
        if (friends) setFriends(friends);
      });
      getService.userFriendGroups({ userId: userId }).then((friendGroups) => {
        if (friendGroups) setFriendGroups(friendGroups);
      });
      getService.userFriendApplications({ userId: userId }).then((friendApplications) => {
        if (friendApplications) setFriendApplications(friendApplications);
      });
      // getService.recommendedServers().then((recommendedServers) => {
      //   if (recommendedServers) setRecommendedServers(recommendedServers);
      // });
      setRecommendedServers({});
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

      if (loadingBox.isLoading) return;

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
  }, [user, mainTab, loadingBox.isLoading]);

  return (
    <WebRTCProvider>
      <ExpandedProvider>
        <Header user={user} userServer={server} friendApplications={friendApplications} />
        {!socket.isConnected ? (
          <LoadingSpinner />
        ) : (
          <>
            <HomePage user={user} servers={servers} recommendedServers={recommendedServers} display={mainTab.selectedTabId === 'home'} />
            <FriendPage user={user} friends={friends} friendGroups={friendGroups} display={mainTab.selectedTabId === 'friends'} />
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
          </>
        )}
      </ExpandedProvider>
    </WebRTCProvider>
  );
};

RootPageComponent.displayName = 'RootPageComponent';

// use dynamic import to disable SSR
const RootPage = dynamic(() => Promise.resolve(RootPageComponent), {
  ssr: false,
});

export default RootPage;

/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState, useRef } from 'react';

// CSS
import header from '@/styles/header.module.css';

// Types
import type { PopupType, Server, User, Channel, FriendGroup, ChannelMessage, PromptMessage, FriendApplication, RecommendServerList, Friend, Member, QueueMember } from '@/types';

// i18n
import i18n, { LanguageKey, LANGUAGES } from '@/i18n';

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
import ActionScannerProvider, { useActionScanner } from '@/providers/ActionScanner';
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
  currentServer: Server;
  friendApplications: FriendApplication[];
}

const Header: React.FC<HeaderProps> = React.memo(({ user, currentServer, friendApplications }) => {
  // Hooks
  const contextMenu = useContextMenu();
  const mainTab = useMainTab();
  const { t } = useTranslation();
  const actionScanner = useActionScanner();

  // Refs
  const menuRef = useRef<HTMLDivElement>(null);
  const isCloseToTray = useRef<boolean>(true);

  // States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const { userId, name: userName, status: userStatus } = user;
  const { serverId, name: serverName } = currentServer;

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
  const handleLeaveServer = (serverId: Server['serverId']) => {
    ipcService.socket.send('disconnectServer', { serverId });
  };

  const handleChangeStatus = (status: User['status']) => {
    ipcService.socket.send('editUser', { update: { status } });
  };

  const handleOpenUserSetting = (userId: User['userId']) => {
    ipcService.popup.open('userInfo', 'userSetting', { userId, targetId: userId });
  };

  const handleOpenSystemSetting = () => {
    ipcService.popup.open('systemSetting', 'systemSetting', {});
  };

  const handleOpenAboutUs = () => {
    ipcService.popup.open('aboutus', 'aboutUs', {});
  };

  const handleOpenChangeTheme = () => {
    ipcService.popup.open('changeTheme', 'changeTheme', {});
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
    if (isCloseToTray.current) {
      ipcService.window.close();
    } else {
      ipcService.exit();
    }
  };

  const handleLanguageChange = (language: LanguageKey) => {
    i18n.changeLanguage(language);
    localStorage.setItem('language', language);
  };

  const handleOpenFriendVerification = () => {
    ipcService.popup.open('friendVerification', 'friendVerification', { userId });
  };

  // Effects
  useEffect(() => {
    const unsubscribe: (() => void)[] = [
      ipcService.systemSettings.closeToTray.get((enable) => {
        isCloseToTray.current = enable;
      }),
    ];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, []);

  useEffect(() => {
    if (!actionScanner.isKeepAlive) {
      handleChangeStatus('idle' as User['status']);
    } else {
      handleChangeStatus('online' as User['status']);
    }
  }, [actionScanner.isKeepAlive]);

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
                  handleChangeStatus(option.status as User['status']);
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
                    handleLeaveServer(serverId);
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
                submenuItems: LANGUAGES.map((language) => ({
                  id: `language-select-${language.code}`,
                  label: language.label,
                  onClick: () => handleLanguageChange(language.code),
                })),
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
  const mainTab = useMainTab();
  const loadingBox = useLoading();
  const soundPlayer = useSoundPlayer();
  const socket = useSocket();

  // States
  const [user, setUser] = useState<User>(Default.user());
  const [servers, setServers] = useState<Server[]>([]);
  const [recommendServerList, setRecommendServerList] = useState<RecommendServerList>({});
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendGroups, setFriendGroups] = useState<FriendGroup[]>([]);
  const [friendApplications, setFriendApplications] = useState<FriendApplication[]>([]);
  const [server, setServer] = useState<Server>(Default.server());
  const [serverMembers, setServerMembers] = useState<Member[]>([]);
  const [serverChannels, setServerChannels] = useState<Channel[]>([]);
  const [channel, setChannel] = useState<Channel>(Default.channel());
  const [channelMessages, setChannelMessages] = useState<ChannelMessage[]>([]);
  const [actionMessages, setActionMessages] = useState<PromptMessage[]>([]);
  const [queueMembers, setQueueMembers] = useState<QueueMember[]>([]);

  // Variables
  const { userId } = user;

  // Handlers
  const handleUserUpdate = (...args: { update: Partial<User> }[]) => {
    setUser((prev) => ({ ...prev, ...args[0].update }));
  };

  const handleServersSet = (...args: Server[]) => {
    setServers(args);
  };

  const handleServerAdd = (...args: { data: Server }[]) => {
    args.forEach((item) => {
      setServers((prev) => [...prev, item.data]);
    });
  };

  const handleServerUpdate = (...args: { serverId: string; update: Partial<Server> }[]) => {
    args.forEach((item) => {
      setServers((prev) => prev.map((server) => (server.serverId === item.serverId ? { ...server, ...item.update } : server)));
    });
  };

  const handleServerRemove = (...args: { serverId: string }[]) => {
    args.forEach((item) => {
      setServers((prev) => prev.filter((server) => server.serverId !== item.serverId));
    });
  };

  const handleFriendsSet = (...args: Friend[]) => {
    setFriends(args);
  };

  const handleFriendAdd = (...args: { data: Friend }[]) => {
    args.forEach((item) => {
      setFriends((prev) => [...prev, item.data]);
    });
  };

  const handleFriendUpdate = (...args: { targetId: string; update: Partial<Friend> }[]) => {
    args.forEach((item) => {
      setFriends((prev) => prev.map((friend) => (friend.targetId === item.targetId ? { ...friend, ...item.update } : friend)));
    });
  };

  const handleFriendDelete = (...args: { targetId: string }[]) => {
    args.forEach((item) => {
      setFriends((prev) => prev.filter((friend) => friend.targetId !== item.targetId));
    });
  };

  const handleFriendGroupsSet = (...args: FriendGroup[]) => {
    setFriendGroups(args);
  };

  const handleFriendGroupAdd = (...args: { data: FriendGroup }[]) => {
    args.forEach((item) => {
      setFriendGroups((prev) => [...prev, item.data]);
    });
  };

  const handleFriendGroupUpdate = (...args: { friendGroupId: string; update: Partial<FriendGroup> }[]) => {
    args.forEach((item) => {
      setFriendGroups((prev) => prev.map((friendGroup) => (friendGroup.friendGroupId === item.friendGroupId ? { ...friendGroup, ...item.update } : friendGroup)));
    });
  };

  const handleFriendGroupDelete = (...args: { friendGroupId: string }[]) => {
    args.forEach((item) => {
      setFriendGroups((prev) => prev.filter((friendGroup) => friendGroup.friendGroupId !== item.friendGroupId));
    });
  };

  const handleFriendApplicationAdd = (...args: { data: FriendApplication }[]) => {
    args.forEach((item) => {
      setFriendApplications((prev) => [...prev, item.data]);
    });
  };

  const handleFriendApplicationRemove = (...args: { senderId: string }[]) => {
    args.forEach((item) => {
      setFriendApplications((prev) => prev.filter((friendApplication) => friendApplication.senderId !== item.senderId));
    });
  };

  const handleServerMembersSet = (...args: Member[]) => {
    setServerMembers(args);
  };

  const handleServerMemberAdd = (...args: { data: Member }[]) => {
    args.forEach((item) => {
      setServerMembers((prev) => [...prev, item.data]);
    });
  };

  const handleServerMemberUpdate = (...args: { userId: string; serverId: string; update: Partial<Member> }[]) => {
    args.forEach((item) => {
      setServerMembers((prev) => prev.map((member) => (member.userId === item.userId && member.serverId === item.serverId ? { ...member, ...item.update } : member)));
    });
  };

  const handleServerMemberDelete = (...args: { userId: string; serverId: string }[]) => {
    args.forEach((item) => {
      setServerMembers((prev) => prev.filter((member) => !(member.userId === item.userId && member.serverId === item.serverId)));
    });
  };

  const handleServerChannelsSet = (...args: Channel[]) => {
    setServerChannels(args);
  };

  const handleServerChannelAdd = (...args: { data: Channel }[]) => {
    args.forEach((item) => {
      setServerChannels((prev) => [...prev, item.data]);
    });
  };

  const handleServerChannelUpdate = (...args: { channelId: string; update: Partial<Channel> }[]) => {
    args.forEach((item) => {
      setServerChannels((prev) => prev.map((channel) => (channel.channelId === item.channelId ? { ...channel, ...item.update } : channel)));
    });
  };

  const handleServerChannelDelete = (...args: { channelId: string }[]) => {
    args.forEach((item) => {
      setServerChannels((prev) => prev.filter((channel) => channel.channelId !== item.channelId));
    });
  };

  const handleChannelMessage = (...args: ChannelMessage[]) => {
    args.forEach((item) => {
      setChannelMessages((prev) => [...prev, item]);
    });
  };

  const handleActionMessage = (...args: PromptMessage[]) => {
    args.forEach((item) => {
      setActionMessages((prev) => [...prev, item]);
    });
  };

  const handleQueueMembersSet = (...args: QueueMember[]) => {
    setQueueMembers(args);
  };

  const handlePlaySound = (...args: ('enterVoiceChannel' | 'leaveVoiceChannel' | 'receiveChannelMessage' | 'receiveDirectMessage' | 'startSpeaking' | 'stopSpeaking')[]) => {
    args.forEach((item) => {
      soundPlayer.playSound(item);
    });
  };

  const handleOpenPopup = (...args: { type: PopupType; id: string; initialData?: unknown; force?: boolean }[]) => {
    args.forEach((item) => {
      loadingBox.setIsLoading(false);
      loadingBox.setLoadingServerId('');
      ipcService.popup.open(item.type, item.id, item.initialData, item.force);
      ipcService.popup.onSubmit(item.id, () => {
        switch (item.id) {
          case 'logout':
            ipcService.auth.logout();
            break;
        }
      });
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
    const server = servers.find((item) => item.serverId === user.currentServerId) || Default.server();
    setServer(server);
  }, [user.currentServerId, servers]);

  useEffect(() => {
    const unsubscribe: (() => void)[] = [
      ipcService.socket.on('userUpdate', handleUserUpdate),
      ipcService.socket.on('serversSet', handleServersSet),
      ipcService.socket.on('serverAdd', handleServerAdd),
      ipcService.socket.on('serverUpdate', handleServerUpdate),
      ipcService.socket.on('serverRemove', handleServerRemove),
      ipcService.socket.on('friendsSet', handleFriendsSet),
      ipcService.socket.on('friendAdd', handleFriendAdd),
      ipcService.socket.on('friendUpdate', handleFriendUpdate),
      ipcService.socket.on('friendRemove', handleFriendDelete),
      ipcService.socket.on('friendGroupsSet', handleFriendGroupsSet),
      ipcService.socket.on('friendGroupAdd', handleFriendGroupAdd),
      ipcService.socket.on('friendGroupUpdate', handleFriendGroupUpdate),
      ipcService.socket.on('friendGroupRemove', handleFriendGroupDelete),
      ipcService.socket.on('friendApplicationAdd', handleFriendApplicationAdd),
      ipcService.socket.on('friendApplicationRemove', handleFriendApplicationRemove),
      ipcService.socket.on('serverOnlineMembersSet', handleServerMembersSet),
      ipcService.socket.on('serverOnlineMemberAdd', handleServerMemberAdd),
      ipcService.socket.on('serverMemberUpdate', handleServerMemberUpdate),
      ipcService.socket.on('serverOnlineMemberRemove', handleServerMemberDelete),
      ipcService.socket.on('serverChannelsSet', handleServerChannelsSet),
      ipcService.socket.on('serverChannelAdd', handleServerChannelAdd),
      ipcService.socket.on('serverChannelUpdate', handleServerChannelUpdate),
      ipcService.socket.on('serverChannelRemove', handleServerChannelDelete),
      ipcService.socket.on('channelMessage', handleChannelMessage),
      ipcService.socket.on('actionMessage', handleActionMessage),
      ipcService.socket.on('openPopup', handleOpenPopup),
      ipcService.socket.on('playSound', handlePlaySound),
      ipcService.socket.on('queueMembersSet', handleQueueMembersSet),
      // ipcService.socket.on('connect', handleConnect),
      // ipcService.socket.on('reconnect', handleReconnect),
      // ipcService.socket.on('disconnect', handleDisconnect),
      // ipcService.socket.on('error', handleError),
      // ipcService.socket.on('connect_error', handleConnectError),
      // ipcService.socket.on('reconnect_error', handleReconnectError),
    ];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, [socket.isConnected]);

  useEffect(() => {
    loadingBox.setIsLoading(false);
    loadingBox.setLoadingServerId('');
  }, [socket.isConnected]);

  useEffect(() => {
    if (!userId) return;
    const refresh = async () => {
      getService.servers({ userId: userId }).then((servers) => {
        if (servers) setServers(servers);
      });
      getService.friends({ userId: userId }).then((friends) => {
        if (friends) setFriends(friends);
      });
      getService.friendGroups({ userId: userId }).then((friendGroups) => {
        if (friendGroups) setFriendGroups(friendGroups);
      });
      getService.friendApplications({ receiverId: userId }).then((friendApplications) => {
        if (friendApplications) setFriendApplications(friendApplications);
      });
      getService.recommendServerList().then((recommendServerList) => {
        if (recommendServerList) setRecommendServerList(recommendServerList);
      });
    };
    refresh();
  }, [userId]);

  useEffect(() => {
    if (!socket.isConnected) {
      setUser(Default.user());
      setServer(Default.server());
      setChannel(Default.channel());
    }
    mainTab.setSelectedTabId('home');
  }, [socket.isConnected]);

  useEffect(() => {
    const handler = ({ key, newValue }: StorageEvent) => {
      if (key !== 'trigger-handle-server-select' || !newValue) return;
      const { serverDisplayId, serverId } = JSON.parse(newValue);
      if (loadingBox.isLoading || !serverDisplayId || !serverId) return;

      if (serverId === server.serverId) {
        mainTab.setSelectedTabId('server');
        return;
      }

      loadingBox.setIsLoading(true);
      loadingBox.setLoadingServerId(serverDisplayId);
      ipcService.socket.send('connectServer', { serverId });
    };

    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [user, mainTab, loadingBox.isLoading]);

  return (
    <WebRTCProvider userId={userId}>
      <ActionScannerProvider>
        <ExpandedProvider>
          <Header user={user} currentServer={server} friendApplications={friendApplications} />
          {!socket.isConnected ? (
            <LoadingSpinner />
          ) : (
            <>
              <HomePage user={user} servers={servers} recommendServerList={recommendServerList} display={mainTab.selectedTabId === 'home'} />
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
                queueMembers={queueMembers}
                display={mainTab.selectedTabId === 'server'}
              />
            </>
          )}
        </ExpandedProvider>
      </ActionScannerProvider>
    </WebRTCProvider>
  );
};

RootPageComponent.displayName = 'RootPageComponent';

// use dynamic import to disable SSR
const RootPage = dynamic(() => Promise.resolve(RootPageComponent), {
  ssr: false,
});

export default RootPage;

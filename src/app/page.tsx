'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState, useRef, useMemo } from 'react';

// CSS
import header from '@/styles/header.module.css';

// Types
import type {
  PopupType,
  Server,
  User,
  Channel,
  FriendGroup,
  ChannelMessage,
  PromptMessage,
  FriendApplication,
  MemberInvitation,
  Announcement,
  Friend,
  OnlineMember,
  MemberApplication,
  QueueUser,
  Notify,
  RecommendServer,
  FriendActivity,
  ChannelEvent,
  LanguageKey,
} from '@/types';

// Pages
import FriendPage from '@/pages/Friend';
import HomePage from '@/pages/Home';
import ServerPage from '@/pages/Server';

// Components
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NotifyToaster from '@/components/NotifyToaster';

// Utils
import { handleOpenUserInfo, handleOpenSystemSetting, handleOpenAboutUs, handleOpenChangeTheme, handleOpenFriendVerification, handleOpenMemberInvitation, handleOpenErrorDialog } from '@/utils/popup';
import Default from '@/utils/default';

// Providers
import WebRTCProvider from '@/providers/WebRTC';
import ActionScannerProvider from '@/providers/ActionScanner';
import ExpandedProvider from '@/providers/FindMe';
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';
import { useMainTab } from '@/providers/MainTab';
import { useLoading } from '@/providers/Loading';
import { useSoundPlayer } from '@/providers/SoundPlayer';

// Services
import ipc from '@/services/ipc.service';

// Constants
import { LANGUAGES } from '@/constant';

interface HeaderProps {
  user: User;
  currentServer: Server;
  friendApplications: FriendApplication[];
  memberInvitations: MemberInvitation[];
  systemNotify: string[];
}

const Header: React.FC<HeaderProps> = React.memo(({ user, currentServer, friendApplications, memberInvitations, systemNotify }) => {
  // Hooks
  const mainTab = useMainTab();
  const contextMenu = useContextMenu();
  // const actionScanner = useActionScanner();
  const { t, i18n } = useTranslation();

  // Refs
  const isCloseToTray = useRef<boolean>(true);

  // States
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Variables
  const { userId, name: userName, status: userStatus } = user;
  const { serverId: currentServerId, name: currentServerName } = currentServer;
  const hasNotify = friendApplications.length !== 0 || memberInvitations.length !== 0 || systemNotify.length !== 0;
  const hasFriendApplication = friendApplications.length !== 0;
  const hasMemberInvitation = memberInvitations.length !== 0;
  const hasSystemNotify = systemNotify.length !== 0;
  const mainTabs: { id: 'home' | 'friends' | 'server'; label: string }[] = [
    { id: 'home', label: t('home') },
    { id: 'friends', label: t('friends') },
    { id: 'server', label: currentServerName },
  ];

  // Handlers
  const getContextMenuItems = () => [
    {
      id: 'system-setting',
      label: t('system-setting'),
      icon: 'setting',
      onClick: () => handleOpenSystemSetting(userId),
    },
    {
      id: 'change-theme',
      label: t('change-theme'),
      icon: 'skin',
      onClick: handleOpenChangeTheme,
    },
    {
      id: 'feedback',
      label: t('feedback'),
      icon: 'feedback',
      onClick: () => window.open('https://forms.gle/AkBTqsZm9NGr5aH46', '_blank'),
    },
    {
      id: 'language-select',
      label: t('language-select'),
      icon: 'submenu-left',
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
      icon: 'submenu-left',
      hasSubmenu: true,
      submenuItems: [
        {
          id: 'faq',
          label: t('faq'),
          onClick: () => window.open('https://ricecall.com.tw/#faq', '_blank'),
        },
        {
          id: 'agreement',
          label: t('agreement'),
          onClick: () => window.open('https://ricecall.com.tw/terms', '_blank'),
        },
        // {
        //   id: 'specification',
        //   label: t('specification'),
        //   onClick: () => window.open('https://ricecall.com.tw/specification', '_blank'),
        // },
        {
          id: 'contact-us',
          label: t('contact-us'),
          onClick: () => window.open('https://ricecall.com.tw/contact', '_blank'),
        },
        {
          id: 'about-us',
          label: t('about-ricecall'),
          onClick: handleOpenAboutUs,
        },
      ],
    },
    {
      id: 'logout',
      label: t('logout'),
      icon: 'logout',
      onClick: handleLogout,
    },
    {
      id: 'exit',
      label: t('exit'),
      icon: 'exit',
      onClick: handleExit,
    },
  ];

  const handleLeaveServer = (serverId: Server['serverId']) => {
    ipc.socket.send('disconnectServer', { serverId });
  };

  const handleChangeStatus = (status: User['status']) => {
    ipc.socket.send('editUser', { update: { status } });
  };

  const handleLogout = () => {
    ipc.auth.logout();
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
  };

  const handleExit = () => {
    ipc.exit();
  };

  const handleMaximize = () => {
    if (isFullscreen) return;
    ipc.window.maximize();
  };

  const handleUnmaximize = () => {
    if (!isFullscreen) return;
    ipc.window.unmaximize();
  };

  const handleMinimize = () => {
    ipc.window.minimize();
  };

  const handleClose = () => {
    if (isCloseToTray.current) ipc.window.close();
    else ipc.exit();
  };

  const handleLanguageChange = (language: LanguageKey) => {
    ipc.language.set(language);
    i18n.changeLanguage(language);
  };

  // Effects
  // TODO: fix auto set to online when manual set to idle or other status
  // useEffect(() => {
  //   const next = actionScanner.isKeepAlive ? 'online' : 'idle';
  //   if (user.status !== next) {
  //     ipc.socket.send('editUser', { update: { status: next } });
  //   }
  // }, [actionScanner.isKeepAlive, user.status]);

  useEffect(() => {
    const changeCloseToTray = (enable: boolean) => {
      isCloseToTray.current = enable;
    };
    changeCloseToTray(isCloseToTray.current);
    const unsub = ipc.systemSettings.closeToTray.onUpdate(changeCloseToTray);
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.window.onMaximize(() => setIsFullscreen(true));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.window.onUnmaximize(() => setIsFullscreen(false));
    return () => unsub();
  }, []);

  return (
    <header className={`${header['header']} ${header['big']}`}>
      {/* Title */}
      <div className={header['title-box']}>
        <div className={header['name-box']} onClick={() => handleOpenUserInfo(userId, userId)}>
          {userName}
        </div>
        <div
          className={header['status-box']}
          onClick={(e) => {
            const x = e.currentTarget.getBoundingClientRect().left;
            const y = e.currentTarget.getBoundingClientRect().bottom;
            contextMenu.showStatusDropdown(x, y, 'right-bottom', (status) => {
              handleChangeStatus(status);
            });
          }}
        >
          <div className={header['status-display']} datatype={userStatus} />
          <div className={header['status-triangle']} />
        </div>
      </div>

      {/* Main Tabs */}
      <div className={header['main-tabs']}>
        {mainTabs.map((tab) =>
          tab.id === 'server' && !currentServerId ? null : (
            <div
              key={`tabs-${tab.id}`}
              data-tab-id={tab.id}
              className={`${header['tab']} ${tab.id === mainTab.selectedTabId ? header['selected'] : ''}`}
              onClick={() => mainTab.setSelectedTabId(tab.id)}
            >
              <div className={header['tab-lable']}>{tab.label}</div>
              <div className={header['tab-bg']} />
              {tab.id === 'server' && (
                <svg
                  className={`${header['tab-close']} themeTabClose`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLeaveServer(currentServerId);
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
          ),
        )}
      </div>

      {/* Buttons */}
      <div className={header['buttons']}>
        <div className={header['gift']} />
        <div className={header['game']} />
        <div
          className={header['notice']}
          onClick={(e) => {
            const x = e.currentTarget.getBoundingClientRect().left;
            const y = e.currentTarget.getBoundingClientRect().bottom;
            contextMenu.showNotifyMenu(x, y, 'right-bottom', [
              {
                id: 'no-unread-notify',
                label: t('no-unread-notify'),
                show: !hasNotify,
                className: 'readonly',
              },
              {
                id: 'friend-verification',
                label: t('friend-verification'),
                icon: 'notify',
                show: hasFriendApplication,
                contentType: 'image',
                showContentLength: true,
                showContent: true,
                contents: friendApplications.map((fa) => fa.avatarUrl),
                onClick: () => handleOpenFriendVerification(userId),
              },
              {
                id: 'member-invitation',
                label: t('member-invitation'),
                icon: 'notify',
                show: hasMemberInvitation,
                contentType: 'image',
                showContentLength: true,
                showContent: true,
                contents: memberInvitations.map((mi) => mi.avatarUrl),
                onClick: () => handleOpenMemberInvitation(userId),
              },
              {
                id: 'system-notify',
                label: t('system-notify'),
                icon: 'notify',
                show: hasSystemNotify,
                showContentLength: true,
                showContent: false,
                contents: memberInvitations.map((mi) => mi.avatarUrl),
                onClick: () => {},
              },
            ]);
          }}
        >
          <div className={`${header['overlay']} ${hasNotify && header['new']}`} />
        </div>
        <div className={header['spliter']} />
        <div
          className={header['menu']}
          onClick={(e) => {
            const x = e.currentTarget.getBoundingClientRect().right + 50;
            const y = e.currentTarget.getBoundingClientRect().bottom;
            contextMenu.showContextMenu(x, y, 'left-bottom', getContextMenuItems());
          }}
        />
        <div className={header['minimize']} onClick={handleMinimize} />
        {isFullscreen ? <div className={header['restore']} onClick={handleUnmaximize} /> : <div className={header['maxsize']} onClick={handleMaximize} />}
        <div className={header['close']} onClick={handleClose} />
      </div>
    </header>
  );
});

Header.displayName = 'Header';

const RootPageComponent: React.FC = React.memo(() => {
  // Hooks
  const mainTab = useMainTab();
  const loadingBox = useLoading();
  const soundPlayer = useSoundPlayer();
  const { t, i18n } = useTranslation();

  // Refs
  const setSelectedTabIdRef = useRef(mainTab.setSelectedTabId);
  const selectedTabIdRef = useRef(mainTab.selectedTabId);
  const loadingBoxRef = useRef(loadingBox);
  const popupOffSubmitRef = useRef<(() => void) | null>(null);
  const disconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const serverOnlineMembersRef = useRef<OnlineMember[]>([]);
  const userRef = useRef<User>(Default.user());
  const friendsRef = useRef<Friend[]>([]);

  // States
  const [user, setUser] = useState<User>(Default.user());
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendActivities, setFriendActivities] = useState<FriendActivity[]>([]);
  const [friendGroups, setFriendGroups] = useState<FriendGroup[]>([]);
  const [friendApplications, setFriendApplications] = useState<FriendApplication[]>([]);
  const [memberInvitations, setMemberInvitations] = useState<MemberInvitation[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [serverOnlineMembers, setServerOnlineMembers] = useState<OnlineMember[]>([]);
  const [serverMemberApplications, setServerMemberApplications] = useState<MemberApplication[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelEvents, setChannelEvents] = useState<ChannelEvent[]>([]);
  const [channelMessages, setChannelMessages] = useState<ChannelMessage[]>([]);
  const [actionMessages, setActionMessages] = useState<PromptMessage[]>([]);
  const [systemNotify, setSystemNotify] = useState<string[]>([]);
  const [queueUsers, setQueueUsers] = useState<QueueUser[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifies, setNotifies] = useState<Notify[]>([]);
  const [recommendServers, setRecommendServers] = useState<RecommendServer[]>([]);
  const [latency, setLatency] = useState<number>(0);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [region, setRegion] = useState<LanguageKey>('en-US');

  // Variables
  const currentServer = useMemo(() => servers.find((item) => item.serverId === user.currentServerId) || Default.server(), [servers, user.currentServerId]);
  const currentChannel = useMemo(() => channels.find((item) => item.channelId === user.currentChannelId) || Default.channel(), [channels, user.currentChannelId]);
  const { userId, name: userName } = user;
  const { serverId: currentServerId, name: currentServerName } = currentServer;

  // Handlers
  const handleClearMessages = () => {
    setChannelMessages([]);
  };

  // Effects
  useEffect(() => {
    const language = navigator.language;

    const match = LANGUAGES.find(({ code }) => code.includes(language));
    if (!match) return setRegion('en-US');

    setRegion(match.code);
  }, []);

  useEffect(() => {
    friendsRef.current = friends;
  }, [friends]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    ipc.tray.title.set(user.name);
  }, [user.name]);

  useEffect(() => {
    if (user.userId) return;

    const userId = localStorage.getItem('userId');
    if (!userId) return;

    ipc.data.userHotReload(userId).then((user) => {
      if (user) {
        setUser(user);
        setIsSocketConnected(true);
      }
    });
  }, [user]);

  useEffect(() => {
    switch (mainTab.selectedTabId) {
      case 'home':
        ipc.discord.updatePresence({
          details: t('rpc:viewing-home-page'),
          state: `${t('rpc:user', { '0': userName })}`,
          largeImageKey: 'app_icon',
          largeImageText: 'RC Voice',
          smallImageKey: 'home_icon',
          smallImageText: t('rpc:home-page'),
          timestamp: Date.now(),
          buttons: [{ label: t('rpc:join-discord-server'), url: 'https://discord.gg/adCWzv6wwS' }],
        });
      case 'friends':
        ipc.discord.updatePresence({
          details: t('rpc:viewing-friend-page'),
          state: `${t('rpc:user', { '0': userName })}`,
          largeImageKey: 'app_icon',
          largeImageText: 'RC Voice',
          smallImageKey: 'home_icon',
          smallImageText: t('rpc:vewing-friend-page'),
          timestamp: Date.now(),
          buttons: [{ label: t('rpc:join-discord-server'), url: 'https://discord.gg/adCWzv6wwS' }],
        });
      case 'server':
        ipc.discord.updatePresence({
          details: `${t('in')} ${currentServerName}`,
          state: `${t('rpc:chat-with-members', { '0': serverOnlineMembers.length.toString() })}`,
          largeImageKey: 'app_icon',
          largeImageText: 'RC Voice',
          smallImageKey: 'home_icon',
          smallImageText: t('rpc:viewing-server-page'),
          timestamp: Date.now(),
          buttons: [{ label: t('rpc:join-discord-server'), url: 'https://discord.gg/adCWzv6wwS' }],
        });
    }
  }, [mainTab.selectedTabId, userName, currentServerName, serverOnlineMembers.length, t]);

  useEffect(() => {
    selectedTabIdRef.current = mainTab.selectedTabId;
  }, [mainTab.selectedTabId]);

  useEffect(() => {
    serverOnlineMembersRef.current = serverOnlineMembers;
  }, [serverOnlineMembers]);

  useEffect(() => {
    if (user.currentServerId && selectedTabIdRef.current !== 'server') setSelectedTabIdRef.current('server');
    else if (selectedTabIdRef.current === 'server') setSelectedTabIdRef.current('home');
    loadingBoxRef.current.setIsLoading(false);
    loadingBoxRef.current.setLoadingServerId('');
  }, [user.currentServerId]);

  useEffect(() => {
    const onStorage = ({ key, newValue }: StorageEvent) => {
      if (key !== 'trigger-handle-server-select' || !newValue) return;
      const { serverDisplayId, serverId } = JSON.parse(newValue);
      if (loadingBox.isLoading) return;
      if (serverId === user.currentServerId) {
        mainTab.setSelectedTabId('server');
        return;
      }
      loadingBox.setIsLoading(true);
      loadingBox.setLoadingServerId(serverDisplayId);
      ipc.socket.send('connectServer', { serverId });
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [user.currentServerId, mainTab, loadingBox]);

  useEffect(() => {
    if (!userId) return;
    const refresh = async () => {
      ipc.data.servers(userId).then((servers) => {
        if (servers) setServers(servers);
      });
      ipc.data.friends(userId).then((friends) => {
        if (friends) setFriends(friends);
      });
      ipc.data.friendActivities(userId).then((friendActivities) => {
        if (friendActivities) setFriendActivities(friendActivities);
      });
      ipc.data.friendGroups(userId).then((friendGroups) => {
        if (friendGroups) setFriendGroups(friendGroups);
      });
      ipc.data.friendApplications(userId).then((friendApplications) => {
        if (friendApplications) setFriendApplications(friendApplications);
      });
      ipc.data.memberInvitations(userId).then((memberInvitations) => {
        if (memberInvitations) setMemberInvitations(memberInvitations);
      });
      ipc.data.recommendServers().then((recommendServerList) => {
        if (recommendServerList) setRecommendServers(recommendServerList);
      });
      setSystemNotify([]); // TODO: Implement system notify
    };
    refresh();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const refresh = async () => {
      ipc.data.announcements(i18n.language).then((announcements) => {
        if (announcements) setAnnouncements(announcements);
      });
      ipc.data.notifies(i18n.language).then((notifies) => {
        if (notifies) setNotifies(notifies);
      });
    };
    refresh();
  }, [i18n.language, userId]);

  useEffect(() => {
    if (!userId || !currentServerId) return;
    const refresh = async () => {
      ipc.data.channels(userId, currentServerId).then((channels) => {
        if (channels) setChannels(channels);
      });
      ipc.data.serverOnlineMembers(currentServerId).then((serverOnlineMembers) => {
        if (serverOnlineMembers) setServerOnlineMembers(serverOnlineMembers);
      });
      setServerMemberApplications([]);
      // ipc.data.memberApplications(server.serverId).then((serverMemberApplications) => {
      //   if (serverMemberApplications) setServerMemberApplications(serverMemberApplications);
      // });
    };
    refresh();
  }, [userId, currentServerId]);

  useEffect(() => {
    const unsub = ipc.socket.on('connect', () => {
      console.info('[Socket] connected');
      ipc.popup.close('errorDialog');
      if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
      setIsSocketConnected(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('disconnect', () => {
      console.info('[Socket] disconnected');
      if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
      disconnectTimerRef.current = setTimeout(() => setIsSocketConnected(false), 30000);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('heartbeat', (...args: { seq: number; latency: number }[]) => {
      console.log(`[Socket] heartbeat`, args);
      setLatency(args[0].latency);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('userUpdate', (...args: { update: Partial<User> }[]) => {
      // Remove action messages and channel messages while switching server
      const newCurrentServerId = args[0].update.currentServerId;
      if (newCurrentServerId !== undefined && newCurrentServerId !== currentServerId) {
        setActionMessages([]);
        setChannelMessages([]);
        setQueueUsers([]);
        setChannels([]);
        setServerOnlineMembers([]);
        setChannelEvents([]);
      }
      const { update } = args[0];
      if (update.signature && update.signature !== userRef.current.signature) {
        // user activity update
        const newActive = Default.friendActivity({ ...userRef.current, content: update.signature, createdAt: Date.now() });
        setFriendActivities((prev) => [newActive, ...prev]);
      }
      setUser((prev) => ({ ...prev, ...args[0].update }));
      if (args[0].update.userId) localStorage.setItem('userId', args[0].update.userId);
    });
    return () => unsub();
  }, [currentServerId]);

  useEffect(() => {
    const unsub = ipc.socket.on('friendAdd', (...args: { data: Friend }[]) => {
      const add = new Set(args.map((i) => `${i.data.targetId}`));
      setFriends((prev) => prev.filter((f) => !add.has(`${f.targetId}`)).concat(args.map((i) => i.data)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('friendUpdate', (...args: { targetId: string; update: Partial<Friend> }[]) => {
      args.forEach(({ targetId, update }) => {
        // friend activity update
        const targetFriend = friendsRef.current.find((f) => f.targetId === targetId);
        if (update.signature) {
          const newActive = Default.friendActivity({
            ...targetFriend,
            ...update,
            userId: targetId,
            content: update.signature,
            createdAt: Date.now(),
          });
          if (targetFriend && targetFriend.relationStatus === 2 && targetFriend.signature !== newActive.signature) {
            setFriendActivities((prev) => [newActive, ...prev]);
          }
        }
      });
      const update = new Map(args.map((i) => [`${i.targetId}`, i.update] as const));
      setFriends((prev) => prev.map((f) => (update.has(`${f.targetId}`) ? { ...f, ...update.get(`${f.targetId}`) } : f)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('friendRemove', (...args: { targetId: string }[]) => {
      const remove = new Set(args.map((i) => `${i.targetId}`));
      setFriends((prev) => prev.filter((f) => !remove.has(`${f.targetId}`)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('friendGroupAdd', (...args: { data: FriendGroup }[]) => {
      const add = new Set(args.map((i) => `${i.data.friendGroupId}`));
      setFriendGroups((prev) => prev.filter((fg) => !add.has(`${fg.friendGroupId}`)).concat(args.map((i) => i.data)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('friendGroupUpdate', (...args: { friendGroupId: string; update: Partial<FriendGroup> }[]) => {
      const update = new Map(args.map((i) => [`${i.friendGroupId}`, i.update] as const));
      setFriendGroups((prev) => prev.map((fg) => (update.has(`${fg.friendGroupId}`) ? { ...fg, ...update.get(`${fg.friendGroupId}`) } : fg)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('friendGroupRemove', (...args: { friendGroupId: string }[]) => {
      const remove = new Set(args.map((i) => `${i.friendGroupId}`));
      setFriendGroups((prev) => prev.filter((fg) => !remove.has(`${fg.friendGroupId}`)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('friendApplicationAdd', (...args: { data: FriendApplication }[]) => {
      const add = new Set(args.map((i) => `${i.data.senderId}`));
      setFriendApplications((prev) => prev.filter((fa) => !add.has(`${fa.senderId}`)).concat(args.map((i) => i.data)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('friendApplicationUpdate', (...args: { senderId: string; update: Partial<FriendApplication> }[]) => {
      const update = new Map(args.map((i) => [`${i.senderId}`, i.update] as const));
      setFriendApplications((prev) => prev.map((a) => (update.has(`${a.senderId}`) ? { ...a, ...update.get(`${a.senderId}`) } : a)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('friendApplicationRemove', (...args: { senderId: string }[]) => {
      const remove = new Set(args.map((i) => `${i.senderId}`));
      setFriendApplications((prev) => prev.filter((fa) => !remove.has(`${fa.senderId}`)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('serverAdd', (...args: { data: Server }[]) => {
      const add = new Set(args.map((i) => `${i.data.serverId}`));
      setServers((prev) => prev.filter((s) => !add.has(`${s.serverId}`)).concat(args.map((i) => i.data)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('serverUpdate', (...args: { serverId: string; update: Partial<Server> }[]) => {
      const update = new Map(args.map((i) => [`${i.serverId}`, i.update] as const));
      setServers((prev) => prev.map((s) => (update.has(`${s.serverId}`) ? { ...s, ...update.get(`${s.serverId}`) } : s)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('serverRemove', (...args: { serverId: string }[]) => {
      const remove = new Set(args.map((i) => `${i.serverId}`));
      setServers((prev) => prev.filter((s) => !remove.has(`${s.serverId}`)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('serverOnlineMemberAdd', (...args: { data: OnlineMember }[]) => {
      setChannelEvents((prev) => [
        ...prev,
        ...args.map((m) => ({
          ...m.data,
          type: 'join' as ChannelEvent['type'],
          prevChannelId: null,
          nextChannelId: m.data.currentChannelId,
          timestamp: Date.now(),
        })),
      ]);
      const add = new Set(args.map((i) => `${i.data.userId}#${i.data.serverId}`));
      setServerOnlineMembers((prev) => args.map((i) => i.data).concat(prev.filter((m) => !add.has(`${m.userId}#${m.serverId}`))));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('serverOnlineMemberUpdate', (...args: { userId: string; serverId: string; update: Partial<OnlineMember> }[]) => {
      args.map((m) => {
        const originMember = serverOnlineMembersRef.current.find((om) => om.userId === m.userId);
        if (originMember && m.update.currentChannelId) {
          const originChannelId = originMember.currentChannelId;
          const newMember = { ...originMember, ...m.update };
          setChannelEvents((prev) => [
            ...prev,
            {
              ...newMember,
              type: 'move' as ChannelEvent['type'],
              prevChannelId: originChannelId,
              nextChannelId: newMember.currentChannelId,
              timestamp: Date.now(),
            },
          ]);
        }
      });
      const update = new Map(args.map((i) => [`${i.userId}#${i.serverId}`, i.update] as const));
      setServerOnlineMembers((prev) => prev.map((m) => (update.has(`${m.userId}#${m.serverId}`) ? { ...m, ...update.get(`${m.userId}#${m.serverId}`) } : m)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('serverOnlineMemberRemove', (...args: { userId: string; serverId: string }[]) => {
      args.map((m) => {
        const originMember = serverOnlineMembersRef.current.find((om) => om.userId === m.userId);
        if (originMember) {
          setChannelEvents((prev) => [
            ...prev,
            {
              ...originMember,
              type: 'leave' as ChannelEvent['type'],
              prevChannelId: originMember.currentChannelId,
              nextChannelId: null,
              timestamp: Date.now(),
            },
          ]);
        }
      });
      const remove = new Set(args.map((i) => `${i.userId}#${i.serverId}`));
      setServerOnlineMembers((prev) => prev.filter((m) => !remove.has(`${m.userId}#${m.serverId}`)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('serverMemberApplicationAdd', (...args: { data: MemberApplication }[]) => {
      const add = new Set(args.map((i) => `${i.data.userId}#${i.data.serverId}`));
      setServerMemberApplications((prev) => args.map((i) => i.data).concat(prev.filter((m) => !add.has(`${m.userId}#${m.serverId}`))));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('serverMemberApplicationRemove', (...args: { userId: string; serverId: string }[]) => {
      const remove = new Set(args.map((i) => `${i.userId}#${i.serverId}`));
      setServerMemberApplications((prev) => prev.filter((m) => !remove.has(`${m.userId}#${m.serverId}`)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('channelAdd', (...args: { data: Channel }[]) => {
      const add = new Set(args.map((i) => `${i.data.channelId}`));
      setChannels((prev) => prev.filter((c) => !add.has(`${c.channelId}`)).concat(args.map((i) => i.data)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('channelUpdate', (...args: { channelId: string; update: Partial<Channel> }[]) => {
      const update = new Map(args.map((i) => [`${i.channelId}`, i.update] as const));
      setChannels((prev) => prev.map((c) => (update.has(`${c.channelId}`) ? { ...c, ...update.get(`${c.channelId}`) } : c)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('channelRemove', (...args: { channelId: string }[]) => {
      const remove = new Set(args.map((i) => `${i.channelId}`));
      setChannels((prev) => prev.filter((c) => !remove.has(`${c.channelId}`)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('memberInvitationAdd', (...args: { data: MemberInvitation }[]) => {
      const add = new Set(args.map((i) => `${i.data.serverId}`));
      setMemberInvitations((prev) => prev.filter((mi) => !add.has(`${mi.serverId}`)).concat(args.map((i) => i.data)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('memberInvitationUpdate', (...args: { serverId: string; update: Partial<MemberInvitation> }[]) => {
      const update = new Map(args.map((i) => [`${i.serverId}`, i.update] as const));
      setMemberInvitations((prev) => prev.map((mi) => (update.has(`${mi.serverId}`) ? { ...mi, ...update.get(`${mi.serverId}`) } : mi)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('memberInvitationRemove', (...args: { serverId: string }[]) => {
      const remove = new Set(args.map((i) => i.serverId));
      setMemberInvitations((prev) => prev.filter((mi) => !remove.has(mi.serverId)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('channelMessage', (...args: ChannelMessage[]) => {
      setChannelMessages((prev) => [...prev, ...args]);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('actionMessage', (...args: PromptMessage[]) => {
      setActionMessages((prev) => [...prev, ...args]);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('queueMembersSet', (...args: QueueUser[]) => {
      setQueueUsers(args);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('playSound', (...args: ('enterVoiceChannel' | 'leaveVoiceChannel' | 'receiveChannelMessage' | 'receiveDirectMessage' | 'startSpeaking' | 'stopSpeaking')[]) => {
      args.forEach((s) => soundPlayer.playSound(s));
    });
    return () => unsub();
  }, [soundPlayer]);

  useEffect(() => {
    const unsub = ipc.socket.on('openPopup', (...args: { type: PopupType; id: string; initialData?: unknown; force?: boolean }[]) => {
      args.forEach((p) => {
        loadingBoxRef.current.setIsLoading(false);
        loadingBoxRef.current.setLoadingServerId('');
        ipc.popup.open(p.type, p.id, p.initialData, p.force);
        popupOffSubmitRef.current?.();
        popupOffSubmitRef.current = ipc.popup.onSubmit(p.id, () => {
          if (p.id === 'logout') {
            ipc.auth.logout();
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
          }
        });
      });
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('error', (error: Error) => {
      handleOpenErrorDialog(error.message, () => {});
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    history.pushState = () => {};
    history.back = () => {};
    history.forward = () => {};
  }, []);

  return (
    <WebRTCProvider>
      <ActionScannerProvider>
        <ExpandedProvider>
          <Header user={user} currentServer={currentServer} friendApplications={friendApplications} memberInvitations={memberInvitations} systemNotify={systemNotify} />
          {!userId || !isSocketConnected ? (
            <LoadingSpinner />
          ) : (
            <>
              <HomePage user={user} servers={servers} announcements={announcements} recommendServers={recommendServers} region={region} display={mainTab.selectedTabId === 'home'} />
              <FriendPage user={user} friends={friends} friendActivities={friendActivities} friendGroups={friendGroups} display={mainTab.selectedTabId === 'friends'} />
              <ServerPage
                user={user}
                currentServer={currentServer}
                currentChannel={currentChannel}
                friends={friends}
                queueUsers={queueUsers}
                serverOnlineMembers={serverOnlineMembers}
                serverMemberApplications={serverMemberApplications}
                channels={channels}
                channelMessages={channelMessages}
                actionMessages={actionMessages}
                channelEvents={channelEvents}
                onClearMessages={handleClearMessages}
                display={mainTab.selectedTabId === 'server'}
                latency={latency}
              />
              <NotifyToaster notifies={notifies} />
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

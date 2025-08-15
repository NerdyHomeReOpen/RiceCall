'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState, useRef, useMemo } from 'react';

// CSS
import header from '@/styles/header.module.css';

// Types
import type { PopupType, Server, User, Channel, FriendGroup, ChannelMessage, PromptMessage, FriendApplication, MemberInvitation, RecommendServerList, Friend, Member, QueueMember } from '@/types';

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
  server: Server;
  friendApplications: FriendApplication[];
  memberInvitations: MemberInvitation[];
  systemNotify: string[];
}

const Header: React.FC<HeaderProps> = React.memo(({ user, server, friendApplications, memberInvitations, systemNotify }) => {
  // Hooks
  const mainTab = useMainTab();
  const contextMenu = useContextMenu();
  const actionScanner = useActionScanner();
  const { t } = useTranslation();

  // Refs
  const menuRef = useRef<HTMLDivElement>(null);
  const notifyMenuRef = useRef<HTMLDivElement>(null);
  const isCloseToTray = useRef<boolean>(true);

  // States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Variables
  const { userId, name: userName, status: userStatus } = user;
  const { serverId, name: serverName } = server;

  // Memos
  const hasNotify = useMemo(() => {
    return friendApplications.length !== 0 || memberInvitations.length !== 0 || systemNotify.length !== 0;
  }, [friendApplications, memberInvitations, systemNotify]);

  const hasFriendApplication = useMemo(() => {
    return friendApplications.length !== 0;
  }, [friendApplications]);

  const hasMemberInvitation = useMemo(() => {
    return memberInvitations.length !== 0;
  }, [memberInvitations]);

  const hasSystemNotify = useMemo(() => {
    return systemNotify.length !== 0;
  }, [systemNotify]);

  const mainTabs = useMemo(() => {
    return [
      { id: 'home', label: t('home') },
      { id: 'friends', label: t('friends') },
      { id: 'server', label: serverName },
    ];
  }, [t, serverName]);

  const statusOptions = useMemo(() => {
    return [
      { status: 'online', label: t('online') },
      { status: 'dnd', label: t('dnd') },
      { status: 'idle', label: t('idle') },
      { status: 'gn', label: t('gn') },
    ];
  }, [t]);

  // Handlers
  const handleLeaveServer = (serverId: Server['serverId']) => {
    ipcService.socket.send('disconnectServer', { serverId });
  };

  const handleChangeStatus = (status: User['status']) => {
    ipcService.socket.send('editUser', { update: { status } });
  };

  const handleOpenUserInfo = (userId: User['userId']) => {
    ipcService.popup.open('userInfo', `userInfo-${userId}`, { userId, targetId: userId });
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
    if (isFullscreen) ipcService.window.unmaximize();
    else ipcService.window.maximize();
  };

  const handleMinimize = () => {
    ipcService.window.minimize();
  };

  const handleClose = () => {
    if (isCloseToTray.current) ipcService.window.close();
    else ipcService.exit();
  };

  const handleLanguageChange = (language: LanguageKey) => {
    i18n.changeLanguage(language);
    localStorage.setItem('language', language);
  };

  const handleOpenFriendVerification = () => {
    ipcService.popup.open('friendVerification', 'friendVerification', { userId });
  };

  const handleOpenMemberInvitation = () => {
    ipcService.popup.open('memberInvitation', 'memberInvitation', { userId });
  };

  // Effects
  useEffect(() => {
    console.log(memberInvitations);
    console.log(friendApplications);
  }, [memberInvitations, friendApplications]);

  useEffect(() => {
    const next = actionScanner.isKeepAlive ? 'online' : 'idle';
    if (user.status !== next) {
      ipcService.socket.send('editUser', { update: { status: next } });
    }
  }, [actionScanner.isKeepAlive, user.status]);

  useEffect(() => {
    const unsubscribe = [
      ipcService.systemSettings.closeToTray.get((enable) => (isCloseToTray.current = enable)),
      ipcService.window.onUnmaximize(() => setIsFullscreen(false)),
      ipcService.window.onMaximize(() => setIsFullscreen(true)),
    ];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, []);

  return (
    <header className={`${header['header']} ${header['big']}`}>
      {/* Title */}
      <div className={header['title-box']}>
        <div className={header['name-box']} onClick={() => handleOpenUserInfo(userId)}>
          {userName}
        </div>
        <div
          className={header['status-box']}
          onClick={() => {
            setShowStatusDropdown((prev) => !prev);
          }}
        >
          <div className={header['status-display']} datatype={userStatus} />
          <div className={header['status-triangle']} />
          <div className={`${header['status-dropdown']} ${showStatusDropdown ? '' : header['hidden']}`}>
            {statusOptions.map((option) => (
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
        {mainTabs.map((Tab) => {
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
          ref={notifyMenuRef}
          className={header['notice']}
          onClick={() => {
            if (!notifyMenuRef.current) return;
            const x = notifyMenuRef.current.getBoundingClientRect().left - 70;
            const y = notifyMenuRef.current.getBoundingClientRect().bottom + 10;
            contextMenu.showNotifyMenu(x, y, false, false, [
              {
                id: 'no-unread-notify',
                label: `無未讀消息`, // TODO: t('no-unread-notify'),
                show: !hasNotify,
                className: 'readonly',
              },
              {
                id: 'friend-applications',
                label: `好友驗證`, // TODO: t('friend-applications'),
                icon: 'notify',
                show: hasFriendApplication,
                contentType: 'image',
                showContentLength: true,
                showContent: true,
                contents: friendApplications.map((fa) => fa.avatarUrl),
                onClick: () => handleOpenFriendVerification(),
              },
              {
                id: 'member-invitations',
                label: `語音群邀請`, // TODO: t('member-invitations'),
                icon: 'notify',
                show: hasMemberInvitation,
                contentType: 'image',
                showContentLength: true,
                showContent: true,
                contents: memberInvitations.map((mi) => mi.avatarUrl),
                onClick: () => handleOpenMemberInvitation(),
              },
              {
                id: 'system-notify',
                label: `系統通知`, // TODO: t('system-notify'),
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
                onClick: handleOpenSystemSetting,
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
                    onClick: () => window.open('https://ricecall.com.tw/faq', '_blank'),
                  },
                  {
                    id: 'agreement',
                    label: t('agreement'),
                    onClick: () => window.open('https://ricecall.com.tw/agreement', '_blank'),
                  },
                  {
                    id: 'specification',
                    label: t('specification'),
                    onClick: () => window.open('https://ricecall.com.tw/specification', '_blank'),
                  },
                  {
                    id: 'contact-us',
                    label: t('contact-us'),
                    onClick: () => window.open('https://ricecall.com.tw/contactus', '_blank'),
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
            ]);
          }}
        />
        <div className={header['minimize']} onClick={handleMinimize} />
        <div className={isFullscreen ? header['restore'] : header['maxsize']} onClick={handleFullscreen} />
        <div className={header['close']} onClick={handleClose} />
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

  // Refs
  const mainTabRef = useRef(mainTab);
  const selectedTabRef = useRef(mainTab.selectedTabId);
  const loadingBoxRef = useRef(loadingBox);
  const soundPlayerRef = useRef(soundPlayer);
  const popupOffSubmitRef = useRef<(() => void) | null>(null);

  selectedTabRef.current = mainTab.selectedTabId;

  // States
  const [user, setUser] = useState<User>(Default.user());
  const [servers, setServers] = useState<Server[]>([]);
  const [recommendServerList, setRecommendServerList] = useState<RecommendServerList>({});
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendGroups, setFriendGroups] = useState<FriendGroup[]>([]);
  const [friendApplications, setFriendApplications] = useState<FriendApplication[]>([]);
  const [memberInvitations, setMemberInvitations] = useState<MemberInvitation[]>([]);
  const [systemNotify, setSystemNotify] = useState<string[]>([]);
  const [serverChannels, setServerChannels] = useState<Channel[]>([]);
  const [serverMembers, setServerMembers] = useState<Member[]>([]);
  const [queueMembers, setQueueMembers] = useState<QueueMember[]>([]);
  const [channelMessages, setChannelMessages] = useState<ChannelMessage[]>([]);
  const [actionMessages, setActionMessages] = useState<PromptMessage[]>([]);

  // Variables
  const { userId } = user;

  // Memos
  const server = useMemo(() => {
    return servers.find((item) => item.serverId === user.currentServerId) || Default.server();
  }, [servers, user.currentServerId]);

  const channel = useMemo(() => {
    return serverChannels.find((item) => item.channelId === user.currentChannelId) || Default.channel();
  }, [serverChannels, user.currentChannelId]);

  // Handlers
  const handleUserUpdate = (...args: { update: Partial<User> }[]) => {
    setUser((prev) => ({ ...prev, ...args[0].update }));
  };

  const handleServersSet = (...args: Server[]) => {
    setServers(args);
  };

  const handleServerAdd = (...args: { data: Server }[]) => {
    setServers((prev) => [...prev, ...args.map((i) => i.data)]);
  };

  const handleServerUpdate = (...args: { serverId: string; update: Partial<Server> }[]) => {
    const update = new Map(args.map((i) => [`${i.serverId}`, i.update] as const));
    setServers((prev) => prev.map((s) => (update.has(`${s.serverId}`) ? { ...s, ...update.get(`${s.serverId}`) } : s)));
  };

  const handleServerRemove = (...args: { serverId: string }[]) => {
    const remove = new Set(args.map((i) => `${i.serverId}`));
    setServers((prev) => prev.filter((s) => !remove.has(`${s.serverId}`)));
  };

  const handleFriendsSet = (...args: Friend[]) => {
    setFriends(args);
  };

  const handleFriendAdd = (...args: { data: Friend }[]) => {
    setFriends((prev) => [...prev, ...args.map((i) => i.data)]);
  };

  const handleFriendUpdate = (...args: { targetId: string; update: Partial<Friend> }[]) => {
    const update = new Map(args.map((i) => [`${i.targetId}`, i.update] as const));
    setFriends((prev) => prev.map((f) => (update.has(`${f.targetId}`) ? { ...f, ...update.get(`${f.targetId}`) } : f)));
  };

  const handleFriendDelete = (...args: { targetId: string }[]) => {
    const remove = new Set(args.map((i) => `${i.targetId}`));
    setFriends((prev) => prev.filter((f) => !remove.has(`${f.targetId}`)));
  };

  const handleFriendGroupsSet = (...args: FriendGroup[]) => {
    setFriendGroups(args);
  };

  const handleFriendGroupAdd = (...args: { data: FriendGroup }[]) => {
    setFriendGroups((prev) => [...prev, ...args.map((i) => i.data)]);
  };

  const handleFriendGroupUpdate = (...args: { friendGroupId: string; update: Partial<FriendGroup> }[]) => {
    const update = new Map(args.map((i) => [`${i.friendGroupId}`, i.update] as const));
    setFriendGroups((prev) => prev.map((fg) => (update.has(`${fg.friendGroupId}`) ? { ...fg, ...update.get(`${fg.friendGroupId}`) } : fg)));
  };

  const handleFriendGroupDelete = (...args: { friendGroupId: string }[]) => {
    const remove = new Set(args.map((i) => `${i.friendGroupId}`));
    setFriendGroups((prev) => prev.filter((fg) => !remove.has(`${fg.friendGroupId}`)));
  };

  const handleFriendApplicationAdd = (...args: { data: FriendApplication }[]) => {
    setFriendApplications((prev) => [...prev, ...args.map((i) => i.data)]);
  };

  const handleFriendApplicationUpdate = (...args: { senderId: string; update: Partial<FriendApplication> }[]) => {
    const update = new Map(args.map((i) => [`${i.senderId}`, i.update] as const));
    setFriendApplications((prev) => prev.map((a) => (update.has(`${a.senderId}`) ? { ...a, ...update.get(`${a.senderId}`) } : a)));
  };

  const handleFriendApplicationRemove = (...args: { senderId: string }[]) => {
    setFriendApplications((prev) => prev.filter((fa) => !args.some((i) => i.senderId === fa.senderId)));
  };

  const handleServerMembersSet = (...args: Member[]) => {
    setServerMembers(args);
  };

  const handleServerMemberAdd = (...args: { data: Member }[]) => {
    setServerMembers((prev) => [...prev, ...args.map((i) => i.data)]);
  };

  const handleServerMemberUpdate = (...args: { userId: string; serverId: string; update: Partial<Member> }[]) => {
    const update = new Map(args.map((i) => [`${i.userId}#${i.serverId}`, i.update] as const));
    setServerMembers((prev) => prev.map((m) => (update.has(`${m.userId}#${m.serverId}`) ? { ...m, ...update.get(`${m.userId}#${m.serverId}`) } : m)));
  };

  const handleServerMemberDelete = (...args: { userId: string; serverId: string }[]) => {
    const remove = new Set(args.map((i) => `${i.userId}#${i.serverId}`));
    setServerMembers((prev) => prev.filter((m) => !remove.has(`${m.userId}#${m.serverId}`)));
  };

  const handleServerChannelsSet = (...args: Channel[]) => {
    setServerChannels(args);
  };

  const handleServerChannelAdd = (...args: { data: Channel }[]) => {
    setServerChannels((prev) => [...prev, ...args.map((i) => i.data)]);
  };

  const handleServerChannelUpdate = (...args: { channelId: string; update: Partial<Channel> }[]) => {
    const update = new Map(args.map((i) => [`${i.channelId}`, i.update] as const));
    setServerChannels((prev) => prev.map((c) => (update.has(`${c.channelId}`) ? { ...c, ...update.get(`${c.channelId}`) } : c)));
  };

  const handleServerChannelDelete = (...args: { channelId: string }[]) => {
    const remove = new Set(args.map((i) => `${i.channelId}`));
    setServerChannels((prev) => prev.filter((c) => !remove.has(`${c.channelId}`)));
  };

  const handleMemberInvitationAdd = (...args: { data: MemberInvitation }[]) => {
    setMemberInvitations((prev) => [...prev, ...args.map((i) => i.data)]);
  };

  const handleMemberInvitationUpdate = (...args: { serverId: string; update: Partial<MemberInvitation> }[]) => {
    const update = new Map(args.map((i) => [`${i.serverId}`, i.update] as const));
    setMemberInvitations((prev) => prev.map((mi) => (update.has(`${mi.serverId}`) ? { ...mi, ...update.get(`${mi.serverId}`) } : mi)));
  };

  const handleMemberInvitationRemove = (...args: { serverId: string }[]) => {
    const remove = new Set(args.map((i) => i.serverId));
    setMemberInvitations((prev) => prev.filter((mi) => !remove.has(mi.serverId)));
  };

  const handleChannelMessage = (...args: ChannelMessage[]) => {
    setChannelMessages((prev) => [...prev, ...args]);
  };

  const handleActionMessage = (...args: PromptMessage[]) => {
    setActionMessages((prev) => [...prev, ...args]);
  };

  const handleQueueMembersSet = (...args: QueueMember[]) => {
    setQueueMembers(args);
  };

  const handlePlaySound = (...args: ('enterVoiceChannel' | 'leaveVoiceChannel' | 'receiveChannelMessage' | 'receiveDirectMessage' | 'startSpeaking' | 'stopSpeaking')[]) => {
    args.forEach((s) => soundPlayerRef.current.playSound(s));
  };

  const handleOpenPopup = (...args: { type: PopupType; id: string; initialData?: unknown; force?: boolean }[]) => {
    args.forEach((p) => {
      loadingBoxRef.current.setIsLoading(false);
      loadingBoxRef.current.setLoadingServerId('');
      ipcService.popup.open(p.type, p.id, p.initialData, p.force);
      popupOffSubmitRef.current?.();
      popupOffSubmitRef.current = ipcService.popup.onSubmit(p.id, () => {
        if (p.id === 'logout') ipcService.auth.logout();
      });
    });
  };

  // Effects
  useEffect(() => {
    if (user.currentServerId) {
      if (selectedTabRef.current !== 'server') {
        mainTabRef.current.setSelectedTabId('server');
      }
    } else {
      if (selectedTabRef.current === 'server') {
        mainTabRef.current.setSelectedTabId('home');
      }
    }
    setActionMessages([]);
    setChannelMessages([]);

    loadingBoxRef.current.setIsLoading(false);
    loadingBoxRef.current.setLoadingServerId('');
  }, [user.currentServerId]);

  useEffect(() => {
    const onStorage = ({ key, newValue }: StorageEvent) => {
      if (key !== 'trigger-handle-server-select' || !newValue) return;
      const { serverDisplayId, serverId } = JSON.parse(newValue);
      if (loadingBoxRef.current.isLoading || !serverDisplayId || !serverId) return;

      if (serverId === server.serverId) {
        mainTabRef.current.setSelectedTabId('server');
        return;
      }

      loadingBoxRef.current.setIsLoading(true);
      loadingBoxRef.current.setLoadingServerId(serverDisplayId);
      ipcService.socket.send('connectServer', { serverId });
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [server.serverId, user.currentServerId]);

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
      getService.memberInvitations({ receiverId: userId }).then((memberInvitations) => {
        if (memberInvitations) setMemberInvitations(memberInvitations);
      });
      getService.recommendServerList().then((recommendServerList) => {
        if (recommendServerList) setRecommendServerList(recommendServerList);
      });
      setSystemNotify([]);
    };
    refresh();
  }, [userId]);

  useEffect(() => {
    const unsubscribe = [
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
      ipcService.socket.on('friendApplicationUpdate', handleFriendApplicationUpdate),
      ipcService.socket.on('friendApplicationRemove', handleFriendApplicationRemove),
      ipcService.socket.on('serverOnlineMembersSet', handleServerMembersSet),
      ipcService.socket.on('serverOnlineMemberAdd', handleServerMemberAdd),
      ipcService.socket.on('serverMemberUpdate', handleServerMemberUpdate),
      ipcService.socket.on('serverOnlineMemberRemove', handleServerMemberDelete),
      ipcService.socket.on('serverChannelsSet', handleServerChannelsSet),
      ipcService.socket.on('serverChannelAdd', handleServerChannelAdd),
      ipcService.socket.on('serverChannelUpdate', handleServerChannelUpdate),
      ipcService.socket.on('serverChannelRemove', handleServerChannelDelete),
      ipcService.socket.on('memberInvitationAdd', handleMemberInvitationAdd),
      ipcService.socket.on('memberInvitationUpdate', handleMemberInvitationUpdate),
      ipcService.socket.on('memberInvitationRemove', handleMemberInvitationRemove),
      ipcService.socket.on('channelMessage', handleChannelMessage),
      ipcService.socket.on('actionMessage', handleActionMessage),
      ipcService.socket.on('openPopup', handleOpenPopup),
      ipcService.socket.on('playSound', handlePlaySound),
      ipcService.socket.on('queueMembersSet', handleQueueMembersSet),
    ];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, []);

  return (
    <WebRTCProvider userId={userId}>
      <ActionScannerProvider>
        <ExpandedProvider>
          <Header user={user} server={server} friendApplications={friendApplications} memberInvitations={memberInvitations} systemNotify={systemNotify} />
          {!socket.isConnected ? (
            <LoadingSpinner />
          ) : (
            <>
              <HomePage user={user} servers={servers} recommendServerList={recommendServerList} display={mainTab.selectedTabId === 'home'} />
              <FriendPage user={user} friends={friends} friendGroups={friendGroups} display={mainTab.selectedTabId === 'friends'} />
              <ServerPage
                user={user}
                friends={friends}
                server={server}
                channel={channel}
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

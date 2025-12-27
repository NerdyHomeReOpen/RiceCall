/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import LoadingSpinner from '@/components/common/LoadingSpinner';
import NotificationToaster from '@/components/NotificationToaster';

import FriendPage from '@/pages/Friend';
import HomePage from '@/pages/Home';
import ServerPage from '@/pages/Server';

import WebRTCProvider from '@/providers/WebRTC';
import ActionScannerProvider from '@/providers/ActionScanner';
import ExpandedProvider from '@/providers/FindMe';
import { useContextMenu } from '@/providers/ContextMenu';
import { useMainTab } from '@/providers/MainTab';
import { useLoading } from '@/providers/Loading';
import { useSoundPlayer } from '@/providers/SoundPlayer';
import { useActionScanner } from '@/providers/ActionScanner';

import * as Popup from '@/utils/popup';
import * as Default from '@/utils/default';
import CtxMenuBuilder from '@/utils/ctxMenuBuilder';

import headerStyles from '@/styles/header.module.css';

import { LANGUAGES, REFRESH_REGION_INFO_INTERVAL } from '@/constant';

interface HeaderProps {
  user: Types.User;
  currentServer: Types.Server;
  friendApplications: Types.FriendApplication[];
  memberInvitations: Types.MemberInvitation[];
  systemNotifications: string[];
}

type Tab = {
  id: 'home' | 'friends' | 'server';
  label: string;
};

const Header: React.FC<HeaderProps> = React.memo(({ user, currentServer, friendApplications, memberInvitations, systemNotifications }) => {
  // Hooks
  const contextMenu = useContextMenu();
  const actionScanner = useActionScanner();
  const { t, i18n } = useTranslation();

  // States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCloseToTray, setIsCloseToTray] = useState(true);

  // Variables
  const { userId, name: userName, status: userStatus } = user;
  const { serverId: currentServerId, name: currentServerName } = currentServer;
  const hasNotification = friendApplications.length !== 0 || memberInvitations.length !== 0 || systemNotifications.length !== 0;
  const hasFriendApplication = friendApplications.length !== 0;
  const hasMemberInvitation = memberInvitations.length !== 0;
  const hasSystemNotification = systemNotifications.length !== 0;
  const mainTabs: Tab[] = useMemo(
    () => [
      { id: 'home', label: t('home') },
      { id: 'friends', label: t('friends') },
      { id: 'server', label: currentServerName },
    ],
    [currentServerName, t],
  );

  // Handlers
  const maximize = () => {
    if (isFullscreen) return;
    ipc.window.maximize();
  };

  const unmaximize = () => {
    if (!isFullscreen) return;
    ipc.window.unmaximize();
  };

  const minimize = () => {
    ipc.window.minimize();
  };

  const logout = () => {
    ipc.auth.logout();
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
  };

  const exit = () => {
    ipc.exit();
  };

  const close = () => {
    if (isCloseToTray) ipc.window.close();
    else ipc.exit();
  };

  const changeLanguage = (language: Types.LanguageKey) => {
    ipc.language.set(language);
    i18n.changeLanguage(language);
  };

  const getContextMenuItems = () =>
    new CtxMenuBuilder()
      .addSystemSettingOption(() => Popup.openSystemSetting(userId))
      .addChangeThemeOption(Popup.openChangeTheme)
      .addFeedbackOption(() => window.open('https://forms.gle/AkBTqsZm9NGr5aH46', '_blank'))
      .addLanguageSelectOption({ languages: LANGUAGES }, (code) => (code ? changeLanguage(code) : null))
      .addHelpCenterOption(
        {
          onFaqClick: () => window.open('https://ricecall.com.tw/#faq', '_blank'),
          onAgreementClick: () => window.open('https://ricecall.com.tw/terms', '_blank'),
          onSpecificationClick: () => window.open('https://ricecall.com.tw/specification', '_blank'),
          onContactUsClick: () => window.open('https://ricecall.com.tw/contact', '_blank'),
          onAboutUsClick: () => Popup.openAboutUs,
        },
        () => {},
      )
      .addLogoutOption(logout)
      .addExitOption(exit)
      .build();

  const getNotificationMenuItems = () => [
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
      contents: friendApplications.map((fa) => fa.avatarUrl),
      onClick: () => Popup.openFriendVerification(userId),
    },
    {
      id: 'member-invitation',
      label: t('member-invitation'),
      icon: 'notification',
      show: hasMemberInvitation,
      contentType: 'image',
      showContentLength: true,
      showContent: true,
      contents: memberInvitations.map((mi) => mi.avatarUrl),
      onClick: () => Popup.openMemberInvitation(userId),
    },
    {
      id: 'system-notify',
      label: t('system-notify'),
      icon: 'notification',
      show: hasSystemNotification,
      showContentLength: true,
      showContent: false,
      contents: memberInvitations.map((mi) => mi.avatarUrl),
      onClick: () => {},
    },
  ];

  const handleStatusDropdownClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left: x, bottom: y } = e.currentTarget.getBoundingClientRect();
    contextMenu.showStatusDropdown(x, y, 'right-bottom', (status) => {
      actionScanner.setIsManualIdling(status !== 'online');
      Popup.editUserStatus(status);
    });
  };

  const handleMenuClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { right: x, bottom: y } = e.currentTarget.getBoundingClientRect();
    contextMenu.showContextMenu(x + 50, y, 'left-bottom', getContextMenuItems());
  };

  const handleNotificationMenuClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { left: x, bottom: y } = e.currentTarget.getBoundingClientRect();
    contextMenu.showNotificationMenu(x, y, 'right-bottom', getNotificationMenuItems());
  };

  // Effects
  useEffect(() => {
    const next = actionScanner.isIdling ? 'idle' : 'online';
    if (user.status !== next && !actionScanner.isManualIdling) {
      Popup.editUserStatus(next);
    }
  }, [actionScanner.isIdling, actionScanner.isManualIdling, user.status]);

  useEffect(() => {
    const changeCloseToTray = (enable: boolean) => {
      setIsCloseToTray(enable);
    };
    changeCloseToTray(ipc.systemSettings.closeToTray.get());
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
    <header className={`${headerStyles['header']} ${headerStyles['big']}`}>
      <div className={headerStyles['title-box']}>
        <div className={headerStyles['name-box']} onClick={() => Popup.openUserInfo(userId, userId)}>
          {userName}
        </div>
        <div className={headerStyles['status-box']} onClick={handleStatusDropdownClick}>
          <div className={headerStyles['status-display']} datatype={userStatus} />
          <div className={headerStyles['status-triangle']} />
        </div>
      </div>
      <div className={headerStyles['main-tabs']}>
        {mainTabs.map((tab) => (
          <TabItem key={tab.id} tab={tab} currentServerId={currentServerId} />
        ))}
      </div>
      <div className={headerStyles['buttons']}>
        <div className={headerStyles['gift']} />
        <div className={headerStyles['game']} />
        <div className={headerStyles['notice']} onClick={handleNotificationMenuClick}>
          <div className={`${headerStyles['overlay']} ${hasNotification && headerStyles['new']}`} />
        </div>
        <div className={headerStyles['spliter']} />
        <div className={headerStyles['menu']} onClick={handleMenuClick} />
        <div className={headerStyles['minimize']} onClick={minimize} />
        {isFullscreen ? <div className={headerStyles['restore']} onClick={unmaximize} /> : <div className={headerStyles['maxsize']} onClick={maximize} />}
        <div className={headerStyles['close']} onClick={close} />
      </div>
    </header>
  );
});

Header.displayName = 'Header';

interface TabItemProps {
  tab: Tab;
  currentServerId: string;
}

const TabItem = React.memo(({ tab, currentServerId }: TabItemProps) => {
  // Hooks
  const mainTab = useMainTab();

  // Variables
  const { id: tabId, label: tabLabel } = tab;
  const isSelected = tabId === mainTab.selectedTabId;

  // Handlers
  const handleTabClick = () => {
    mainTab.setSelectedTabId(tabId);
  };

  const handleCloseButtonClick = (e: React.MouseEvent<SVGSVGElement>) => {
    e.stopPropagation();
    Popup.leaveServer(currentServerId);
  };

  if (tabId === 'server' && !currentServerId) return null;
  return (
    <div key={`tabs-${tabId}`} data-tab-id={tabId} className={`${headerStyles['tab']} ${isSelected ? headerStyles['selected'] : ''}`} onClick={handleTabClick}>
      <div className={headerStyles['tab-lable']}>{tabLabel}</div>
      <div className={headerStyles['tab-bg']} />
      {tabId === 'server' && (
        <svg className={`${headerStyles['tab-close']} themeTabClose`} onClick={handleCloseButtonClick} xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="12" fill="var(--main-color, rgb(55 144 206))" />
          <path d="M17 7L7 17M7 7l10 10" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
});

TabItem.displayName = 'TabItem';

const RootPageComponent: React.FC = React.memo(() => {
  // Hooks
  const mainTab = useMainTab();
  const loadingBox = useLoading();
  const soundPlayer = useSoundPlayer();
  const { t } = useTranslation();

  // Refs
  const setSelectedTabIdRef = useRef(mainTab.setSelectedTabId);
  const selectedTabIdRef = useRef(mainTab.selectedTabId);
  const loadingBoxRef = useRef(loadingBox);
  const popupOffSubmitRef = useRef<(() => void) | null>(null);
  const disconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const userRef = useRef<Types.User>(Default.user());
  const currentServerRef = useRef<Types.Server>(Default.server());
  const currentChannelRef = useRef<Types.Channel>(Default.channel());
  const friendsRef = useRef<Types.Friend[]>([]);
  const serverOnlineMembersRef = useRef<Types.OnlineMember[]>([]);

  // States
  const [user, setUser] = useState<Types.User>(Default.user());
  const [friends, setFriends] = useState<Types.Friend[]>([]);
  const [friendActivities, setFriendActivities] = useState<Types.FriendActivity[]>([]);
  const [friendGroups, setFriendGroups] = useState<Types.FriendGroup[]>([]);
  const [friendApplications, setFriendApplications] = useState<Types.FriendApplication[]>([]);
  const [memberInvitations, setMemberInvitations] = useState<Types.MemberInvitation[]>([]);
  const [currentServer, setCurrentServer] = useState<Types.Server>(Default.server());
  const [servers, setServers] = useState<Types.Server[]>([]);
  const [serverOnlineMembers, setServerOnlineMembers] = useState<Types.OnlineMember[]>([]);
  const [serverMemberApplications, setServerMemberApplications] = useState<Types.MemberApplication[]>([]);
  const [currentChannel, setCurrentChannel] = useState<Types.Channel>(Default.channel());
  const [channels, setChannels] = useState<Types.Channel[]>([]);
  const [channelEvents, setChannelEvents] = useState<Types.ChannelEvent[]>([]);
  const [channelMessages, setChannelMessages] = useState<Types.ChannelMessage[]>([]);
  const [actionMessages, setActionMessages] = useState<Types.PromptMessage[]>([]);
  const [systemNotifications, setSystemNotifications] = useState<string[]>([]);
  const [queueUsers, setQueueUsers] = useState<Types.QueueUser[]>([]);
  const [announcements, setAnnouncements] = useState<Types.Announcement[]>([]);
  const [notifications, setNotifications] = useState<Types.Notification[]>([]);
  const [recommendServers, setRecommendServers] = useState<Types.RecommendServer[]>([]);
  const [latency, setLatency] = useState<number>(0);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [region, setRegion] = useState<Types.LanguageKey>('en-US');

  // Variables
  const { userId, name: userName, currentServerId, currentChannelId } = user;
  const { name: currentServerName } = currentServer;

  // Handlers
  const clearChannelMessages = useCallback(() => {
    setChannelMessages([]);
  }, []);

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
    currentServerRef.current = currentServer;
  }, [currentServer]);

  useEffect(() => {
    currentChannelRef.current = currentChannel;
  }, [currentChannel]);

  useEffect(() => {
    serverOnlineMembersRef.current = serverOnlineMembers;
  }, [serverOnlineMembers]);

  useEffect(() => {
    selectedTabIdRef.current = mainTab.selectedTabId;
  }, [mainTab.selectedTabId]);

  useEffect(() => {
    if (user.userId) return;

    const userId = localStorage.getItem('userId');
    if (!userId) return;

    ipc.data.userHotReload({ userId }).then((user) => {
      if (user) {
        setUser(user);
        setIsSocketConnected(true);
      }
    });
  }, [user]);

  useEffect(() => {
    if (currentServerId && selectedTabIdRef.current !== 'server') setSelectedTabIdRef.current('server');
    else if (selectedTabIdRef.current === 'server') setSelectedTabIdRef.current('home');
    loadingBoxRef.current.setIsLoading(false);
    loadingBoxRef.current.setLoadingServerId('');
  }, [currentServerId]);

  useEffect(() => {
    const onTriggerHandleServerSelect = ({ key, newValue }: StorageEvent) => {
      if (key !== 'trigger-handle-server-select' || !newValue) return;
      const { serverDisplayId, serverId } = JSON.parse(newValue);
      if (loadingBox.isLoading) return;
      if (serverId === currentServerId) {
        mainTab.setSelectedTabId('server');
        return;
      }
      loadingBox.setIsLoading(true);
      loadingBox.setLoadingServerId(serverDisplayId);
      ipc.socket.send('connectServer', { serverId });
    };
    window.addEventListener('storage', onTriggerHandleServerSelect);
    return () => window.removeEventListener('storage', onTriggerHandleServerSelect);
  }, [currentServerId, mainTab, loadingBox]);

  useEffect(() => {
    if (!userId) return;
    const refresh = async () => {
      ipc.data.servers({ userId }).then((servers) => {
        if (servers) setServers(servers);
      });
      ipc.data.friends({ userId }).then((friends) => {
        if (friends) setFriends(friends);
      });
      ipc.data.friendActivities({ userId }).then((friendActivities) => {
        if (friendActivities) setFriendActivities(friendActivities);
      });
      ipc.data.friendGroups({ userId }).then((friendGroups) => {
        if (friendGroups) setFriendGroups(friendGroups);
      });
      ipc.data.friendApplications({ receiverId: userId }).then((friendApplications) => {
        if (friendApplications) setFriendApplications(friendApplications);
      });
      ipc.data.memberInvitations({ receiverId: userId }).then((memberInvitations) => {
        if (memberInvitations) setMemberInvitations(memberInvitations);
      });
      setSystemNotifications([]); // TODO: Implement system notification
    };
    refresh();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const refresh = async () => {
      ipc.data.announcements({ region }).then((announcements) => {
        if (announcements) setAnnouncements(announcements);
      });
      ipc.data.notifications({ region }).then((notifications) => {
        if (notifications) setNotifications(notifications);
      });
      ipc.data.recommendServers({ region }).then((recommendServerList) => {
        if (recommendServerList) setRecommendServers(recommendServerList);
      });
    };
    const interval = setInterval(() => refresh(), REFRESH_REGION_INFO_INTERVAL);
    refresh();
    return () => clearInterval(interval);
  }, [region, userId]);

  useEffect(() => {
    if (!userId) return;
    if (!currentServerId) {
      setCurrentServer(Default.server());
      setChannels([]);
      setServerOnlineMembers([]);
      setServerMemberApplications([]);
      setActionMessages([]);
      setChannelMessages([]);
      setQueueUsers([]);
      setChannelEvents([]);
      return;
    }
    const refresh = async () => {
      ipc.data.server({ userId, serverId: currentServerId }).then((server) => {
        if (server) setCurrentServer(server);
      });
      ipc.data.channels({ userId, serverId: currentServerId }).then((channels) => {
        if (channels) setChannels(channels);
      });
      ipc.data.serverOnlineMembers({ serverId: currentServerId }).then((serverOnlineMembers) => {
        if (serverOnlineMembers) setServerOnlineMembers(serverOnlineMembers);
      });
      ipc.data.memberApplications({ serverId: currentServerId }).then((serverMemberApplications) => {
        if (serverMemberApplications) setServerMemberApplications(serverMemberApplications);
      });
    };
    refresh();
  }, [userId, currentServerId]);

  useEffect(() => {
    if (!userId) return;
    if (!currentServerId || !currentChannelId) {
      setCurrentChannel(Default.channel());
      return;
    }
    const refresh = async () => {
      ipc.data.channel({ userId, serverId: currentServerId, channelId: currentChannelId }).then((channel) => {
        if (channel) setCurrentChannel(channel);
      });
    };
    refresh();
  }, [userId, currentServerId, currentChannelId]);

  useEffect(() => {
    const unsub = ipc.socket.on('connect', () => {
      ipc.popup.close('errorDialog');
      if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
      setIsSocketConnected(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('disconnect', () => {
      if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
      disconnectTimerRef.current = setTimeout(() => setIsSocketConnected(false), 30000);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('heartbeat', (...args: { seq: number; latency: number }[]) => {
      setLatency(args[0].latency);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('userUpdate', (...args: { update: Partial<Types.User> }[]) => {
      // Add activity when signature is updated
      const newActives = args.reduce<Types.FriendActivity[]>((acc, curr) => {
        if (curr.update.signature && userRef.current.signature !== curr.update.signature) {
          acc.push(Default.friendActivity({ ...userRef.current, content: curr.update.signature, timestamp: Date.now() }));
        }
        return acc;
      }, []);
      setFriendActivities((prev) => [...newActives, ...prev]);

      if (args[0].update.userId) localStorage.setItem('userId', args[0].update.userId);
      setUser((prev) => ({ ...prev, ...args[0].update }));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('userUpdate', (...args: { update: Partial<Types.User> }[]) => {
      const newCurrentServerId = args[0].update.currentServerId;
      if (newCurrentServerId !== undefined && newCurrentServerId !== currentServerId) {
        setChannels([]);
        setServerOnlineMembers([]);
        setServerMemberApplications([]);
        setActionMessages([]);
        setChannelMessages([]);
        setQueueUsers([]);
        setChannelEvents([]);
      }
    });
    return () => unsub();
  }, [currentServerId]);

  useEffect(() => {
    const unsub = ipc.socket.on('friendAdd', (...args: { data: Types.Friend }[]) => {
      const add = new Set(args.map((i) => `${i.data.targetId}`));
      setFriends((prev) => prev.filter((f) => !add.has(`${f.targetId}`)).concat(args.map((i) => i.data)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('friendUpdate', (...args: { targetId: string; update: Partial<Types.Friend> }[]) => {
      // Add activity when signature is updated
      const newActivities = args.reduce<Types.FriendActivity[]>((acc, curr) => {
        const targetFriend = friendsRef.current.find((f) => f.targetId === curr.targetId && f.relationStatus === 2);
        if (targetFriend && curr.update.signature && targetFriend.signature !== curr.update.signature) {
          acc.push(Default.friendActivity({ ...targetFriend, content: curr.update.signature, timestamp: Date.now() }));
        }
        return acc;
      }, []);
      setFriendActivities((prev) => [...newActivities, ...prev]);

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
    const unsub = ipc.socket.on('friendGroupAdd', (...args: { data: Types.FriendGroup }[]) => {
      const add = new Set(args.map((i) => `${i.data.friendGroupId}`));
      setFriendGroups((prev) => prev.filter((fg) => !add.has(`${fg.friendGroupId}`)).concat(args.map((i) => i.data)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('friendGroupUpdate', (...args: { friendGroupId: string; update: Partial<Types.FriendGroup> }[]) => {
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
    const unsub = ipc.socket.on('friendApplicationAdd', (...args: { data: Types.FriendApplication }[]) => {
      const add = new Set(args.map((i) => `${i.data.senderId}`));
      setFriendApplications((prev) => prev.filter((fa) => !add.has(`${fa.senderId}`)).concat(args.map((i) => i.data)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('friendApplicationUpdate', (...args: { senderId: string; update: Partial<Types.FriendApplication> }[]) => {
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
    const unsub = ipc.socket.on('serverAdd', (...args: { data: Types.Server }[]) => {
      const add = new Set(args.map((i) => `${i.data.serverId}`));
      setServers((prev) => prev.filter((s) => !add.has(`${s.serverId}`)).concat(args.map((i) => i.data)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('serverUpdate', (...args: { serverId: string; update: Partial<Types.Server> }[]) => {
      // Update current server
      const currentServerUpdate = args.filter((i) => i.serverId === currentServerRef.current.serverId).reduce<Partial<Types.Server>>((acc, curr) => ({ ...acc, ...curr.update }), {});
      setCurrentServer((prev) => ({ ...prev, ...currentServerUpdate }));

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
    const unsub = ipc.socket.on('serverOnlineMemberAdd', (...args: { data: Types.OnlineMember }[]) => {
      // Add channel events
      const newChannelEvents = args.reduce<Types.ChannelEvent[]>((acc, curr) => {
        const originMember = serverOnlineMembersRef.current.find((om) => om.userId === curr.data.userId && om.serverId === curr.data.serverId);
        if (!originMember) {
          acc.push({ ...curr.data, type: 'join' as Types.ChannelEvent['type'], prevChannelId: null, nextChannelId: curr.data.currentChannelId, timestamp: Date.now() });
        }
        return acc;
      }, []);
      setChannelEvents((prev) => [...newChannelEvents, ...prev]);

      const add = new Set(args.map((i) => `${i.data.userId}#${i.data.serverId}`));
      setServerOnlineMembers((prev) => args.map((i) => i.data).concat(prev.filter((m) => !add.has(`${m.userId}#${m.serverId}`))));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('serverOnlineMemberUpdate', (...args: { userId: string; serverId: string; update: Partial<Types.OnlineMember> }[]) => {
      // Add channel events
      const newChannelEvents = args.reduce<Types.ChannelEvent[]>((acc, curr) => {
        const originMember = serverOnlineMembersRef.current.find((om) => om.userId === curr.userId && om.serverId === curr.serverId);
        if (originMember && curr.update.currentChannelId) {
          acc.push({ ...originMember, type: 'move' as Types.ChannelEvent['type'], prevChannelId: originMember.currentChannelId, nextChannelId: curr.update.currentChannelId, timestamp: Date.now() });
        }
        return acc;
      }, []);
      setChannelEvents((prev) => [...newChannelEvents, ...prev]);

      const update = new Map(args.map((i) => [`${i.userId}#${i.serverId}`, i.update] as const));
      setServerOnlineMembers((prev) => prev.map((m) => (update.has(`${m.userId}#${m.serverId}`) ? { ...m, ...update.get(`${m.userId}#${m.serverId}`) } : m)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('serverOnlineMemberRemove', (...args: { userId: string; serverId: string }[]) => {
      // Add channel events
      const newChannelEvents = args.reduce<Types.ChannelEvent[]>((acc, curr) => {
        const originMember = serverOnlineMembersRef.current.find((om) => om.userId === curr.userId && om.serverId === curr.serverId);
        if (originMember) {
          acc.push({ ...originMember, type: 'leave' as Types.ChannelEvent['type'], prevChannelId: originMember.currentChannelId, nextChannelId: null, timestamp: Date.now() });
        }
        return acc;
      }, []);
      setChannelEvents((prev) => [...newChannelEvents, ...prev]);

      const remove = new Set(args.map((i) => `${i.userId}#${i.serverId}`));
      setServerOnlineMembers((prev) => prev.filter((m) => !remove.has(`${m.userId}#${m.serverId}`)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('serverMemberApplicationAdd', (...args: { data: Types.MemberApplication }[]) => {
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
    const unsub = ipc.socket.on('channelAdd', (...args: { data: Types.Channel }[]) => {
      const add = new Set(args.map((i) => `${i.data.channelId}`));
      setChannels((prev) => prev.filter((c) => !add.has(`${c.channelId}`)).concat(args.map((i) => i.data)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('channelUpdate', (...args: { channelId: string; update: Partial<Types.Channel> }[]) => {
      // Update current channel
      const currentChannelUpdate = args.filter((i) => i.channelId === currentChannelRef.current.channelId).reduce<Partial<Types.Channel>>((acc, curr) => ({ ...acc, ...curr.update }), {});
      setCurrentChannel((prev) => ({ ...prev, ...currentChannelUpdate }));

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
    const unsub = ipc.socket.on('memberInvitationAdd', (...args: { data: Types.MemberInvitation }[]) => {
      const add = new Set(args.map((i) => `${i.data.serverId}`));
      setMemberInvitations((prev) => prev.filter((mi) => !add.has(`${mi.serverId}`)).concat(args.map((i) => i.data)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('memberInvitationUpdate', (...args: { serverId: string; update: Partial<Types.MemberInvitation> }[]) => {
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
    const unsub = ipc.socket.on('channelMessage', (...args: Types.ChannelMessage[]) => {
      setChannelMessages((prev) => [...prev, ...args]);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('actionMessage', (...args: Types.PromptMessage[]) => {
      setActionMessages((prev) => [...prev, ...args]);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('queueMembersSet', (...args: Types.QueueUser[]) => {
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
    const unsub = ipc.socket.on('openPopup', (...args: { type: Types.PopupType; id: string; initialData?: unknown; force?: boolean }[]) => {
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
      Popup.openErrorDialog(error.message, () => {});
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('shakeWindow', (...args: any[]) => {
      const initialData: Record<string, unknown> | undefined = args[0].initialData;
      if (!initialData) return;
      ipc.popup.open('directMessage', `directMessage-${initialData.targetId}`, { ...initialData, event: 'shakeWindow', message: args[0] }, false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('directMessage', (...args: any[]) => {
      const initialData: Record<string, unknown> | undefined = args[0].initialData;
      if (!initialData) return;
      ipc.popup.open('directMessage', `directMessage-${initialData.targetId}`, { ...initialData, event: 'directMessage', message: args[0] }, false);
    });
    return () => unsub();
  }, []);

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
        break;
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
        break;
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
        break;
    }
  }, [mainTab.selectedTabId, userName, currentServerName, serverOnlineMembers.length, t]);

  return (
    <WebRTCProvider>
      <ActionScannerProvider>
        <ExpandedProvider>
          <Header user={user} currentServer={currentServer} friendApplications={friendApplications} memberInvitations={memberInvitations} systemNotifications={systemNotifications} />
          {!userId || !isSocketConnected ? (
            <LoadingSpinner />
          ) : (
            <>
              <HomePage user={user} servers={servers} announcements={announcements} recommendServers={recommendServers} display={mainTab.selectedTabId === 'home'} />
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
                onClearMessages={clearChannelMessages}
                display={mainTab.selectedTabId === 'server'}
                latency={latency}
              />
              <NotificationToaster notifications={notifications} />
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

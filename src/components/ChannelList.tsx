import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';

// CSS
import styles from '@/styles/server.module.css';
import header from '@/styles/header.module.css';

// Types
import type { OnlineMember, Channel, Server, User, Category, Friend, QueueUser, MemberApplication } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';
import { useFindMeContext } from '@/providers/FindMe';

// Components
import ChannelTab from '@/components/ChannelTab';
import CategoryTab from '@/components/CategoryTab';
import QueueMemberTab from '@/components/QueueMemberTab';
import LazyRender from '@/components/common/LazyRender';

// Services
import ipc from '@/services/ipc.service';

// Utils
import { handleOpenAlertDialog, handleOpenServerSetting, handleOpenEditNickname, handleOpenCreateChannel, handleOpenEditChannelOrder, handleOpenApplyMember } from '@/utils/popup';
import { isMember, isServerAdmin, isStaff } from '@/utils/permission';

interface ChannelListProps {
  user: User;
  friends: Friend[];
  server: Server;
  serverOnlineMembers: OnlineMember[];
  serverMemberApplications: MemberApplication[];
  currentChannel: Channel;
  channels: (Channel | Category)[];
  queueUsers: QueueUser[];
}

const ChannelList: React.FC<ChannelListProps> = React.memo(({ user, friends, server, serverOnlineMembers, serverMemberApplications, currentChannel, channels, queueUsers }) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();
  const findMe = useFindMeContext();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // States
  const [viewType, setViewType] = useState<'all' | 'current'>('all');
  const [latency, setLatency] = useState<number>(0);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Destructuring
  const { userId, permissionLevel: globalPermissionLevel } = user;
  const {
    serverId,
    name: serverName,
    avatarUrl: serverAvatarUrl,
    displayId: serverDisplayId,
    receiveApply: serverReceiveApply,
    permissionLevel: serverPermissionLevel,
    favorite: isFavorite,
    isVerified: isVerifiedServer,
  } = server;
  const { channelId: currentChannelId, name: currentChannelName, voiceMode: currentChannelVoiceMode, isLobby: currentChannelIsLobby } = currentChannel;

  // Memos
  const permissionLevel = useMemo(() => Math.max(globalPermissionLevel, serverPermissionLevel), [globalPermissionLevel, serverPermissionLevel]);
  const connectStatus = useMemo(() => 4 - Math.floor(Number(latency) / 50), [latency]);
  const serverUserIds = useMemo(() => serverOnlineMembers.map((m) => m.userId), [serverOnlineMembers]);
  const serverOnlineMemberMap = useMemo(() => new Map(serverOnlineMembers.map((m) => [m.userId, m] as const)), [serverOnlineMembers]);
  const filteredChannels = useMemo(() => channels.filter((c) => !!c && !c.categoryId).sort((a, b) => (a.order !== b.order ? a.order - b.order : a.createdAt - b.createdAt)), [channels]);
  const channelMemberMap = useMemo(() => {
    const map = new Map<string, OnlineMember[]>();
    for (const member of serverOnlineMembers) {
      const key = member.currentChannelId;
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(member);
    }
    return map;
  }, [serverOnlineMembers]);
  const targetChannelMeta = useMemo(() => channels.find((item) => item.channelId === currentChannelId), [channels, currentChannelId]);
  const targetCategoryId = useMemo(() => {
    if (!targetChannelMeta) return null;
    if ((targetChannelMeta as Channel).type === 'channel') {
      return (targetChannelMeta as Channel).categoryId ?? null;
    }
    return targetChannelMeta.channelId;
  }, [targetChannelMeta]);
  const filteredQueueMembers = useMemo<(QueueUser & OnlineMember)[]>(
    () =>
      queueUsers
        .reduce<(QueueUser & OnlineMember)[]>((acc, qm) => {
          if (qm.position < 0 || qm.leftTime <= 0) return acc;
          const online = serverOnlineMemberMap.get(qm.userId);
          if (!online) return acc;
          acc.push({ ...qm, ...online });
          return acc;
        }, [])
        .sort((a, b) => a.position - b.position),
    [queueUsers, serverOnlineMemberMap],
  );

  // Handlers
  const handleFavoriteServer = (serverId: Server['serverId']) => {
    ipc.socket.send('favoriteServer', { serverId });
  };

  const handleApplyMember = (userId: User['userId'], serverId: Server['serverId']) => {
    if (!serverReceiveApply) handleOpenAlertDialog(t('cannot-apply-member'), () => {});
    else handleOpenApplyMember(userId, serverId);
  };

  const handleLocateUser = () => {
    findMe.findMe();
    setSelectedItemId(`user-${userId}`);
  };

  const handleKickUsersFromServer = (userIds: User['userId'][], serverId: Server['serverId']) => {
    handleOpenAlertDialog(t('confirm-kick-users-from-server', { '0': userIds.length }), () => ipc.socket.send('blockUserFromServer', ...userIds.map((userId) => ({ userId, serverId }))));
  };

  // Effects
  useEffect(() => {
    for (const channel of channels) {
      setExpanded((prev) => ({ ...prev, [channel.channelId]: prev[channel.channelId] != undefined ? prev[channel.channelId] : true }));
    }
  }, [channels]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(ipc.latency.get());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (viewType !== 'all') return;
    if (!targetCategoryId) return;
    setExpanded((prev) => {
      if (prev[targetCategoryId]) return prev;
      return { ...prev, [targetCategoryId]: true };
    });
  }, [targetCategoryId, viewType]);

  const scrollToChannel = useCallback(
    (channelId: string) => {
      const container = scrollContainerRef.current;
      if (!container || !channelId) return false;
      const targetNode = container.querySelector<HTMLElement>(`[data-channel-scroll-id="channel-${channelId}"]`);
      if (!targetNode) return false;
      targetNode.scrollIntoView({
        block: 'center',
        behavior: 'smooth',
      });
      return true;
    },
    [scrollContainerRef],
  );

  useEffect(() => {
    if (viewType !== 'all') return;
    if (!currentChannelId) return;
    if (targetCategoryId && !expanded[targetCategoryId]) return;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const tryScroll = () => {
      const success = scrollToChannel(currentChannelId);
      if (success || attempts >= 8) {
        if (timer) clearTimeout(timer);
        return;
      }
      attempts += 1;
      timer = setTimeout(tryScroll, 120);
    };
    timer = setTimeout(tryScroll, 100);
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [viewType, currentChannelId, scrollToChannel, expanded, targetCategoryId]);

  return (
    <>
      {/* Header */}
      <div className={styles['sidebar-header']}>
        <div className={styles['avatar-box']} onClick={() => handleOpenServerSetting(userId, serverId)}>
          <div className={styles['avatar-picture']} style={{ backgroundImage: `url(${serverAvatarUrl})` }} />
        </div>
        <div className={styles['base-info-wrapper']}>
          <div className={styles['box']}>
            {!!isVerifiedServer && <div className={styles['verify-icon']} title={t('official-verified-server')}></div>}
            <div className={styles['name-text']}>{serverName} </div>
          </div>
          <div className={styles['box']}>
            <div className={styles['id-text']}>{serverDisplayId}</div>
            <div className={styles['member-text']}>{serverOnlineMembers.length > 0 && serverOnlineMembers.length}</div>
            <div className={styles['options']}>
              <div
                className={styles['invitation-icon']}
                onClick={() => {
                  // Handle invite friends
                }}
              />
              <div className={styles['saperator-1']} />
              <div
                className={styles['setting-icon']}
                onClick={(e) => {
                  const x = e.currentTarget.getBoundingClientRect().left;
                  const y = e.currentTarget.getBoundingClientRect().bottom;
                  contextMenu.showContextMenu(x, y, 'right-bottom', [
                    {
                      id: 'apply-member',
                      label: t('apply-member'),
                      show: !isMember(permissionLevel),
                      icon: 'applyMember',
                      onClick: () => handleApplyMember(userId, serverId),
                    },
                    {
                      id: 'member-management',
                      label: t('member-management'),
                      show: isServerAdmin(permissionLevel),
                      icon: 'memberManagement',
                      onClick: () => handleOpenServerSetting(userId, serverId),
                    },
                    {
                      id: 'separator',
                      label: '',
                    },
                    {
                      id: 'edit-nickname',
                      label: t('edit-nickname'),
                      icon: 'editGroupcard',
                      show: isMember(permissionLevel),
                      onClick: () => handleOpenEditNickname(userId, serverId),
                    },
                    {
                      id: 'locate-me',
                      label: t('locate-me'),
                      icon: 'locateme',
                      onClick: () => handleLocateUser(),
                    },
                    {
                      id: 'separator',
                      label: '',
                    },
                    {
                      id: 'report',
                      label: t('report'),
                      icon: 'report',
                      disabled: true,
                      onClick: () => {
                        /* TODO: handleOpenReport */
                      },
                    },
                    {
                      id: 'favorite',
                      label: isFavorite ? t('unfavorite') : t('favorite'),
                      icon: isFavorite ? 'collect' : 'uncollect',
                      onClick: () => handleFavoriteServer(serverId),
                    },
                  ]);
                }}
              >
                <div className={`${header['overlay']} ${isServerAdmin(permissionLevel) && serverMemberApplications.length > 0 ? header['new'] : ''}`} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Channel */}
      <div className={styles['current-channel-box']}>
        <div className={`${styles['current-channel-icon']} ${styles[`status${connectStatus}`]} has-hover-text`}>
          <div className={'hover-text'}>{`${latency}ms`}</div>
        </div>
        <div className={styles['current-channel-text']}>{currentChannelIsLobby ? t(`${currentChannelName}`) : currentChannelName}</div>
      </div>

      {/* Mic Queue */}
      {currentChannelVoiceMode === 'queue' && (
        <>
          <div className={styles['section-title-text']}>{t('mic-order')}</div>
          <div className={styles['scroll-view']} style={{ maxHeight: '120px' }}>
            <div className={styles['queue-list']}>
              {filteredQueueMembers.map((queueMember) => (
                <QueueMemberTab
                  key={queueMember.userId}
                  user={user}
                  friends={friends}
                  queueMember={queueMember}
                  server={server}
                  channel={currentChannel}
                  selectedItemId={selectedItemId}
                  setSelectedItemId={setSelectedItemId}
                />
              ))}
            </div>
          </div>
          <div className={styles['saperator-2']} />
        </>
      )}

      {/* Channel List Title */}
      <div className={styles['section-title-text']}>{viewType === 'current' ? t('current-channel') : t('all-channel')}</div>

      {/* Channel List */}
      <div
        className={styles['scroll-view']}
        ref={scrollContainerRef}
        onContextMenu={(e) => {
          e.preventDefault();
          const { clientX: x, clientY: y } = e;
          contextMenu.showContextMenu(x, y, 'right-bottom', [
            {
              id: 'create-channel',
              label: t('create-channel'),
              show: isServerAdmin(permissionLevel),
              onClick: () => handleOpenCreateChannel(userId, serverId, ''),
            },
            {
              id: 'separator',
              label: '',
            },
            {
              id: 'kick-all-users-from-server',
              label: t('kick-all-users-from-server'),
              show: isStaff(permissionLevel) && serverUserIds.length > 0,
              onClick: () => handleKickUsersFromServer(serverUserIds, serverId),
            },
            {
              id: 'separator',
              label: '',
            },
            {
              id: 'edit-channel-order',
              label: t('edit-channel-order'),
              show: isServerAdmin(permissionLevel),
              onClick: () => handleOpenEditChannelOrder(userId, serverId),
            },
          ]);
        }}
      >
        <div className={styles['channel-list']}>
          {viewType === 'current' ? (
            <ChannelTab
              key={currentChannelId}
              user={user}
              friends={friends}
              server={server}
              serverOnlineMembers={serverOnlineMembers}
              channel={currentChannel}
              currentChannel={currentChannel}
              queueUsers={queueUsers}
              expanded={{ [currentChannelId]: true }}
              selectedItemId={selectedItemId}
              setExpanded={() => {}}
              setSelectedItemId={setSelectedItemId}
              channelMemberMap={channelMemberMap}
            />
          ) : (
            filteredChannels.map((item) =>
              item.type === 'category' ? (
                <LazyRender
                  key={`category-${item.channelId}`}
                  root={scrollContainerRef}
                  placeholderHeight={56}
                  forceVisible={viewType === 'all' && targetCategoryId === item.channelId}
                >
                  <CategoryTab
                    user={user}
                    friends={friends}
                    server={server}
                    serverOnlineMembers={serverOnlineMembers}
                    category={item as Category}
                    channels={channels}
                    currentChannel={currentChannel}
                    queueUsers={queueUsers}
                    expanded={expanded}
                    selectedItemId={selectedItemId}
                    setExpanded={setExpanded}
                    setSelectedItemId={setSelectedItemId}
                    channelMemberMap={channelMemberMap}
                  />
                </LazyRender>
              ) : (
                <LazyRender
                  key={`channel-${item.channelId}`}
                  root={scrollContainerRef}
                  placeholderHeight={48}
                  forceVisible={viewType === 'all' && currentChannelId === item.channelId}
                >
                  <ChannelTab
                    user={user}
                    friends={friends}
                    server={server}
                    serverOnlineMembers={serverOnlineMembers}
                    channel={item as Channel}
                    currentChannel={currentChannel}
                    queueUsers={queueUsers}
                    expanded={expanded}
                    selectedItemId={selectedItemId}
                    setExpanded={setExpanded}
                    setSelectedItemId={setSelectedItemId}
                    channelMemberMap={channelMemberMap}
                  />
                </LazyRender>
              ),
            )
          )}
        </div>
      </div>

      {/* Saperator */}
      <div className={styles['saperator-3']} />

      {/* Footer */}
      <div className={styles['sidebar-footer']}>
        <div className={`${styles['navegate-tab']} ${viewType === 'current' ? styles['active'] : ''}`} onClick={() => setViewType('current')}>
          {t('current-channel')}
        </div>
        <div className={`${styles['navegate-tab']} ${viewType === 'all' ? styles['active'] : ''}`} onClick={() => setViewType('all')}>
          {t('all-channel')}
        </div>
      </div>
    </>
  );
});

ChannelList.displayName = 'ChannelList';

export default ChannelList;

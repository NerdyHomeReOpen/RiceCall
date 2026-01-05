import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import ChannelTab from '@/components/ChannelTab';
import CategoryTab from '@/components/CategoryTab';
import QueueUserTab from '@/components/QueueUserTab';

import { useContextMenu } from '@/providers/ContextMenu';
import { useFindMeContext } from '@/providers/FindMe';

import * as Popup from '@/utils/popup';
import * as Permission from '@/utils/permission';

import styles from '@/styles/server.module.css';
import header from '@/styles/header.module.css';

interface ChannelListProps {
  user: Types.User;
  currentServer: Types.Server;
  currentChannel: Types.Channel;
  friends: Types.Friend[];
  queueUsers: Types.QueueUser[];
  serverOnlineMembers: Types.OnlineMember[];
  serverMemberApplications: Types.MemberApplication[];
  channels: (Types.Channel | Types.Category)[];
  latency: number;
}

const ChannelList: React.FC<ChannelListProps> = React.memo(({ user, currentServer, currentChannel, friends, queueUsers, serverOnlineMembers, serverMemberApplications, channels, latency }) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();
  const findMe = useFindMeContext();

  // Refs
  const queueListRef = useRef<HTMLDivElement>(null);
  const isResizingQueueListRef = useRef<boolean>(false);

  // States
  const [viewType, setViewType] = useState<'all' | 'current'>('all');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Variables
  const { userId } = user;
  const {
    serverId: currentServerId,
    name: currentServerName,
    avatarUrl: currentServerAvatarUrl,
    displayId: currentServerDisplayId,
    specialId: currentServerSpecialId,
    receiveApply: currentServerReceiveApply,
    favorite: isCurrentServerFavorite,
    isVerified: isCurrentServerVerified,
  } = currentServer;
  const { channelId: currentChannelId, name: currentChannelName, voiceMode: currentChannelVoiceMode, isLobby: isCurrentChannelLobby } = currentChannel;
  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel);
  const connectStatus = 4 - Math.floor(Number(latency) / 50);
  const movableServerUserIds = useMemo(
    () => serverOnlineMembers.filter((m) => m.userId !== userId && m.permissionLevel <= permissionLevel).map((m) => m.userId),
    [userId, serverOnlineMembers, permissionLevel],
  );
  const serverOnlineMemberMap = useMemo(() => new Map(serverOnlineMembers.map((m) => [m.userId, m] as const)), [serverOnlineMembers]);
  const filteredChannels = useMemo(() => channels.filter((c) => !!c && !c.categoryId).sort((a, b) => (a.order !== b.order ? a.order - b.order : a.createdAt - b.createdAt)), [channels]);
  const queueMembers = useMemo<Types.QueueMember[]>(
    () =>
      queueUsers
        .reduce<Types.QueueMember[]>((acc, qm) => {
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
  const getContextMenuItems1 = () => [
    {
      id: 'apply-member',
      label: t('apply-member'),
      show: !Permission.isMember(permissionLevel),
      icon: 'applyMember',
      onClick: () => handleApplyMember(userId, currentServerId),
    },
    {
      id: 'member-management',
      label: t('member-management'),
      show: Permission.isServerAdmin(permissionLevel),
      icon: 'memberManagement',
      onClick: () => Popup.handleOpenServerSetting(userId, currentServerId),
    },
    {
      id: 'separator',
      label: '',
    },
    {
      id: 'edit-nickname',
      label: t('edit-nickname'),
      icon: 'editGroupcard',
      show: Permission.isMember(permissionLevel),
      onClick: () => Popup.handleOpenEditNickname(userId, currentServerId),
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
        // window.open('https://ricecall.com/report-server', '_blank');
      },
    },
    {
      id: 'favorite',
      label: isCurrentServerFavorite ? t('unfavorite') : t('favorite'),
      icon: isCurrentServerFavorite ? 'collect' : 'uncollect',
      onClick: () => handleFavoriteServer(currentServerId),
    },
  ];

  const getContextMenuItems2 = () => [
    {
      id: 'create-channel',
      label: t('create-channel'),
      show: Permission.isServerAdmin(permissionLevel),
      onClick: () => Popup.handleOpenCreateChannel(userId, currentServerId, ''),
    },
    {
      id: 'separator',
      label: '',
    },
    {
      id: 'kick-all-users-from-server',
      label: t('kick-all-users-from-server'),
      show: Permission.isStaff(permissionLevel) && movableServerUserIds.length > 0,
      onClick: () => handleKickUsersFromServer(movableServerUserIds, currentServerId),
    },
    {
      id: 'separator',
      label: '',
    },
    {
      id: 'broadcast',
      label: t('broadcast'),
      show: Permission.isServerAdmin(permissionLevel),
      onClick: () => Popup.handleOpenServerBroadcast(currentServerId, currentChannelId),
    },
    {
      id: 'edit-channel-order',
      label: t('edit-channel-order'),
      show: Permission.isServerAdmin(permissionLevel),
      onClick: () => Popup.handleOpenEditChannelOrder(userId, currentServerId),
    },
  ];

  const handleFavoriteServer = (serverId: Types.Server['serverId']) => {
    ipc.socket.send('favoriteServer', { serverId });
  };

  const handleApplyMember = (userId: Types.User['userId'], serverId: Types.Server['serverId']) => {
    if (!currentServerReceiveApply) Popup.handleOpenAlertDialog(t('cannot-apply-member'), () => {});
    else Popup.handleOpenApplyMember(userId, serverId);
  };

  const handleLocateUser = () => {
    findMe.findMe();
    setSelectedItemId(`user-${userId}`);
  };

  const handleKickUsersFromServer = (userIds: Types.User['userId'][], serverId: Types.Server['serverId']) => {
    Popup.handleOpenAlertDialog(t('confirm-kick-users-from-server', { '0': userIds.length }), () => ipc.socket.send('blockUserFromServer', ...userIds.map((userId) => ({ userId, serverId }))));
  };

  const handleQueueListHandleDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isResizingQueueListRef.current = true;
  };

  const handleQueueListHandleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizingQueueListRef.current || !queueListRef.current) return;
    queueListRef.current.style.maxHeight = `${e.clientY - queueListRef.current.offsetTop}px`;
  };

  // Effects
  useEffect(() => {
    for (const channel of channels) {
      setExpanded((prev) => ({ ...prev, [channel.channelId]: prev[channel.channelId] != undefined ? prev[channel.channelId] : true }));
    }
  }, [channels]);

  useEffect(() => {
    const onPointerup = () => {
      isResizingQueueListRef.current = false;
    };
    document.addEventListener('pointerup', onPointerup);
    return () => document.removeEventListener('pointerup', onPointerup);
  }, []);

  return (
    <>
      <div className={styles['sidebar-header']}>
        <div className={styles['avatar-box']} onClick={() => Popup.handleOpenServerSetting(userId, currentServerId)}>
          <div className={styles['avatar-picture']} style={{ backgroundImage: `url(${currentServerAvatarUrl})` }} />
        </div>
        <div className={styles['base-info-wrapper']}>
          <div className={styles['box']}>
            {!!isCurrentServerVerified && <div className={styles['verify-icon']} title={t('official-verified-server')}></div>}
            <div className={styles['name-text']}>{currentServerName} </div>
          </div>
          <div className={styles['box']}>
            <div className={styles['id-text']}>{currentServerSpecialId || currentServerDisplayId}</div>
            <div className={styles['member-text']}>{serverOnlineMembers.length}</div>
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
                  contextMenu.showContextMenu(x, y, 'right-bottom', getContextMenuItems1());
                }}
              >
                <div className={`${header['overlay']} ${Permission.isServerAdmin(permissionLevel) && serverMemberApplications.length > 0 ? header['new'] : ''}`} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={styles['current-channel-box']}>
        <div className={`${styles['current-channel-icon']} ${styles[`status${connectStatus}`]} has-hover-text`}>
          <div className={'hover-text'}>{`${latency}ms`}</div>
        </div>
        <div className={styles['current-channel-text']}>{isCurrentChannelLobby ? t(currentChannelName) : currentChannelName}</div>
      </div>
      {currentChannelVoiceMode === 'queue' && (
        <>
          <div className={styles['section-title-text']}>{t('mic-order')}</div>
          <div ref={queueListRef} className={styles['scroll-view']} style={{ minHeight: '120px', maxHeight: '120px' }}>
            <div className={styles['queue-list']}>
              {queueMembers.map((queueMember) => (
                <QueueUserTab
                  key={queueMember.userId}
                  user={user}
                  friends={friends}
                  queueMember={queueMember}
                  queueMembers={queueMembers}
                  currentServer={currentServer}
                  currentChannel={currentChannel}
                  selectedItemId={selectedItemId}
                  setSelectedItemId={setSelectedItemId}
                />
              ))}
            </div>
          </div>
          <div className={styles['saperator-2']} onPointerDown={handleQueueListHandleDown} onPointerMove={handleQueueListHandleMove} />
        </>
      )}
      <div className={styles['section-title-text']}>{viewType === 'current' ? t('current-channel') : t('all-channel')}</div>
      <div
        className={styles['scroll-view']}
        onContextMenu={(e) => {
          e.preventDefault();
          const { clientX: x, clientY: y } = e;
          contextMenu.showContextMenu(x, y, 'right-bottom', getContextMenuItems2());
        }}
      >
        <div className={styles['channel-list']}>
          {viewType === 'current' ? (
            <ChannelTab
              key={currentChannelId}
              user={user}
              currentServer={currentServer}
              currentChannel={currentChannel}
              friends={friends}
              queueUsers={queueUsers}
              serverOnlineMembers={serverOnlineMembers}
              channel={currentChannel}
              expanded={{ [currentChannelId]: true }}
              selectedItemId={selectedItemId}
              setExpanded={() => {}}
              setSelectedItemId={setSelectedItemId}
            />
          ) : (
            filteredChannels.map((item) =>
              item.type === 'category' ? (
                <CategoryTab
                  key={item.channelId}
                  user={user}
                  currentServer={currentServer}
                  currentChannel={currentChannel}
                  friends={friends}
                  queueUsers={queueUsers}
                  serverOnlineMembers={serverOnlineMembers}
                  channels={channels}
                  category={item as Types.Category}
                  expanded={expanded}
                  selectedItemId={selectedItemId}
                  setExpanded={setExpanded}
                  setSelectedItemId={setSelectedItemId}
                />
              ) : (
                <ChannelTab
                  key={item.channelId}
                  user={user}
                  currentServer={currentServer}
                  currentChannel={currentChannel}
                  friends={friends}
                  queueUsers={queueUsers}
                  serverOnlineMembers={serverOnlineMembers}
                  channel={item as Types.Channel}
                  expanded={expanded}
                  selectedItemId={selectedItemId}
                  setExpanded={setExpanded}
                  setSelectedItemId={setSelectedItemId}
                />
              ),
            )
          )}
        </div>
      </div>
      <div className={styles['saperator-3']} />
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

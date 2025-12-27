import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import ChannelTab from '@/components/ChannelTab';
import CategoryTab from '@/components/CategoryTab';
import QueueUserTab from '@/components/QueueUserTab';

import { useContextMenu } from '@/providers/ContextMenu';
import { useFindMeContext } from '@/providers/FindMe';

import * as Popup from '@/utils/popup';
import * as Permission from '@/utils/permission';
import CtxMenuBuilder from '@/utils/ctxMenuBuilder';

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
  const getContextMenuItems1 = () =>
    new CtxMenuBuilder()
      .addApplyMemberOption({ permissionLevel }, () => Popup.applyMember(userId, currentServerId, currentServerReceiveApply))
      .addServerSettingOption({ permissionLevel }, () => Popup.openServerSetting(userId, currentServerId))
      .addSeparator()
      .addEditNicknameOption({ permissionLevel, isSelf: true, isSuperior: false }, () => Popup.openEditNickname(userId, currentServerId))
      .addLocateMeOption(() => locateMe())
      .addSeparator()
      .addReportOption(() => {})
      .addFavoriteServerOption({ isFavorite: isCurrentServerFavorite }, () => Popup.favoriteServer(currentServerId))
      .build();

  const getContextMenuItems2 = () =>
    new CtxMenuBuilder()
      .addCreateChannelOption({ permissionLevel }, () => Popup.openCreateChannel(userId, currentServerId, ''))
      .addSeparator()
      .addKickAllUsersFromServerOption({ permissionLevel, movableUserIds: movableServerUserIds }, () => Popup.kickUsersFromServer(movableServerUserIds, currentServerId))
      .addSeparator()
      .addBroadcastOption({ permissionLevel }, () => Popup.openServerBroadcast(currentServerId, currentChannelId))
      .addSeparator()
      .addEditChannelOrderOption({ permissionLevel }, () => Popup.openEditChannelOrder(userId, currentServerId))
      .build();

  const locateMe = () => {
    findMe.findMe();
    setSelectedItemId(`user-${userId}`);
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
        <div className={styles['avatar-box']} onClick={() => Popup.openServerSetting(userId, currentServerId)}>
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
              <div className={styles['invitation-icon']} onClick={() => Popup.openInviteFriend(userId, currentServerId)} />
              <div className={styles['saperator-1']} />
              <div
                className={styles['setting-icon']}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const { left: x, top: y } = e.currentTarget.getBoundingClientRect();
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
          e.stopPropagation();
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

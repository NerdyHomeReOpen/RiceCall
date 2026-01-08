import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hook';

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

const ChannelList: React.FC = React.memo(() => {
  // Hooks
  const { t } = useTranslation();
  const { showContextMenu } = useContextMenu();
  const { findMe } = useFindMeContext();

  // Selectors
  const user = useAppSelector((state) => state.user.data);
  const currentServer = useAppSelector((state) => state.currentServer.data);
  const currentChannel = useAppSelector((state) => state.currentChannel.data);
  const memberApplications = useAppSelector((state) => state.memberApplications.data);
  const onlineMembers = useAppSelector((state) => state.onlineMembers.data);
  const channels = useAppSelector((state) => state.channels.data);
  const queueUsers = useAppSelector((state) => state.queueUsers.data);
  const latency = useAppSelector((state) => state.socket.latency);

  // Refs
  const queueListRef = useRef<HTMLDivElement>(null);
  const isResizingQueueListRef = useRef<boolean>(false);

  // States
  const [selectedTabId, setSelectedTabId] = useState<'all' | 'current'>('all');
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
  const hasNewMemberApplications = Permission.isServerAdmin(permissionLevel) && memberApplications.length > 0;
  const isAllTab = useMemo(() => selectedTabId === 'all', [selectedTabId]);
  const isCurrentTab = useMemo(() => selectedTabId === 'current', [selectedTabId]);
  const connectStatus = 4 - Math.floor(Number(latency) / 50);
  const movableServerUserIds = useMemo(
    () => onlineMembers.filter((om) => om.userId !== userId && om.permissionLevel <= permissionLevel).map((om) => om.userId),
    [onlineMembers, userId, permissionLevel],
  );
  const filteredChannels = useMemo(() => [...channels].filter((c) => !c.categoryId).sort((a, b) => (a.order !== b.order ? a.order - b.order : a.createdAt - b.createdAt)), [channels]);

  // Functions
  const getServerSettingContextMenuItems = () =>
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

  const getChannelListContextMenuItems = () =>
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
    findMe();
    setSelectedItemId(`user-${userId}`);
  };

  // Handlers
  const handleQueueListHandleDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isResizingQueueListRef.current = true;
  };

  const handleQueueListHandleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizingQueueListRef.current || !queueListRef.current) return;
    queueListRef.current.style.maxHeight = `${e.clientY - queueListRef.current.offsetTop}px`;
  };

  const handleInviteFriendClick = () => {
    Popup.openInviteFriend(userId, currentServerId);
  };

  const handleServerSettingClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { left: x, bottom: y } = e.currentTarget.getBoundingClientRect();
    showContextMenu(x, y, 'right-bottom', getServerSettingContextMenuItems());
  };

  const handleServerAvatarClick = () => {
    Popup.openServerSetting(userId, currentServerId);
  };

  const handleChannelListContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', getChannelListContextMenuItems());
  };

  const handleCurrentChannelTabClick = () => {
    setSelectedTabId('current');
  };

  const handleAllChannelTabClick = () => {
    setSelectedTabId('all');
  };

  // Effects
  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev };
      channels.forEach((c) => (next[c.channelId] = next[c.channelId] != undefined ? next[c.channelId] : true));
      return next;
    });
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
        <div className={styles['avatar-box']} onClick={handleServerAvatarClick}>
          <Image className={styles['avatar-picture']} src={currentServerAvatarUrl} alt={currentServerName} width={50} height={50} loading="lazy" draggable="false" />
        </div>
        <div className={styles['base-info-wrapper']}>
          <div className={styles['box']}>
            {!!isCurrentServerVerified && <div className={styles['verify-icon']} title={t('official-verified-server')} />}
            <div className={styles['name-text']}>{currentServerName} </div>
          </div>
          <div className={styles['box']}>
            <div className={styles['id-text']}>{currentServerSpecialId || currentServerDisplayId}</div>
            <div className={styles['member-text']}>{onlineMembers.length}</div>
            <div className={styles['options']}>
              <div className={styles['invitation-icon']} onClick={handleInviteFriendClick} />
              <div className={styles['saperator-1']} />
              <div className={styles['setting-icon']} onClick={handleServerSettingClick}>
                <div className={`${header['overlay']} ${hasNewMemberApplications ? header['new'] : ''}`} />
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
              {queueUsers.map((queueUser) => (
                <QueueUserTab key={queueUser.userId} queueUser={queueUser} selectedItemId={selectedItemId} setSelectedItemId={setSelectedItemId} />
              ))}
            </div>
          </div>
          <div className={styles['saperator-2']} onPointerDown={handleQueueListHandleDown} onPointerMove={handleQueueListHandleMove} />
        </>
      )}
      <div className={styles['section-title-text']}>{isCurrentTab ? t('current-channel') : t('all-channel')}</div>
      <div className={styles['scroll-view']} onContextMenu={handleChannelListContextMenu}>
        <div className={styles['channel-list']}>
          {isCurrentTab ? (
            <ChannelTab key={currentChannelId} channel={currentChannel} selectedItemId={selectedItemId} setSelectedItemId={setSelectedItemId} />
          ) : (
            filteredChannels.map((item) =>
              item.type === 'category' ? (
                <CategoryTab key={item.channelId} category={item} expanded={expanded} selectedItemId={selectedItemId} setSelectedItemId={setSelectedItemId} />
              ) : (
                <ChannelTab key={item.channelId} channel={item} expanded={expanded} selectedItemId={selectedItemId} setSelectedItemId={setSelectedItemId} />
              ),
            )
          )}
        </div>
      </div>
      <div className={styles['saperator-3']} />
      <div className={styles['sidebar-footer']}>
        <div className={`${styles['navegate-tab']} ${isCurrentTab ? styles['active'] : ''}`} onClick={handleCurrentChannelTabClick}>
          {t('current-channel')}
        </div>
        <div className={`${styles['navegate-tab']} ${isAllTab ? styles['active'] : ''}`} onClick={handleAllChannelTabClick}>
          {t('all-channel')}
        </div>
      </div>
    </>
  );
});

ChannelList.displayName = 'ChannelList';

export default ChannelList;

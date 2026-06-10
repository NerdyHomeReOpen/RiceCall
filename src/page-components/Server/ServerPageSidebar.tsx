import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import * as Types from '@/types';

import * as Store from '@/store';

import { openCreateChannel, kickUsersFromServer, openEditChannelOrder, openServerBroadcast, openInviteFriend, openServerSetting, openEditNickname, favoriteServer, applyMember } from '@/services';

import { useContextMenu } from '@/providers/ContextMenu';
import { useLocateMeContext } from '@/providers/LocateMe';

import { useAppDispatch, useAppSelector } from '@/hooks/useStore';

import ChannelTab from './ChannelTab';
import CategoryTab from './CategoryTab';
import QueueUserTab from './QueueUserTab';

import { DEFAULT_SERVER_AVATAR_URL } from '@/constants';

import ContextMenu from '@/utils/contextMenu';

import styles from './Server.module.css';

const ServerPageSidebar: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const { showContextMenu } = useContextMenu();
  const { locateMe } = useLocateMeContext();
  const dispatch = useAppDispatch();

  const userId = useAppSelector((state) => state.user.data.userId);
  const userPermissionLevel = useAppSelector((state) => state.user.data.permissionLevel);
  const currentServerId = useAppSelector((state) => state.currentServer.data.serverId);
  const currentServerPermissionLevel = useAppSelector((state) => state.currentServer.data.permissionLevel);
  const currentServerFavorite = useAppSelector((state) => state.currentServer.data.favorite);
  const currentServerAvatarUrl = useAppSelector((state) => state.currentServer.data.avatarUrl);
  const currentServerName = useAppSelector((state) => state.currentServer.data.name);
  const currentServerSpecialId = useAppSelector((state) => state.currentServer.data.specialId);
  const currentServerDisplayId = useAppSelector((state) => state.currentServer.data.displayId);
  const currentServerIsVerified = useAppSelector((state) => state.currentServer.data.isVerified);
  const currentServerReceiveApply = useAppSelector((state) => state.currentServer.data.receiveApply);
  const currentChannel = useAppSelector((state) => state.currentChannel.data, shallowEqual);
  const memberApplicationsCount = useAppSelector((state) => state.memberApplications.data.length);
  const onlineMembers = useAppSelector((state) => state.onlineMembers.data, shallowEqual);
  const channels = useAppSelector((state) => state.channels.data.filter((c) => !c.categoryId).sort((a, b) => a.order - b.order), shallowEqual);
  const queueUserIds = useAppSelector((state) => state.queueUsers.data.filter((q) => q.position >= 0).map((q) => q.userId), shallowEqual);
  const socketLatency = useAppSelector((state) => state.socket.latency);
  const webrtcLatency = useAppSelector((state) => state.webrtc.latency);

  const queueListEl = useRef<HTMLDivElement>(null);
  const isResizingQueueList = useRef<boolean>(false);

  const [selectedTabId, setSelectedTabId] = useState<'all' | 'current'>('all');

  const permissionLevel = Math.max(userPermissionLevel, currentServerPermissionLevel);
  const movableServerUserIds = onlineMembers.filter((om) => om.userId !== userId && om.permissionLevel <= permissionLevel).map((om) => om.userId);
  const allTabIsSelected = selectedTabId === 'all';
  const currentTabIsSelected = selectedTabId === 'current';
  const currentChannelIsQueueMode = currentChannel.voiceMode === 'queue';
  const connectStatus = 4 - Math.floor(Number(Math.max(socketLatency, webrtcLatency)) / 50);
  const hasNewMemberApplications = permissionLevel >= Types.Permission.ServerAdmin && memberApplicationsCount > 0;

  const handleLocateMe = () => {
    locateMe();
    dispatch(Store.setSelectedItemId(`user-${userId}`));
  };

  const handleQueueListHandleDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);

    isResizingQueueList.current = true;
  };

  const handleQueueListHandleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizingQueueList.current || !queueListEl.current) return;

    queueListEl.current.style.maxHeight = `${e.clientY - queueListEl.current.offsetTop}px`;
  };

  const handleInviteFriendClick = () => {
    openInviteFriend(userId, currentServerId);
  };

  const handleServerSettingClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const { left: x, bottom: y } = e.currentTarget.getBoundingClientRect();

    const contextMenu = new ContextMenu()
      .addApplyMemberOption({ permissionLevel }, () => applyMember(userId, currentServerId, currentServerReceiveApply))
      .addServerSettingOption({ permissionLevel }, () => openServerSetting(userId, currentServerId))
      .addSeparator()
      .addEditNicknameOption({ permissionLevel, targetIsSelf: true, targetHasLowerLevel: false }, () => openEditNickname(userId, currentServerId))
      .addLocateMeOption(() => handleLocateMe())
      .addSeparator()
      .addReportOption(() => window.open('https://ricecall.com/report-server', '_blank'))
      .addFavoriteServerOption({ serverIsFavorite: currentServerFavorite }, () => favoriteServer(currentServerId))
      .build();

    showContextMenu(x, y, 'right-bottom', contextMenu);
  };

  const handleServerAvatarClick = () => {
    openServerSetting(userId, currentServerId);
  };

  const handleChannelListContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const { clientX: x, clientY: y } = e;

    const contextMenu = new ContextMenu()
      .addCreateChannelOption({ permissionLevel }, () => openCreateChannel(userId, currentServerId))
      .addSeparator()
      .addKickAllUsersFromServerOption({ permissionLevel, userIdsToKick: movableServerUserIds }, () => kickUsersFromServer(movableServerUserIds, currentServerId))
      .addSeparator()
      .addBroadcastOption({ permissionLevel }, () => openServerBroadcast(currentServerId, currentChannel.channelId))
      .addSeparator()
      .addEditChannelOrderOption({ permissionLevel }, () => openEditChannelOrder(userId, currentServerId))
      .build();

    showContextMenu(x, y, 'right-bottom', contextMenu);
  };

  const handleCurrentChannelTabClick = () => {
    setSelectedTabId('current');
  };

  const handleAllChannelTabClick = () => {
    setSelectedTabId('all');
  };

  useEffect(() => {
    const onPointerup = () => {
      isResizingQueueList.current = false;
    };

    document.addEventListener('pointerup', onPointerup);

    return () => {
      document.removeEventListener('pointerup', onPointerup);
    };
  }, []);

  useEffect(() => {
    locateMe();
  }, [locateMe]);

  return (
    <>
      <div className={styles['sidebar-header']}>
        <div className={styles['server-avatar']} onClick={handleServerAvatarClick}>
          <Image src={currentServerAvatarUrl || DEFAULT_SERVER_AVATAR_URL} alt="server_avatar" width={50} height={50} loading="lazy" draggable="false" />
        </div>
        <div className={styles['server-info-wrapper']}>
          <div className={styles['server-info-box']}>
            {!!currentServerIsVerified && <div className={styles['server-verify-icon']} title={t('official-verified-server')} />}
            <div className={styles['server-name-text']}>{currentServerName} </div>
          </div>
          <div className={styles['server-info-box']}>
            <div className={styles['server-id-text']}>{currentServerSpecialId || currentServerDisplayId}</div>
            <div className={styles['server-online-count-text']}>{onlineMembers.length}</div>
            <div className={styles['server-options']}>
              <div className={styles['invitation-button']} onClick={handleInviteFriendClick} />
              <div className={styles['options-separator']} />
              <div className={styles['setting-button']} onClick={handleServerSettingClick}>
                <div className={`${styles['setting-overlay']} ${hasNewMemberApplications ? styles['new'] : ''}`} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={styles['current-channel-box']}>
        <div className={`${styles['current-channel-icon']} ${styles[`status${connectStatus}`]} has-hover-text`}>
          <div className={'hover-text'}>
            {`${t('latency', { 0: socketLatency || '-' })}`}
            <br />
            {`${t('audio-latency', { 0: webrtcLatency || '-' })}`}
          </div>
        </div>
        <div className={styles['current-channel-name-text']}>{currentChannel.isLobby ? t(currentChannel.name) : currentChannel.name}</div>
      </div>
      {currentChannelIsQueueMode && (
        <>
          <div className={styles['section-title-text']}>{t('mic-order')}</div>
          <div ref={queueListEl} className={styles['scroll-view']} style={{ minHeight: '120px', maxHeight: '120px' }}>
            <div className={styles['queue-list']}>
              {queueUserIds.map((queueUserId) => (
                <QueueUserTab key={queueUserId} queueUserId={queueUserId} />
              ))}
            </div>
          </div>
          <div className={styles['queue-list-separator']} onPointerDown={handleQueueListHandleDown} onPointerMove={handleQueueListHandleMove} />
        </>
      )}
      <div className={styles['section-title-text']}>{currentTabIsSelected ? t('current-channel') : t('all-channel')}</div>
      <div className={styles['scroll-view']} onContextMenu={handleChannelListContextMenu}>
        <div className={styles['channel-list']}>
          {currentTabIsSelected ? (
            <ChannelTab key={currentChannel.channelId} channel={currentChannel} />
          ) : (
            channels.map((item) => (item.type === 'category' ? <CategoryTab key={item.channelId} category={item} /> : <ChannelTab key={item.channelId} channel={item} />))
          )}
        </div>
      </div>
      <div className={styles['channel-list-separator']} />
      <div className={styles['sidebar-footer']}>
        <div className={`${styles['sidebar-navigate-tab']} ${currentTabIsSelected ? styles['active'] : ''}`} onClick={handleCurrentChannelTabClick}>
          {t('current-channel')}
        </div>
        <div className={`${styles['sidebar-navigate-tab']} ${allTabIsSelected ? styles['active'] : ''}`} onClick={handleAllChannelTabClick}>
          {t('all-channel')}
        </div>
      </div>
    </>
  );
});

ServerPageSidebar.displayName = 'ServerPageSidebar';

export default ServerPageSidebar;

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { Permission } from '@/types';

import * as Store from '@/store';

import { openInviteFriend, openServerSetting } from '@/services';

import { useContextMenu } from '@/providers/ContextMenu';
import { useLocateMeContext } from '@/providers/LocateMe';

import { useAppDispatch, useAppSelector } from '@/hooks/Store';
import { useChannelListContextMenu } from '@/hooks/ContextMenus/ChannelList';
import { useServerSettingContextMenu } from '@/hooks/ContextMenus/ServerSetting';

import ChannelTab from '@/components/ChannelTab';
import CategoryTab from '@/components/CategoryTab';
import QueueUserTab from '@/components/QueueUserTab';

import styles from './Server.module.css';

const ServerPageSidebar: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const { showContextMenu } = useContextMenu();
  const { locateMe } = useLocateMeContext();
  const dispatch = useAppDispatch();

  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
      permissionLevel: state.user.data.permissionLevel,
    }),
    shallowEqual,
  );

  const currentServer = useAppSelector(
    (state) => ({
      serverId: state.currentServer.data.serverId,
      permissionLevel: state.currentServer.data.permissionLevel,
      receptionLobbyId: state.currentServer.data.receptionLobbyId,
      favorite: state.currentServer.data.favorite,
      avatarUrl: state.currentServer.data.avatarUrl,
      name: state.currentServer.data.name,
      specialId: state.currentServer.data.specialId,
      displayId: state.currentServer.data.displayId,
      isVerified: state.currentServer.data.isVerified,
      receiveApply: state.currentServer.data.receiveApply,
    }),
    shallowEqual,
  );

  const currentChannel = useAppSelector((state) => state.currentChannel.data, shallowEqual);
  const memberApplicationsCount = useAppSelector((state) => state.memberApplications.data.length, shallowEqual);
  const onlineMembers = useAppSelector((state) => state.onlineMembers.data, shallowEqual);
  const channels = useAppSelector((state) => state.channels.data, shallowEqual);
  const queueUserIds = useAppSelector((state) => state.queueUsers.data.filter((q) => q.position >= 0).map((q) => q.userId), shallowEqual);
  const latency = useAppSelector((state) => state.socket.latency, shallowEqual);
  const rtcLatency = useAppSelector((state) => state.webrtc.latency, shallowEqual);

  const queueListRef = useRef<HTMLDivElement>(null);
  const isResizingQueueListRef = useRef<boolean>(false);

  const [selectedTabId, setSelectedTabId] = useState<'all' | 'current'>('all');

  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel);
  const movableServerUserIds = useMemo(
    () => onlineMembers.filter((om) => om.userId !== user.userId && om.permissionLevel <= permissionLevel).map((om) => om.userId),
    [onlineMembers, user.userId, permissionLevel],
  );
  const sortedChannels = useMemo(() => [...channels].filter((c) => !c.categoryId).sort((a, b) => a.order - b.order), [channels]);
  const isAllTab = selectedTabId === 'all';
  const isCurrentTab = selectedTabId === 'current';
  const isCurrentChannelQueueMode = currentChannel.voiceMode === 'queue';
  const connectStatus = 4 - Math.floor(Number(Math.max(latency, rtcLatency)) / 50);
  const hasNewMemberApplications = permissionLevel >= Permission.ServerAdmin && memberApplicationsCount > 0;

  const handleLocateMe = () => {
    locateMe();
    dispatch(Store.setSelectedItemId(`user-${user.userId}`));
  };

  const { buildContextMenu: buildServerSettingContextMenu } = useServerSettingContextMenu({
    user,
    currentServer,
    onLocateMe: handleLocateMe,
  });

  const { buildContextMenu: buildChannelListContextMenu } = useChannelListContextMenu({
    user,
    currentServer,
    currentChannel,
    movableServerUserIds,
  });

  const handleQueueListHandleDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isResizingQueueListRef.current = true;
  };

  const handleQueueListHandleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizingQueueListRef.current || !queueListRef.current) return;
    queueListRef.current.style.maxHeight = `${e.clientY - queueListRef.current.offsetTop}px`;
  };

  const handleInviteFriendClick = () => {
    openInviteFriend(user.userId, currentServer.serverId);
  };

  const handleServerSettingClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { left: x, bottom: y } = e.currentTarget.getBoundingClientRect();
    showContextMenu(x, y, 'right-bottom', buildServerSettingContextMenu());
  };

  const handleServerAvatarClick = () => {
    openServerSetting(user.userId, currentServer.serverId);
  };

  const handleChannelListContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', buildChannelListContextMenu());
  };

  const handleCurrentChannelTabClick = () => {
    setSelectedTabId('current');
  };

  const handleAllChannelTabClick = () => {
    setSelectedTabId('all');
  };

  useEffect(() => {
    const onPointerup = () => {
      isResizingQueueListRef.current = false;
    };
    document.addEventListener('pointerup', onPointerup);
    return () => document.removeEventListener('pointerup', onPointerup);
  }, []);

  useEffect(() => {
    if (isCurrentTab) return;
    locateMe();
  }, [isCurrentTab, locateMe]);

  return (
    <>
      <div className={styles['server-page-sidebar-header']}>
        <div className={styles['server-avatar-picture']} onClick={handleServerAvatarClick}>
          <Image src={currentServer.avatarUrl} alt="server_avatar" width={50} height={50} loading="lazy" draggable="false" />
        </div>
        <div className={styles['server-base-info-wrapper']}>
          <div className={styles['server-base-info-box']}>
            {!!currentServer.isVerified && <div className={styles['server-verify-icon']} title={t('official-verified-server')} />}
            <div className={styles['server-name-text']}>{currentServer.name} </div>
          </div>
          <div className={styles['server-base-info-box']}>
            <div className={styles['server-id-text']}>{currentServer.specialId || currentServer.displayId}</div>
            <div className={styles['server-online-count-text']}>{onlineMembers.length}</div>
            <div className={styles['server-options']}>
              <div className={styles['invitation-button']} onClick={handleInviteFriendClick} />
              <div className={styles['server-option-saperator']} />
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
            {`${t('latency', { 0: latency || '-' })}`}
            <br />
            {`${t('audio-latency', { 0: rtcLatency || '-' })}`}
          </div>
        </div>
        <div className={styles['current-channel-name-text']}>{currentChannel.isLobby ? t(currentChannel.name) : currentChannel.name}</div>
      </div>
      {isCurrentChannelQueueMode && (
        <>
          <div className={styles['section-title-text']}>{t('mic-order')}</div>
          <div ref={queueListRef} className={styles['scroll-view']} style={{ minHeight: '120px', maxHeight: '120px' }}>
            <div className={styles['queue-list']}>
              {queueUserIds.map((queueUserId) => (
                <QueueUserTab key={queueUserId} queueUserId={queueUserId} />
              ))}
            </div>
          </div>
          <div className={styles['queue-list-saperator']} onPointerDown={handleQueueListHandleDown} onPointerMove={handleQueueListHandleMove} />
        </>
      )}
      <div className={styles['section-title-text']}>{isCurrentTab ? t('current-channel') : t('all-channel')}</div>
      <div className={styles['scroll-view']} onContextMenu={handleChannelListContextMenu}>
        <div className={styles['channel-list']}>
          {isCurrentTab ? (
            <ChannelTab key={currentChannel.channelId} channel={currentChannel} />
          ) : (
            sortedChannels.map((item) => (item.type === 'category' ? <CategoryTab key={item.channelId} category={item} /> : <ChannelTab key={item.channelId} channel={item} />))
          )}
        </div>
      </div>
      <div className={styles['channel-list-saperator']} />
      <div className={styles['server-page-sidebar-footer']}>
        <div className={`${styles['server-page-sidebar-navegate-tab']} ${isCurrentTab ? styles['active'] : ''}`} onClick={handleCurrentChannelTabClick}>
          {t('current-channel')}
        </div>
        <div className={`${styles['server-page-sidebar-navegate-tab']} ${isAllTab ? styles['active'] : ''}`} onClick={handleAllChannelTabClick}>
          {t('all-channel')}
        </div>
      </div>
    </>
  );
});

ServerPageSidebar.displayName = 'ServerPageSidebar';

export default ServerPageSidebar;

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/hook';

import ChannelTab from '@/components/ChannelTab';
import CategoryTab from '@/components/CategoryTab';
import QueueUserTab from '@/components/QueueUserTab';

import { setSelectedItemId } from '@/store/slices/uiSlice';

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
  const dispatch = useAppDispatch();

  // Selectors
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

  // Refs
  const queueListRef = useRef<HTMLDivElement>(null);
  const isResizingQueueListRef = useRef<boolean>(false);

  // States
  const [selectedTabId, setSelectedTabId] = useState<'all' | 'current'>('all');

  // Variables
  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel);
  const movableServerUserIds = useMemo(
    () => onlineMembers.filter((om) => om.userId !== user.userId && om.permissionLevel <= permissionLevel).map((om) => om.userId),
    [onlineMembers, user.userId, permissionLevel],
  );
  const sortedChannels = useMemo(() => [...channels].filter((c) => !c.categoryId).sort((a, b) => a.order - b.order), [channels]);
  const isAllTab = selectedTabId === 'all';
  const isCurrentTab = selectedTabId === 'current';
  const isCurrentChannelQueueMode = currentChannel.voiceMode === 'queue';
  const connectStatus = 4 - Math.floor(Number(latency) / 50);
  const hasNewMemberApplications = Permission.isServerAdmin(permissionLevel) && memberApplicationsCount > 0;

  // Functions
  const getServerSettingContextMenuItems = () =>
    new CtxMenuBuilder()
      .addApplyMemberOption({ permissionLevel }, () => Popup.applyMember(user.userId, currentServer.serverId, currentServer.receiveApply))
      .addServerSettingOption({ permissionLevel }, () => Popup.openServerSetting(user.userId, currentServer.serverId))
      .addSeparator()
      .addEditNicknameOption({ permissionLevel, isSelf: true, isLowerLevel: false }, () => Popup.openEditNickname(user.userId, currentServer.serverId))
      .addLocateMeOption(() => locateMe())
      .addSeparator()
      .addReportOption(() => {})
      .addFavoriteServerOption({ isFavorite: currentServer.favorite }, () => Popup.favoriteServer(currentServer.serverId))
      .build();

  const getChannelListContextMenuItems = () =>
    new CtxMenuBuilder()
      .addCreateChannelOption({ permissionLevel }, () => Popup.openCreateChannel(user.userId, currentServer.serverId, ''))
      .addSeparator()
      .addKickAllUsersFromServerOption({ permissionLevel, movableUserIds: movableServerUserIds }, () => Popup.kickUsersFromServer(movableServerUserIds, currentServer.serverId))
      .addSeparator()
      .addBroadcastOption({ permissionLevel }, () => Popup.openServerBroadcast(currentServer.serverId, currentChannel.channelId))
      .addSeparator()
      .addEditChannelOrderOption({ permissionLevel }, () => Popup.openEditChannelOrder(user.userId, currentServer.serverId))
      .build();

  const locateMe = () => {
    findMe();
    dispatch(setSelectedItemId(`user-${user.userId}`));
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
    Popup.openInviteFriend(user.userId, currentServer.serverId);
  };

  const handleServerSettingClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { left: x, bottom: y } = e.currentTarget.getBoundingClientRect();
    showContextMenu(x, y, 'right-bottom', getServerSettingContextMenuItems());
  };

  const handleServerAvatarClick = () => {
    Popup.openServerSetting(user.userId, currentServer.serverId);
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

  useEffect(() => {
    const onPointerup = () => {
      isResizingQueueListRef.current = false;
    };
    document.addEventListener('pointerup', onPointerup);
    return () => document.removeEventListener('pointerup', onPointerup);
  }, []);

  useEffect(() => {
    if (isCurrentTab) return;
    findMe();
  }, [isCurrentTab, findMe]);

  return (
    <>
      <div className={styles['sidebar-header']}>
        <div className={styles['avatar-box']} onClick={handleServerAvatarClick}>
          <Image className={styles['avatar-picture']} src={currentServer.avatarUrl} alt={currentServer.name} width={50} height={50} loading="lazy" draggable="false" />
        </div>
        <div className={styles['base-info-wrapper']}>
          <div className={styles['box']}>
            {!!currentServer.isVerified && <div className={styles['verify-icon']} title={t('official-verified-server')} />}
            <div className={styles['name-text']}>{currentServer.name} </div>
          </div>
          <div className={styles['box']}>
            <div className={styles['id-text']}>{currentServer.specialId || currentServer.displayId}</div>
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
        <div className={styles['current-channel-text']}>{currentChannel.isLobby ? t(currentChannel.name) : currentChannel.name}</div>
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
          <div className={styles['saperator-2']} onPointerDown={handleQueueListHandleDown} onPointerMove={handleQueueListHandleMove} />
        </>
      )}
      <div className={styles['section-title-text']}>{isCurrentTab ? t('current-channel') : t('all-channel')}</div>
      <div className={styles['scroll-view']} onContextMenu={handleChannelListContextMenu}>
        <div className={styles['channel-list']}>
          {isCurrentTab ? (
            <ChannelTab key={currentChannel.channelId} channel={currentChannel} sortChannelMembersWithRules={true} />
          ) : (
            sortedChannels.map((item) => (item.type === 'category' ? <CategoryTab key={item.channelId} category={item} /> : <ChannelTab key={item.channelId} channel={item} />))
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

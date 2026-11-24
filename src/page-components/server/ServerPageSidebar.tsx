import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { Permission } from '@/types';

import * as Store from '@/store';

import { openInviteFriend, openServerSetting } from '@/services';

import { useContextMenu } from '@/providers/ContextMenu';
import { useLocateMeContext } from '@/providers/LocateMe';

import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { useChannelListCtxMenu } from '@/hooks/context-menus/useChannelListCtxMenu';
import { useServerSettingCtxMenu } from '@/hooks/context-menus/useServerSettingCtxMenu';

import ChannelTab from './ChannelTab';
import CategoryTab from './CategoryTab';
import QueueUserTab from './QueueUserTab';

import { DEFAULT_SERVER_AVATAR_URL } from '@/constants';

const CONNECT_STATUS_POSITIONS: Record<number, string> = {
  1: 'bg-[position:-20px_0]',
  2: 'bg-[position:-40px_0]',
  3: 'bg-[position:-60px_0]',
  4: 'bg-[position:-80px_0]',
};

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
      isFavorite: state.currentServer.data.isFavorite,
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

  const { buildContextMenu: buildServerSettingContextMenu } = useServerSettingCtxMenu({
    user,
    currentServer,
    onLocateMe: handleLocateMe,
  });

  const { buildContextMenu: buildChannelListContextMenu } = useChannelListCtxMenu({
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
      <div className="relative flex gap-[5px] items-center p-[8px] border-b border-b-border">
        <div
          className="relative w-[50px] h-[50px] cursor-pointer before:absolute before:top-[-1px] before:left-[-1px] before:z-1 before:min-w-[52px] before:min-h-[52px] before:content-[''] before:bg-[url('/channel/server_logo_border.svg')] before:bg-no-repeat before:bg-[position:0_0] before:bg-cover"
          onClick={handleServerAvatarClick}
        >
          <Image src={currentServer.avatarUrl || DEFAULT_SERVER_AVATAR_URL} alt="server_avatar" width={50} height={50} loading="lazy" draggable="false" />
        </div>
        <div className="flex flex-1 flex-col gap-[10px] justify-between overflow-hidden">
          <div className="flex gap-[5px] items-center justify-start">
            {!!currentServer.isVerified && <div className="min-w-[12px] min-h-[12px] bg-[url('/icon_verify.svg')] bg-no-repeat bg-[position:0_0]" title={t('official-verified-server')} />}
            <div className="line-clamp-2 text-ellipsis text-text-color-quaternary wrap-break-word">{currentServer.name} </div>
          </div>
          <div className="flex gap-[5px] items-center justify-start">
            <div className="flex items-center justify-start min-w-[75px] text-text-color-quaternary text-shadow-[0_1px_0_#fff] before:relative before:min-w-[12px] before:min-h-[12px] before:mr-[2px] before:content-[''] before:bg-no-repeat before:bg-[position:0_0] before:bg-[url('/channel/ID.svg')]">
              {currentServer.specialId || currentServer.displayId}
            </div>
            <div className="flex items-center justify-start min-w-[55px] text-text-color-quaternary text-shadow-[0_1px_0_#fff] before:relative before:min-w-[12px] before:min-h-[12px] before:mr-[2px] before:content-[''] before:bg-no-repeat before:bg-[position:0_0] before:bg-[url('/channel/member.svg')]">
              {onlineMembers.length}
            </div>
            <div className="flex flex-1 gap-[5px] items-center justify-end">
              <div
                className="min-w-[20px] min-h-[16px] cursor-pointer bg-[url('/channel/icon_invite_friend.svg')] bg-no-repeat bg-[position:0_0] hover:bg-[position:-20px_0] active:bg-[position:-40px_0]"
                onClick={handleInviteFriendClick}
              />
              <div className="min-w-[2px] min-h-[16px] bg-[url('/icon_v_split.svg')] bg-no-repeat bg-[position:0_0] bg-auto" />
              <div
                className="relative min-w-[24px] min-h-[16px] cursor-pointer bg-[url('/channel/icon_group_option.svg')] bg-no-repeat bg-[position:0_0] hover:bg-[position:-24px_0] active:bg-[position:-48px_0]"
                onClick={handleServerSettingClick}
              >
                <div
                  className={`absolute inline-block min-w-[24px] min-h-[24px] cursor-pointer bg-[url('/icon_notice_overlay.svg')] bg-no-repeat bg-cover ${hasNewMemberApplications ? 'bg-[position:-24px_0]' : 'bg-[position:0_0]'}`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center w-full h-[35px]">
        <div
          className={`relative min-w-[20px] min-h-[20px] ml-[8px] bg-[url('/channel/NetworkStatus.svg')] bg-no-repeat ${CONNECT_STATUS_POSITIONS[connectStatus] ?? 'bg-[position:0_0]'} has-hover-text`}
        >
          <div className={'hover-text'}>
            {`${t('latency', { 0: latency || '-' })}`}
            <br />
            {`${t('audio-latency', { 0: rtcLatency || '-' })}`}
          </div>
        </div>
        <div className="ml-[3px] truncate text-[1.1rem] text-text-color-quinary">{currentChannel.isLobby ? t(currentChannel.name) : currentChannel.name}</div>
      </div>
      {isCurrentChannelQueueMode && (
        <>
          <div className="px-[10px] py-[5px] text-text-color-senary text-shadow-[0_1px_#fff]">{t('mic-order')}</div>
          <div ref={queueListRef} className="flex flex-1 flex-col min-w-0 min-h-0 overflow-y-auto" style={{ minHeight: '120px', maxHeight: '120px' }}>
            <div className="flex flex-col">
              {queueUserIds.map((queueUserId) => (
                <QueueUserTab key={queueUserId} queueUserId={queueUserId} />
              ))}
            </div>
          </div>
          <div
            className="min-h-[8px] cursor-ns-resize bg-[url('/channel/chn_tree_split.svg')] bg-no-repeat bg-[position:50%_0]"
            onPointerDown={handleQueueListHandleDown}
            onPointerMove={handleQueueListHandleMove}
          />
        </>
      )}
      <div className="px-[10px] py-[5px] text-text-color-senary text-shadow-[0_1px_#fff]">{isCurrentTab ? t('current-channel') : t('all-channel')}</div>
      <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-y-auto" onContextMenu={handleChannelListContextMenu}>
        <div className="flex flex-col">
          {isCurrentTab ? (
            <ChannelTab key={currentChannel.channelId} channel={currentChannel} />
          ) : (
            sortedChannels.map((item) => (item.type === 'category' ? <CategoryTab key={item.channelId} category={item} /> : <ChannelTab key={item.channelId} channel={item} />))
          )}
        </div>
      </div>
      <div className="min-h-[1px] bg-[url('/channel/spliter_SpecialMenu.svg')] bg-no-repeat bg-[position:50%_0]" />
      <div className="relative flex items-center justify-center">
        <div
          className={`z-1 flex items-center justify-center p-[8px] text-center cursor-pointer transition-transform duration-200 ease-[ease] before:inline-block before:w-[15px] before:min-w-[18px] before:h-[15px] before:min-h-[18px] before:mr-[4px] before:content-[''] before:bg-no-repeat before:bg-auto before:bg-[url('/channel/rdb_cur_channel.svg')] ${isCurrentTab ? "text-text-color-quaternary -translate-y-px before:bg-[position:0_-18px] after:absolute after:top-[-15px] after:min-w-[70px] after:min-h-[20px] after:content-[''] after:bg-[url('/channel/switch_arrow.svg')] after:bg-no-repeat after:bg-[position:0_0] after:bg-auto after:transition-[left] after:duration-200 after:ease-[ease]" : 'text-text-color-quinary before:bg-[position:0_0]'}`}
          onClick={handleCurrentChannelTabClick}
        >
          {t('current-channel')}
        </div>
        <div
          className={`z-1 flex items-center justify-center p-[8px] text-center cursor-pointer transition-transform duration-200 ease-[ease] before:inline-block before:w-[15px] before:min-w-[18px] before:h-[15px] before:min-h-[18px] before:mr-[4px] before:content-[''] before:bg-no-repeat before:bg-auto before:bg-[url('/channel/rdb_all_channel.svg')] ${isAllTab ? "text-text-color-quaternary -translate-y-px before:bg-[position:0_-18px] after:absolute after:top-[-15px] after:min-w-[70px] after:min-h-[20px] after:content-[''] after:bg-[url('/channel/switch_arrow.svg')] after:bg-no-repeat after:bg-[position:0_0] after:bg-auto after:transition-[left] after:duration-200 after:ease-[ease]" : 'text-text-color-quinary before:bg-[position:0_0]'}`}
          onClick={handleAllChannelTabClick}
        >
          {t('all-channel')}
        </div>
      </div>
    </>
  );
});

ServerPageSidebar.displayName = 'ServerPageSidebar';

export default ServerPageSidebar;

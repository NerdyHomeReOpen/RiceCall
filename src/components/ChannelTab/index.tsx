import React, { useEffect, useMemo, useState } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';
import { Permission } from '@/types';

import * as Actions from '@/action';

import { useContextMenu } from '@/providers/ContextMenu';
import { useLocateMeContext } from '@/providers/LocateMe';

import { useAppDispatch, useAppSelector } from '@/hooks/Store';
import { useChannelContextMenu } from '@/hooks/ContextMenus/Channel';

import UserTab from '@/components/UserTab';

import { setSelectedItemId } from '@/store/slices/UI';

import styles from './ChannelTab.module.css';

interface ChannelTabProps {
  channel: Types.Channel;
}

const ChannelTab: React.FC<ChannelTabProps> = React.memo(({ channel }) => {
  const { t } = useTranslation();
  const { showContextMenu } = useContextMenu();
  const { setExpandChannelHandlerRef } = useLocateMeContext();
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
      lobbyId: state.currentServer.data.lobbyId,
    }),
    shallowEqual,
  );

  const currentChannel = useAppSelector(
    (state) => ({
      channelId: state.currentChannel.data.channelId,
      permissionLevel: state.currentChannel.data.permissionLevel,
    }),
    shallowEqual,
  );

  const friends = useAppSelector((state) => state.friends.data, shallowEqual);
  const onlineMembers = useAppSelector((state) => state.onlineMembers.data, shallowEqual);
  const isSelected = useAppSelector((state) => state.ui.selectedItemId === `channel-${channel.channelId}`, shallowEqual);

  const [isExpanded, setIsExpanded] = useState(true);

  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, channel.permissionLevel);
  const channelMembers = useMemo(() => onlineMembers.filter((om) => om.currentChannelId === channel.channelId), [onlineMembers, channel.channelId]);
  const movableServerUserIds = useMemo(
    () => onlineMembers.filter((om) => om.userId !== user.userId && om.permissionLevel <= permissionLevel).map((om) => om.userId),
    [onlineMembers, user.userId, permissionLevel],
  );
  const movableChannelUserIds = useMemo(
    () => channelMembers.filter((cm) => cm.userId !== user.userId && cm.permissionLevel <= permissionLevel).map((cm) => cm.userId),
    [channelMembers, user.userId, permissionLevel],
  );
  const sortedChannelMembers = useMemo(() => {
    const friendIds = new Set(friends.filter((f) => f.relationStatus === 2).map((f) => f.targetId));
    return [...channelMembers].sort((a, b) => {
      if (a.userId === user.userId && b.userId !== user.userId) return -1;
      if (b.userId === user.userId && a.userId !== user.userId) return 1;

      const aIsFriend = friendIds.has(a.userId);
      const bIsFriend = friendIds.has(b.userId);
      if (aIsFriend !== bIsFriend) return aIsFriend ? -1 : 1;

      return b.permissionLevel - a.permissionLevel || b.lastJoinChannelAt - a.lastJoinChannelAt;
    });
  }, [channelMembers, user, friends]);

  const isInChannel = currentChannel.channelId === channel.channelId;
  const isLobby = currentServer.lobbyId === channel.channelId;
  const isReceptionLobby = currentServer.receptionLobbyId === channel.channelId;
  const isMemberChannel = channel.visibility === 'member';
  const isPrivateChannel = channel.visibility === 'private';
  const isReadonlyChannel = channel.visibility === 'readonly';
  const isFull = channel.userLimit && channel.userLimit <= channelMembers.length;
  const isDraggable = permissionLevel >= Permission.ChannelMod && movableChannelUserIds.length > 0;
  const isPasswordNeeded = permissionLevel < Permission.ChannelMod && isPrivateChannel;
  const canJoin = !isInChannel && !isReadonlyChannel && !(isMemberChannel && permissionLevel < Permission.Member) && (!isFull || permissionLevel >= Permission.ServerAdmin);

  const { buildContextMenu } = useChannelContextMenu({
    user,
    currentServer,
    currentChannel,
    channel,
    movableChannelUserIds,
    movableServerUserIds,
    canJoin,
    isPasswordNeeded,
  });

  const handleTabClick = () => {
    if (isSelected) dispatch(setSelectedItemId(null));
    else dispatch(setSelectedItemId(`channel-${channel.channelId}`));
  };

  const handleTabDoubleClick = () => {
    Actions.connectChannel(currentServer.serverId, channel.channelId, canJoin, isPasswordNeeded);
  };

  const handleTabDragStart = (e: React.DragEvent) => {
    if (!isDraggable) return;
    e.dataTransfer.clearData();
    e.dataTransfer.setData('moveUserEvent/userIds', JSON.stringify(movableChannelUserIds));
    e.dataTransfer.setData('moveUserEvent/currentChannelId', channel.channelId);
  };

  const handleTabDragOver = (e: React.DragEvent) => {
    if (permissionLevel >= Permission.ChannelMod && !isReadonlyChannel) e.preventDefault();
    else e.dataTransfer.dropEffect = 'none';
  };

  const handleTabDrop = (e: React.DragEvent) => {
    if (isReadonlyChannel) return;
    e.stopPropagation();
    const userIds = JSON.parse(e.dataTransfer.getData('moveUserEvent/userIds')) as string[];
    const currentChannelId = e.dataTransfer.getData('moveUserEvent/currentChannelId');
    if (!currentChannelId || !userIds || userIds.length === 0) return;
    if (currentChannelId === channel.channelId || isReadonlyChannel) return;
    Actions.moveAllUsersToChannel(userIds, currentServer.serverId, channel.channelId);
    e.dataTransfer.clearData();
  };

  const handleTabContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', buildContextMenu());
  };

  const handleTabExpandedClick = () => {
    setIsExpanded(!isExpanded);
  };

  useEffect(() => {
    if (!isInChannel) return;
    setExpandChannelHandlerRef(() => setIsExpanded(true));
  }, [isInChannel, setExpandChannelHandlerRef]);

  return (
    <>
      <div
        className={`${styles['channel-tab']} ${isSelected ? styles['selected'] : ''}`}
        onClick={handleTabClick}
        onDoubleClick={handleTabDoubleClick}
        draggable={isDraggable}
        onDragStart={handleTabDragStart}
        onDragOver={handleTabDragOver}
        onDrop={handleTabDrop}
        onContextMenu={handleTabContextMenu}
      >
        <div className={`${styles['channel-tab-icon']} ${isExpanded ? styles['expanded'] : ''} ${isLobby ? styles['lobby'] : styles[channel.visibility]}`} onClick={handleTabExpandedClick} />
        <div className={`${styles['channel-tab-label']} ${isReceptionLobby ? styles['is-reception-lobby'] : ''}`}>{isLobby ? t(`lobby`) : channel.name}</div>
        {!isReadonlyChannel && <div className={styles['channel-tab-user-count-text']}>{`(${channelMembers.length}${channel.userLimit > 0 ? `/${channel.userLimit}` : ''})`}</div>}
        {isInChannel && !isExpanded && <div className={styles['my-location-icon']} />}
      </div>
      <div className={styles['channel-tab-user-list']} style={isExpanded ? {} : { display: 'none' }}>
        {sortedChannelMembers.map((member) => (
          <UserTab key={member.userId} member={member} channel={channel} canJoin={canJoin} isPasswordNeeded={isPasswordNeeded} />
        ))}
      </div>
    </>
  );
});

ChannelTab.displayName = 'ChannelTab';

export default ChannelTab;

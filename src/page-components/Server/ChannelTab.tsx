import React, { useEffect, useState } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import * as Types from '@/types';

import * as Store from '@/store';

import { connectChannel, kickUsersFromServer, deleteChannel, moveAllUsersToChannel, openEditChannelOrder, openServerBroadcast, openChannelSetting, openCreateChannel, editServer } from '@/services';

import { useContextMenu } from '@/providers/ContextMenu';
import { useLocateMeContext } from '@/providers/LocateMe';

import { useAppDispatch, useAppSelector } from '@/hooks/useStore';

import ContextMenu from '@/utils/contextMenu';

import UserTab from './UserTab';

import styles from './Server.module.css';

interface ChannelTabProps {
  channel: Types.Channel;
}

const ChannelTab: React.FC<ChannelTabProps> = React.memo(({ channel }) => {
  const { t } = useTranslation();
  const { showContextMenu } = useContextMenu();
  const { setExpandChannelHandlerRef } = useLocateMeContext();
  const dispatch = useAppDispatch();

  const userId = useAppSelector((state) => state.user.data.userId);
  const userPermissionLevel = useAppSelector((state) => state.user.data.permissionLevel);
  const currentServerId = useAppSelector((state) => state.currentServer.data.serverId);
  const currentServerPermissionLevel = useAppSelector((state) => state.currentServer.data.permissionLevel);
  const currentServerLobbyId = useAppSelector((state) => state.currentServer.data.lobbyId);
  const currentServerReceptionLobbyId = useAppSelector((state) => state.currentServer.data.receptionLobbyId);
  const currentChannelId = useAppSelector((state) => state.currentChannel.data.channelId);
  const onlineMembers = useAppSelector((state) => state.onlineMembers.data, shallowEqual);
  const isSelected = useAppSelector((state) => state.ui.selectedItemId === `channel-${channel.channelId}`);

  const [isExpanded, setIsExpanded] = useState(true);

  const permissionLevel = Math.max(userPermissionLevel, currentServerPermissionLevel, channel.permissionLevel);
  const channelMembers = onlineMembers.filter((om) => om.currentChannelId === channel.channelId);
  const movableServerUserIds = onlineMembers.filter((om) => om.userId !== userId && om.permissionLevel <= permissionLevel).map((om) => om.userId);
  const movableChannelUserIds = channelMembers.filter((cm) => cm.userId !== userId && cm.permissionLevel <= permissionLevel).map((cm) => cm.userId);
  const sortedChannelMembers = [...channelMembers].sort((a, b) => {
    if (a.userId === userId && b.userId !== userId) return -1;
    if (b.userId === userId && a.userId !== userId) return 1;
    return b.permissionLevel - a.permissionLevel || b.lastJoinChannelAt - a.lastJoinChannelAt;
  });
  const isInChannel = currentChannelId === channel.channelId;
  const isLobby = currentServerLobbyId === channel.channelId;
  const isReceptionLobby = currentServerReceptionLobbyId === channel.channelId;
  const isMemberChannel = channel.visibility === 'member';
  const isPrivateChannel = channel.visibility === 'private';
  const isReadonlyChannel = channel.visibility === 'readonly';
  const isFull = channel.userLimit && channel.userLimit <= channelMembers.length;
  const isDraggable = permissionLevel >= Types.Permission.ChannelMod && movableChannelUserIds.length > 0;
  const isPasswordNeeded = permissionLevel < Types.Permission.ChannelMod && isPrivateChannel;
  const isSubChannel = !!channel.categoryId;
  const canJoin = !isInChannel && !isReadonlyChannel && !(isMemberChannel && permissionLevel < Types.Permission.Member) && (!isFull || permissionLevel >= Types.Permission.ServerAdmin);

  const handleTabClick = () => {
    if (isSelected) dispatch(Store.setSelectedItemId(null));
    else dispatch(Store.setSelectedItemId(`channel-${channel.channelId}`));
  };

  const handleTabDoubleClick = () => {
    connectChannel(currentServerId, channel.channelId, canJoin, isPasswordNeeded);
  };

  const handleTabDragStart = (e: React.DragEvent) => {
    if (!isDraggable) return;
    e.dataTransfer.clearData();
    e.dataTransfer.setData('moveUserEvent/userIds', JSON.stringify(movableChannelUserIds));
    e.dataTransfer.setData('moveUserEvent/currentChannelId', channel.channelId);
  };

  const handleTabDragOver = (e: React.DragEvent) => {
    if (permissionLevel >= Types.Permission.ChannelMod && !isReadonlyChannel) e.preventDefault();
    else e.dataTransfer.dropEffect = 'none';
  };

  const handleTabDrop = (e: React.DragEvent) => {
    if (isReadonlyChannel) return;
    e.stopPropagation();
    const userIds = JSON.parse(e.dataTransfer.getData('moveUserEvent/userIds')) as string[];
    const currentChannelId = e.dataTransfer.getData('moveUserEvent/currentChannelId');
    if (!currentChannelId || !userIds || userIds.length === 0) return;
    if (currentChannelId === channel.channelId || isReadonlyChannel) return;
    moveAllUsersToChannel(userIds, currentServerId, channel.channelId);
    e.dataTransfer.clearData();
  };

  const handleTabContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;

    const contextMenu = new ContextMenu()
      .addJoinChannelOption({ canJoin, isInChannel }, () => connectChannel(currentServerId, channel.channelId, canJoin, isPasswordNeeded))
      .addViewOrEditOption(() => openChannelSetting(userId, currentServerId, channel.channelId))
      .addSeparator()
      .addCreateChannelOption({ permissionLevel }, () => openCreateChannel(userId, currentServerId))
      .addCreateSubChannelOption({ permissionLevel }, () => openCreateChannel(userId, currentServerId, channel.categoryId ?? channel.channelId))
      .addDeleteChannelOption({ permissionLevel, isSubChannel }, () => deleteChannel(currentServerId, channel.channelId, channel.name))
      .addSeparator()
      .addBroadcastOption({ permissionLevel }, () => openServerBroadcast(currentServerId, channel.channelId))
      .addSeparator()
      .addMoveAllUserToChannelOption({ isInChannel, currentPermissionLevel: permissionLevel, permissionLevel, movableChannelUserIds }, () =>
        moveAllUsersToChannel(movableChannelUserIds, currentServerId, currentChannelId),
      )
      .addEditChannelOrderOption({ permissionLevel }, () => openEditChannelOrder(userId, currentServerId))
      .addSeparator()
      .addKickChannelUsersFromServerOption({ permissionLevel, movableChannelUserIds }, () => kickUsersFromServer(movableChannelUserIds, currentServerId))
      .addKickAllUsersFromServerOption({ permissionLevel, movableServerUserIds }, () => kickUsersFromServer(movableServerUserIds, currentServerId))
      .addSeparator()
      .addSetReceptionLobbyOption({ permissionLevel, isPrivateChannel, isReadonlyChannel, isReceptionLobby }, () => editServer(currentServerId, { receptionLobbyId: channel.channelId }))
      .build();

    showContextMenu(x, y, 'right-bottom', contextMenu);
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
        className={`${styles['channel']} ${isSelected ? styles['selected'] : ''}`}
        onClick={handleTabClick}
        onDoubleClick={handleTabDoubleClick}
        draggable={isDraggable}
        onDragStart={handleTabDragStart}
        onDragOver={handleTabDragOver}
        onDrop={handleTabDrop}
        onContextMenu={handleTabContextMenu}
      >
        <div className={`${styles['channel-icon']} ${isExpanded ? styles['expanded'] : ''} ${isLobby ? styles['lobby'] : styles[channel.visibility]}`} onClick={handleTabExpandedClick} />
        <div className={`${styles['label']} ${isReceptionLobby ? styles['is-reception-lobby'] : ''}`}>{isLobby ? t(`lobby`) : channel.name}</div>
        {!isReadonlyChannel && <div className={styles['user-count-text']}>{`(${channelMembers.length}${channel.userLimit > 0 ? `/${channel.userLimit}` : ''})`}</div>}
        {isInChannel && !isExpanded && <div className={styles['my-location-icon']} />}
      </div>
      <div className={styles['user-list']} style={isExpanded ? {} : { display: 'none' }}>
        {sortedChannelMembers.map((member) => (
          <UserTab key={member.userId} member={member} channel={channel} canJoin={canJoin} isPasswordNeeded={isPasswordNeeded} />
        ))}
      </div>
    </>
  );
});

ChannelTab.displayName = 'ChannelTab';

export default ChannelTab;

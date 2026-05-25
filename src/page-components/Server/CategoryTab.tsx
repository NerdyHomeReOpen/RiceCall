import React, { useEffect, useState } from 'react';

import * as Types from '@/types';

import * as Store from '@/store';

import { connectChannel, moveAllUsersToChannel } from '@/services';

import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { useChannelCtxMenu } from '@/hooks/ContextMenus/useChannelCtxMenu';

import { useContextMenu } from '@/providers/ContextMenu';
import { useLocateMeContext } from '@/providers/LocateMe';

import ChannelTab from './ChannelTab';
import UserTab from './UserTab';

import styles from './Server.module.css';

interface CategoryTabProps {
  category: Types.Category;
}

const CategoryTab: React.FC<CategoryTabProps> = React.memo(({ category }) => {
  const { showContextMenu } = useContextMenu();
  const { setExpandCategoryHandlerRef } = useLocateMeContext();
  const dispatch = useAppDispatch();

  const userId = useAppSelector((state) => state.user.data.userId);
  const userPermissionLevel = useAppSelector((state) => state.user.data.permissionLevel);
  const currentServerId = useAppSelector((state) => state.currentServer.data.serverId);
  const currentServerPermissionLevel = useAppSelector((state) => state.currentServer.data.permissionLevel);
  const currentServerLobbyId = useAppSelector((state) => state.currentServer.data.lobbyId);
  const currentServerReceptionLobbyId = useAppSelector((state) => state.currentServer.data.receptionLobbyId);
  const currentChannelId = useAppSelector((state) => state.currentChannel.data.channelId);
  const currentChannelPermissionLevel = useAppSelector((state) => state.currentChannel.data.permissionLevel);
  const channels = useAppSelector((state) => state.channels.data);
  const onlineMembers = useAppSelector((state) => state.onlineMembers.data);
  const isSelected = useAppSelector((state) => state.ui.selectedItemId === `category-${category.channelId}`);

  const [isExpanded, setIsExpanded] = useState(true);

  const permissionLevel = Math.max(userPermissionLevel, currentServerPermissionLevel, category.permissionLevel);
  const categoryChannels = channels.filter((c) => c.type === 'channel').filter((c) => c.categoryId === category.channelId);
  const categoryMembers = onlineMembers.filter((om) => om.currentChannelId === category.channelId);
  const movableServerUserIds = onlineMembers.filter((om) => om.userId !== userId && om.permissionLevel <= permissionLevel).map((om) => om.userId);
  const movableCategoryUserIds = categoryMembers.filter((cm) => cm.userId !== userId && cm.permissionLevel <= permissionLevel).map((cm) => cm.userId);
  const sortedCategoryChannels = [...categoryChannels].sort((a, b) => a.order - b.order);
  const sortedCategoryMembers = [...categoryMembers].sort((a, b) => {
    if (a.userId === userId && b.userId !== userId) return -1;
    if (b.userId === userId && a.userId !== userId) return 1;
    return b.permissionLevel - a.permissionLevel || b.lastJoinChannelAt - a.lastJoinChannelAt;
  });
  const isInChannel = currentChannelId === category.channelId;
  const isInCategory = categoryMembers.some((m) => m.currentChannelId === currentChannelId);
  const isReceptionLobby = currentServerLobbyId === category.channelId;
  const isMemberChannel = category.visibility === 'member';
  const isPrivateChannel = category.visibility === 'private';
  const isReadonlyChannel = category.visibility === 'readonly';
  const isFull = category.userLimit && category.userLimit <= categoryMembers.length;
  const isDraggable = permissionLevel >= Types.Permission.ChannelMod && movableCategoryUserIds.length > 0;
  const isPasswordNeeded = permissionLevel < Types.Permission.ChannelMod && isPrivateChannel;
  const canJoin = !isInChannel && !isReadonlyChannel && !(isMemberChannel && permissionLevel < Types.Permission.Member) && (!isFull || permissionLevel >= Types.Permission.ServerAdmin);

  const { buildContextMenu } = useChannelCtxMenu({
    userId,
    userPermissionLevel,
    currentServerId,
    currentServerPermissionLevel,
    currentServerReceptionLobbyId,
    currentChannelId,
    currentChannelPermissionLevel,
    channel: category,
    movableChannelUserIds: movableCategoryUserIds,
    movableServerUserIds,
    canJoin,
    isPasswordNeeded,
  });

  const handleTabClick = () => {
    if (isSelected) dispatch(Store.setSelectedItemId(null));
    else dispatch(Store.setSelectedItemId(`category-${category.channelId}`));
  };

  const handleTabDoubleClick = () => {
    connectChannel(currentServerId, category.channelId, canJoin, isPasswordNeeded);
  };

  const handleTabDragStart = (e: React.DragEvent) => {
    if (!isDraggable) return;
    e.dataTransfer.clearData();
    e.dataTransfer.setData('moveUserEvent/userIds', JSON.stringify(movableCategoryUserIds));
    e.dataTransfer.setData('moveUserEvent/currentChannelId', category.channelId);
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
    if (currentChannelId === category.channelId || isReadonlyChannel) return;
    moveAllUsersToChannel(userIds, currentServerId, category.channelId);
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
    if (!isInCategory) return;
    setExpandCategoryHandlerRef(() => setIsExpanded(true));
  }, [isInCategory, setExpandCategoryHandlerRef]);

  return (
    <>
      <div
        className={`${styles['category']} ${isSelected ? styles['selected'] : ''}`}
        onClick={handleTabClick}
        onDoubleClick={handleTabDoubleClick}
        draggable={isDraggable}
        onDragStart={handleTabDragStart}
        onDragOver={handleTabDragOver}
        onDrop={handleTabDrop}
        onContextMenu={handleTabContextMenu}
      >
        <div className={`${styles['category-icon']} ${isExpanded ? styles['expanded'] : ''} ${styles[category.visibility]}`} onClick={handleTabExpandedClick} />
        <div className={`${styles['label']} ${isReceptionLobby ? styles['is-reception-lobby'] : ''}`}>{category.name}</div>
        {!isReadonlyChannel && <div className={styles['user-count-text']}>{`(${categoryMembers.length}${category.userLimit > 0 ? `/${category.userLimit}` : ''})`}</div>}
        {!isExpanded && isInCategory && <div className={styles['my-location-icon']} />}
      </div>
      <div className={styles['user-list']} style={isExpanded ? {} : { display: 'none' }}>
        {sortedCategoryMembers.map((member) => (
          <UserTab key={member.userId} member={member} channel={category} canJoin={canJoin} isPasswordNeeded={isPasswordNeeded} />
        ))}
      </div>
      <div className={styles['channel-list']} style={isExpanded ? {} : { display: 'none' }}>
        {sortedCategoryChannels.map((channel) => (
          <ChannelTab key={channel.channelId} channel={channel} />
        ))}
      </div>
    </>
  );
});

CategoryTab.displayName = 'CategoryTab';

export default CategoryTab;

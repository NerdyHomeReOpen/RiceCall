import React, { useEffect, useMemo, useState } from 'react';
import { shallowEqual } from 'react-redux';

import type * as Types from '@/types';
import { Permission } from '@/types';

import * as Actions from '@/action';

import { useAppDispatch, useAppSelector } from '@/hooks/Store';
import { useChannelContextMenu } from '@/hooks/ContextMenus/Channel';

import { useContextMenu } from '@/providers/ContextMenu';
import { useLocateMeContext } from '@/providers/LocateMe';

import ChannelTab from '@/components/ChannelTab';
import UserTab from '@/components/UserTab';

import { setSelectedItemId } from '@/store/slices/UI';

import styles from './CategoryTab.module.css';

interface CategoryTabProps {
  category: Types.Category;
}

const CategoryTab: React.FC<CategoryTabProps> = React.memo(({ category }) => {
  const { showContextMenu } = useContextMenu();
  const { setExpandCategoryHandlerRef } = useLocateMeContext();
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
  const channels = useAppSelector((state) => state.channels.data, shallowEqual);
  const onlineMembers = useAppSelector((state) => state.onlineMembers.data, shallowEqual);
  const isSelected = useAppSelector((state) => state.ui.selectedItemId === `category-${category.channelId}`, shallowEqual);

  const [isExpanded, setIsExpanded] = useState(true);

  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, category.permissionLevel);
  const categoryChannels = channels.filter((c) => c.type === 'channel').filter((c) => c.categoryId === category.channelId);
  const categoryMembers = onlineMembers.filter((om) => om.currentChannelId === category.channelId);
  const movableServerUserIds = onlineMembers.filter((om) => om.userId !== user.userId && om.permissionLevel <= permissionLevel).map((om) => om.userId);
  const movableCategoryUserIds = categoryMembers.filter((cm) => cm.userId !== user.userId && cm.permissionLevel <= permissionLevel).map((cm) => cm.userId);
  const filteredCategoryChannels = [...categoryChannels].sort((a, b) => a.order - b.order);
  const filteredCategoryMembers = useMemo(() => {
    const friendIds = new Set(friends.filter((f) => f.relationStatus === 2).map((f) => f.targetId));
    return [...categoryMembers].sort((a, b) => {
      if (a.userId === user.userId && b.userId !== user.userId) return -1;
      if (b.userId === user.userId && a.userId !== user.userId) return 1;

      const aIsFriend = friendIds.has(a.userId);
      const bIsFriend = friendIds.has(b.userId);
      if (aIsFriend !== bIsFriend) return aIsFriend ? -1 : 1;

      return b.permissionLevel - a.permissionLevel || b.lastJoinChannelAt - a.lastJoinChannelAt;
    });
  }, [categoryMembers, user, friends]);

  const isInChannel = currentChannel.channelId === category.channelId;
  const isInCategory = categoryMembers.some((m) => m.currentChannelId === currentChannel.channelId);
  const isReceptionLobby = currentServer.receptionLobbyId === category.channelId;
  const isMemberChannel = category.visibility === 'member';
  const isPrivateChannel = category.visibility === 'private';
  const isReadonlyChannel = category.visibility === 'readonly';
  const isFull = category.userLimit && category.userLimit <= categoryMembers.length;
  const isDraggable = permissionLevel >= Permission.ChannelMod && movableCategoryUserIds.length > 0;
  const isPasswordNeeded = permissionLevel < Permission.ChannelMod && isPrivateChannel;
  const canJoin = !isInChannel && !isReadonlyChannel && !(isMemberChannel && permissionLevel < Permission.Member) && (!isFull || permissionLevel >= Permission.ServerAdmin);

  const { buildContextMenu } = useChannelContextMenu({
    user,
    currentServer,
    currentChannel,
    channel: category,
    category,
    movableChannelUserIds: movableCategoryUserIds,
    movableServerUserIds,
    canJoin,
    isPasswordNeeded,
  });

  const handleTabClick = () => {
    if (isSelected) dispatch(setSelectedItemId(null));
    else dispatch(setSelectedItemId(`category-${category.channelId}`));
  };

  const handleTabDoubleClick = () => {
    Actions.connectChannel(currentServer.serverId, category.channelId, canJoin, isPasswordNeeded);
  };

  const handleTabDragStart = (e: React.DragEvent) => {
    if (!isDraggable) return;
    e.dataTransfer.clearData();
    e.dataTransfer.setData('moveUserEvent/userIds', JSON.stringify(movableCategoryUserIds));
    e.dataTransfer.setData('moveUserEvent/currentChannelId', category.channelId);
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
    if (currentChannelId === category.channelId || isReadonlyChannel) return;
    Actions.moveAllUsersToChannel(userIds, currentServer.serverId, category.channelId);
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
        className={`${styles['channel-tab']} ${isSelected ? styles['selected'] : ''}`}
        onClick={handleTabClick}
        onDoubleClick={handleTabDoubleClick}
        draggable={isDraggable}
        onDragStart={handleTabDragStart}
        onDragOver={handleTabDragOver}
        onDrop={handleTabDrop}
        onContextMenu={handleTabContextMenu}
      >
        <div className={`${styles['channel-tab-icon']} ${isExpanded ? styles['expanded'] : ''} ${styles[category.visibility]}`} onClick={handleTabExpandedClick} />
        <div className={`${styles['channel-tab-label']} ${isReceptionLobby ? styles['is-reception-lobby'] : ''}`}>{category.name}</div>
        {!isReadonlyChannel && <div className={styles['channel-tab-user-count-text']}>{`(${categoryMembers.length}${category.userLimit > 0 ? `/${category.userLimit}` : ''})`}</div>}
        {!isExpanded && isInCategory && <div className={styles['my-location-icon']} />}
      </div>
      <div className={styles['channel-tab-user-list']} style={isExpanded ? {} : { display: 'none' }}>
        {filteredCategoryMembers.map((member) => (
          <UserTab key={member.userId} member={member} channel={category} canJoin={canJoin} isPasswordNeeded={isPasswordNeeded} />
        ))}
      </div>
      <div className={styles['channel-tab-channel-list']} style={isExpanded ? {} : { display: 'none' }}>
        {filteredCategoryChannels.map((channel) => (
          <ChannelTab key={channel.channelId} channel={channel} />
        ))}
      </div>
    </>
  );
});

CategoryTab.displayName = 'CategoryTab';

export default CategoryTab;

import React, { useEffect, useState } from 'react';
import { shallowEqual } from 'react-redux';
import { useAppDispatch, useAppSelector } from '@/store/hook';

import type * as Types from '@/types';

import { setSelectedItemId } from '@/store/slices/uiSlice';

import ChannelTab from '@/components/ChannelTab';
import UserTab from '@/components/UserTab';

import { useContextMenu } from '@/providers/ContextMenu';
import { useFindMeContext } from '@/providers/FindMe';

import * as Popup from '@/utils/popup';
import * as Permission from '@/utils/permission';
import CtxMenuBuilder from '@/utils/ctxMenuBuilder';

import styles from '@/styles/server.module.css';

interface CategoryTabProps {
  category: Types.Category;
}

const CategoryTab: React.FC<CategoryTabProps> = React.memo(({ category }) => {
  // Hooks
  const { showContextMenu } = useContextMenu();
  const { setExpandedCategoryHandlerRef } = useFindMeContext();
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

  const channels = useAppSelector((state) => state.channels.data, shallowEqual);
  const onlineMembers = useAppSelector((state) => state.onlineMembers.data, shallowEqual);
  const isSelected = useAppSelector((state) => state.ui.selectedItemId === `category-${category.channelId}`, shallowEqual);

  // States
  const [isExpanded, setIsExpanded] = useState(true);

  // Variables
  const currentPermissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, currentChannel.permissionLevel);
  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, category.permissionLevel);
  const categoryChannels = channels.filter((c) => c.type === 'channel').filter((c) => c.categoryId === category.channelId);
  const categoryMembers = onlineMembers.filter((om) => om.currentChannelId === category.channelId);
  const movableServerUserIds = onlineMembers.filter((om) => om.userId !== user.userId && om.permissionLevel <= permissionLevel).map((om) => om.userId);
  const movableCategoryUserIds = categoryMembers.filter((cm) => cm.userId !== user.userId && cm.permissionLevel <= permissionLevel).map((cm) => cm.userId);
  const isInChannel = currentChannel.channelId === category.channelId;
  const isInCategory = categoryMembers.some((m) => m.currentChannelId === currentChannel.channelId);
  const isReceptionLobby = currentServer.receptionLobbyId === category.channelId;
  const isMemberChannel = category.visibility === 'member';
  const isPrivateChannel = category.visibility === 'private';
  const isReadonlyChannel = category.visibility === 'readonly';
  const isFull = category.userLimit && category.userLimit <= categoryMembers.length;
  const isDraggable = Permission.isChannelMod(permissionLevel) && movableCategoryUserIds.length > 0;
  const isPasswordNeeded = !Permission.isChannelMod(permissionLevel) && isPrivateChannel;
  const canJoin = !isInChannel && !isReadonlyChannel && !(isMemberChannel && !Permission.isMember(permissionLevel)) && (!isFull || Permission.isServerAdmin(permissionLevel));
  const filteredCategoryChannels = [...categoryChannels].sort((a, b) => a.order - b.order);
  const filteredCategoryMembers = [...categoryMembers].sort((a, b) => b.lastJoinChannelAt - a.lastJoinChannelAt);

  // Functions
  const getTabContextMenuItems = () =>
    new CtxMenuBuilder()
      .addJoinChannelOption({ canJoin, isInChannel }, () => Popup.connectChannel(currentServer.serverId, category.channelId, canJoin, isPasswordNeeded))
      .addViewOrEditOption(() => Popup.openChannelSetting(user.userId, currentServer.serverId, category.channelId))
      .addSeparator()
      .addCreateChannelOption({ permissionLevel }, () => Popup.openCreateChannel(user.userId, currentServer.serverId, ''))
      .addCreateSubChannelOption({ permissionLevel }, () => Popup.openCreateChannel(user.userId, currentServer.serverId, category.channelId))
      .addDeleteChannelOption({ permissionLevel }, () => Popup.deleteChannel(currentServer.serverId, category.channelId, category.name))
      .addSeparator()
      .addBroadcastOption({ permissionLevel }, () => Popup.openServerBroadcast(currentServer.serverId, category.channelId))
      .addSeparator()
      .addMoveAllUserToChannelOption({ isInChannel, currentPermissionLevel, permissionLevel, movableUserIds: movableCategoryUserIds }, () =>
        Popup.moveAllUsersToChannel(movableCategoryUserIds, currentServer.serverId, category.channelId),
      )
      .addEditChannelOrderOption({ permissionLevel }, () => Popup.openEditChannelOrder(user.userId, currentServer.serverId))
      .addSeparator()
      .addKickChannelUsersFromServerOption({ permissionLevel, movableUserIds: movableCategoryUserIds }, () => Popup.kickUsersFromServer(movableCategoryUserIds, currentServer.serverId))
      .addKickAllUsersFromServerOption({ permissionLevel, movableUserIds: movableServerUserIds }, () => Popup.kickUsersFromServer(movableServerUserIds, currentServer.serverId))
      .addSeparator()
      .addSetReceptionLobbyOption({ permissionLevel, isPrivateChannel, isReadonlyChannel, isReceptionLobby }, () => Popup.editServer(currentServer.serverId, { receptionLobbyId: category.channelId }))
      .build();

  // Handlers
  const handleTabClick = () => {
    if (isSelected) dispatch(setSelectedItemId(null));
    else dispatch(setSelectedItemId(`category-${category.channelId}`));
  };

  const handleTabDoubleClick = () => {
    Popup.connectChannel(currentServer.serverId, category.channelId, canJoin, isPasswordNeeded);
  };

  const handleTabDragStart = (e: React.DragEvent) => {
    if (!isDraggable) return;
    e.dataTransfer.setData('type', 'moveAllUsers');
    e.dataTransfer.setData('userIds', movableCategoryUserIds.join(','));
    e.dataTransfer.setData('currentChannelId', category.channelId);
  };

  const handleTabDragOver = (e: React.DragEvent) => {
    if (Permission.isChannelMod(permissionLevel) && !isReadonlyChannel) e.preventDefault();
    else e.dataTransfer.dropEffect = 'none';
  };

  const handleTabDrop = (e: React.DragEvent) => {
    if (isReadonlyChannel) return;
    e.preventDefault();
    const moveType = e.dataTransfer.getData('type');
    const currentChannelId = e.dataTransfer.getData('currentChannelId');
    if (!moveType || !currentChannelId || currentChannelId === category.channelId || isReadonlyChannel) return;
    switch (moveType) {
      case 'moveUser':
        const targetUserId = e.dataTransfer.getData('userId');
        if (!targetUserId) return;
        Popup.moveUserToChannel(targetUserId, currentServer.serverId, category.channelId);
        break;
      case 'moveAllUsers':
        const targetUserIds = e.dataTransfer.getData('userIds');
        if (!targetUserIds) return;
        Popup.moveAllUsersToChannel(targetUserIds.split(','), currentServer.serverId, category.channelId);
        break;
    }
  };

  const handleTabContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', getTabContextMenuItems());
  };

  const handleTabExpandedClick = () => {
    setIsExpanded(!isExpanded);
  };

  // Effect
  useEffect(() => {
    if (!isInCategory) return;
    setExpandedCategoryHandlerRef(() => setIsExpanded(true));
  }, [isInCategory, setExpandedCategoryHandlerRef]);

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
        <div className={`${styles['tab-icon']} ${isExpanded ? styles['expanded'] : ''} ${styles[category.visibility]}`} onClick={handleTabExpandedClick} />
        <div className={`${styles['channel-tab-label']} ${isReceptionLobby ? styles['is-reception-lobby'] : ''}`}>{category.name}</div>
        {!isReadonlyChannel && <div className={styles['channel-user-count-text']}>{`(${categoryMembers.length}${category.userLimit > 0 ? `/${category.userLimit}` : ''})`}</div>}
        {!isExpanded && isInCategory && <div className={styles['my-location-icon']} />}
      </div>
      <div className={styles['user-list']} style={isExpanded ? {} : { display: 'none' }}>
        {filteredCategoryMembers.map((member) => (
          <UserTab key={member.userId} member={member} channel={category} canJoin={canJoin} isPasswordNeeded={isPasswordNeeded} />
        ))}
      </div>
      <div className={styles['channel-list']} style={isExpanded ? {} : { display: 'none' }}>
        {filteredCategoryChannels.map((channel) => (
          <ChannelTab key={channel.channelId} channel={channel} />
        ))}
      </div>
    </>
  );
});

CategoryTab.displayName = 'CategoryTab';

export default CategoryTab;

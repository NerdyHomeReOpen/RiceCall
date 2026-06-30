import React, { useEffect, useState } from 'react';

import * as Types from '@/types';

import * as Store from '@/store';

import { connectChannel, kickUsersFromServer, deleteChannel, moveAllUsersToChannel, openChannelSetting, openCreateChannel, openEditChannelOrder, openServerBroadcast, editServer } from '@/services';

import { useAppDispatch, useAppSelector } from '@/hooks/useStore';

import { useContextMenu } from '@/providers/ContextMenu';
import { useLocateMeContext } from '@/providers/LocateMe';

import ContextMenu from '@/utils/contextMenu';

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
  const permissionLevel = useAppSelector((state) => Math.max(state.user.data.permissionLevel, state.currentServer.data.permissionLevel, state.currentChannel.data.permissionLevel));
  const currentServerId = useAppSelector((state) => state.currentServer.data.serverId);
  const currentServerReceptionLobbyId = useAppSelector((state) => state.currentServer.data.receptionLobbyId);
  const currentChannelId = useAppSelector((state) => state.currentChannel.data.channelId);
  const channels = useAppSelector((state) => state.channels.data);
  const onlineMembers = useAppSelector((state) => state.onlineMembers.data);
  const isSelected = useAppSelector((state) => state.ui.selectedItemId === `category-${category.channelId}`);

  const [isExpanded, setIsExpanded] = useState(true);

  const categoryChannels = channels.filter((c) => c.type === 'channel').filter((c) => c.categoryId === category.channelId);
  const categoryMembers = onlineMembers.filter((om) => om.currentChannelId === category.channelId);
  const sortedCategoryChannels = [...categoryChannels].sort((a, b) => a.order - b.order);
  const sortedCategoryMembers = [...categoryMembers].sort((a, b) => b.permissionLevel - a.permissionLevel || b.lastJoinChannelAt - a.lastJoinChannelAt);
  const movableServerUserIds = onlineMembers.filter((om) => om.userId !== userId && om.permissionLevel <= permissionLevel).map((om) => om.userId);
  const movableCategoryUserIds = categoryMembers.filter((cm) => cm.userId !== userId && cm.permissionLevel <= permissionLevel).map((cm) => cm.userId);
  const isInCategory = currentChannelId === category.channelId;
  const isCategoryReceptionLobby = currentServerReceptionLobbyId === category.channelId;
  const isCategoryMember = category.visibility === 'member';
  const isCategoryPrivate = category.visibility === 'private';
  const isCategoryReadonly = category.visibility === 'readonly';
  const isCategoryFull = category.userLimit && category.userLimit <= categoryMembers.length;
  const isCategoryPasswordNeeded = permissionLevel < Types.Permission.ChannelMod && isCategoryPrivate;
  const isDraggable = permissionLevel >= Types.Permission.ChannelMod && movableCategoryUserIds.length > 0;
  const canJoin = !(isInCategory || isCategoryReadonly || (permissionLevel < Types.Permission.ServerAdmin && isCategoryFull) || (permissionLevel < Types.Permission.Member && isCategoryMember));

  const handleTabClick = () => {
    if (isSelected) {
      dispatch(Store.setSelectedItemId(null));
    } else {
      dispatch(Store.setSelectedItemId(`category-${category.channelId}`));
    }
  };

  const handleTabDoubleClick = () => {
    connectChannel(currentServerId, category.channelId, canJoin, isCategoryPasswordNeeded);
  };

  const handleTabDragStart = (e: React.DragEvent) => {
    if (!isDraggable) return;

    e.dataTransfer.clearData();
    e.dataTransfer.setData('moveUserEvent/userIds', JSON.stringify(movableCategoryUserIds));
    e.dataTransfer.setData('moveUserEvent/currentChannelId', category.channelId);
  };

  const handleTabDragOver = (e: React.DragEvent) => {
    if (permissionLevel >= Types.Permission.ChannelMod && !isCategoryReadonly) {
      e.preventDefault();
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleTabDrop = (e: React.DragEvent) => {
    if (isCategoryReadonly) return;

    e.stopPropagation();

    const userIds = JSON.parse(e.dataTransfer.getData('moveUserEvent/userIds')) as string[];
    const currentChannelId = e.dataTransfer.getData('moveUserEvent/currentChannelId');

    if (!currentChannelId || !userIds || userIds.length === 0 || currentChannelId === category.channelId || isCategoryReadonly) return;

    moveAllUsersToChannel(userIds, currentServerId, category.channelId);

    e.dataTransfer.clearData();
  };

  const handleTabContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const { clientX: x, clientY: y } = e;

    const contextMenu = new ContextMenu()
      .addJoinChannelOption(
        {
          canJoin,
          isInChannel: isInCategory,
        },
        () => {
          connectChannel(currentServerId, category.channelId, canJoin, isCategoryPasswordNeeded);
        },
      )
      .addViewOrEditOption(() => {
        openChannelSetting(userId, currentServerId, category.channelId);
      })
      .addSeparator()
      .addCreateChannelOption(
        {
          permissionLevel,
        },
        () => {
          openCreateChannel(userId, currentServerId);
        },
      )
      .addCreateSubChannelOption(
        {
          permissionLevel,
        },
        () => {
          openCreateChannel(userId, currentServerId, category.categoryId ?? category.channelId);
        },
      )
      .addDeleteChannelOption(
        {
          permissionLevel,
          isChannelSubChannel: false,
        },
        () => {
          deleteChannel(currentServerId, category.channelId, category.name);
        },
      )
      .addSeparator()
      .addBroadcastOption(
        {
          permissionLevel,
        },
        () => {
          openServerBroadcast(currentServerId, category.channelId);
        },
      )
      .addSeparator()
      .addMoveAllUserToChannelOption(
        {
          permissionLevel,
          destinationPermissionLevel: category.permissionLevel,
          isInChannel: isInCategory,
          userIdsToMove: movableCategoryUserIds,
        },
        () => {
          moveAllUsersToChannel(movableCategoryUserIds, currentServerId, currentChannelId);
        },
      )
      .addEditChannelOrderOption(
        {
          permissionLevel,
        },
        () => {
          openEditChannelOrder(userId, currentServerId);
        },
      )
      .addSeparator()
      .addKickChannelUsersFromServerOption(
        {
          permissionLevel,
          userIdsToKick: movableCategoryUserIds,
        },
        () => {
          kickUsersFromServer(movableCategoryUserIds, currentServerId);
        },
      )
      .addKickAllUsersFromServerOption(
        {
          permissionLevel,
          userIdsToKick: movableServerUserIds,
        },
        () => {
          kickUsersFromServer(movableServerUserIds, currentServerId);
        },
      )
      .addSeparator()
      .addSetReceptionLobbyOption(
        {
          permissionLevel,
          isChannelPrivate: isCategoryPrivate,
          isChannelReadonly: isCategoryReadonly,
          isChannelReceptionLobby: isCategoryReceptionLobby,
        },
        () => {
          editServer(currentServerId, { receptionLobbyId: category.channelId });
        },
      )
      .build();

    showContextMenu(x, y, 'right-bottom', contextMenu);
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
        <div className={`${styles['label']} ${isCategoryReceptionLobby ? styles['is-reception-lobby'] : ''}`}>{category.name}</div>
        {!isCategoryReadonly && <div className={styles['user-count-text']}>{`(${categoryMembers.length}${category.userLimit > 0 ? `/${category.userLimit}` : ''})`}</div>}
        {!isExpanded && isInCategory && <div className={styles['my-location-icon']} />}
      </div>
      <div className={styles['user-list']} style={isExpanded ? {} : { display: 'none' }}>
        {sortedCategoryMembers.map((member) => (
          <UserTab key={member.userId} member={member} channel={category} canJoin={canJoin} isPasswordNeeded={isCategoryPasswordNeeded} />
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

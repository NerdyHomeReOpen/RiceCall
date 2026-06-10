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
  const userIsInChannel = currentChannelId === category.channelId;
  const userIsInCategory = categoryMembers.some((m) => m.currentChannelId === currentChannelId);
  const categoryIsReceptionLobby = currentServerReceptionLobbyId === category.channelId;
  const categoryIsMemberChannel = category.visibility === 'member';
  const categoryIsPrivateChannel = category.visibility === 'private';
  const categoryIsReadonlyChannel = category.visibility === 'readonly';
  const categoryIsFull = category.userLimit && category.userLimit <= categoryMembers.length;
  const categoryNeedsPassword = permissionLevel < Types.Permission.ChannelMod && categoryIsPrivateChannel;
  const userCanJoinCategory = !(
    userIsInChannel ||
    categoryIsReadonlyChannel ||
    (permissionLevel < Types.Permission.ServerAdmin && categoryIsFull) ||
    (permissionLevel < Types.Permission.Member && categoryIsMemberChannel)
  );
  const isDraggable = permissionLevel >= Types.Permission.ChannelMod && movableCategoryUserIds.length > 0;

  const handleTabClick = () => {
    if (isSelected) {
      dispatch(Store.setSelectedItemId(null));
    } else {
      dispatch(Store.setSelectedItemId(`category-${category.channelId}`));
    }
  };

  const handleTabDoubleClick = () => {
    connectChannel(currentServerId, category.channelId, userCanJoinCategory, categoryNeedsPassword);
  };

  const handleTabDragStart = (e: React.DragEvent) => {
    if (!isDraggable) return;

    e.dataTransfer.clearData();
    e.dataTransfer.setData('moveUserEvent/userIds', JSON.stringify(movableCategoryUserIds));
    e.dataTransfer.setData('moveUserEvent/currentChannelId', category.channelId);
  };

  const handleTabDragOver = (e: React.DragEvent) => {
    if (permissionLevel >= Types.Permission.ChannelMod && !categoryIsReadonlyChannel) {
      e.preventDefault();
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleTabDrop = (e: React.DragEvent) => {
    if (categoryIsReadonlyChannel) return;

    e.stopPropagation();

    const userIds = JSON.parse(e.dataTransfer.getData('moveUserEvent/userIds')) as string[];
    const currentChannelId = e.dataTransfer.getData('moveUserEvent/currentChannelId');

    if (!currentChannelId || !userIds || userIds.length === 0 || currentChannelId === category.channelId || categoryIsReadonlyChannel) return;

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
          userCanJoinChannel: userCanJoinCategory,
          userIsInChannel: userIsInChannel,
        },
        () => {
          connectChannel(currentServerId, category.channelId, userCanJoinCategory, categoryNeedsPassword);
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
          channelIsSubChannel: false,
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
          channelPermissionLevel: category.permissionLevel,
          userIsInChannel: userIsInCategory,
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
          channelIsPrivateChannel: categoryIsPrivateChannel,
          channelIsReadonlyChannel: categoryIsReadonlyChannel,
          isReceptionLobby: categoryIsReceptionLobby,
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
    if (!userIsInCategory) return;
    setExpandCategoryHandlerRef(() => setIsExpanded(true));
  }, [userIsInCategory, setExpandCategoryHandlerRef]);

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
        <div className={`${styles['label']} ${categoryIsReceptionLobby ? styles['is-reception-lobby'] : ''}`}>{category.name}</div>
        {!categoryIsReadonlyChannel && <div className={styles['user-count-text']}>{`(${categoryMembers.length}${category.userLimit > 0 ? `/${category.userLimit}` : ''})`}</div>}
        {!isExpanded && userIsInCategory && <div className={styles['my-location-icon']} />}
      </div>
      <div className={styles['user-list']} style={isExpanded ? {} : { display: 'none' }}>
        {sortedCategoryMembers.map((member) => (
          <UserTab key={member.userId} member={member} channel={category} userCanJoinChannel={userCanJoinCategory} channelNeedsPassword={categoryNeedsPassword} />
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

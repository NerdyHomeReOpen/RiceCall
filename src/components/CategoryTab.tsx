import React, { useEffect } from 'react';

import type * as Types from '@/types';

import ChannelTab from '@/components/ChannelTab';
import UserTab from '@/components/UserTab';

import { useContextMenu } from '@/providers/ContextMenu';
import { useFindMeContext } from '@/providers/FindMe';

import * as Popup from '@/utils/popup';
import * as Permission from '@/utils/permission';
import CtxMenuBuilder from '@/utils/ctxMenuBuilder';

import styles from '@/styles/server.module.css';

interface CategoryTabProps {
  user: Types.User;
  currentServer: Types.Server;
  currentChannel: Types.Channel;
  friends: Types.Friend[];
  queueUsers: Types.QueueUser[];
  serverOnlineMembers: Types.OnlineMember[];
  channels: (Types.Channel | Types.Category)[];
  category: Types.Category;
  expanded: Record<string, boolean>;
  selectedItemId: string | null;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setSelectedItemId: React.Dispatch<React.SetStateAction<string | null>>;
}

const CategoryTab: React.FC<CategoryTabProps> = React.memo(
  ({ user, currentServer, currentChannel, friends, queueUsers, serverOnlineMembers, channels, category, expanded, selectedItemId, setExpanded, setSelectedItemId }) => {
    // Hooks
    const contextMenu = useContextMenu();
    const findMe = useFindMeContext();

    // Variables
    const { userId } = user;
    const { serverId: currentServerId, receptionLobbyId: currentServerReceptionLobbyId } = currentServer;
    const { channelId: currentChannelId } = currentChannel;
    const { channelId: categoryId, name: categoryName, visibility: categoryVisibility, userLimit: categoryUserLimit } = category;
    const currentPermissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, currentChannel.permissionLevel);
    const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, category.permissionLevel);
    const categoryChannels = channels.filter((c) => c.type === 'channel').filter((c) => c.categoryId === categoryId);
    const categoryMembers = serverOnlineMembers.filter((m) => m.currentChannelId === categoryId);
    const movableServerUserIds = serverOnlineMembers.filter((m) => m.userId !== userId && m.permissionLevel <= permissionLevel).map((m) => m.userId);
    const movableCategoryUserIds = categoryMembers.filter((m) => m.userId !== userId && m.permissionLevel <= permissionLevel).map((m) => m.userId);
    const isInChannel = currentChannelId === categoryId;
    const isInCategory = categoryMembers.some((m) => m.currentChannelId === currentChannelId);
    const isReceptionLobby = currentServerReceptionLobbyId === categoryId;
    const isMemberChannel = categoryVisibility === 'member';
    const isPrivateChannel = categoryVisibility === 'private';
    const isReadonlyChannel = categoryVisibility === 'readonly';
    const isFull = categoryUserLimit && categoryUserLimit <= categoryMembers.length;
    const isSelected = selectedItemId === `category-${categoryId}`;
    const isDraggable = Permission.isChannelMod(permissionLevel) && movableCategoryUserIds.length > 0;
    const isExpandable = expanded[categoryId];
    const canJoin = !isInChannel && !isReadonlyChannel && !(isMemberChannel && !Permission.isMember(permissionLevel)) && (!isFull || Permission.isServerAdmin(permissionLevel));
    const needsPassword = !Permission.isChannelMod(permissionLevel) && isPrivateChannel;
    const filteredCategoryChannels = [...categoryChannels].sort((a, b) => a.order - b.order);
    const filteredCategoryMembers = [...categoryMembers].sort((a, b) => b.lastJoinChannelAt - a.lastJoinChannelAt);

    // Handlers
    const getContextMenuItems = () =>
      new CtxMenuBuilder()
        .addJoinChannelOption({ canJoin, isInChannel }, () => Popup.connectChannel(currentServerId, categoryId, canJoin, needsPassword))
        .addViewOrEditOption(() => Popup.openChannelSetting(userId, currentServerId, categoryId))
        .addSeparator()
        .addCreateChannelOption({ permissionLevel }, () => Popup.openCreateChannel(userId, currentServerId, ''))
        .addCreateSubChannelOption({ permissionLevel }, () => Popup.openCreateChannel(userId, currentServerId, categoryId))
        .addDeleteChannelOption({ permissionLevel }, () => Popup.deleteChannel(currentServerId, categoryId, categoryName))
        .addSeparator()
        .addBroadcastOption({ permissionLevel }, () => Popup.openServerBroadcast(currentServerId, categoryId))
        .addSeparator()
        .addMoveAllUserToChannelOption({ isInChannel, currentPermissionLevel, permissionLevel, movableUserIds: movableCategoryUserIds }, () =>
          Popup.moveAllUsersToChannel(movableCategoryUserIds, currentServerId, categoryId),
        )
        .addEditChannelOrderOption({ permissionLevel }, () => Popup.openEditChannelOrder(userId, currentServerId))
        .addSeparator()
        .addKickChannelUsersFromServerOption({ permissionLevel, movableUserIds: movableCategoryUserIds }, () => Popup.kickUsersFromServer(movableCategoryUserIds, currentServerId))
        .addKickAllUsersFromServerOption({ permissionLevel, movableUserIds: movableServerUserIds }, () => Popup.kickUsersFromServer(movableServerUserIds, currentServerId))
        .addSeparator()
        .addSetReceptionLobbyOption({ permissionLevel, isPrivateChannel, isReadonlyChannel, isReceptionLobby }, () => Popup.editServer(currentServerId, { receptionLobbyId: categoryId }))
        .build();

    const handleTabClick = () => {
      if (isSelected) setSelectedItemId(null);
      else setSelectedItemId(`category-${categoryId}`);
    };

    const handleTabDoubleClick = () => {
      Popup.connectChannel(currentServerId, categoryId, canJoin, needsPassword);
    };

    const handleTabDragStart = (e: React.DragEvent) => {
      if (!isDraggable) return;
      e.dataTransfer.setData('type', 'moveAllUsers');
      e.dataTransfer.setData('userIds', movableCategoryUserIds.join(','));
      e.dataTransfer.setData('currentChannelId', categoryId);
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
      if (!moveType || !currentChannelId || currentChannelId === categoryId || isReadonlyChannel) return;
      switch (moveType) {
        case 'moveUser':
          const targetUserId = e.dataTransfer.getData('userId');
          if (!targetUserId) return;
          Popup.moveUserToChannel(targetUserId, currentServerId, categoryId);
          break;
        case 'moveAllUsers':
          const targetUserIds = e.dataTransfer.getData('userIds');
          if (!targetUserIds) return;
          Popup.moveAllUsersToChannel(targetUserIds.split(','), currentServerId, categoryId);
          break;
      }
    };

    const handleTabContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const { clientX: x, clientY: y } = e;
      contextMenu.showContextMenu(x, y, 'right-bottom', getContextMenuItems());
    };

    const handleTabExpandedClick = () => {
      setExpanded((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }));
    };

    // Effect
    useEffect(() => {
      if (!findMe || !isInCategory) return;
      findMe.handleCategoryExpanded.current = () => {
        setExpanded((prev) => ({ ...prev, [categoryId]: true }));
      };
    }, [categoryId, findMe, setExpanded, isInCategory]);

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
          <div className={`${styles['tab-icon']} ${isExpandable ? styles['expanded'] : ''} ${styles[categoryVisibility]}`} onClick={handleTabExpandedClick} />
          <div className={`${styles['channel-tab-label']} ${isReceptionLobby ? styles['is-reception-lobby'] : ''}`}>{categoryName}</div>
          {!isReadonlyChannel && <div className={styles['channel-user-count-text']}>{`(${categoryMembers.length}${categoryUserLimit > 0 ? `/${categoryUserLimit}` : ''})`}</div>}
          {!isExpandable && isInCategory && <div className={styles['my-location-icon']} />}
        </div>
        <div className={styles['user-list']} style={isExpandable ? {} : { display: 'none' }}>
          {filteredCategoryMembers.map((member) => (
            <UserTab
              key={member.userId}
              user={user}
              currentServer={currentServer}
              currentChannel={currentChannel}
              friends={friends}
              queueUsers={queueUsers}
              channel={category}
              member={member}
              selectedItemId={selectedItemId}
              setSelectedItemId={setSelectedItemId}
              canJoin={canJoin}
              needsPassword={needsPassword}
            />
          ))}
        </div>
        <div className={styles['channel-list']} style={isExpandable ? {} : { display: 'none' }}>
          {filteredCategoryChannels.map((channel) => (
            <ChannelTab
              key={channel.channelId}
              user={user}
              currentServer={currentServer}
              currentChannel={currentChannel}
              friends={friends}
              queueUsers={queueUsers}
              serverOnlineMembers={serverOnlineMembers}
              channel={channel}
              expanded={expanded}
              setExpanded={setExpanded}
              selectedItemId={selectedItemId}
              setSelectedItemId={setSelectedItemId}
            />
          ))}
        </div>
      </>
    );
  },
);

CategoryTab.displayName = 'CategoryTab';

export default CategoryTab;

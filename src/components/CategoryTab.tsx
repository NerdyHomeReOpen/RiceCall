import React, { useEffect, useMemo } from 'react';

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
    const categoryChannels = useMemo(() => channels.filter((c) => c.type === 'channel').filter((c) => c.categoryId === categoryId), [channels, categoryId]);
    const categoryMembers = useMemo(() => serverOnlineMembers.filter((m) => m.currentChannelId === categoryId), [serverOnlineMembers, categoryId]);
    const movableServerUserIds = useMemo(
      () => serverOnlineMembers.filter((m) => m.userId !== userId && m.permissionLevel <= permissionLevel).map((m) => m.userId),
      [userId, serverOnlineMembers, permissionLevel],
    );
    const movableCategoryUserIds = useMemo(
      () => categoryMembers.filter((m) => m.userId !== userId && m.permissionLevel <= permissionLevel).map((m) => m.userId),
      [userId, categoryMembers, permissionLevel],
    );
    const isInChannel = currentChannelId === categoryId;
    const isInCategory = useMemo(() => categoryMembers.some((m) => m.currentChannelId === currentChannelId), [categoryMembers, currentChannelId]);
    const isReceptionLobby = currentServerReceptionLobbyId === categoryId;
    const isMemberChannel = categoryVisibility === 'member';
    const isPrivateChannel = categoryVisibility === 'private';
    const isReadonlyChannel = categoryVisibility === 'readonly';
    const isFull = categoryUserLimit && categoryUserLimit <= categoryMembers.length;
    const isSelected = selectedItemId === `category-${categoryId}`;
    const canJoin = useMemo(
      () => !isInChannel && !isReadonlyChannel && !(isMemberChannel && !Permission.isMember(permissionLevel)) && (!isFull || Permission.isServerAdmin(permissionLevel)),
      [isInChannel, isReadonlyChannel, isMemberChannel, permissionLevel, isFull],
    );
    const needsPassword = useMemo(() => !Permission.isChannelMod(permissionLevel) && isPrivateChannel, [permissionLevel, isPrivateChannel]);
    const filteredCategoryChannels = useMemo(() => categoryChannels.sort((a, b) => a.order - b.order), [categoryChannels]);
    const filteredCategoryMembers = useMemo(
      () => categoryMembers.filter(Boolean).sort((a, b) => b.lastJoinChannelAt - a.lastJoinChannelAt || (a.nickname || a.name).localeCompare(b.nickname || b.name)),
      [categoryMembers],
    );

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

    const handleDragStart = (e: React.DragEvent, userIds: Types.User['userId'][], currentChannelId: Types.Channel['channelId']) => {
      e.dataTransfer.setData('type', 'moveAllUsers');
      e.dataTransfer.setData('userIds', userIds.join(','));
      e.dataTransfer.setData('currentChannelId', currentChannelId);
    };

    const handleDrop = (e: React.DragEvent, serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) => {
      e.preventDefault();
      const moveType = e.dataTransfer.getData('type');
      const currentChannelId = e.dataTransfer.getData('currentChannelId');
      if (!moveType || !currentChannelId || currentChannelId === channelId || isReadonlyChannel) return;
      switch (moveType) {
        case 'moveUser':
          const targetUserId = e.dataTransfer.getData('userId');
          if (!targetUserId) return;
          Popup.moveUserToChannel(targetUserId, serverId, channelId);
          break;
        case 'moveAllUsers':
          const targetUserIds = e.dataTransfer.getData('userIds');
          if (!targetUserIds) return;
          Popup.moveAllUsersToChannel(targetUserIds.split(','), serverId, channelId);
          break;
      }
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
          key={categoryId}
          className={`${styles['channel-tab']} ${isSelected ? styles['selected'] : ''}`}
          onClick={() => {
            if (isSelected) setSelectedItemId(null);
            else setSelectedItemId(`category-${categoryId}`);
          }}
          onDoubleClick={() => Popup.connectChannel(currentServerId, categoryId, canJoin, needsPassword)}
          draggable={Permission.isChannelMod(permissionLevel) && movableCategoryUserIds.length > 0}
          onDragStart={(e) => handleDragStart(e, movableCategoryUserIds, categoryId)}
          onDragOver={(e) => {
            if (Permission.isChannelMod(permissionLevel) && !isReadonlyChannel) e.preventDefault();
            else e.dataTransfer.dropEffect = 'none';
          }}
          onDrop={(e) => {
            if (isReadonlyChannel) return;
            handleDrop(e, currentServerId, categoryId);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const { clientX: x, clientY: y } = e;
            contextMenu.showContextMenu(x, y, 'right-bottom', getContextMenuItems());
          }}
        >
          <div
            className={`${styles['tab-icon']} ${expanded[categoryId] ? styles['expanded'] : ''} ${styles[categoryVisibility]}`}
            onClick={() => setExpanded((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }))}
          />
          <div className={`${styles['channel-tab-label']} ${isReceptionLobby ? styles['is-reception-lobby'] : ''}`}>{categoryName}</div>
          {!isReadonlyChannel && <div className={styles['channel-user-count-text']}>{`(${categoryMembers.length}${categoryUserLimit > 0 ? `/${categoryUserLimit}` : ''})`}</div>}
          {!expanded[categoryId] && isInCategory && <div className={styles['my-location-icon']} />}
        </div>
        <div className={styles['user-list']} style={expanded[categoryId] ? {} : { display: 'none' }}>
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
        <div className={styles['channel-list']} style={expanded[categoryId] ? {} : { display: 'none' }}>
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

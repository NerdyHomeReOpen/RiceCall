import React, { useEffect, useMemo } from 'react';

// CSS
import styles from '@/styles/server.module.css';

// Types
import type { OnlineMember, Channel, Server, User, Category, Friend, QueueUser } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';
import { useFindMeContext } from '@/providers/FindMe';

// Components
import ChannelTab from '@/components/ChannelTab';
import UserTab from '@/components/UserTab';

// Services
import ipc from '@/services/ipc.service';

// Utils
import { handleOpenAlertDialog, handleOpenChannelSetting, handleOpenCreateChannel, handleOpenEditChannelOrder, handleOpenServerBroadcast, handleOpenChannelPassword } from '@/utils/popup';
import { isMember, isChannelAdmin, isServerAdmin, isChannelMod, isStaff } from '@/utils/permission';

interface CategoryTabProps {
  user: User;
  friends: Friend[];
  server: Server;
  serverOnlineMembers: OnlineMember[];
  category: Category;
  channels: (Channel | Category)[];
  currentChannel: Channel;
  queueUsers: QueueUser[];
  expanded: Record<string, boolean>;
  selectedItemId: string | null;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setSelectedItemId: React.Dispatch<React.SetStateAction<string | null>>;
}

const CategoryTab: React.FC<CategoryTabProps> = React.memo(
  ({ user, friends, server, serverOnlineMembers, category, channels, currentChannel, queueUsers, expanded, selectedItemId, setExpanded, setSelectedItemId }) => {
    // Hooks
    const { t } = useTranslation();
    const contextMenu = useContextMenu();
    const findMe = useFindMeContext();

    // Variables
    const { userId, permissionLevel: globalPermissionLevel, currentChannelId: userCurrentChannelId } = user;
    const { channelId: categoryId, name: categoryName, visibility: categoryVisibility, userLimit: categoryUserLimit, permissionLevel: categoryPermissionLevel } = category;
    const { permissionLevel: currentChannelPermissionLevel } = currentChannel;
    const { serverId, permissionLevel: serverPermissionLevel, receptionLobbyId: serverReceptionLobbyId } = server;
    const permissionLevel = Math.max(globalPermissionLevel, serverPermissionLevel, categoryPermissionLevel);
    const currentPermissionLevel = Math.max(globalPermissionLevel, serverPermissionLevel, currentChannelPermissionLevel);
    const serverUserIds = useMemo(() => serverOnlineMembers.map((m) => m.userId), [serverOnlineMembers]);
    const categoryChannels = useMemo(() => channels.filter((c) => c.type === 'channel').filter((c) => c.categoryId === categoryId), [channels, categoryId]);
    const categoryMembers = useMemo(() => serverOnlineMembers.filter((m) => m.currentChannelId === categoryId), [serverOnlineMembers, categoryId]);
    const categoryUserIds = useMemo(() => categoryMembers.map((m) => m.userId), [categoryMembers]);
    const movableUserIds = useMemo(() => categoryMembers.filter((m) => m.permissionLevel <= currentPermissionLevel).map((m) => m.userId), [categoryMembers, currentPermissionLevel]);
    const isInChannel = userCurrentChannelId === categoryId;
    const isInCategory = useMemo(() => categoryMembers.some((m) => m.currentChannelId === userCurrentChannelId), [categoryMembers, userCurrentChannelId]);
    const isReceptionLobby = serverReceptionLobbyId === categoryId;
    const isMemberChannel = categoryVisibility === 'member';
    const isPrivateChannel = categoryVisibility === 'private';
    const isReadonlyChannel = categoryVisibility === 'readonly';
    const isFull = categoryUserLimit && categoryUserLimit <= categoryMembers.length;
    const isSelected = selectedItemId === `category-${categoryId}`;
    const canJoin = !isInChannel && !isReadonlyChannel && !(isMemberChannel && !isMember(permissionLevel)) && (!isFull || isServerAdmin(permissionLevel));
    const filteredCategoryChannels = useMemo(() => categoryChannels.filter(Boolean).sort((a, b) => (a.order !== b.order ? a.order - b.order : a.createdAt - b.createdAt)), [categoryChannels]);
    const filteredCategoryMembers = useMemo(
      () => categoryMembers.filter(Boolean).sort((a, b) => b.lastJoinChannelAt - a.lastJoinChannelAt || (a.nickname || a.name).localeCompare(b.nickname || b.name)),
      [categoryMembers],
    );

    // Handlers
    const getContextMenuItems = () => [
      {
        id: 'join-channel',
        label: t('join-channel'),
        disabled: !canJoin,
        show: !isInChannel,
        onClick: () => handleConnectChannel(serverId, categoryId),
      },
      {
        id: 'view-or-edit',
        label: t('view-or-edit'),
        onClick: () => handleOpenChannelSetting(userId, serverId, categoryId),
      },
      {
        id: 'separator',
        label: '',
      },
      {
        id: 'create-channel',
        label: t('create-channel'),
        show: isServerAdmin(permissionLevel),
        onClick: () => handleOpenCreateChannel(userId, serverId, ''),
      },
      {
        id: 'create-sub-channel',
        label: t('create-sub-channel'),
        show: isChannelAdmin(permissionLevel),
        onClick: () => handleOpenCreateChannel(userId, serverId, categoryId),
      },
      {
        id: 'delete-channel',
        label: t('delete-channel'),
        show: isServerAdmin(permissionLevel),
        onClick: () => handleDeleteChannel(serverId, categoryId),
      },
      {
        id: 'separator',
        label: '',
      },
      {
        id: 'broadcast',
        label: t('broadcast'),
        show: isChannelAdmin(permissionLevel),
        onClick: () => handleOpenServerBroadcast(serverId, categoryId),
      },
      {
        id: 'move-all-user-to-channel',
        label: t('move-all-user-to-channel'),
        show: !isInChannel && isServerAdmin(permissionLevel) && movableUserIds.length > 0,
        onClick: () => handleMoveAllUsersToChannel(movableUserIds, serverId, categoryId),
      },
      {
        id: 'edit-channel-order',
        label: t('edit-channel-order'),
        show: isServerAdmin(permissionLevel),
        onClick: () => handleOpenEditChannelOrder(userId, serverId),
      },
      {
        id: 'separator',
        label: '',
      },
      {
        id: 'kick-channel-users-from-server',
        label: t('kick-channel-users-from-server'),
        disabled: categoryMembers.length === 0,
        show: isStaff(permissionLevel),
        onClick: () => handleKickUsersFromServer(categoryUserIds, serverId),
      },
      {
        id: 'kick-all-users-from-server',
        label: t('kick-all-users-from-server'),
        disabled: serverOnlineMembers.length === 0,
        show: isStaff(permissionLevel),
        onClick: () => handleKickUsersFromServer(serverUserIds, serverId),
      },
      {
        id: 'separator',
        label: '',
      },
      {
        id: 'set-reception-lobby',
        label: t('set-reception-lobby'),
        disabled: isPrivateChannel || isReadonlyChannel,
        show: isServerAdmin(permissionLevel) && !isReceptionLobby,
        onClick: () => handleEditServer(serverId, { receptionLobbyId: categoryId }),
      },
    ];

    const handleEditServer = (serverId: Server['serverId'], update: Partial<Server>) => {
      ipc.socket.send('editServer', { serverId, update });
    };

    const handleConnectChannel = (serverId: Server['serverId'], channelId: Channel['channelId']) => {
      if (!canJoin) return;
      if (!isChannelMod(permissionLevel) && isPrivateChannel) handleOpenChannelPassword((password) => ipc.socket.send('connectChannel', { serverId, channelId, password }));
      else ipc.socket.send('connectChannel', { serverId, channelId });
    };

    const handleMoveUserToChannel = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId']) => {
      ipc.socket.send('moveUserToChannel', { userId, serverId, channelId });
    };

    const handleMoveAllUsersToChannel = (userIds: User['userId'][], serverId: Server['serverId'], channelId: Channel['channelId']) => {
      ipc.socket.send('moveUserToChannel', ...userIds.map((userId) => ({ userId, serverId, channelId })));
    };

    const handleKickUsersFromServer = (userIds: User['userId'][], serverId: Server['serverId']) => {
      handleOpenAlertDialog(t('confirm-kick-users-from-server', { '0': userIds.length }), () => ipc.socket.send('blockUserFromServer', ...userIds.map((userId) => ({ userId, serverId }))));
    };

    const handleDeleteChannel = (serverId: Server['serverId'], channelId: Channel['channelId']) => {
      handleOpenAlertDialog(t('confirm-delete-channel', { '0': categoryName }), () => ipc.socket.send('deleteChannel', { serverId, channelId }));
    };

    const handleDragStart = (e: React.DragEvent, userIds: User['userId'][], currentChannelId: Channel['channelId']) => {
      e.dataTransfer.setData('type', 'moveAllUsers');
      e.dataTransfer.setData('userIds', userIds.join(','));
      e.dataTransfer.setData('currentChannelId', currentChannelId);
    };

    const handleDrop = (e: React.DragEvent, serverId: Server['serverId'], channelId: Channel['channelId']) => {
      e.preventDefault();
      const moveType = e.dataTransfer.getData('type');
      const currentChannelId = e.dataTransfer.getData('currentChannelId');
      if (!moveType || !currentChannelId || currentChannelId === channelId || isReadonlyChannel) return;
      switch (moveType) {
        case 'moveUser':
          const targetUserId = e.dataTransfer.getData('userId');
          if (!targetUserId) return;
          handleMoveUserToChannel(targetUserId, serverId, channelId);
          break;
        case 'moveAllUsers':
          const targetUserIds = e.dataTransfer.getData('userIds');
          if (!targetUserIds) return;
          handleMoveAllUsersToChannel(targetUserIds.split(','), serverId, channelId);
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
        {/* Category View */}
        <div
          key={categoryId}
          className={`${styles['channel-tab']} ${isSelected ? styles['selected'] : ''}`}
          onClick={() => {
            if (isSelected) setSelectedItemId(null);
            else setSelectedItemId(`category-${categoryId}`);
          }}
          onDoubleClick={() => handleConnectChannel(serverId, categoryId)}
          draggable={isChannelMod(permissionLevel) && movableUserIds.length > 0}
          onDragStart={(e) => handleDragStart(e, movableUserIds, categoryId)}
          onDragOver={(e) => {
            if (isChannelMod(permissionLevel) && !isReadonlyChannel) {
              e.preventDefault();
            } else {
              e.dataTransfer.dropEffect = 'none';
            }
          }}
          onDrop={(e) => {
            if (isReadonlyChannel) return;
            handleDrop(e, serverId, categoryId);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const x = e.clientX;
            const y = e.clientY;
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

        {/* Expanded Sections */}
        <div className={styles['user-list']} style={expanded[categoryId] ? {} : { display: 'none' }}>
          {filteredCategoryMembers.map((member) => (
            <UserTab
              key={member.userId}
              user={user}
              friends={friends}
              channel={category}
              currentChannel={currentChannel}
              server={server}
              member={member}
              queueUsers={queueUsers}
              selectedItemId={selectedItemId}
              setSelectedItemId={setSelectedItemId}
              handleConnectChannel={handleConnectChannel}
            />
          ))}
        </div>
        <div className={styles['channel-list']} style={expanded[categoryId] ? {} : { display: 'none' }}>
          {filteredCategoryChannels.map((channel) => (
            <ChannelTab
              key={channel.channelId}
              user={user}
              friends={friends}
              channel={channel}
              currentChannel={currentChannel}
              server={server}
              serverOnlineMembers={serverOnlineMembers}
              queueUsers={queueUsers}
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

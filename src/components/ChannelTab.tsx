import React, { useEffect, useMemo } from 'react';

// CSS
import styles from '@/styles/server.module.css';

// Types
import type { OnlineMember, Channel, Server, User, Friend, QueueUser } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';
import { useFindMeContext } from '@/providers/FindMe';

// Components
import UserTab from '@/components/UserTab';

// Services
import ipc from '@/ipc';

// Utils
import { handleOpenAlertDialog, handleOpenChannelSetting, handleOpenCreateChannel, handleOpenEditChannelOrder, handleOpenServerBroadcast, handleOpenChannelPassword } from '@/utils/popup';
import { isMember, isServerAdmin, isChannelMod, isChannelAdmin, isStaff } from '@/utils/permission';

interface ChannelTabProps {
  user: User;
  currentServer: Server;
  currentChannel: Channel;
  friends: Friend[];
  queueUsers: QueueUser[];
  serverOnlineMembers: OnlineMember[];
  channel: Channel;
  expanded: Record<string, boolean>;
  selectedItemId: string | null;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setSelectedItemId: React.Dispatch<React.SetStateAction<string | null>>;
}

const ChannelTab: React.FC<ChannelTabProps> = React.memo(
  ({ user, currentServer, currentChannel, friends, queueUsers, serverOnlineMembers, channel, expanded, selectedItemId, setExpanded, setSelectedItemId }) => {
    // Hooks
    const { t } = useTranslation();
    const contextMenu = useContextMenu();
    const findMe = useFindMeContext();

    // Variables
    const { userId } = user;
    const { serverId: currentServerId, lobbyId: currentServerLobbyId, receptionLobbyId: currentServerReceptionLobbyId } = currentServer;
    const { channelId: currentChannelId } = currentChannel;
    const { channelId, name: channelName, visibility: channelVisibility, userLimit: channelUserLimit, categoryId: channelCategoryId } = channel;
    const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, channel.permissionLevel);
    const currentPermissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, currentChannel.permissionLevel);
    const channelMembers = useMemo(() => serverOnlineMembers.filter((m) => m.currentChannelId === channelId), [serverOnlineMembers, channelId]);
    const movableServerUserIds = useMemo(
      () => serverOnlineMembers.filter((m) => m.userId !== userId && m.permissionLevel <= permissionLevel).map((m) => m.userId),
      [userId, serverOnlineMembers, permissionLevel],
    );
    const movableChannelUserIds = useMemo(
      () => channelMembers.filter((m) => m.userId !== userId && m.permissionLevel <= permissionLevel).map((m) => m.userId),
      [userId, channelMembers, permissionLevel],
    );
    const isInChannel = currentChannelId === channelId;
    const isLobby = currentServerLobbyId === channelId;
    const isReceptionLobby = currentServerReceptionLobbyId === channelId;
    const isMemberChannel = channelVisibility === 'member';
    const isPrivateChannel = channelVisibility === 'private';
    const isReadonlyChannel = channelVisibility === 'readonly';
    const isFull = channelUserLimit && channelUserLimit <= channelMembers.length;
    const isSelected = selectedItemId === `channel-${channelId}`;
    const canJoin = !isInChannel && !isReadonlyChannel && !(isMemberChannel && !isMember(permissionLevel)) && (!isFull || isServerAdmin(permissionLevel));
    const filteredChannelMembers = useMemo(
      () => channelMembers.filter(Boolean).sort((a, b) => b.lastJoinChannelAt - a.lastJoinChannelAt || (a.nickname || a.name).localeCompare(b.nickname || b.name)),
      [channelMembers],
    );

    // Handlers
    const getContextMenuItems = () => [
      {
        id: 'join-channel',
        label: t('join-channel'),
        disabled: !canJoin,
        show: !isInChannel,
        onClick: () => handleConnectChannel(currentServerId, channelId),
      },
      {
        id: 'view-or-edit',
        label: t('view-or-edit'),
        onClick: () => handleOpenChannelSetting(userId, currentServerId, channelId),
      },
      {
        id: 'separator',
        label: '',
      },
      {
        id: 'create-channel',
        label: t('create-channel'),
        show: isServerAdmin(permissionLevel) && channelCategoryId === null,
        onClick: () => handleOpenCreateChannel(userId, currentServerId, ''),
      },
      {
        id: 'create-sub-channel',
        label: t('create-sub-channel'),
        show: !isLobby && isChannelAdmin(permissionLevel),
        onClick: () => handleOpenCreateChannel(userId, currentServerId, channelCategoryId ? channelCategoryId : channelId),
      },
      {
        id: 'delete-channel',
        label: t('delete-channel'),
        show: !isLobby && isChannelAdmin(permissionLevel),
        onClick: () => handleDeleteChannel(currentServerId, channelId),
      },
      {
        id: 'separator',
        label: '',
      },
      {
        id: 'broadcast',
        label: t('broadcast'),
        show: isChannelAdmin(permissionLevel),
        onClick: () => handleOpenServerBroadcast(currentServerId, channelId),
      },
      {
        id: 'move-all-user-to-channel',
        label: t('move-all-user-to-channel'),
        show: !isInChannel && isChannelMod(currentPermissionLevel) && isChannelMod(permissionLevel) && movableChannelUserIds.length > 0,
        onClick: () => handleMoveAllUsersToChannel(movableChannelUserIds, currentServerId, currentChannelId),
      },
      {
        id: 'edit-channel-order',
        label: t('edit-channel-order'),
        show: isServerAdmin(permissionLevel),
        onClick: () => handleOpenEditChannelOrder(userId, currentServerId),
      },
      {
        id: 'separator',
        label: '',
      },
      {
        id: 'kick-channel-users-from-server',
        label: t('kick-channel-users-from-server'),
        show: isStaff(permissionLevel) && movableChannelUserIds.length > 0,
        onClick: () => handleKickUsersFromServer(movableChannelUserIds, currentServerId),
      },
      {
        id: 'kick-all-users-from-server',
        label: t('kick-all-users-from-server'),
        show: isStaff(permissionLevel) && movableServerUserIds.length > 0,
        onClick: () => handleKickUsersFromServer(movableServerUserIds, currentServerId),
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
        onClick: () => handleEditServer(currentServerId, { receptionLobbyId: channelId }),
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
      handleOpenAlertDialog(t('confirm-move-members-to-channel', { '0': 1 }), () => ipc.socket.send('moveUserToChannel', { userId, serverId, channelId }));
    };

    const handleMoveAllUsersToChannel = (userIds: User['userId'][], serverId: Server['serverId'], channelId: Channel['channelId']) => {
      handleOpenAlertDialog(t('confirm-move-members-to-channel', { '0': userIds.length }), () => ipc.socket.send('moveUserToChannel', ...userIds.map((userId) => ({ userId, serverId, channelId }))));
    };

    const handleKickUsersFromServer = (userIds: User['userId'][], serverId: Server['serverId']) => {
      handleOpenAlertDialog(t('confirm-kick-users-from-server', { '0': userIds.length }), () => ipc.socket.send('blockUserFromServer', ...userIds.map((userId) => ({ userId, serverId }))));
    };

    const handleDeleteChannel = (serverId: Server['serverId'], channelId: Channel['channelId']) => {
      handleOpenAlertDialog(t('confirm-delete-channel', { '0': channelName }), () => ipc.socket.send('deleteChannel', { serverId, channelId }));
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
      if (!findMe || !isInChannel) return;
      findMe.handleChannelExpanded.current = () => {
        setExpanded((prev) => ({ ...prev, [channelId]: true }));
      };
    }, [channelId, findMe, setExpanded, isInChannel]);

    return (
      <>
        {/* Channel View */}
        <div
          key={channelId}
          className={`${styles['channel-tab']} ${isSelected ? styles['selected'] : ''}`}
          onClick={() => {
            if (isSelected) setSelectedItemId(null);
            else setSelectedItemId(`channel-${channelId}`);
          }}
          onDoubleClick={() => handleConnectChannel(currentServerId, channelId)}
          draggable={isChannelMod(permissionLevel) && movableChannelUserIds.length > 0}
          onDragStart={(e) => handleDragStart(e, movableChannelUserIds, channelId)}
          onDragOver={(e) => {
            if (isChannelMod(permissionLevel) && !isReadonlyChannel) {
              e.preventDefault();
            } else {
              e.dataTransfer.dropEffect = 'none';
            }
          }}
          onDrop={(e) => {
            if (isReadonlyChannel) return;
            handleDrop(e, currentServerId, channelId);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const { clientX: x, clientY: y } = e;
            contextMenu.showContextMenu(x, y, 'right-bottom', getContextMenuItems());
          }}
        >
          <div
            className={`${styles['tab-icon']} ${expanded[channelId] ? styles['expanded'] : ''} ${isLobby ? styles['lobby'] : styles[channelVisibility]}`}
            onClick={() => setExpanded((prev) => ({ ...prev, [channelId]: !prev[channelId] }))}
          />
          <div className={`${styles['channel-tab-label']} ${isReceptionLobby ? styles['is-reception-lobby'] : ''}`}>{isLobby ? t(`${channelName}`) : channelName}</div>
          {!isReadonlyChannel && <div className={styles['channel-user-count-text']}>{`(${channelMembers.length}${channelUserLimit > 0 ? `/${channelUserLimit}` : ''})`}</div>}
          {isInChannel && !expanded[channelId] && <div className={styles['my-location-icon']} />}
        </div>

        {/* Expanded Sections */}
        <div className={styles['user-list']} style={expanded[channelId] ? {} : { display: 'none' }}>
          {filteredChannelMembers.map((member) => (
            <UserTab
              key={member.userId}
              user={user}
              currentServer={currentServer}
              currentChannel={currentChannel}
              friends={friends}
              queueUsers={queueUsers}
              channel={channel}
              member={member}
              selectedItemId={selectedItemId}
              setSelectedItemId={setSelectedItemId}
              handleConnectChannel={handleConnectChannel}
            />
          ))}
        </div>
      </>
    );
  },
);

ChannelTab.displayName = 'ChannelTab';

export default ChannelTab;

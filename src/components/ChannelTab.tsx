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
import ipc from '@/services/ipc.service';

// Utils
import { handleOpenAlertDialog, handleOpenChannelSetting, handleOpenCreateChannel, handleOpenEditChannelOrder, handleOpenServerBroadcast, handleOpenChannelPassword } from '@/utils/popup';
import { isMember, isServerAdmin, isChannelMod, isChannelAdmin, isStaff } from '@/utils/permission';

interface ChannelTabProps {
  user: User;
  friends: Friend[];
  server: Server;
  serverOnlineMembers: OnlineMember[];
  channel: Channel;
  currentChannel: Channel;
  queueUsers: QueueUser[];
  expanded: Record<string, boolean>;
  selectedItemId: string | null;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setSelectedItemId: React.Dispatch<React.SetStateAction<string | null>>;
  channelMemberMap: Map<string, OnlineMember[]>;
}

const ChannelTabComponent: React.FC<ChannelTabProps> = ({
  user,
  friends,
  server,
  serverOnlineMembers,
  channel,
  currentChannel,
  queueUsers,
  expanded,
  selectedItemId,
  setExpanded,
  setSelectedItemId,
  channelMemberMap,
}) => {
    // Hooks
    const { t } = useTranslation();
    const contextMenu = useContextMenu();
    const findMe = useFindMeContext();

    // Destructuring
    const { userId, permissionLevel: globalPermissionLevel, currentChannelId: userCurrentChannelId } = user;
    const { channelId, name: channelName, visibility: channelVisibility, userLimit: channelUserLimit, permissionLevel: channelPermissionLevel, categoryId: channelCategoryId } = channel;
    const { permissionLevel: currentChannelPermissionLevel } = currentChannel;
    const { serverId, permissionLevel: serverPermissionLevel, lobbyId: serverLobbyId, receptionLobbyId: serverReceptionLobbyId } = server;

    // Memos
    const permissionLevel = useMemo(() => Math.max(globalPermissionLevel, serverPermissionLevel, channelPermissionLevel), [globalPermissionLevel, serverPermissionLevel, channelPermissionLevel]);
    const currentPermissionLevel = useMemo(
      () => Math.max(globalPermissionLevel, serverPermissionLevel, currentChannelPermissionLevel),
      [globalPermissionLevel, serverPermissionLevel, currentChannelPermissionLevel],
    );
    const serverUserIds = useMemo(() => serverOnlineMembers.map((m) => m.userId), [serverOnlineMembers]);
    const channelMembers = useMemo(() => channelMemberMap.get(channelId) ?? [], [channelMemberMap, channelId]);
    const channelUserIds = useMemo(() => channelMembers.map((m) => m.userId), [channelMembers]);
    const movableUserIds = useMemo(() => channelMembers.filter((m) => m.permissionLevel <= currentPermissionLevel).map((m) => m.userId), [channelMembers, currentPermissionLevel]);
    const isInChannel = useMemo(() => userCurrentChannelId === channelId, [userCurrentChannelId, channelId]);
    const isLobby = useMemo(() => serverLobbyId === channelId, [serverLobbyId, channelId]);
    const isReceptionLobby = useMemo(() => serverReceptionLobbyId === channelId, [serverReceptionLobbyId, channelId]);
    const isMemberChannel = useMemo(() => channelVisibility === 'member', [channelVisibility]);
    const isPrivateChannel = useMemo(() => channelVisibility === 'private', [channelVisibility]);
    const isReadonlyChannel = useMemo(() => channelVisibility === 'readonly', [channelVisibility]);
    const isFull = useMemo(() => channelUserLimit && channelUserLimit <= channelMembers.length, [channelUserLimit, channelMembers]);
    const isSelected = useMemo(() => selectedItemId === `channel-${channelId}`, [selectedItemId, channelId]);
    const canJoin = useMemo(
      () => !isInChannel && !isReadonlyChannel && !(isMemberChannel && !isMember(permissionLevel)) && (!isFull || isServerAdmin(permissionLevel)),
      [isInChannel, isReadonlyChannel, isMemberChannel, permissionLevel, isFull],
    );
    const isExpanded = expanded[channelId] ?? false;
    const filteredChannelMembers = useMemo(
      () =>
        !isExpanded
          ? []
          : channelMembers
              .filter(Boolean)
              .sort((a, b) => b.lastJoinChannelAt - a.lastJoinChannelAt || (a.nickname || a.name).localeCompare(b.nickname || b.name)),
      [channelMembers, isExpanded],
    );

    // Handlers
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
          data-channel-scroll-id={`channel-${channelId}`}
          onClick={() => {
            if (isSelected) setSelectedItemId(null);
            else setSelectedItemId(`channel-${channelId}`);
          }}
          onDoubleClick={() => handleConnectChannel(serverId, channelId)}
          draggable={isChannelMod(permissionLevel) && movableUserIds.length > 0}
          onDragStart={(e) => handleDragStart(e, movableUserIds, channelId)}
          onDragOver={(e) => {
            if (isChannelMod(permissionLevel) && !isReadonlyChannel) {
              e.preventDefault();
            } else {
              e.dataTransfer.dropEffect = 'none';
            }
          }}
          onDrop={(e) => {
            if (isReadonlyChannel) return;
            handleDrop(e, serverId, channelId);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const { clientX: x, clientY: y } = e;
            contextMenu.showContextMenu(x, y, 'right-bottom', [
              {
                id: 'join-channel',
                label: t('join-channel'),
                disabled: !canJoin,
                show: !isInChannel,
                onClick: () => handleConnectChannel(serverId, channelId),
              },
              {
                id: 'view-or-edit',
                label: t('view-or-edit'),
                onClick: () => handleOpenChannelSetting(userId, serverId, channelId),
              },
              {
                id: 'separator',
                label: '',
              },
              {
                id: 'create-channel',
                label: t('create-channel'),
                show: isServerAdmin(permissionLevel) && channelCategoryId === null,
                onClick: () => handleOpenCreateChannel(userId, serverId, ''),
              },
              {
                id: 'create-sub-channel',
                label: t('create-sub-channel'),
                show: !isLobby && isChannelAdmin(permissionLevel),
                onClick: () => handleOpenCreateChannel(userId, serverId, channelCategoryId ? channelCategoryId : channelId),
              },
              {
                id: 'delete-channel',
                label: t('delete-channel'),
                show: !isLobby && isChannelAdmin(permissionLevel),
                onClick: () => handleDeleteChannel(serverId, channelId),
              },
              {
                id: 'separator',
                label: '',
              },
              {
                id: 'broadcast',
                label: t('broadcast'),
                show: isChannelAdmin(permissionLevel),
                onClick: () => handleOpenServerBroadcast(serverId, channelId),
              },
              {
                id: 'move-all-user-to-channel',
                label: t('move-all-user-to-channel'),
                show: !isInChannel && isChannelMod(permissionLevel) && movableUserIds.length > 0,
                onClick: () => handleMoveAllUsersToChannel(movableUserIds, serverId, userCurrentChannelId || ''),
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
                disabled: channelMembers.length === 0,
                show: isStaff(permissionLevel),
                onClick: () => handleKickUsersFromServer(channelUserIds, serverId),
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
                onClick: () => handleEditServer(serverId, { receptionLobbyId: channelId }),
              },
            ]);
          }}
        >
          <div
            className={`${styles['tab-icon']} ${isExpanded ? styles['expanded'] : ''} ${isLobby ? styles['lobby'] : styles[channelVisibility]}`}
            onClick={() => setExpanded((prev) => ({ ...prev, [channelId]: !prev[channelId] }))}
          />
          <div className={`${styles['channel-tab-label']} ${isReceptionLobby ? styles['is-reception-lobby'] : ''}`}>{isLobby ? t(`${channelName}`) : channelName}</div>
          {!isReadonlyChannel && <div className={styles['channel-user-count-text']}>{`(${channelMembers.length}${channelUserLimit > 0 ? `/${channelUserLimit}` : ''})`}</div>}
          {isInChannel && !isExpanded && <div className={styles['my-location-icon']} />}
        </div>

        {/* Expanded Sections */}
        <div className={styles['user-list']} style={isExpanded ? {} : { display: 'none' }}>
          {filteredChannelMembers.map((member) => (
            <UserTab
              key={member.userId}
              user={user}
              friends={friends}
              channel={channel}
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
      </>
    );
  };

const getExpandedState = (expanded: Record<string, boolean>, channelId: string) => expanded[channelId] ?? false;

const areChannelTabPropsEqual = (prev: Readonly<ChannelTabProps>, next: Readonly<ChannelTabProps>) => {
  if (prev.user !== next.user) return false;
  if (prev.friends !== next.friends) return false;
  if (prev.server !== next.server) return false;
  if (prev.serverOnlineMembers !== next.serverOnlineMembers) return false;
  if (prev.channel !== next.channel) return false;
  if (prev.currentChannel !== next.currentChannel) return false;
  if (prev.queueUsers !== next.queueUsers) return false;
  if (prev.selectedItemId !== next.selectedItemId) return false;

  const prevExpanded = getExpandedState(prev.expanded, prev.channel.channelId);
  const nextExpanded = getExpandedState(next.expanded, next.channel.channelId);
  if (prevExpanded !== nextExpanded) return false;

  return true;
};

ChannelTabComponent.displayName = 'ChannelTab';

export default React.memo(ChannelTabComponent, areChannelTabPropsEqual);

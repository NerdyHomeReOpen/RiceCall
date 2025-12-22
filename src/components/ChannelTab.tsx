import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import { useContextMenu } from '@/providers/ContextMenu';
import { useFindMeContext } from '@/providers/FindMe';

import UserTab from '@/components/UserTab';

import * as Popup from '@/utils/popup';
import * as Permission from '@/utils/permission';

import styles from '@/styles/server.module.css';

interface ChannelTabProps {
  user: Types.User;
  currentServer: Types.Server;
  currentChannel: Types.Channel;
  friends: Types.Friend[];
  queueUsers: Types.QueueUser[];
  serverOnlineMembers: Types.OnlineMember[];
  channel: Types.Channel;
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
    const canJoin = !isInChannel && !isReadonlyChannel && !(isMemberChannel && !Permission.isMember(permissionLevel)) && (!isFull || Permission.isServerAdmin(permissionLevel));
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
        onClick: () => Popup.handleOpenChannelSetting(userId, currentServerId, channelId),
      },
      {
        id: 'separator',
        label: '',
      },
      {
        id: 'create-channel',
        label: t('create-channel'),
        show: Permission.isServerAdmin(permissionLevel) && channelCategoryId === null,
        onClick: () => Popup.handleOpenCreateChannel(userId, currentServerId, ''),
      },
      {
        id: 'create-sub-channel',
        label: t('create-sub-channel'),
        show: !isLobby && Permission.isChannelAdmin(permissionLevel),
        onClick: () => Popup.handleOpenCreateChannel(userId, currentServerId, channelCategoryId ? channelCategoryId : channelId),
      },
      {
        id: 'delete-channel',
        label: t('delete-channel'),
        show: !isLobby && Permission.isChannelAdmin(permissionLevel),
        onClick: () => handleDeleteChannel(currentServerId, channelId),
      },
      {
        id: 'separator',
        label: '',
      },
      {
        id: 'broadcast',
        label: t('broadcast'),
        show: Permission.isChannelAdmin(permissionLevel),
        onClick: () => Popup.handleOpenServerBroadcast(currentServerId, channelId),
      },
      {
        id: 'move-all-user-to-channel',
        label: t('move-all-user-to-channel'),
        show: !isInChannel && Permission.isChannelMod(currentPermissionLevel) && Permission.isChannelMod(permissionLevel) && movableChannelUserIds.length > 0,
        onClick: () => handleMoveAllUsersToChannel(movableChannelUserIds, currentServerId, currentChannelId),
      },
      {
        id: 'edit-channel-order',
        label: t('edit-channel-order'),
        show: Permission.isServerAdmin(permissionLevel),
        onClick: () => Popup.handleOpenEditChannelOrder(userId, currentServerId),
      },
      {
        id: 'separator',
        label: '',
      },
      {
        id: 'kick-channel-users-from-server',
        label: t('kick-channel-users-from-server'),
        show: Permission.isStaff(permissionLevel) && movableChannelUserIds.length > 0,
        onClick: () => handleKickUsersFromServer(movableChannelUserIds, currentServerId),
      },
      {
        id: 'kick-all-users-from-server',
        label: t('kick-all-users-from-server'),
        show: Permission.isStaff(permissionLevel) && movableServerUserIds.length > 0,
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
        show: Permission.isServerAdmin(permissionLevel) && !isReceptionLobby,
        onClick: () => handleEditServer(currentServerId, { receptionLobbyId: channelId }),
      },
    ];

    const handleEditServer = (serverId: Types.Server['serverId'], update: Partial<Types.Server>) => {
      ipc.socket.send('editServer', { serverId, update });
    };

    const handleConnectChannel = (serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) => {
      if (!canJoin) return;
      if (!Permission.isChannelMod(permissionLevel) && isPrivateChannel) Popup.handleOpenChannelPassword((password) => ipc.socket.send('connectChannel', { serverId, channelId, password }));
      else ipc.socket.send('connectChannel', { serverId, channelId });
    };

    const handleMoveUserToChannel = (userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) => {
      Popup.handleOpenAlertDialog(t('confirm-move-members-to-channel', { '0': 1 }), () => ipc.socket.send('moveUserToChannel', { userId, serverId, channelId }));
    };

    const handleMoveAllUsersToChannel = (userIds: Types.User['userId'][], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) => {
      Popup.handleOpenAlertDialog(t('confirm-move-members-to-channel', { '0': userIds.length }), () =>
        ipc.socket.send('moveUserToChannel', ...userIds.map((userId) => ({ userId, serverId, channelId }))),
      );
    };

    const handleKickUsersFromServer = (userIds: Types.User['userId'][], serverId: Types.Server['serverId']) => {
      Popup.handleOpenAlertDialog(t('confirm-kick-users-from-server', { '0': userIds.length }), () => ipc.socket.send('blockUserFromServer', ...userIds.map((userId) => ({ userId, serverId }))));
    };

    const handleDeleteChannel = (serverId: Types.Server['serverId'], channelId: Types.Channel['channelId']) => {
      Popup.handleOpenAlertDialog(t('confirm-delete-channel', { '0': channelName }), () => ipc.socket.send('deleteChannel', { serverId, channelId }));
    };

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
        <div
          key={channelId}
          className={`${styles['channel-tab']} ${isSelected ? styles['selected'] : ''}`}
          onClick={() => {
            if (isSelected) setSelectedItemId(null);
            else setSelectedItemId(`channel-${channelId}`);
          }}
          onDoubleClick={() => handleConnectChannel(currentServerId, channelId)}
          draggable={Permission.isChannelMod(permissionLevel) && movableChannelUserIds.length > 0}
          onDragStart={(e) => handleDragStart(e, movableChannelUserIds, channelId)}
          onDragOver={(e) => {
            if (Permission.isChannelMod(permissionLevel) && !isReadonlyChannel) {
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

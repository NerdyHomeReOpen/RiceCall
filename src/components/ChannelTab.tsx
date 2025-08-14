import React, { useEffect } from 'react';

// CSS
import styles from '@/styles/pages/server.module.css';

// Types
import type { Member, Channel, Server, User, Friend } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';
import { useFindMeContext } from '@/providers/FindMe';

// Components
import UserTab from '@/components/UserTab';

// Services
import ipcService from '@/services/ipc.service';

interface ChannelTabProps {
  channel: Channel;
  currentChannel: Channel;
  currentServer: Server;
  friends: Friend[];
  serverMembers: Member[];
  expanded: Record<string, boolean>;
  selectedItemId: string | null;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setSelectedItemId: React.Dispatch<React.SetStateAction<string | null>>;
}

const ChannelTab: React.FC<ChannelTabProps> = React.memo(({ channel, friends, currentChannel, currentServer, serverMembers, expanded, selectedItemId, setExpanded, setSelectedItemId }) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();
  const findMe = useFindMeContext();

  // Variables
  const { channelId, name: channelName, visibility: channelVisibility, userLimit: channelUserLimit, categoryId: channelCategoryId } = channel;
  const { userId, serverId, permissionLevel, lobbyId: serverLobbyId, receptionLobbyId: serverReceptionLobbyId } = currentServer;
  const { channelId: currentChannelId } = currentChannel;
  const channelMembers = serverMembers.filter((mb) => mb.currentChannelId === channelId);
  const channelUserIds = channelMembers.map((mb) => mb.userId);
  const userInChannel = currentChannelId === channelId;
  const isReceptionLobby = serverReceptionLobbyId === channelId;
  const isLobby = serverLobbyId === channelId;
  const needPassword = channelVisibility === 'private' && permissionLevel < 3;
  const canJoin =
    !userInChannel &&
    channelVisibility !== 'readonly' &&
    !(channelVisibility === 'member' && permissionLevel < 2) &&
    (!channelUserLimit || channelUserLimit > channelMembers.length || permissionLevel > 4);
  const canManageChannel = permissionLevel > 4;
  const canCreate = canManageChannel && !channelCategoryId;
  const canCreateSub = canManageChannel && !isLobby;
  const canDelete = canManageChannel && !isLobby;
  const canMoveAllUserToChannel = canManageChannel && !userInChannel && channelUserIds.length !== 0;
  const canSetReceptionLobby = canManageChannel && !isReceptionLobby && channelVisibility !== 'private' && channelVisibility !== 'readonly';

  // Handlers
  const handleEditServer = (serverId: Server['serverId'], update: Partial<Server>) => {
    ipcService.socket.send('editServer', { serverId, update });
  };

  const handleConnectChannel = (serverId: Server['serverId'], channelId: Channel['channelId'], password?: string) => {
    ipcService.socket.send('connectChannel', { serverId, channelId, password });
  };

  const handleMoveToChannel = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId']) => {
    ipcService.socket.send('moveToChannel', { userId, serverId, channelId });
  };

  const handleMoveAllToChannel = (userIds: User['userId'][], serverId: Server['serverId'], channelId: Channel['channelId']) => {
    ipcService.socket.send('moveToChannel', ...userIds.map((userId) => ({ userId, serverId, channelId })));
  };

  const handleDeleteChannel = (serverId: Server['serverId'], channelId: Channel['channelId']) => {
    handleOpenAlertDialog(t('confirm-delete-channel', { '0': channelName }), () => ipcService.socket.send('deleteChannel', { serverId, channelId }));
  };

  const handleOpenChannelSetting = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId']) => {
    ipcService.popup.open('channelSetting', 'channelSetting', { userId, serverId, channelId });
  };

  const handleOpenCreateChannel = (serverId: Server['serverId'], channelId: Channel['channelId'] | null, userId: User['userId']) => {
    ipcService.popup.open('createChannel', 'createChannel', { serverId, channelId, userId });
  };

  const handleOpenEditChannelOrder = (serverId: Server['serverId'], userId: User['userId']) => {
    ipcService.popup.open('editChannelOrder', 'editChannelOrder', { serverId, userId });
  };

  const handleOpenServerBroadcast = (serverId: Server['serverId'], channelId: Channel['channelId']) => {
    ipcService.popup.open('serverBroadcast', 'serverBroadcast', { serverId, channelId });
  };

  const handleOpenChannelPassword = (serverId: Server['serverId'], channelId: Channel['channelId']) => {
    ipcService.popup.open('channelPassword', 'channelPassword', { submitTo: 'channelPassword' });
    ipcService.popup.onSubmit('channelPassword', (password) => handleConnectChannel(serverId, channelId, password));
  };

  const handleOpenAlertDialog = (message: string, callback: () => void) => {
    ipcService.popup.open('dialogAlert', 'dialogAlert', { message, submitTo: 'dialogAlert' });
    ipcService.popup.onSubmit('dialogAlert', callback);
  };

  const handleDragStart = (e: React.DragEvent, userIds: User['userId'][], currentChannelId: Channel['channelId']) => {
    e.dataTransfer.setData('type', 'moveChannelUser');
    e.dataTransfer.setData('userIds', userIds.join(','));
    e.dataTransfer.setData('currentChannelId', currentChannelId);
  };

  const handleDrop = (e: React.DragEvent, serverId: Server['serverId'], channelId: Channel['channelId']) => {
    e.preventDefault();
    const moveType = e.dataTransfer.getData('type');
    const currentChannelId = e.dataTransfer.getData('currentChannelId');
    if (!moveType || !currentChannelId || currentChannelId === channelId || channelVisibility === 'readonly') return;

    switch (moveType) {
      case 'moveUser':
        const targetUserId = e.dataTransfer.getData('userId');
        if (!targetUserId) return;
        handleMoveToChannel(targetUserId, serverId, channelId);
        break;
      case 'moveChannelUser':
        const targetUserIds = e.dataTransfer.getData('userIds').split(',');
        handleMoveAllToChannel(targetUserIds, serverId, channelId);
        break;
    }
  };

  // Effect
  useEffect(() => {
    if (!findMe || !userInChannel) return;
    findMe.handleChannelExpanded.current = () => {
      setExpanded((prev) => ({ ...prev, [channelId]: true }));
    };
  }, [channelId, findMe, setExpanded, userInChannel]);

  return (
    <>
      {/* Channel View */}
      <div
        key={channelId}
        className={`${styles['channel-tab']} ${selectedItemId === `channel-${channelId}` ? styles['selected'] : ''}`}
        onClick={() => {
          if (selectedItemId === `channel-${channelId}`) setSelectedItemId(null);
          else setSelectedItemId(`channel-${channelId}`);
        }}
        onDoubleClick={() => {
          if (!canJoin) return;
          if (needPassword) {
            handleOpenChannelPassword(serverId, channelId);
          } else {
            handleConnectChannel(serverId, channelId);
          }
        }}
        draggable={permissionLevel >= 5 && channelMembers.length !== 0}
        onDragStart={(e) => handleDragStart(e, channelUserIds, channelId)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, serverId, channelId)}
        onContextMenu={(e) => {
          e.stopPropagation();
          const x = e.clientX;
          const y = e.clientY;
          contextMenu.showContextMenu(x, y, false, false, [
            {
              id: 'join-channel',
              label: t('join-channel'),
              show: canJoin,
              onClick: () => {
                if (needPassword) {
                  handleOpenChannelPassword(serverId, channelId);
                } else {
                  handleConnectChannel(serverId, channelId);
                }
              },
            },
            {
              id: 'view-or-edit',
              label: t('view-or-edit'),
              show: canManageChannel,
              onClick: () => handleOpenChannelSetting(userId, serverId, channelId),
            },
            {
              id: 'separator',
              label: '',
              show: canManageChannel,
            },
            {
              id: 'create-channel',
              label: t('create-channel'),
              show: canCreate,
              onClick: () => handleOpenCreateChannel(serverId, null, userId),
            },
            {
              id: 'create-sub-channel',
              label: t('create-sub-channel'),
              show: canCreateSub,
              onClick: () => handleOpenCreateChannel(serverId, channelCategoryId ? channelCategoryId : channelId, userId),
            },
            {
              id: 'delete-channel',
              label: t('delete-channel'),
              show: canDelete,
              onClick: () => handleDeleteChannel(serverId, channelId),
            },
            {
              id: 'separator',
              label: '',
              show: canManageChannel,
            },
            {
              id: 'broadcast',
              label: t('broadcast'),
              show: canManageChannel,
              onClick: () => handleOpenServerBroadcast(serverId, channelCategoryId ? channelCategoryId : channelId),
            },
            {
              id: 'move-all-user-to-channel',
              label: t('move-all-user-to-channel'),
              show: canMoveAllUserToChannel,
              onClick: () => handleMoveAllToChannel(channelUserIds, serverId, currentChannelId),
            },
            {
              id: 'edit-channel-order',
              label: t('edit-channel-order'),
              show: canManageChannel,
              onClick: () => handleOpenEditChannelOrder(serverId, userId),
            },
            {
              id: 'separator',
              label: '',
              show: canSetReceptionLobby,
            },
            {
              id: 'set-reception-lobby',
              label: t('set-reception-lobby'),
              show: canSetReceptionLobby,
              onClick: () => handleEditServer(serverId, { receptionLobbyId: channelId }),
            },
          ]);
        }}
      >
        <div
          className={`${styles['tab-icon']} ${expanded[channelId] ? styles['expanded'] : ''} ${isLobby ? styles['lobby'] : styles[channelVisibility]}`}
          onClick={() => setExpanded((prev) => ({ ...prev, [channelId]: !prev[channelId] }))}
        />
        <div className={`${styles['channel-tab-label']} ${isReceptionLobby ? styles['is-reception-lobby'] : ''}`}>{isLobby ? t(`${channelName}`) : channelName}</div>
        {channelVisibility !== 'readonly' && <div className={styles['channel-user-count-text']}>{`(${channelMembers.length}${channelUserLimit > 0 ? `/${channelUserLimit}` : ''})`}</div>}
        {userInChannel && !expanded[channelId] && <div className={styles['my-location-icon']} />}
      </div>

      {/* Expanded Sections */}
      <div className={styles['user-list']} style={expanded[channelId] ? {} : { display: 'none' }}>
        {channelMembers
          .filter((mb) => !!mb)
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((member) => (
            <UserTab
              key={member.userId}
              member={member}
              friends={friends}
              currentChannel={currentChannel}
              currentServer={currentServer}
              selectedItemId={selectedItemId}
              setSelectedItemId={setSelectedItemId}
            />
          ))}
      </div>
    </>
  );
});

ChannelTab.displayName = 'ChannelTab';

export default ChannelTab;

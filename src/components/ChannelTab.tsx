import React, { useEffect, useMemo } from 'react';

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

// Utils
import { isMember, isServerAdmin, isChannelMod, isChannelAdmin } from '@/utils/permission';

interface ChannelTabProps {
  user: User;
  friends: Friend[];
  server: Server;
  serverMembers: Member[];
  channel: Channel;
  expanded: Record<string, boolean>;
  selectedItemId: string | null;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setSelectedItemId: React.Dispatch<React.SetStateAction<string | null>>;
}

const ChannelTab: React.FC<ChannelTabProps> = React.memo(({ user, friends, server, serverMembers, channel, expanded, selectedItemId, setExpanded, setSelectedItemId }) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();
  const findMe = useFindMeContext();

  // Variables
  const { userId, permissionLevel: globalPermissionLevel, currentChannelId: userCurrentChannelId } = user;
  const { channelId, name: channelName, visibility: channelVisibility, userLimit: channelUserLimit, categoryId: channelCategoryId, permissionLevel: channelPermissionLevel } = channel;
  const { serverId, permissionLevel: serverPermissionLevel, lobbyId: serverLobbyId, receptionLobbyId: serverReceptionLobbyId } = server;

  // Memos
  const permissionLevel = useMemo(() => {
    return Math.max(globalPermissionLevel, serverPermissionLevel, channelPermissionLevel);
  }, [globalPermissionLevel, serverPermissionLevel, channelPermissionLevel]);
  const channelMembers = useMemo(() => {
    return serverMembers.filter((mb) => mb.currentChannelId === channelId);
  }, [serverMembers, channelId]);
  const channelUserIds = useMemo(() => {
    return channelMembers.map((mb) => mb.userId);
  }, [channelMembers]);
  const userInChannel = useMemo(() => {
    return userCurrentChannelId === channelId;
  }, [userCurrentChannelId, channelId]);
  const isLobby = useMemo(() => {
    return serverLobbyId === channelId;
  }, [serverLobbyId, channelId]);
  const isReceptionLobby = useMemo(() => {
    return serverReceptionLobbyId === channelId;
  }, [serverReceptionLobbyId, channelId]);
  const canJoin = useMemo(() => {
    return (
      !userInChannel &&
      channelVisibility !== 'readonly' &&
      !(!isMember(permissionLevel) && channelVisibility === 'member') &&
      (isServerAdmin(permissionLevel) || !channelUserLimit || channelUserLimit > channelMembers.length)
    );
  }, [userInChannel, channelVisibility, permissionLevel, channelUserLimit, channelMembers]);

  // Handlers
  const handleEditServer = (serverId: Server['serverId'], update: Partial<Server>) => {
    ipcService.socket.send('editServer', { serverId, update });
  };

  const handleConnectChannel = (serverId: Server['serverId'], channelId: Channel['channelId']) => {
    if (!isChannelMod(permissionLevel) && channelVisibility === 'private') handleOpenChannelPassword(serverId, channelId);
    ipcService.socket.send('connectChannel', { serverId, channelId });
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

  const handleOpenCreateChannel = (serverId: Server['serverId'], categoryId: Channel['categoryId'], categoryName: Channel['name']) => {
    ipcService.popup.open('createChannel', 'createChannel', { serverId, categoryId, categoryName });
  };

  const handleOpenEditChannelOrder = (serverId: Server['serverId'], userId: User['userId']) => {
    ipcService.popup.open('editChannelOrder', 'editChannelOrder', { serverId, userId });
  };

  const handleOpenServerBroadcast = (serverId: Server['serverId'], channelId: Channel['channelId']) => {
    ipcService.popup.open('serverBroadcast', 'serverBroadcast', { serverId, channelId });
  };

  const handleOpenChannelPassword = (serverId: Server['serverId'], channelId: Channel['channelId']) => {
    ipcService.popup.open('channelPassword', 'channelPassword', { submitTo: 'channelPassword' });
    ipcService.popup.onSubmit('channelPassword', (password) => ipcService.socket.send('connectChannel', { serverId, channelId, password }));
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
          handleConnectChannel(serverId, channelId);
        }}
        draggable={isChannelMod(permissionLevel) && channelMembers.length > 0}
        onDragStart={(e) => handleDragStart(e, channelUserIds, channelId)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          if (channelVisibility === 'readonly') return;
          handleDrop(e, serverId, channelId);
        }}
        onContextMenu={(e) => {
          e.stopPropagation();
          const x = e.clientX;
          const y = e.clientY;
          contextMenu.showContextMenu(x, y, false, false, [
            {
              id: 'join-channel',
              label: t('join-channel'),
              show: canJoin,
              onClick: () => handleConnectChannel(serverId, channelId),
            },
            {
              id: 'view-or-edit',
              label: t('view-or-edit'),
              show: isChannelMod(permissionLevel),
              onClick: () => handleOpenChannelSetting(userId, serverId, channelId),
            },
            {
              id: 'separator',
              label: '',
            },
            {
              id: 'create-channel',
              label: t('create-channel'),
              show: isServerAdmin(permissionLevel),
              onClick: () => handleOpenCreateChannel(serverId, null, userId),
            },
            {
              id: 'create-sub-channel',
              label: t('create-sub-channel'),
              show: isChannelAdmin(permissionLevel),
              onClick: () => handleOpenCreateChannel(serverId, channelCategoryId ? channelCategoryId : channelId, userId),
            },
            {
              id: 'delete-channel',
              label: t('delete-channel'),
              show: isServerAdmin(permissionLevel) && !isLobby,
              onClick: () => handleDeleteChannel(serverId, channelId),
            },
            {
              id: 'separator',
              label: '',
            },
            {
              id: 'broadcast',
              label: t('broadcast'),
              show: isChannelMod(permissionLevel),
              onClick: () => handleOpenServerBroadcast(serverId, channelCategoryId ? channelCategoryId : channelId),
            },
            {
              id: 'move-all-user-to-channel',
              label: t('move-all-user-to-channel'),
              show: isChannelMod(permissionLevel) && channelUserIds.length > 0,
              onClick: () => handleMoveAllToChannel(channelUserIds, serverId, userCurrentChannelId),
            },
            {
              id: 'edit-channel-order',
              label: t('edit-channel-order'),
              show: isServerAdmin(permissionLevel),
              onClick: () => handleOpenEditChannelOrder(serverId, userId),
            },
            {
              id: 'separator',
              label: '',
            },
            {
              id: 'set-reception-lobby',
              label: t('set-reception-lobby'),
              show: isServerAdmin(permissionLevel) && serverReceptionLobbyId !== channelId && channelVisibility !== 'private' && channelVisibility !== 'readonly',
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
            <UserTab key={member.userId} user={user} friends={friends} channel={channel} server={server} member={member} selectedItemId={selectedItemId} setSelectedItemId={setSelectedItemId} />
          ))}
      </div>
    </>
  );
});

ChannelTab.displayName = 'ChannelTab';

export default ChannelTab;

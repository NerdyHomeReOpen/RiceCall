import React, { useEffect } from 'react';

// CSS
import styles from '@/styles/pages/server.module.css';

// Types
import { PopupType, ServerMember, Channel, Server, User, UserFriend, UserServer } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useSocket } from '@/providers/Socket';
import { useContextMenu } from '@/providers/ContextMenu';
import { useFindMeContext } from '@/providers/FindMe';

// Components
import UserTab from '@/components/UserTab';

// Services
import ipcService from '@/services/ipc.service';

interface ChannelTabProps {
  channel: Channel;
  currentChannel: Channel;
  currentServer: UserServer;
  friends: UserFriend[];
  serverMembers: ServerMember[];
  expanded: Record<string, boolean>;
  selectedItemId: string | null;
  selectedItemType: string | null;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setSelectedItemId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedItemType: React.Dispatch<React.SetStateAction<string | null>>;
}

const ChannelTab: React.FC<ChannelTabProps> = React.memo(
  ({
    channel,
    friends,
    currentChannel,
    currentServer,
    serverMembers,
    expanded,
    selectedItemId,
    selectedItemType,
    setExpanded,
    setSelectedItemId,
    setSelectedItemType,
  }) => {
    // Hooks
    const { t } = useTranslation();
    const socket = useSocket();
    const contextMenu = useContextMenu();
    const findMe = useFindMeContext();

    // Variables
    const {
      channelId,
      name: channelName,
      visibility: channelVisibility,
      userLimit: channelUserLimit,
      categoryId: channelCategoryId,
    } = channel;
    const {
      userId,
      serverId,
      permissionLevel,
      lobbyId: serverLobbyId,
      receptionLobbyId: serverReceptionLobbyId,
    } = currentServer;
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
    const canEdit = canManageChannel;
    const canDelete = canManageChannel && !isLobby;
    const canMoveAllUserToChannel = canManageChannel && !userInChannel && channelUserIds.length !== 0;
    const canSetReceptionLobby =
      canManageChannel && !isReceptionLobby && channelVisibility !== 'private' && channelVisibility !== 'readonly';

    // Handlers
    const handleEditServer = (server: Partial<Server>, serverId: Server['serverId']) => {
      if (!socket) return;
      socket.send.editServer({ serverId, server });
    };

    const handleJoinChannel = (
      userId: User['userId'],
      serverId: Server['serverId'],
      channelId: Channel['channelId'],
    ) => {
      if (!socket) return;
      socket.send.connectChannel({ userId, channelId, serverId });
    };

    const handleDeleteChannel = (channelId: Channel['channelId'], serverId: Server['serverId']) => {
      if (!socket) return;
      handleOpenWarningDialog(t('confirm-delete-channel').replace('{0}', channelName), () =>
        socket.send.deleteChannel({ channelId, serverId }),
      );
    };

    const handleOpenWarningDialog = (message: string, callback: () => void) => {
      ipcService.popup.open(PopupType.DIALOG_WARNING, 'warningDialog');
      ipcService.initialData.onRequest('warningDialog', {
        message: message,
        submitTo: 'warningDialog',
      });
      ipcService.popup.onSubmit('warningDialog', callback);
    };

    const handleOpenChannelSetting = (channelId: Channel['channelId'], serverId: Server['serverId']) => {
      ipcService.popup.open(PopupType.CHANNEL_SETTING, 'channelSetting');
      ipcService.initialData.onRequest('channelSetting', {
        channelId,
        serverId,
      });
    };

    const handleOpenCreateChannel = (
      serverId: Server['serverId'],
      channelId: Channel['channelId'] | null,
      userId: User['userId'],
    ) => {
      ipcService.popup.open(PopupType.CREATE_CHANNEL, 'createChannel');
      ipcService.initialData.onRequest('createChannel', {
        serverId,
        channelId,
        userId,
      });
    };

    const handleOpenEditChannelOrder = (serverId: Server['serverId'], userId: User['userId']) => {
      ipcService.popup.open(PopupType.EDIT_CHANNEL_ORDER, 'editChannelOrder');
      ipcService.initialData.onRequest('editChannelOrder', {
        serverId,
        userId,
      });
    };

    const handleOpenChannelPassword = (
      userId: User['userId'],
      serverId: Server['serverId'],
      channelId: Channel['channelId'],
    ) => {
      ipcService.popup.open(PopupType.CHANNEL_PASSWORD, 'channelPassword');
      ipcService.initialData.onRequest('channelPassword', {
        userId,
        serverId,
        channelId,
      });
    };

    const handleOpenServerBroadcast = (serverId: Server['serverId'], channelId: Channel['channelId']) => {
      ipcService.popup.open(PopupType.SERVER_BROADCAST, 'serverBroadcast');
      ipcService.initialData.onRequest('serverBroadcast', {
        serverId,
        channelId,
      });
    };

    const handleDragStart = (e: React.DragEvent, userIds: User['userId'][], currentChannelId: Channel['channelId']) => {
      e.dataTransfer.setData('type', 'moveChannelUser');
      e.dataTransfer.setData('userIds', userIds.join(','));
      e.dataTransfer.setData('currentChannelId', currentChannelId);
    };

    const handleDrop = (e: React.DragEvent, serverId: Server['serverId'], channelId: Channel['channelId']) => {
      e.preventDefault();
      if (!socket) return;
      const moveType = e.dataTransfer.getData('type');
      const currentChannelId = e.dataTransfer.getData('currentChannelId');
      if (!moveType || !currentChannelId || currentChannelId === channelId) return;

      switch (moveType) {
        case 'moveUser':
          const targetUserId = e.dataTransfer.getData('userId');
          if (!targetUserId) return;
          handleJoinChannel(targetUserId, serverId, channelId);
          break;
        case 'moveChannelUser':
          const targetUserIds = e.dataTransfer.getData('userIds').split(',');
          for (const targetUserId of targetUserIds) {
            if (!targetUserId) return;
            handleJoinChannel(targetUserId, serverId, channelId);
          }
          break;
      }
    };

    // Effect
    useEffect(() => {
      if (!findMe || !userInChannel) return;
      findMe.handleChannelExpanded.current = () => {
        setExpanded((prev) => ({
          ...prev,
          [channelId]: true,
        }));
      };
    }, [channelId, findMe, setExpanded, userInChannel]);

    return (
      <>
        {/* Channel View */}
        <div
          key={channelId}
          className={`${styles['channel-tab']} ${
            selectedItemId === channelId && selectedItemType === 'channel' ? styles['selected'] : ''
          }`}
          onClick={() => {
            if (selectedItemId === channelId && selectedItemType === 'channel') {
              setSelectedItemId(null);
              setSelectedItemType(null);
              return;
            }
            setSelectedItemId(channelId);
            setSelectedItemType('channel');
          }}
          onDoubleClick={() => {
            if (!canJoin) return;
            if (needPassword) {
              handleOpenChannelPassword(userId, serverId, channelId);
            } else {
              handleJoinChannel(userId, serverId, channelId);
            }
          }}
          draggable={permissionLevel >= 5 && channelMembers.length !== 0}
          onDragStart={(e) => handleDragStart(e, channelUserIds, channelId)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, serverId, channelId)}
          onContextMenu={(e) => {
            const x = e.clientX;
            const y = e.clientY;
            contextMenu.showContextMenu(x, y, false, false, [
              {
                id: 'join-channel',
                label: t('join-channel'),
                show: canJoin,
                onClick: () => {
                  if (needPassword) {
                    handleOpenChannelPassword(userId, serverId, channelId);
                  } else {
                    handleJoinChannel(userId, serverId, channelId);
                  }
                },
              },
              {
                id: 'edit-channel',
                label: t('edit-channel'),
                show: canEdit,
                onClick: () => handleOpenChannelSetting(channelId, serverId),
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
                onClick: () =>
                  handleOpenCreateChannel(serverId, channelCategoryId ? channelCategoryId : channelId, userId),
              },
              {
                id: 'delete-channel',
                label: t('delete-channel'),
                show: canDelete,
                onClick: () => handleDeleteChannel(channelId, serverId),
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
                onClick: () => {
                  handleOpenServerBroadcast(serverId, channelCategoryId ? channelCategoryId : channelId);
                },
              },
              {
                id: 'move-all-user-to-channel',
                label: t('move-all-user-to-channel'),
                show: canMoveAllUserToChannel,
                onClick: () =>
                  channelUserIds.forEach((userId) => handleJoinChannel(userId, serverId, currentChannelId)),
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
                onClick: () => handleEditServer({ receptionLobbyId: channelId }, serverId),
              },
            ]);
          }}
        >
          <div
            className={`${styles['tab-icon']} ${expanded[channelId] ? styles['expanded'] : ''} ${
              isLobby ? styles['lobby'] : styles[channelVisibility]
            }`}
            onClick={() => setExpanded((prev) => ({ ...prev, [channelId]: !prev[channelId] }))}
          />
          <div className={`${styles['channel-tab-label']} ${isReceptionLobby ? styles['is-reception-lobby'] : ''}`}>
            {channelName}
          </div>
          {channelVisibility !== 'readonly' && (
            <div className={styles['channel-tab-count-text']}>
              {`(${channelMembers.length}${channelUserLimit > 0 ? `/${channelUserLimit}` : ''})`}
            </div>
          )}
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
                selectedItemType={selectedItemType}
                setSelectedItemId={setSelectedItemId}
                setSelectedItemType={setSelectedItemType}
              />
            ))}
        </div>
      </>
    );
  },
);

ChannelTab.displayName = 'ChannelTab';

export default ChannelTab;

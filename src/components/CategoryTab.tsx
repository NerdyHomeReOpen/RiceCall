import React, { useEffect } from 'react';

// CSS
import styles from '@/styles/pages/server.module.css';

// Types
import { PopupType, ServerMember, Channel, Server, User, Category, UserFriend, UserServer } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useSocket } from '@/providers/Socket';
import { useContextMenu } from '@/providers/ContextMenu';
import { useFindMeContext } from '@/providers/FindMe';

// Components
import ChannelTab from '@/components/ChannelTab';

// Services
import ipcService from '@/services/ipc.service';
import Default from '@/utils/default';

interface CategoryTabProps {
  category: Category;
  currentChannel: Channel;
  currentServer: UserServer;
  friends: UserFriend[];
  serverMembers: ServerMember[];
  serverChannels: (Channel | Category)[];
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  selectedItemId: string | null;
  selectedItemType: string | null;
  setSelectedItemId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedItemType: React.Dispatch<React.SetStateAction<string | null>>;
}

const CategoryTab: React.FC<CategoryTabProps> = React.memo(
  ({ category, friends, currentChannel, currentServer, serverMembers, serverChannels, expanded, selectedItemId, selectedItemType, setExpanded, setSelectedItemId, setSelectedItemType }) => {
    // Hooks
    const { t } = useTranslation();
    const socket = useSocket();
    const contextMenu = useContextMenu();
    const findMe = useFindMeContext();

    // Variables
    const { channelId: categoryId, name: categoryName, visibility: categoryVisibility, userLimit: categoryUserLimit, permissionLevel } = category;
    const { userId, serverId, receptionLobbyId: serverReceptionLobbyId } = currentServer;
    const { channelId: currentChannelId } = currentChannel;
    const categoryLobby = Default.channel({
      ...category,
      name: t('channel-lobby'),
      order: -1,
      type: 'channel',
    });
    const categoryChannels = serverChannels.filter((ch) => ch.type === 'channel').filter((ch) => ch.categoryId === categoryId);
    const categoryChannelIds = new Set(categoryChannels.map((ch) => ch.channelId));
    const isAllChannelReadOnly = categoryChannels.every((channel) => channel.visibility === 'readonly');
    const categoryMembers = serverMembers.filter((mb) => categoryChannelIds.has(mb.currentChannelId) || mb.currentChannelId === categoryId);
    const categoryUserIds = categoryMembers.map((mb) => mb.userId);
    const userInCategory = categoryMembers.some((mb) => mb.currentChannelId === currentChannelId);
    const userInChannel = currentChannelId === categoryId;
    const isReceptionLobby = serverReceptionLobbyId === categoryId;
    const needPassword = categoryVisibility === 'private' && permissionLevel < 3;
    const canJoin =
      !userInChannel &&
      categoryVisibility !== 'readonly' &&
      !(categoryVisibility === 'member' && permissionLevel < 2) &&
      (!categoryVisibility || categoryUserLimit > categoryMembers.length || permissionLevel > 4);
    const canEditChannel = permissionLevel > 2;
    const canCreateChannel = permissionLevel > 4;
    const canCreateSubchannel = permissionLevel > 3;
    const canDeleteChannel = permissionLevel > 4;
    const canBroadcastChannel = permissionLevel > 2;
    const canOpenChannelOrder = permissionLevel > 4;
    const canMoveToChannel =
      permissionLevel > 4 && !userInChannel && categoryUserIds.length !== 0;
    const canSetReceptionLobby =
      permissionLevel > 4 &&
      categoryVisibility !== 'private' &&
      categoryVisibility !== 'readonly';

    // Handlers
    const handleEditServer = (server: Partial<Server>, serverId: Server['serverId']) => {
      if (!socket) return;
      socket.send.editServer({ serverId, server });
    };

    const handleJoinChannel = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId']) => {
      if (!socket) return;
      socket.send.connectChannel({ userId, channelId, serverId });
    };

    const handleDeleteChannel = (channelId: Channel['channelId'], serverId: Server['serverId']) => {
      if (!socket) return;
      handleOpenWarningDialog(t('confirm-delete-channel').replace('{0}', categoryName), () => socket.send.deleteChannel({ channelId, serverId }));
    };

    const handleOpenWarningDialog = (message: string, callback: () => void) => {
      ipcService.popup.open(PopupType.DIALOG_WARNING, 'warningDialog');
      ipcService.initialData.onRequest('warningDialog', { message, submitTo: 'warningDialog' });
      ipcService.popup.onSubmit('warningDialog', callback);
    };

    const handleOpenChannelSetting = (channelId: Channel['channelId'], serverId: Server['serverId']) => {
      ipcService.popup.open(PopupType.CHANNEL_SETTING, 'channelSetting');
      ipcService.initialData.onRequest('channelSetting', { channelId, serverId });
    };

    const handleOpenCreateChannel = (serverId: Server['serverId'], channelId: Category['categoryId'], userId: User['userId']) => {
      ipcService.popup.open(PopupType.CREATE_CHANNEL, 'createChannel');
      ipcService.initialData.onRequest('createChannel', { serverId, channelId, userId });
    };

    const handleOpenChangeChannelOrder = (userId: User['userId'], serverId: Server['serverId']) => {
      ipcService.popup.open(PopupType.EDIT_CHANNEL_ORDER, 'editChannelOrder');
      ipcService.initialData.onRequest('editChannelOrder', { serverId, userId });
    };

    const handleOpenServerBroadcast = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId']) => {
      ipcService.popup.open(PopupType.SERVER_BROADCAST, 'serverBroadcast');
      ipcService.initialData.onRequest('serverBroadcast', { userId, serverId, channelId });
    };

    const handleOpenChannelPassword = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId']) => {
      ipcService.popup.open(PopupType.CHANNEL_PASSWORD, 'channelPassword');
      ipcService.initialData.onRequest('channelPassword', { userId, serverId, channelId });
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
      if (!findMe || !userInCategory) return;

      findMe.handleCategoryExpanded.current = () => {
        setExpanded((prev) => ({
          ...prev,
          [categoryId]: true,
        }));
      };
    }, [categoryId, findMe, setExpanded, userInCategory]);

    return (
      <>
        {/* Category View */}
        <div
          key={categoryId}
          className={`${styles['channel-tab']} ${selectedItemId === categoryId && selectedItemType === 'category' ? styles['selected'] : ''}`}
          onClick={() => {
            if (selectedItemId === categoryId && selectedItemType === 'category') {
              setSelectedItemId(null);
              setSelectedItemType(null);
              return;
            }
            setSelectedItemId(categoryId);
            setSelectedItemType('category');
          }}
          onDoubleClick={() => {
            if (!canJoin) return;
            if (needPassword) {
              handleOpenChannelPassword(userId, serverId, categoryId);
            } else {
              handleJoinChannel(userId, serverId, categoryId);
            }
          }}
          draggable={permissionLevel >= 5 && categoryMembers.length !== 0}
          onDragStart={(e) => handleDragStart(e, categoryUserIds, categoryId)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, serverId, categoryId)}
          onContextMenu={(e) => {
            e.stopPropagation();
            const x = e.clientX;
            const y = e.clientY;
            contextMenu.showContextMenu(x, y, false, false, [
              {
                id: 'edit-channel',
                label: t('edit-channel'),
                show: canEditChannel,
                onClick: () => handleOpenChannelSetting(categoryId, serverId),
              },
              {
                id: 'separator',
                label: '',
                show: canCreateChannel || canCreateSubchannel || canDeleteChannel,
              },
              {
                id: 'create-channel',
                label: t('create-channel'),
                show: canCreateChannel,
                onClick: () => handleOpenCreateChannel(serverId, null, userId),
              },
              {
                id: 'create-sub-channel',
                label: t('create-sub-channel'),
                show: canCreateSubchannel,
                onClick: () => handleOpenCreateChannel(serverId, categoryId, userId),
              },
              {
                id: 'delete-channel',
                label: t('delete-channel'),
                show: canDeleteChannel,
                onClick: () => {
                  if (!categoryName) return;
                  handleDeleteChannel(categoryId, serverId);
                },
              },
              {
                id: 'separator',
                label: '',
                show: canBroadcastChannel || canMoveToChannel || canOpenChannelOrder
              },
              {
                id: 'broadcast',
                label: t('broadcast'),
                show: canBroadcastChannel,
                onClick: () => {
                  handleOpenServerBroadcast(userId, serverId, categoryId);
                },
              },
              {
                id: 'move-all-user-to-channel',
                label: t('move-all-user-to-channel'),
                show: canMoveToChannel,
                onClick: () => categoryUserIds.forEach((userId) => handleJoinChannel(userId, serverId, currentChannelId)),
              },
              {
                id: 'edit-channel-order',
                label: t('edit-channel-order'),
                show: canOpenChannelOrder,
                onClick: () => handleOpenChangeChannelOrder(userId, serverId),
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
                onClick: () => handleEditServer({ receptionLobbyId: categoryId }, serverId),
              },
            ]);
          }}
        >
          <div
            className={`${styles['tab-icon']} ${expanded[categoryId] ? styles['expanded'] : ''} ${styles[categoryVisibility]}`}
            onClick={() => setExpanded((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }))}
          />
          <div className={`${styles['channel-tab-label']} ${isReceptionLobby ? styles['is-reception-lobby'] : ''}`}>{categoryName}</div>
          {!isAllChannelReadOnly && <div className={styles['channel-tab-count-text']}>{`(${categoryMembers.length})`}</div>}
          {!expanded[categoryId] && userInCategory && <div className={styles['my-location-icon']} />}
        </div>

        {/* Expanded Sections */}
        <div className={styles['channel-list']} style={expanded[categoryId] ? {} : { display: 'none' }}>
          {categoryVisibility !== 'readonly'
            ? [categoryLobby, ...categoryChannels]
                .filter((ch) => !!ch)
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((channel) => (
                  <ChannelTab
                    key={channel.channelId}
                    channel={channel}
                    friends={friends}
                    currentChannel={currentChannel}
                    currentServer={currentServer}
                    serverMembers={serverMembers}
                    expanded={expanded}
                    setExpanded={setExpanded}
                    selectedItemId={selectedItemId}
                    selectedItemType={selectedItemType}
                    setSelectedItemId={setSelectedItemId}
                    setSelectedItemType={setSelectedItemType}
                  />
                ))
            : categoryChannels
                .filter((ch) => !!ch)
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((channel) => (
                  <ChannelTab
                    key={channel.channelId}
                    channel={channel}
                    friends={friends}
                    currentChannel={currentChannel}
                    currentServer={currentServer}
                    serverMembers={serverMembers}
                    expanded={expanded}
                    setExpanded={setExpanded}
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

CategoryTab.displayName = 'CategoryTab';

export default CategoryTab;

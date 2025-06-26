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
  ({
    category,
    friends,
    currentChannel,
    currentServer,
    serverMembers,
    serverChannels,
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
      channelId: categoryId,
      name: categoryName,
      visibility: categoryVisibility,
      userLimit: channelUserLimit,
    } = category;
    const { userId, serverId, permissionLevel, receptionLobbyId: serverReceptionLobbyId } = currentServer;
    const { channelId: currentChannelId } = currentChannel;
    const categoryChannels = serverChannels
      .filter((ch) => ch.type === 'channel')
      .filter((ch) => ch.categoryId === categoryId);
    const categoryLobby =
      categoryVisibility !== 'readonly'
        ? Default.channel({
            ...category,
            channelId: categoryId,
            name: t('lobby'),
            type: 'channel',
            categoryId: categoryId,
            visibility: categoryVisibility,
            order: -1,
          })
        : null;

    const categoryChannelIds = new Set(categoryChannels.map((ch) => ch.channelId));
    const isAllChannelReadOnly = categoryChannels.every((channel) => channel.visibility === 'readonly');
    const categoryMembers = serverMembers.filter(
      (mb) => categoryChannelIds.has(mb.currentChannelId) || mb.currentChannelId === categoryId,
    );
    const categoryUserIds = categoryMembers.map((mb) => mb.userId);
    const userInCategory = categoryMembers.some((mb) => mb.currentChannelId === currentChannelId);
    const channelMembers = serverMembers.filter((mb) => mb.currentChannelId === categoryId);
    const isReceptionLobby = serverReceptionLobbyId === categoryId;
    const userInChannel = currentChannelId === categoryId;
    const needPassword = categoryVisibility === 'private' && permissionLevel < 3;
    const canJoin =
      !userInChannel &&
      categoryVisibility !== 'readonly' &&
      !(categoryVisibility === 'member' && permissionLevel < 2) &&
      (channelUserLimit === 0 || channelUserLimit > channelMembers.length || permissionLevel > 4);
    const canManageChannel = permissionLevel > 4;
    const canMoveToChannel = canManageChannel && !userInChannel && categoryUserIds.length !== 0;
    const canSetReceptionLobby =
      canManageChannel && !isReceptionLobby && categoryVisibility !== 'private' && categoryVisibility !== 'readonly';

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
      handleOpenWarningDialog(t('warningDeleteChannel').replace('{0}', categoryName), () =>
        socket.send.deleteChannel({ channelId, serverId }),
      );
    };

    const handleOpenWarningDialog = (message: string, callback: () => void) => {
      ipcService.popup.open(PopupType.DIALOG_WARNING, 'warningDialog');
      ipcService.initialData.onRequest('warningDialog', {
        title: message,
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
      channelId: Category['categoryId'],
      userId: User['userId'],
    ) => {
      ipcService.popup.open(PopupType.CREATE_CHANNEL, 'createChannel');
      ipcService.initialData.onRequest('createChannel', {
        serverId,
        channelId,
        userId,
      });
    };

    const handleOpenChangeChannelOrder = (userId: User['userId'], serverId: Server['serverId']) => {
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

    const handleOpenServerBroadcast = (
      userId: User['userId'],
      serverId: Server['serverId'],
      channelId: Channel['channelId'],
    ) => {
      ipcService.popup.open(PopupType.SERVER_BROADCAST, 'serverBroadcast');
      ipcService.initialData.onRequest('serverBroadcast', {
        userId,
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
          className={`${styles['channelTab']} ${
            selectedItemId === categoryId && selectedItemType === 'category' ? styles['selected'] : ''
          }`}
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
            const x = e.clientX;
            const y = e.clientY;
            contextMenu.showContextMenu(x, y, false, false, [
              {
                id: 'joinChannel',
                label: '進入此頻道', // TODO: lang.tr
                show: canJoin,
                onClick: () => {
                  if (!canJoin) return;
                  if (needPassword) {
                    handleOpenChannelPassword(userId, serverId, categoryId);
                  } else {
                    handleJoinChannel(userId, serverId, categoryId);
                  }
                },
              },
              {
                id: 'edit',
                label: t('editChannel'),
                show: canManageChannel,
                onClick: () => handleOpenChannelSetting(categoryId, serverId),
              },
              {
                id: 'separator',
                label: '',
                show: canManageChannel,
              },
              {
                id: 'createChannel',
                label: t('addChannel'),
                show: canManageChannel,
                onClick: () => handleOpenCreateChannel(serverId, null, userId),
              },
              {
                id: 'createSubChannel',
                label: t('addSubChannel'),
                show: canManageChannel,
                onClick: () => handleOpenCreateChannel(serverId, categoryId, userId),
              },
              {
                id: 'deleteChannel',
                label: t('deleteChannel'),
                show: canManageChannel,
                onClick: () => {
                  if (!categoryName) return;
                  handleDeleteChannel(categoryId, serverId);
                },
              },
              {
                id: 'separator',
                label: '',
                show: canManageChannel,
              },
              {
                id: 'broadcastServer',
                label: '廣播', // TODO: lang.tr
                show: canManageChannel,
                onClick: () => {
                  handleOpenServerBroadcast(userId, serverId, categoryId);
                },
              },
              {
                id: 'moveAllUserToChannel',
                label: '批量移動到我的房間', // TODO: lang.tr
                show: canMoveToChannel,
                onClick: () =>
                  categoryUserIds.forEach((userId) => handleJoinChannel(userId, serverId, currentChannelId)),
              },
              {
                id: 'changeChannelOrder',
                label: t('editChannelOrder'),
                show: canManageChannel,
                onClick: () => handleOpenChangeChannelOrder(userId, serverId),
              },
              {
                id: 'separator',
                label: '',
                show: canSetReceptionLobby,
              },
              {
                id: 'setReceptionLobby',
                label: t('setDefaultChannel'),
                show: canSetReceptionLobby,
                onClick: () => handleEditServer({ receptionLobbyId: categoryId }, serverId),
              },
            ]);
          }}
        >
          <div
            className={`
              ${styles['tabIcon']} 
              ${expanded[categoryId] ? styles['expanded'] : ''}
              ${styles[categoryVisibility]}
            `}
            onClick={() =>
              setExpanded((prev) => ({
                ...prev,
                [categoryId]: !prev[categoryId],
              }))
            }
          />
          <div
            className={`
            ${styles['channelTabLable']}
            ${isReceptionLobby ? styles['isReceptionLobby'] : ''}
          `}
          >
            {categoryName}
          </div>
          {!isAllChannelReadOnly && <div className={styles['channelTabCount']}>{`(${categoryMembers.length})`}</div>}
          {!expanded[categoryId] && userInCategory && <div className={styles['myLocationIcon']} />}
        </div>

        {/* Expanded Sections */}
        <div className={styles['channelList']} style={expanded[categoryId] ? {} : { display: 'none' }}>
          {[categoryLobby, ...categoryChannels]
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

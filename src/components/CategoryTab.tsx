import React, { useEffect, useMemo } from 'react';

// CSS
import styles from '@/styles/pages/server.module.css';

// Types
import type { OnlineMember, Channel, Server, User, Category, Friend } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';
import { useFindMeContext } from '@/providers/FindMe';

// Components
import ChannelTab from '@/components/ChannelTab';

// Services
import ipcService from '@/services/ipc.service';
import Default from '@/utils/default';

// Utils
import { isMember, isChannelAdmin, isServerAdmin, isChannelMod } from '@/utils/permission';

interface CategoryTabProps {
  user: User;
  friends: Friend[];
  server: Server;
  serverOnlineMembers: OnlineMember[];
  serverChannels: (Channel | Category)[];
  category: Category;
  expanded: Record<string, boolean>;
  selectedItemId: string | null;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setSelectedItemId: React.Dispatch<React.SetStateAction<string | null>>;
}

const CategoryTab: React.FC<CategoryTabProps> = React.memo(({ user, friends, server, serverOnlineMembers, serverChannels, category, expanded, selectedItemId, setExpanded, setSelectedItemId }) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();
  const findMe = useFindMeContext();

  // Variables
  const { userId, permissionLevel: globalPermissionLevel, currentChannelId: userCurrentChannelId } = user;
  const { channelId: categoryId, name: categoryName, visibility: categoryVisibility, userLimit: categoryUserLimit, permissionLevel: categoryPermissionLevel } = category;
  const { serverId, permissionLevel: serverPermissionLevel, receptionLobbyId: serverReceptionLobbyId } = server;

  // Memos
  const permissionLevel = useMemo(() => {
    return Math.max(globalPermissionLevel, serverPermissionLevel, categoryPermissionLevel);
  }, [globalPermissionLevel, serverPermissionLevel, categoryPermissionLevel]);
  const categoryLobby = useMemo(() => {
    return Default.channel({
      ...category,
      name: t('channel-lobby'),
      order: -1,
      type: 'channel',
    });
  }, [t, category]);
  const categoryChannels = useMemo(() => {
    return serverChannels.filter((ch) => ch.type === 'channel').filter((ch) => ch.categoryId === categoryId);
  }, [serverChannels, categoryId]);

  const categoryChannelIds = useMemo(() => {
    return new Set(categoryChannels.map((ch) => ch.channelId));
  }, [categoryChannels]);

  const categoryMembers = useMemo(() => {
    return serverOnlineMembers.filter((mb) => categoryChannelIds.has(mb.currentChannelId) || mb.currentChannelId === categoryId);
  }, [serverOnlineMembers, categoryChannelIds, categoryId]);

  const categoryMemberUserIds = useMemo(() => {
    return categoryMembers.map((mb) => mb.userId);
  }, [categoryMembers]);

  const userInCategory = useMemo(() => {
    return categoryMembers.some((mb) => mb.currentChannelId === userCurrentChannelId);
  }, [categoryMembers, userCurrentChannelId]);

  const isAllChannelReadOnly = useMemo(() => {
    return categoryChannels.every((channel) => channel.visibility === 'readonly');
  }, [categoryChannels]);

  const isSameChannel = useMemo(() => {
    return userCurrentChannelId === categoryId;
  }, [userCurrentChannelId, categoryId]);

  const canSetReceptionLobby = useMemo(() => {
    return isServerAdmin(permissionLevel) && serverReceptionLobbyId !== categoryId && categoryVisibility !== 'private' && categoryVisibility !== 'readonly';
  }, [permissionLevel, serverReceptionLobbyId, categoryId, categoryVisibility]);

  const canJoin = useMemo(() => {
    return (
      userCurrentChannelId !== categoryId &&
      categoryVisibility !== 'readonly' &&
      !(categoryVisibility === 'member' && !isMember(permissionLevel)) &&
      (!categoryUserLimit || categoryUserLimit > categoryMembers.length || isServerAdmin(permissionLevel))
    );
  }, [categoryId, categoryVisibility, permissionLevel, categoryUserLimit, categoryMembers, userCurrentChannelId]);

  // Handlers
  const handleEditServer = (serverId: Server['serverId'], update: Partial<Server>) => {
    ipcService.socket.send('editServer', { serverId, update });
  };

  const handleConnectChannel = (serverId: Server['serverId'], channelId: Channel['channelId']) => {
    if (!isChannelMod(permissionLevel) && categoryVisibility === 'private') handleOpenChannelPassword(serverId, channelId);
    ipcService.socket.send('connectChannel', { serverId, channelId });
  };

  const handleMoveUserToChannel = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId']) => {
    ipcService.socket.send('moveUserToChannel', { userId, serverId, channelId });
  };

  const handleMoveAllUsersToChannel = (userIds: User['userId'][], serverId: Server['serverId'], channelId: Channel['channelId']) => {
    ipcService.socket.send('moveUserToChannel', ...userIds.map((userId) => ({ userId, serverId, channelId })));
  };

  const handleDeleteChannel = (serverId: Server['serverId'], channelId: Channel['channelId']) => {
    handleOpenAlertDialog(t('confirm-delete-channel', { '0': categoryName }), () => ipcService.socket.send('deleteChannel', { serverId, channelId }));
  };

  const handleOpenChannelSetting = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId']) => {
    ipcService.popup.open('channelSetting', 'channelSetting', { userId, serverId, channelId });
  };

  const handleOpenCreateChannel = (serverId: Server['serverId'], categoryId: Category['categoryId'], categoryName: Category['name']) => {
    ipcService.popup.open('createChannel', 'createChannel', { serverId, categoryId, categoryName });
  };

  const handleOpenChangeChannelOrder = (userId: User['userId'], serverId: Server['serverId']) => {
    ipcService.popup.open('editChannelOrder', 'editChannelOrder', { serverId, userId });
  };

  const handleOpenServerBroadcast = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId']) => {
    ipcService.popup.open('serverBroadcast', 'serverBroadcast', { userId, serverId, channelId });
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
    if (!moveType || !currentChannelId || currentChannelId === channelId || categoryVisibility === 'readonly') return;

    switch (moveType) {
      case 'moveUser':
        const targetUserId = e.dataTransfer.getData('userId');
        if (!targetUserId) return;
        handleMoveUserToChannel(targetUserId, serverId, channelId);
        break;
      case 'moveChannelUser':
        const targetUserIds = e.dataTransfer.getData('userIds').split(',');
        handleMoveAllUsersToChannel(targetUserIds, serverId, channelId);
        break;
    }
  };

  // Effect
  useEffect(() => {
    if (!findMe || !userInCategory) return;
    findMe.handleCategoryExpanded.current = () => {
      setExpanded((prev) => ({ ...prev, [categoryId]: true }));
    };
  }, [categoryId, findMe, setExpanded, userInCategory]);

  return (
    <>
      {/* Category View */}
      <div
        key={categoryId}
        className={`${styles['channel-tab']} ${selectedItemId === `category-${categoryId}` ? styles['selected'] : ''}`}
        onClick={() => {
          if (selectedItemId === `category-${categoryId}`) setSelectedItemId(null);
          else setSelectedItemId(`category-${categoryId}`);
        }}
        onDoubleClick={() => {
          if (!canJoin) return;
          handleConnectChannel(serverId, categoryId);
        }}
        draggable={isChannelMod(permissionLevel) && categoryMembers.length > 0}
        onDragStart={(e) => handleDragStart(e, categoryMemberUserIds, categoryId)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          if (categoryVisibility === 'readonly') return;
          handleDrop(e, serverId, categoryId);
        }}
        onContextMenu={(e) => {
          e.stopPropagation();
          const x = e.clientX;
          const y = e.clientY;
          contextMenu.showContextMenu(x, y, 'right-bottom', [
            {
              id: 'join-channel',
              label: t('join-channel'),
              show: canJoin,
              onClick: () => handleConnectChannel(serverId, categoryId),
            },
            {
              id: 'view-or-edit',
              label: t('view-or-edit'),
              show: isChannelMod(permissionLevel),
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
              onClick: () => handleOpenCreateChannel(serverId, null, ''),
            },
            {
              id: 'create-sub-channel',
              label: t('create-sub-channel'),
              show: isChannelAdmin(permissionLevel),
              onClick: () => handleOpenCreateChannel(serverId, categoryId, categoryName),
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
              show: isChannelMod(permissionLevel),
              onClick: () => {
                handleOpenServerBroadcast(userId, serverId, categoryId);
              },
            },
            {
              id: 'move-all-user-to-channel',
              label: t('move-all-user-to-channel'),
              show: !isSameChannel && isChannelMod(permissionLevel) && categoryMemberUserIds.length !== 0,
              onClick: () => handleMoveAllUsersToChannel(categoryMemberUserIds, serverId, categoryId),
            },
            {
              id: 'edit-channel-order',
              label: t('edit-channel-order'),
              show: isServerAdmin(permissionLevel),
              onClick: () => handleOpenChangeChannelOrder(userId, serverId),
            },
            {
              id: 'separator',
              label: '',
            },
            {
              id: 'set-reception-lobby',
              label: t('set-reception-lobby'),
              show: canSetReceptionLobby,
              onClick: () => handleEditServer(serverId, { receptionLobbyId: categoryId }),
            },
          ]);
        }}
      >
        <div
          className={`${styles['tab-icon']} ${expanded[categoryId] ? styles['expanded'] : ''} ${styles[categoryVisibility]}`}
          onClick={() => setExpanded((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }))}
        />
        <div className={`${styles['channel-tab-label']} ${serverReceptionLobbyId === categoryId ? styles['is-reception-lobby'] : ''}`}>{categoryName}</div>
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
                  user={user}
                  friends={friends}
                  channel={channel}
                  server={server}
                  serverOnlineMembers={serverOnlineMembers}
                  expanded={expanded}
                  setExpanded={setExpanded}
                  selectedItemId={selectedItemId}
                  setSelectedItemId={setSelectedItemId}
                />
              ))
          : categoryChannels
              .filter((ch) => !!ch)
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((channel) => (
                <ChannelTab
                  key={channel.channelId}
                  user={user}
                  friends={friends}
                  channel={channel}
                  server={server}
                  serverOnlineMembers={serverOnlineMembers}
                  expanded={expanded}
                  setExpanded={setExpanded}
                  selectedItemId={selectedItemId}
                  setSelectedItemId={setSelectedItemId}
                />
              ))}
      </div>
    </>
  );
});

CategoryTab.displayName = 'CategoryTab';

export default CategoryTab;

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
import ipc from '@/services/ipc.service';

// Utils
import Default from '@/utils/default';
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

  // Destructuring
  const { userId, permissionLevel: globalPermissionLevel, currentChannelId: userCurrentChannelId } = user;
  const { channelId: categoryId, name: categoryName, visibility: categoryVisibility, userLimit: categoryUserLimit, permissionLevel: categoryPermissionLevel } = category;
  const { serverId, permissionLevel: serverPermissionLevel, receptionLobbyId: serverReceptionLobbyId } = server;

  // Memos
  const permissionLevel = useMemo(() => Math.max(globalPermissionLevel, serverPermissionLevel, categoryPermissionLevel), [globalPermissionLevel, serverPermissionLevel, categoryPermissionLevel]);
  const categoryLobby = useMemo(
    () =>
      Default.channel({
        ...category,
        name: t('channel-lobby'),
        order: -1,
        type: 'channel',
      }),
    [t, category],
  );
  const categoryChannels = useMemo(() => serverChannels.filter((c) => c.type === 'channel').filter((c) => c.categoryId === categoryId), [serverChannels, categoryId]);
  const categoryChannelIds = useMemo(() => new Set(categoryChannels.map((c) => c.channelId)), [categoryChannels]);
  const categoryMembers = useMemo(
    () => serverOnlineMembers.filter((m) => categoryChannelIds.has(m.currentChannelId) || m.currentChannelId === categoryId),
    [serverOnlineMembers, categoryChannelIds, categoryId],
  );
  const categoryUserIds = useMemo(() => categoryMembers.map((m) => m.userId), [categoryMembers]);
  const isInChannel = useMemo(() => userCurrentChannelId !== categoryId, [userCurrentChannelId, categoryId]);
  const isInCategory = useMemo(() => categoryMembers.some((m) => m.currentChannelId === userCurrentChannelId), [categoryMembers, userCurrentChannelId]);
  const isAllChannelReadOnly = useMemo(() => categoryChannels.every((c) => c.visibility === 'readonly'), [categoryChannels]);
  const isReceptionLobby = useMemo(() => serverReceptionLobbyId === categoryId, [serverReceptionLobbyId, categoryId]);
  const isMemberChannel = useMemo(() => categoryVisibility === 'member', [categoryVisibility]);
  const isPrivateChannel = useMemo(() => categoryVisibility === 'private', [categoryVisibility]);
  const isReadonlyChannel = useMemo(() => categoryVisibility === 'readonly', [categoryVisibility]);
  const isFull = useMemo(() => categoryUserLimit && categoryUserLimit > categoryMembers.length, [categoryUserLimit, categoryMembers]);
  const isSelected = useMemo(() => selectedItemId === `category-${categoryId}`, [selectedItemId, categoryId]);
  const canJoin = useMemo(
    () => !isInChannel && !isReadonlyChannel && !(isMemberChannel && !isMember(permissionLevel)) && (!isFull || isServerAdmin(permissionLevel)),
    [isInChannel, isReadonlyChannel, isMemberChannel, permissionLevel, isFull],
  );
  const filteredCategoryChannels = useMemo(
    () => (!isReadonlyChannel ? [categoryLobby, ...categoryChannels] : categoryChannels).filter((ch) => !!ch).sort((a, b) => (a.order !== b.order ? a.order - b.order : a.createdAt - b.createdAt)),
    [categoryChannels, categoryLobby, isReadonlyChannel],
  );

  // Handlers
  const handleEditServer = (serverId: Server['serverId'], update: Partial<Server>) => {
    ipc.socket.send('editServer', { serverId, update });
  };

  const handleConnectChannel = (serverId: Server['serverId'], channelId: Channel['channelId']) => {
    if (!isChannelMod(permissionLevel) && isPrivateChannel) handleOpenChannelPassword(serverId, channelId);
    else ipc.socket.send('connectChannel', { serverId, channelId });
  };

  const handleMoveUserToChannel = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId']) => {
    ipc.socket.send('moveUserToChannel', { userId, serverId, channelId });
  };

  const handleMoveAllUsersToChannel = (userIds: User['userId'][], serverId: Server['serverId'], channelId: Channel['channelId']) => {
    ipc.socket.send('moveUserToChannel', ...userIds.map((userId) => ({ userId, serverId, channelId })));
  };

  const handleDeleteChannel = (serverId: Server['serverId'], channelId: Channel['channelId']) => {
    handleOpenAlertDialog(t('confirm-delete-channel', { '0': categoryName }), () => ipc.socket.send('deleteChannel', { serverId, channelId }));
  };

  const handleOpenChannelSetting = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId']) => {
    ipc.popup.open('channelSetting', 'channelSetting', { userId, serverId, channelId });
  };

  const handleOpenCreateChannel = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId']) => {
    ipc.popup.open('createChannel', 'createChannel', { userId, serverId, channelId });
  };

  const handleOpenChangeChannelOrder = (userId: User['userId'], serverId: Server['serverId']) => {
    ipc.popup.open('editChannelOrder', 'editChannelOrder', { serverId, userId });
  };

  const handleOpenServerBroadcast = (serverId: Server['serverId'], channelId: Channel['channelId']) => {
    ipc.popup.open('serverBroadcast', 'serverBroadcast', { serverId, channelId });
  };

  const handleOpenChannelPassword = (serverId: Server['serverId'], channelId: Channel['channelId']) => {
    ipc.popup.open('channelPassword', 'channelPassword', { submitTo: 'channelPassword' });
    ipc.popup.onSubmit('channelPassword', (password) => ipc.socket.send('connectChannel', { serverId, channelId, password }));
  };

  const handleOpenAlertDialog = (message: string, callback: () => void) => {
    ipc.popup.open('dialogAlert', 'dialogAlert', { message, submitTo: 'dialogAlert' });
    ipc.popup.onSubmit('dialogAlert', callback);
  };

  const handleDragStart = (e: React.DragEvent, members: OnlineMember[], currentChannelId: Channel['channelId']) => {
    const userIds = members.filter((m) => m.permissionLevel < permissionLevel).map((m) => m.userId);
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
        onDoubleClick={() => {
          if (!canJoin) return;
          handleConnectChannel(serverId, categoryId);
        }}
        draggable={isChannelMod(permissionLevel) && categoryMembers.length > 0}
        onDragStart={(e) => handleDragStart(e, categoryMembers, categoryId)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          if (isReadonlyChannel) return;
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
              show: isChannelMod(permissionLevel),
              onClick: () => {
                handleOpenServerBroadcast(serverId, categoryId);
              },
            },
            {
              id: 'move-all-user-to-channel',
              label: t('move-all-user-to-channel'),
              show: !isInChannel && isChannelMod(permissionLevel) && categoryUserIds.length !== 0,
              onClick: () => handleMoveAllUsersToChannel(categoryUserIds, serverId, categoryId),
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
              show: isServerAdmin(permissionLevel) && !isReceptionLobby && !isPrivateChannel && !isReadonlyChannel,
              onClick: () => handleEditServer(serverId, { receptionLobbyId: categoryId }),
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
        {!expanded[categoryId] && isInCategory && <div className={styles['my-location-icon']} />}
      </div>

      {/* Expanded Sections */}
      <div className={styles['channel-list']} style={expanded[categoryId] ? {} : { display: 'none' }}>
        {filteredCategoryChannels.map((channel) => (
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

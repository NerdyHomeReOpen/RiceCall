import React, { useState, useEffect, useRef } from 'react';

// CSS
import styles from '@/styles/pages/server.module.css';
import grade from '@/styles/grade.module.css';
import vip from '@/styles/vip.module.css';
import permission from '@/styles/permission.module.css';

// Types
import {
  PopupType,
  ServerMember,
  Channel,
  Server,
  User,
  Member,
  Category,
  UserFriend,
  UserServer,
  SocketServerEvent,
} from '@/types';

// Providers
import { useLanguage } from '@/providers/Language';
import { useSocket } from '@/providers/Socket';
import { useContextMenu } from '@/providers/ContextMenu';
import { useExpandedContext } from '@/providers/Expanded';
import { useWebRTC } from '@/providers/WebRTC';

// Components
import BadgeListViewer from '@/components/viewers/BadgeList';

// Services
import refreshService from '@/services/refresh.service';
import ipcService from '@/services/ipc.service';
import { createDefault } from '@/utils/createDefault';

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
    const lang = useLanguage();
    const socket = useSocket();
    const contextMenu = useContextMenu();
    const { setCategoryExpanded } = useExpandedContext();

    // Variables
    const {
      channelId: categoryId,
      name: categoryName,
      visibility: categoryVisibility,
      userLimit: channelUserLimit,
    } = category;
    const {
      userId,
      serverId,
      permissionLevel,
      receptionLobbyId: serverReceptionLobbyId,
    } = currentServer;
    const { channelId: currentChannelId } = currentChannel;
    const categoryChannels = serverChannels
      .filter((ch) => ch.type === 'channel')
      .filter((ch) => ch.categoryId === categoryId);
    const categoryLobby =
      categoryVisibility !== 'readonly'
        ? createDefault.channel({
            ...category,
            channelId: categoryId,
            name: lang.tr.lobby,
            type: 'channel',
            categoryId: categoryId,
            visibility: categoryVisibility,
            order: -1,
          })
        : null;
    const categoryMembers = serverMembers.filter(
      (mb) =>
        categoryChannels
          .map((ch) => ch.channelId)
          .includes(mb.currentChannelId) || mb.currentChannelId === categoryId,
    );
    const categoryUserIds = categoryMembers.map((mb) => mb.userId);
    const userInCategory = categoryMembers.some(
      (mb) => mb.currentChannelId === currentChannelId,
    );
    const channelMembers = serverMembers.filter(
      (mb) => mb.currentChannelId === categoryId,
    );
    const isReceptionLobby = serverReceptionLobbyId === categoryId;
    const userInChannel = currentChannelId === categoryId;
    const needPassword =
      categoryVisibility === 'private' && permissionLevel < 3;
    const canJoin =
      !userInChannel &&
      categoryVisibility !== 'readonly' &&
      !(categoryVisibility === 'member' && permissionLevel < 2) &&
      (channelUserLimit === 0 ||
        channelUserLimit > channelMembers.length ||
        permissionLevel > 4);
    const canManageChannel = permissionLevel > 4;
    const canMoveToChannel =
      canManageChannel && !userInChannel && categoryUserIds.length !== 0;
    const canSetReceptionLobby =
      canManageChannel &&
      !isReceptionLobby &&
      categoryVisibility !== 'private' &&
      categoryVisibility !== 'readonly';

    // Handlers
    const handleUpdateServer = (
      server: Partial<Server>,
      serverId: Server['serverId'],
    ) => {
      if (!socket) return;
      socket.send.updateServer({ serverId, server });
    };

    const handleJoinChannel = (
      userId: User['userId'],
      serverId: Server['serverId'],
      channelId: Channel['channelId'],
    ) => {
      if (!socket) return;
      socket.send.connectChannel({ userId, channelId, serverId });
    };

    const handleDeleteChannel = (
      channelId: Channel['channelId'],
      serverId: Server['serverId'],
    ) => {
      if (!socket) return;
      handleOpenWarning(
        lang.tr.warningDeleteChannel.replace('{0}', categoryName),
        () => socket.send.deleteChannel({ channelId, serverId }),
      );
    };

    const handleOpenWarning = (message: string, callback: () => void) => {
      ipcService.popup.open(PopupType.DIALOG_WARNING, 'warningDialog');
      ipcService.initialData.onRequest('warningDialog', {
        title: message,
        submitTo: 'warningDialog',
      });
      ipcService.popup.onSubmit('warningDialog', callback);
    };

    const handleOpenChannelSetting = (
      channelId: Channel['channelId'],
      serverId: Server['serverId'],
    ) => {
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

    const handleOpenChangeChannelOrder = (
      userId: User['userId'],
      serverId: Server['serverId'],
    ) => {
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

    const handleDragStart = (
      e: React.DragEvent,
      userIds: User['userId'][],
      currentChannelId: Channel['channelId'],
    ) => {
      e.dataTransfer.setData('type', 'moveChannelUser');
      e.dataTransfer.setData('userIds', userIds.join(','));
      e.dataTransfer.setData('currentChannelId', currentChannelId);
    };

    const handleDrop = (
      e: React.DragEvent,
      serverId: Server['serverId'],
      channelId: Channel['channelId'],
    ) => {
      e.preventDefault();
      if (!socket) return;
      const moveType = e.dataTransfer.getData('type');
      const currentChannelId = e.dataTransfer.getData('currentChannelId');
      if (!moveType || !currentChannelId || currentChannelId === channelId)
        return;

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
      if (setCategoryExpanded && userInCategory)
        setCategoryExpanded.current = () =>
          setExpanded((prev) => ({
            ...prev,
            [categoryId]: true,
          }));
    }, [categoryId, setCategoryExpanded, setExpanded, userInCategory]);

    return (
      <>
        {/* Category View */}
        <div
          key={categoryId}
          className={`${styles['channelTab']} ${
            selectedItemId === categoryId && selectedItemType === 'category'
              ? styles['selected']
              : ''
          }`}
          onClick={() => {
            if (
              selectedItemId === categoryId &&
              selectedItemType === 'category'
            ) {
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
                label: lang.tr.editChannel,
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
                label: lang.tr.addChannel,
                show: canManageChannel,
                onClick: () => handleOpenCreateChannel(serverId, null, userId),
              },
              {
                id: 'createSubChannel',
                label: lang.tr.addSubChannel,
                show: canManageChannel,
                onClick: () =>
                  handleOpenCreateChannel(serverId, categoryId, userId),
              },
              {
                id: 'deleteChannel',
                label: lang.tr.deleteChannel,
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
                } 
              },
              {
                id: 'moveAllUserToChannel',
                label: '批量移動到我的房間', // TODO: lang.tr
                show: canMoveToChannel,
                onClick: () =>
                  categoryUserIds.forEach((userId) =>
                    handleJoinChannel(userId, serverId, currentChannelId),
                  ),
              },
              {
                id: 'changeChannelOrder',
                label: lang.tr.editChannelOrder,
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
                label: lang.tr.setDefaultChannel,
                show: canSetReceptionLobby,
                onClick: () =>
                  handleUpdateServer(
                    { receptionLobbyId: categoryId },
                    serverId,
                  ),
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
          <div className={styles['channelTabCount']}>
            {`(${categoryMembers.length})`}
          </div>
          {!expanded[categoryId] && userInCategory && (
            <div className={styles['myLocationIcon']} />
          )}
        </div>

        {/* Expanded Sections */}
        <div
          className={styles['channelList']}
          style={expanded[categoryId] ? {} : { display: 'none' }}
        >
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
    const lang = useLanguage();
    const socket = useSocket();
    const contextMenu = useContextMenu();
    const { setChannelExpanded } = useExpandedContext();

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
    const channelMembers = serverMembers.filter(
      (mb) => mb.currentChannelId === channelId,
    );
    const channelUserIds = channelMembers.map((mb) => mb.userId);
    const userInChannel = currentChannelId === channelId;
    const isReceptionLobby = serverReceptionLobbyId === channelId;
    const isLobby = serverLobbyId === channelId;
    const needPassword = channelVisibility === 'private' && permissionLevel < 3;
    const canJoin =
      !userInChannel &&
      channelVisibility !== 'readonly' &&
      !(channelVisibility === 'member' && permissionLevel < 2) &&
      (!channelUserLimit ||
        channelUserLimit > channelMembers.length ||
        permissionLevel > 4);
    const canManageChannel = permissionLevel > 4;
    const canCreate = canManageChannel && !channelCategoryId;
    const canCreateSub = canManageChannel && !isLobby;
    const canEdit = canManageChannel;
    const canDelete = canManageChannel && !isLobby;
    const canMoveAllUserToChannel =
      canManageChannel && !userInChannel && channelUserIds.length !== 0;
    const canSetReceptionLobby =
      canManageChannel &&
      !isReceptionLobby &&
      channelVisibility !== 'private' &&
      channelVisibility !== 'readonly';

    // Handlers
    const handleUpdateServer = (
      server: Partial<Server>,
      serverId: Server['serverId'],
    ) => {
      if (!socket) return;
      socket.send.updateServer({ serverId, server });
    };

    const handleJoinChannel = (
      userId: User['userId'],
      serverId: Server['serverId'],
      channelId: Channel['channelId'],
    ) => {
      if (!socket) return;
      socket.send.connectChannel({ userId, channelId, serverId });
    };

    const handleDeleteChannel = (
      channelId: Channel['channelId'],
      serverId: Server['serverId'],
    ) => {
      if (!socket) return;
      handleOpenWarning(
        lang.tr.warningDeleteChannel.replace('{0}', channelName),
        () => socket.send.deleteChannel({ channelId, serverId }),
      );
    };

    const handleOpenWarning = (message: string, callback: () => void) => {
      ipcService.popup.open(PopupType.DIALOG_WARNING, 'warningDialog');
      ipcService.initialData.onRequest('warningDialog', {
        title: message,
        submitTo: 'warningDialog',
      });
      ipcService.popup.onSubmit('warningDialog', callback);
    };

    const handleOpenChannelSetting = (
      channelId: Channel['channelId'],
      serverId: Server['serverId'],
    ) => {
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

    const handleOpenEditChannelOrder = (
      serverId: Server['serverId'],
      userId: User['userId'],
    ) => {
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

    const handleDragStart = (
      e: React.DragEvent,
      userIds: User['userId'][],
      currentChannelId: Channel['channelId'],
    ) => {
      e.dataTransfer.setData('type', 'moveChannelUser');
      e.dataTransfer.setData('userIds', userIds.join(','));
      e.dataTransfer.setData('currentChannelId', currentChannelId);
    };

    const handleDrop = (
      e: React.DragEvent,
      serverId: Server['serverId'],
      channelId: Channel['channelId'],
    ) => {
      e.preventDefault();
      if (!socket) return;
      const moveType = e.dataTransfer.getData('type');
      const currentChannelId = e.dataTransfer.getData('currentChannelId');
      if (!moveType || !currentChannelId || currentChannelId === channelId)
        return;

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
      if (setChannelExpanded && userInChannel)
        setChannelExpanded.current = () =>
          setExpanded((prev) => ({
            ...prev,
            [channelId]: true,
          }));
    }, [channelId, setChannelExpanded, setExpanded, userInChannel]);

    return (
      <>
        {/* Channel View */}
        <div
          key={channelId}
          className={`${styles['channelTab']} ${
            selectedItemId === channelId && selectedItemType === 'channel'
              ? styles['selected']
              : ''
          }`}
          onClick={() => {
            if (
              selectedItemId === channelId &&
              selectedItemType === 'channel'
            ) {
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
                id: 'joinChannel',
                label: '進入此頻道', // TODO: lang.tr
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
                id: 'editChannel',
                label: lang.tr.editChannel,
                show: canEdit,
                onClick: () => handleOpenChannelSetting(channelId, serverId),
              },
              {
                id: 'separator',
                label: '',
                show: canManageChannel,
              },
              {
                id: 'createChannel',
                label: lang.tr.addChannel,
                show: canCreate,
                onClick: () => handleOpenCreateChannel(serverId, null, userId),
              },
              {
                id: 'createSubChannel',
                label: lang.tr.addSubChannel,
                show: canCreateSub,
                onClick: () =>
                  handleOpenCreateChannel(
                    serverId,
                    channelCategoryId ? channelCategoryId : channelId,
                    userId,
                  ),
              },
              {
                id: 'deleteChannel',
                label: lang.tr.deleteChannel,
                show: canDelete,
                onClick: () => handleDeleteChannel(channelId, serverId),
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
                  handleOpenServerBroadcast(userId, serverId, channelCategoryId ? channelCategoryId : channelId);
                } 
              },
              {
                id: 'moveAllUserToChannel',
                label: lang.tr.moveAllUserToChannel,
                show: canMoveAllUserToChannel,
                onClick: () =>
                  channelUserIds.forEach((userId) =>
                    handleJoinChannel(userId, serverId, currentChannelId),
                  ),
              },
              {
                id: 'editChannelOrder',
                label: lang.tr.editChannelOrder,
                show: canManageChannel,
                onClick: () => handleOpenEditChannelOrder(serverId, userId),
              },
              {
                id: 'separator',
                label: '',
                show: canSetReceptionLobby,
              },
              {
                id: 'setReceptionLobby',
                label: lang.tr.setDefaultChannel,
                show: canSetReceptionLobby,
                onClick: () =>
                  handleUpdateServer({ receptionLobbyId: channelId }, serverId),
              },
            ]);
          }}
        >
          <div
            className={`
              ${styles['tabIcon']} 
              ${expanded[channelId] ? styles['expanded'] : ''} 
              ${isLobby ? styles['lobby'] : styles[channelVisibility]} 
            `}
            onClick={() =>
              setExpanded((prev) => ({
                ...prev,
                [channelId]: !prev[channelId],
              }))
            }
          />
          <div
            className={`
              ${styles['channelTabLable']} 
              ${isReceptionLobby ? styles['isReceptionLobby'] : ''} 
            `}
          >
            {channelName}
          </div>
          {channelVisibility !== 'readonly' && (
            <div className={styles['channelTabCount']}>
              {`(${channelMembers.length}${
                channelUserLimit > 0 ? `/${channelUserLimit}` : ''
              })`}
            </div>
          )}
          {userInChannel && !expanded[channelId] && (
            <div className={styles['myLocationIcon']} />
          )}
        </div>

        {/* Expanded Sections */}
        <div
          className={styles['userList']}
          style={expanded[channelId] ? {} : { display: 'none' }}
        >
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

interface UserTabProps {
  member: ServerMember;
  currentChannel: Channel;
  currentServer: UserServer;
  friends: UserFriend[];
  selectedItemId: string | null;
  selectedItemType: string | null;
  setSelectedItemId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedItemType: React.Dispatch<React.SetStateAction<string | null>>;
}

const UserTab: React.FC<UserTabProps> = React.memo(
  ({
    member,
    friends,
    currentChannel,
    currentServer,
    selectedItemId,
    selectedItemType,
    setSelectedItemId,
    setSelectedItemType,
  }) => {
    // Hooks
    const lang = useLanguage();
    const contextMenu = useContextMenu();
    const socket = useSocket();
    const webRTC = useWebRTC();

    // Refs
    // const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    // const qualifyingEventRef = useRef<React.MouseEvent<HTMLDivElement> | null>(
    //   null,
    // );
    // const initialPosForThresholdRef = useRef<{ x: number; y: number } | null>(
    //   null,
    // );
    // const hasMovedTooMuchInitiallyRef = useRef<boolean>(false);
    const userTabRef = useRef<HTMLDivElement>(null);

    // // Constants
    // const HOVER_DELAY = 500;
    // const MOVEMENT_THRESHOLD = 5;

    // Variables
    const {
      name: memberName,
      permissionLevel: memberPermission,
      nickname: memberNickname,
      level: memberLevel,
      gender: memberGender,
      badges: memberBadges,
      vip: memberVip,
      userId: memberUserId,
      currentChannelId: memberCurrentChannelId,
      currentServerId: memberCurrentServerId,
    } = member;
    const {
      userId,
      serverId,
      permissionLevel: userPermission,
      lobbyId: serverLobbyId,
    } = currentServer;
    const { channelId: currentChannelId } = currentChannel;
    const isCurrentUser = memberUserId === userId;
    const speakingStatus =
      webRTC.speakStatus?.[memberUserId] ||
      (isCurrentUser && webRTC.volumePercent) ||
      0;
    const isSpeaking = speakingStatus !== 0;
    const isMuted = speakingStatus === -1;
    const isMutedByUser = webRTC.muteList.includes(memberUserId);
    const isFriend = friends.some((fd) => fd.targetId === memberUserId);
    const canApplyFriend = !isFriend && !isCurrentUser;
    const canManageMember =
      !isCurrentUser &&
      userPermission > 4 &&
      memberPermission < 6 &&
      userPermission > memberPermission;
    const canEditNickname =
      (canManageMember && memberPermission != 1) || (isCurrentUser && userPermission > 1);
    const canChangeToGuest =
      canManageMember && memberPermission !== 1 && userPermission > 4;
    const canChangeToMember =
      canManageMember &&
      memberPermission !== 2 &&
      (memberPermission > 1 || userPermission > 5);
    const canChangeToChannelAdmin =
      canManageMember &&
      memberPermission !== 3 &&
      memberPermission > 1 &&
      userPermission > 3;
    const canChangeToCategoryAdmin =
      canManageMember &&
      memberPermission !== 4 &&
      memberPermission > 1 &&
      userPermission > 4;
    const canChangeToAdmin =
      canManageMember &&
      memberPermission !== 5 &&
      memberPermission > 1 &&
      userPermission > 5;
    const canKickServer = canManageMember && memberCurrentServerId === serverId;
    const canKickChannel =
      canManageMember && memberCurrentChannelId !== serverLobbyId;
    const canBan = canManageMember;
    const canMoveToChannel =
      canManageMember && memberCurrentChannelId !== currentChannelId;
    const canMute = !isCurrentUser && !isMutedByUser;
    const canUnmute = !isCurrentUser && isMutedByUser;
    const canRemoveMembership = isCurrentUser && userPermission > 1 && userPermission < 6;

    // Handlers
    const handleMuteUser = (userId: User['userId']) => {
      if (!webRTC) return;
      webRTC.handleMute(userId);
    };

    const handleUnmuteUser = (userId: User['userId']) => {
      if (!webRTC) return;
      webRTC.handleUnmute(userId);
    };

    const handleKickServer = (
      userId: User['userId'],
      serverId: Server['serverId'],
    ) => {
      if (!socket) return;
      socket.send.disconnectServer({ userId, serverId });
    };

    const handleKickChannel = (
      userId: User['userId'],
      lobbyId: Channel['channelId'],
      serverId: Server['serverId'],
    ) => {
      if (!socket) return;
      socket.send.connectChannel({ userId, channelId: lobbyId, serverId });
    };

    const handleUpdateMember = (
      member: Partial<Member>,
      userId: User['userId'],
      serverId: Server['serverId'],
    ) => {
      if (!socket) return;
      socket.send.updateMember({
        member,
        userId,
        serverId,
      });
    };

    const handleMoveToChannel = (
      userId: User['userId'],
      serverId: Server['serverId'],
      channelId: Channel['channelId'],
    ) => {
      if (!socket) return;
      socket.send.connectChannel({ userId, serverId, channelId });
    };

    const handleOpenEditNickname = (
      userId: User['userId'],
      serverId: Server['serverId'],
    ) => {
      ipcService.popup.open(PopupType.EDIT_NICKNAME, 'editNickname');
      ipcService.initialData.onRequest('editNickname', {
        serverId,
        userId,
      });
    };

    const handleOpenApplyFriend = (
      userId: User['userId'],
      targetId: User['userId'],
    ) => {
      ipcService.popup.open(PopupType.APPLY_FRIEND, 'applyFriend');
      ipcService.initialData.onRequest('applyFriend', {
        userId,
        targetId,
      });
    };

    const handleOpenDirectMessage = (
      userId: User['userId'],
      targetId: User['userId'],
      targetName: User['name'],
    ) => {
      ipcService.popup.open(
        PopupType.DIRECT_MESSAGE,
        `directMessage-${targetId}`,
      );
      ipcService.initialData.onRequest(`directMessage-${targetId}`, {
        userId,
        targetId,
        targetName,
      });
    };

    const handleOpenUserInfo = (
      userId: User['userId'],
      targetId: User['userId'],
    ) => {
      ipcService.popup.open(PopupType.USER_INFO, `userInfo-${targetId}`);
      ipcService.initialData.onRequest(`userInfo-${targetId}`, {
        userId,
        targetId,
      });
    };

    const handleOpeAlert = (message: string, callback: () => void) => {
      ipcService.popup.open(PopupType.DIALOG_ALERT, 'alertDialog');
      ipcService.initialData.onRequest('alertDialog', {
        title: message,
        submitTo: 'alertDialog',
      });
      ipcService.popup.onSubmit('alertDialog', callback);
    };

    const handleRemoveMembership = (
      userId: User['userId'],
      serverId: Server['serverId'],
    ) => {
      if (!socket) return;
      handleOpeAlert(
        '確定要解除自己與語音群的會員關係嗎', // lang.tr
        () => {
          handleUpdateMember(
            { permissionLevel: 1 },
            userId,
            serverId,
          )
        }
      );
    };

    const handleDragStart = (
      e: React.DragEvent,
      userId: User['userId'],
      channelId: Channel['channelId'],
    ) => {
      e.dataTransfer.setData('type', 'moveUser');
      e.dataTransfer.setData('userId', userId);
      e.dataTransfer.setData('currentChannelId', channelId);
    };

    return (
      <div
        ref={userTabRef}
        key={memberUserId}
        className={`context-menu-container ${styles['userTab']} ${
          selectedItemId === memberUserId && selectedItemType === 'user'
            ? styles['selected']
            : ''
        }`}
        onMouseEnter={() => {
          if (!userTabRef.current) return;
          const x = userTabRef.current.getBoundingClientRect().left + 
                    userTabRef.current.getBoundingClientRect().width + 
                    10;
          const y = userTabRef.current.getBoundingClientRect().top;
          contextMenu.showUserInfoBlock(x, y, false, member);
        }}
        onClick={() => {
          if (selectedItemId === memberUserId && selectedItemType === 'user') {
            setSelectedItemId(null);
            setSelectedItemType(null);
            return;
          }
          setSelectedItemId(memberUserId);
          setSelectedItemType('user');
        }}
        onDoubleClick={() => {
          if (isCurrentUser) return;
          handleOpenDirectMessage(userId, memberUserId, memberName);
        }}
        draggable={userPermission >= 5 && memberUserId !== userId}
        onDragStart={(e) =>
          handleDragStart(e, memberUserId, memberCurrentChannelId)
        }
        onContextMenu={(e) => {
          const x = e.clientX;
          const y = e.clientY;
          contextMenu.showContextMenu(x, y, false, false, [
            {
              id: 'direct-message',
              label: lang.tr.directMessage,
              show: !isCurrentUser,
              onClick: () =>
                handleOpenDirectMessage(userId, memberUserId, memberName),
            },
            {
              id: 'view-profile',
              label: lang.tr.viewProfile,
              onClick: () => handleOpenUserInfo(userId, memberUserId),
            },
            {
              id: 'apply-friend',
              label: lang.tr.addFriend,
              show: canApplyFriend,
              onClick: () => handleOpenApplyFriend(userId, memberUserId),
            },
            {
              id: 'mute',
              label: lang.tr.mute,
              show: canMute,
              onClick: () => handleMuteUser(memberUserId),
            },
            {
              id: 'unmute',
              label: lang.tr.unmute,
              show: canUnmute,
              onClick: () => handleUnmuteUser(memberUserId),
            },
            {
              id: 'edit-nickname',
              label: lang.tr.editNickname,
              show: canEditNickname,
              onClick: () => handleOpenEditNickname(memberUserId, serverId),
            },
            {
              id: 'separator',
              label: '',
              show: canMoveToChannel,
            },
            {
              id: 'move-to-channel',
              label: lang.tr.moveToChannel,
              show: canMoveToChannel,
              onClick: () =>
                handleMoveToChannel(memberUserId, serverId, currentChannelId),
            },
            {
              id: 'separator',
              label: '',
              show: canManageMember,
            },
            {
              id: 'forbid-voice',
              label: lang.tr.forbidVoice,
              show: canManageMember,
              disabled: true,
              onClick: () => {},
            },
            {
              id: 'forbid-text',
              label: lang.tr.forbidText,
              show: canManageMember,
              disabled: true,
              onClick: () => {},
            },
            {
              id: 'kick-channel',
              label: lang.tr.kickChannel,
              show: canKickChannel,
              onClick: () => {
                handleKickChannel(memberUserId, serverLobbyId, serverId);
              },
            },
            {
              id: 'kick-server',
              label: lang.tr.kickServer,
              show: canKickServer,
              onClick: () => {
                handleUpdateMember(
                  {
                    isBlocked: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days TODO: user can set the time
                  },
                  memberUserId,
                  serverId,
                );
                handleKickServer(memberUserId, serverId);
              },
            },
            {
              id: 'ban',
              label: lang.tr.ban,
              show: canBan,
              onClick: () => {
                handleUpdateMember(
                  { permissionLevel: 1, isBlocked: -1 },
                  memberUserId,
                  serverId,
                );
                handleKickServer(memberUserId, serverId);
              },
            },
            {
              id: 'separator',
              label: '',
              show: canManageMember || canRemoveMembership,
            },
            {
              id: 'remove-self-membership',
              label: '解除會員關係', // lang.tr
              show: canRemoveMembership,
              onClick: () => {
                handleRemoveMembership(userId, serverId)
              },
            },
            {
              id: 'send-member-application',
              label: lang.tr.sendMemberApplication,
              show: canManageMember && memberPermission === 1,
              disabled: true,
              onClick: () => {
                /* sendMemberApplication() */
              },
            },
            {
              id: 'member-management',
              label: lang.tr.memberManagement,
              show: canManageMember && memberPermission > 1,
              icon: 'submenu',
              hasSubmenu: true,
              submenuItems: [
                {
                  id: 'set-guest',
                  label: lang.tr.setGuest,
                  show: canChangeToGuest,
                  onClick: () =>
                    handleUpdateMember(
                      { permissionLevel: 1 },
                      memberUserId,
                      serverId,
                    ),
                },
                {
                  id: 'set-member',
                  label: lang.tr.setMember,
                  show: canChangeToMember,
                  onClick: () =>
                    handleUpdateMember(
                      { permissionLevel: 2 },
                      memberUserId,
                      serverId,
                    ),
                },
                {
                  id: 'set-channel-admin',
                  label: lang.tr.setChannelAdmin,
                  show: canChangeToChannelAdmin,
                  onClick: () =>
                    handleUpdateMember(
                      { permissionLevel: 3 },
                      memberUserId,
                      serverId,
                    ),
                },
                {
                  id: 'set-category-admin',
                  label: lang.tr.setCategoryAdmin,
                  show: canChangeToCategoryAdmin,
                  onClick: () =>
                    handleUpdateMember(
                      { permissionLevel: 4 },
                      memberUserId,
                      serverId,
                    ),
                },
                {
                  id: 'set-admin',
                  label: lang.tr.setAdmin,
                  show: canChangeToAdmin,
                  onClick: () =>
                    handleUpdateMember(
                      { permissionLevel: 5 },
                      memberUserId,
                      serverId,
                    ),
                },
              ],
            },
          ]);
        }}
      >
        <div
          className={`
            ${styles['userState']} 
            ${isSpeaking && !isMuted ? styles['play'] : ''} 
            ${!isSpeaking && isMuted ? styles['muted'] : ''} 
            ${isMutedByUser ? styles['muted'] : ''}
          `}
        />
        <div
          className={`${styles['gradeIcon']} 
            ${permission[memberGender]} 
            ${permission[`lv-${memberPermission}`]}
          `}
        />
        {memberVip > 0 && (
          <div
            className={`
              ${vip['vipIcon']} 
              ${vip[`vip-small-${memberVip}`]}
            `}
          />
        )}
        <div
          className={`
            ${styles['userTabName']} 
            ${memberNickname ? styles['member'] : ''}
            ${memberVip > 0 ? styles['isVIP'] : ''}
          `}
        >
          {memberNickname || memberName}
        </div>
        <div
          className={`
            ${grade['grade']} 
            ${grade[`lv-${Math.min(56, memberLevel)}`]}
          `}
          style={{ cursor: 'default' }}
        />
        <BadgeListViewer badges={memberBadges} maxDisplay={5} />
        {isCurrentUser && <div className={styles['myLocationIcon']} />}
      </div>
    );
  },
);

UserTab.displayName = 'UserTab';

interface ChannelListViewerProps {
  currentServer: UserServer;
  currentChannel: Channel;
  serverMembers: ServerMember[];
  serverChannels: (Channel | Category)[];
  friends: UserFriend[];
}

const ChannelListViewer: React.FC<ChannelListViewerProps> = React.memo(
  ({
    currentServer,
    currentChannel,
    serverMembers,
    serverChannels,
    friends,
  }) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();
    const contextMenu = useContextMenu();
    const { handleSetCategoryExpanded, handleSetChannelExpanded } =
      useExpandedContext();

    // Refs
    const viewerRef = useRef<HTMLDivElement>(null);
    const settingButtonRef = useRef<HTMLDivElement>(null);

    // States
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [view, setView] = useState<'all' | 'current'>('all');
    const [latency, setLatency] = useState<string>('0');
    const [selectedItemId, setSelectedItemId] = useState<string | null>(
      currentChannel.channelId,
    );
    const [selectedItemType, setSelectedItemType] = useState<string | null>(
      'channel',
    );
    const [memberApplicationsCount, setMemberApplicationsCount] = useState<number>(0);

    // Variables
    const connectStatus = 4 - Math.floor(Number(latency) / 50);
    const {
      userId,
      serverId,
      name: serverName,
      avatarUrl: serverAvatarUrl,
      displayId: serverDisplayId,
      receiveApply: serverReceiveApply,
      permissionLevel: userPermission,
      favorite: isFavorite,
    } = currentServer;
    const {
      channelId: currentChannelId,
      name: currentChannelName,
      voiceMode: currentChannelVoiceMode,
    } = currentChannel;
    const isVerifyServer = false;
    const canEditNickname = userPermission > 1;
    const canApplyMember = userPermission < 2;
    const canOpenSettings = userPermission > 4;

    // Handlers
    const handleFavoriteServer = (serverId: Server['serverId']) => {
      if (!socket) return;
      socket.send.favoriteServer({
        serverId,
      });
    };

    const handleOpenAlert = (message: string) => {
      ipcService.popup.open(PopupType.DIALOG_ALERT, 'alertDialog');
      ipcService.initialData.onRequest('alertDialog', {
        title: message,
      });
    };

    const handleOpenServerSetting = (
      userId: User['userId'],
      serverId: Server['serverId'],
    ) => {
      ipcService.popup.open(PopupType.SERVER_SETTING, 'serverSetting');
      ipcService.initialData.onRequest('serverSetting', {
        serverId,
        userId,
      });
    };

    const handleOpenApplyMember = (
      userId: User['userId'],
      serverId: Server['serverId'],
    ) => {
      if (!serverReceiveApply) {
        handleOpenAlert(lang.tr.cannotApply);
        return;
      }
      ipcService.popup.open(PopupType.APPLY_MEMBER, 'applyMember');
      ipcService.initialData.onRequest('applyMember', {
        userId,
        serverId,
      });
    };

    const handleOpenEditNickname = (
      userId: User['userId'],
      serverId: Server['serverId'],
    ) => {
      ipcService.popup.open(PopupType.EDIT_NICKNAME, 'editNickname');
      ipcService.initialData.onRequest('editNickname', {
        serverId,
        userId,
      });
    };

    const handleLocateUser = () => {
      if (!handleSetCategoryExpanded || !handleSetChannelExpanded) return;
      handleSetCategoryExpanded();
      handleSetChannelExpanded();
    };

    const handleServerMemberApplicationsSet = (data: { count: number }) => {
      setMemberApplicationsCount(data.count);
    };

    const handleServerMemberApplicationAdd = () => {
      setMemberApplicationsCount((prev) => prev + 1);
    };

    const handleServerMemberApplicationDelete = () => {
      setMemberApplicationsCount((prev) => Math.max(prev - 1, 0));
    };

    // Effects
    useEffect(() => {
      for (const channel of serverChannels) {
        setExpanded((prev) => ({
          ...prev,
          [channel.channelId]:
            prev[channel.channelId] != undefined
              ? prev[channel.channelId]
              : true,
        }));
      }
    }, [serverChannels]);

    useEffect(() => {
      if (!socket) return;
      let start = Date.now();
      let end = Date.now();
      socket.send.ping('ping');
      const measure = setInterval(() => {
        start = Date.now();
        socket.send.ping('ping');
      }, 10000);
      const clearPong = socket.on.pong(() => {
        end = Date.now();
        setLatency((end - start).toFixed(0));
      });
      return () => {
        clearInterval(measure);
        clearPong();
      };
    }, [socket]);

    useEffect(() => {
      if (!socket) return;

      const eventHandlers = {
        [SocketServerEvent.SERVER_MEMBER_APPLICATIONS_SET]: handleServerMemberApplicationsSet,
        [SocketServerEvent.SERVER_MEMBER_APPLICATION_ADD]: handleServerMemberApplicationAdd,
        [SocketServerEvent.SERVER_MEMBER_APPLICATION_DELETE]: handleServerMemberApplicationDelete,
      };
      const unsubscribe: (() => void)[] = [];

      Object.entries(eventHandlers).map(([event, handler]) => {
        const unsub = socket.on[event as SocketServerEvent](handler);
        unsubscribe.push(unsub);
      });

      return () => {
        unsubscribe.forEach((unsub) => unsub());
      };
    }, [socket]);

    return (
      <>
        {/* Header */}
        <div className={styles['sidebarHeader']} ref={viewerRef}>
          <div
            className={styles['avatarBox']}
            onClick={() => {
              if (!canOpenSettings) return;
              handleOpenServerSetting(userId, serverId);
            }}
          >
            <div
              className={styles['avatarPicture']}
              style={{ backgroundImage: `url(${serverAvatarUrl})` }}
            />
          </div>
          <div className={styles['baseInfoBox']}>
            <div className={styles['container']}>
              {isVerifyServer ? (
                <div className={styles['verifyIcon']} title={'官方認證語音群' /* TODO: lang.tr */}></div>
              ) : ('')}
              <div className={styles['name']}>{serverName} </div>
            </div>
            <div className={styles['container']}>
              <div className={styles['idText']}>{serverDisplayId}</div>
              <div className={styles['memberText']}>{serverMembers.length}</div>
              <div className={styles['optionBox']}>
                <div
                  className={styles['invitation']}
                  onClick={() => {
                    // Handle invite friends
                  }}
                />
                <div className={styles['saperator']} />
                <div
                  ref={settingButtonRef}
                  className={styles['setting']}
                  onClick={() => {
                    if (!settingButtonRef.current) return;
                    const x = settingButtonRef.current.getBoundingClientRect().left;
                    const y =
                      settingButtonRef.current.getBoundingClientRect().top +
                      settingButtonRef.current.getBoundingClientRect().height;
                    contextMenu.showContextMenu(x, y, false, false, [
                      {
                        id: 'invitation',
                        label: lang.tr.invitation,
                        show: canApplyMember,
                        icon: 'memberapply',
                        onClick: () => handleOpenApplyMember(userId, serverId),
                      },
                      {
                        id: 'editNickname',
                        label: lang.tr.editNickname,
                        icon: 'editGroupcard',
                        show: canEditNickname,
                        onClick: () => handleOpenEditNickname(userId, serverId),
                      },
                      {
                        id: 'locateMe',
                        label: lang.tr.locateMe,
                        icon: 'locateme',
                        onClick: () => handleLocateUser(),
                      },
                      {
                        id: 'separator',
                        label: '',
                      },
                      {
                        id: 'report',
                        label: '舉報', // TODO: lang.tr
                        disabled: true,
                        onClick: () => {},
                      },
                      {
                        id: 'favorite',
                        label: isFavorite ? lang.tr.unfavorite : lang.tr.favorite,
                        icon: isFavorite ? 'collect' : 'uncollect',
                        onClick: () => handleFavoriteServer(serverId),
                      },
                    ]);
                  }}
                >
                  <div
                    className={`
                      ${styles['overlay']}
                      ${canOpenSettings && memberApplicationsCount > 0 ? styles['new'] : ''}
                    `}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Channel */}
        <div className={styles['currentChannelBox']}>
          <div
            className={`
              ${styles['currentChannelIcon']} 
              ${styles[`status${connectStatus}`]}
            `}
          >
            <div
              className={`${styles['currentChannelPing']}`}
            >{`${latency}ms`}</div>
          </div>
          <div className={styles['currentChannelText']}>
            {currentChannelName}
          </div>
        </div>

        {/* Mic Queue */}
        {currentChannelVoiceMode === 'queue' && (
          <>
            <div className={styles['sectionTitle']}>{lang.tr.micOrder}</div>
            <div className={styles['micQueueBox']}>
              <div className={styles['userList']}>
                {/* {micQueueUsers.map((user) => (
                    <UserTab
                      key={user.id}
                      user={user}
                      server={server}
                      mainUser={user}
                    />
                  ))} */}
              </div>
            </div>
            <div className={styles['saperator-2']} />
          </>
        )}

        {/* Channel List Title */}
        <div className={styles['sectionTitle']}>
          {view === 'current' ? lang.tr.currentChannel : lang.tr.allChannel}
        </div>

        {/* Channel List */}
        <div className={styles['scrollView']}>
          <div className={styles['channelList']}>
            {view === 'current' ? (
              <ChannelTab
                key={currentChannelId}
                channel={currentChannel}
                friends={friends}
                currentChannel={currentChannel}
                currentServer={currentServer}
                serverMembers={serverMembers}
                expanded={{ [currentChannelId]: true }}
                selectedItemId={selectedItemId}
                selectedItemType={selectedItemType}
                setExpanded={() => {}}
                setSelectedItemId={setSelectedItemId}
                setSelectedItemType={setSelectedItemType}
              />
            ) : (
              serverChannels
                .filter((ch) => !!ch && !ch.categoryId)
                .sort((a, b) =>
                  a.order !== b.order
                    ? a.order - b.order
                    : a.createdAt - b.createdAt,
                )
                .map((item) =>
                  item.type === 'category' ? (
                    <CategoryTab
                      key={item.channelId}
                      category={item as Category}
                      friends={friends}
                      currentChannel={currentChannel}
                      currentServer={currentServer}
                      serverMembers={serverMembers}
                      serverChannels={serverChannels}
                      expanded={expanded}
                      selectedItemId={selectedItemId}
                      selectedItemType={selectedItemType}
                      setExpanded={setExpanded}
                      setSelectedItemId={setSelectedItemId}
                      setSelectedItemType={setSelectedItemType}
                    />
                  ) : (
                    <ChannelTab
                      key={item.channelId}
                      channel={item as Channel}
                      friends={friends}
                      currentChannel={currentChannel}
                      currentServer={currentServer}
                      serverMembers={serverMembers}
                      expanded={expanded}
                      selectedItemId={selectedItemId}
                      selectedItemType={selectedItemType}
                      setExpanded={setExpanded}
                      setSelectedItemId={setSelectedItemId}
                      setSelectedItemType={setSelectedItemType}
                    />
                  ),
                )
            )}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className={styles['bottomNav']}>
          <div
            className={`
              ${styles['navItem']} 
              ${styles['navItemLeft']} 
              ${view === 'current' ? styles['active'] : ''}
            `}
            onClick={() => setView('current')}
          >
            {lang.tr.currentChannel}
          </div>
          <div
            className={`
              ${styles['navItem']} 
              ${styles['navItemRight']} 
              ${view === 'all' ? styles['active'] : ''}
            `}
            onClick={() => setView('all')}
          >
            {lang.tr.allChannel}
          </div>
        </div>
      </>
    );
  },
);

ChannelListViewer.displayName = 'ChannelListViewer';

export default ChannelListViewer;

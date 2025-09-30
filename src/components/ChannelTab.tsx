import React, { useEffect, useMemo } from 'react';

// CSS
import styles from '@/styles/pages/server.module.css';

// Types
import type { OnlineMember, Channel, Server, User, Friend } from '@/types';

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
import { isMember, isServerAdmin, isChannelMod, isChannelAdmin } from '@/utils/permission';

interface ChannelTabProps {
  user: User;
  friends: Friend[];
  server: Server;
  serverOnlineMembers: OnlineMember[];
  channel: Channel;
  expanded: Record<string, boolean>;
  selectedItemId: string | null;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setSelectedItemId: React.Dispatch<React.SetStateAction<string | null>>;
}

const toMs = (v: unknown): number => {
  if (v == null) return Number.NaN;
  if (typeof v === 'number') return v;
  const n = Number(v);
  if (!Number.isNaN(n) && Number.isFinite(n)) return n;
  const t = new Date(String(v)).getTime();
  return Number.isNaN(t) ? Number.NaN : t;
};

const cmpLastJoinDesc = (a: any, b: any) => {
  const ta = toMs(a.lastJoinChannelTime);
  const tb = toMs(b.lastJoinChannelTime);
  const aNaN = Number.isNaN(ta);
  const bNaN = Number.isNaN(tb);

  if (aNaN && bNaN) return 0;
  if (aNaN) return 1;
  if (bNaN) return -1;

  return tb - ta;
};


const ChannelTab: React.FC<ChannelTabProps> = React.memo(({ user, friends, server, serverOnlineMembers, channel, expanded, selectedItemId, setExpanded, setSelectedItemId }) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();
  const findMe = useFindMeContext();

  // Destructuring
  const { userId, permissionLevel: globalPermissionLevel, currentChannelId: userCurrentChannelId } = user;
  const { channelId, name: channelName, visibility: channelVisibility, userLimit: channelUserLimit, permissionLevel: channelPermissionLevel } = channel;
  const { serverId, permissionLevel: serverPermissionLevel, lobbyId: serverLobbyId, receptionLobbyId: serverReceptionLobbyId } = server;

  // Memos
  const permissionLevel = useMemo(() => Math.max(globalPermissionLevel, serverPermissionLevel, channelPermissionLevel), [globalPermissionLevel, serverPermissionLevel, channelPermissionLevel]);
  const channelMembers = useMemo(() => serverOnlineMembers.filter((mb) => mb.currentChannelId === channelId), [serverOnlineMembers, channelId]);
  const channelUserIds = useMemo(() => channelMembers.map((mb) => mb.userId), [channelMembers]);
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
  const filteredChannelMembers = useMemo(
    () => channelMembers
          .filter(Boolean)
          .sort(cmpLastJoinDesc),
    [channelMembers]
  );

  // Handlers
  const handleEditServer = (serverId: Server['serverId'], update: Partial<Server>) => {
    ipc.socket.send('editServer', { serverId, update });
  };

  const handleConnectChannel = (serverId: Server['serverId'], channelId: Channel['channelId']) => {
    if (!canJoin) return;
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
    handleOpenAlertDialog(t('confirm-delete-channel', { '0': channelName }), () => ipc.socket.send('deleteChannel', { serverId, channelId }));
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
        onClick={() => {
          if (isSelected) setSelectedItemId(null);
          else setSelectedItemId(`channel-${channelId}`);
        }}
        onDoubleClick={() => handleConnectChannel(serverId, channelId)}
        draggable={isChannelMod(permissionLevel) && channelMembers.length > 0}
        onDragStart={(e) => handleDragStart(e, channelMembers, channelId)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          if (isReadonlyChannel) return;
          handleDrop(e, serverId, channelId);
        }}
        onContextMenu={(e) => {
          e.stopPropagation();
          const { clientX: x, clientY: y } = e;
          contextMenu.showContextMenu(x, y, 'right-bottom', [
            {
              id: 'join-channel',
              label: t('join-channel'),
              show: canJoin,
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
              show: isServerAdmin(permissionLevel),
              onClick: () => handleOpenCreateChannel(userId, serverId, ''),
            },
            {
              id: 'create-sub-channel',
              label: t('create-sub-channel'),
              show: isChannelAdmin(permissionLevel) && !isLobby,
              onClick: () => handleOpenCreateChannel(userId, serverId, channelId),
            },
            {
              id: 'delete-channel',
              label: t('delete-channel'),
              show: isChannelAdmin(permissionLevel) && !isLobby,
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
              onClick: () => handleOpenServerBroadcast(serverId, channelId),
            },
            {
              id: 'move-all-user-to-channel',
              label: t('move-all-user-to-channel'),
              show: !isInChannel && isChannelMod(permissionLevel) && channelUserIds.length > 0,
              onClick: () => handleMoveAllUsersToChannel(channelUserIds, serverId, userCurrentChannelId || ''),
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
              id: 'set-reception-lobby',
              label: t('set-reception-lobby'),
              show: isServerAdmin(permissionLevel) && serverReceptionLobbyId !== channelId && !isPrivateChannel && !isReadonlyChannel,
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
        {!isReadonlyChannel && <div className={styles['channel-user-count-text']}>{`(${channelMembers.length}${channelUserLimit > 0 ? `/${channelUserLimit}` : ''})`}</div>}
        {isInChannel && !expanded[channelId] && <div className={styles['my-location-icon']} />}
      </div>

      {/* Expanded Sections */}
      <div className={styles['user-list']} style={expanded[channelId] ? {} : { display: 'none' }}>
        {filteredChannelMembers.map((member) => (
          <UserTab
            key={member.userId}
            user={user}
            friends={friends}
            channel={channel}
            server={server}
            member={member}
            selectedItemId={selectedItemId}
            setSelectedItemId={setSelectedItemId}
            handleConnectChannel={handleConnectChannel}
          />
        ))}
      </div>
    </>
  );
});

ChannelTab.displayName = 'ChannelTab';

export default ChannelTab;

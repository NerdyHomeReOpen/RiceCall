import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import { useContextMenu } from '@/providers/ContextMenu';
import { useFindMeContext } from '@/providers/FindMe';

import UserTab from '@/components/UserTab';

import * as Popup from '@/utils/popup';
import * as Permission from '@/utils/permission';
import CtxMenuBuilder from '@/utils/ctxMenuBuilder';

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
    const canJoin = useMemo(
      () => !isInChannel && !isReadonlyChannel && !(isMemberChannel && !Permission.isMember(permissionLevel)) && (!isFull || Permission.isServerAdmin(permissionLevel)),
      [isInChannel, isReadonlyChannel, isMemberChannel, permissionLevel, isFull],
    );
    const needsPassword = useMemo(() => !Permission.isChannelMod(permissionLevel) && isPrivateChannel, [permissionLevel, isPrivateChannel]);
    const filteredChannelMembers = useMemo(
      () => channelMembers.filter(Boolean).sort((a, b) => b.lastJoinChannelAt - a.lastJoinChannelAt || (a.nickname || a.name).localeCompare(b.nickname || b.name)),
      [channelMembers],
    );

    // Handlers
    const getContextMenuItems = () =>
      new CtxMenuBuilder()
        .addJoinChannelOption({ canJoin, isInChannel }, () => Popup.connectChannel(currentServerId, channelId, canJoin, needsPassword))
        .addViewOrEditOption(() => Popup.openChannelSetting(userId, currentServerId, channelId))
        .addSeparator()
        .addCreateChannelOption({ permissionLevel }, () => Popup.openCreateChannel(userId, currentServerId, ''))
        .addCreateSubChannelOption({ permissionLevel }, () => Popup.openCreateChannel(userId, currentServerId, channelCategoryId ? channelCategoryId : channelId))
        .addDeleteChannelOption({ permissionLevel }, () => Popup.deleteChannel(currentServerId, channelId, channelName))
        .addSeparator()
        .addBroadcastOption({ permissionLevel }, () => Popup.openServerBroadcast(currentServerId, channelId))
        .addSeparator()
        .addMoveAllUserToChannelOption({ isInChannel, currentPermissionLevel, permissionLevel, movableUserIds: movableChannelUserIds }, () =>
          Popup.moveAllUsersToChannel(movableChannelUserIds, currentServerId, currentChannelId),
        )
        .addEditChannelOrderOption({ permissionLevel }, () => Popup.openEditChannelOrder(userId, currentServerId))
        .addSeparator()
        .addKickChannelUsersFromServerOption({ permissionLevel, movableUserIds: movableChannelUserIds }, () => Popup.kickUsersFromServer(movableChannelUserIds, currentServerId))
        .addKickAllUsersFromServerOption({ permissionLevel, movableUserIds: movableServerUserIds }, () => Popup.kickUsersFromServer(movableServerUserIds, currentServerId))
        .addSeparator()
        .addSetReceptionLobbyOption({ permissionLevel, isPrivateChannel, isReadonlyChannel, isReceptionLobby }, () => Popup.editServer(currentServerId, { receptionLobbyId: channelId }))
        .build();

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
          Popup.moveUserToChannel(targetUserId, serverId, channelId);
          break;
        case 'moveAllUsers':
          const targetUserIds = e.dataTransfer.getData('userIds');
          if (!targetUserIds) return;
          Popup.moveAllUsersToChannel(targetUserIds.split(','), serverId, channelId);
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
          onDoubleClick={() => Popup.connectChannel(currentServerId, channelId, canJoin, needsPassword)}
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
              canJoin={canJoin}
              needsPassword={needsPassword}
            />
          ))}
        </div>
      </>
    );
  },
);

ChannelTab.displayName = 'ChannelTab';

export default ChannelTab;

import React, { useEffect, useMemo, useState } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/hook';

import type * as Types from '@/types';

import { setSelectedItemId } from '@/store/slices/uiSlice';

import { useContextMenu } from '@/providers/ContextMenu';
import { useFindMeContext } from '@/providers/FindMe';

import UserTab from '@/components/UserTab';

import * as Popup from '@/utils/popup';
import * as Permission from '@/utils/permission';
import CtxMenuBuilder from '@/utils/ctxMenuBuilder';

import styles from '@/styles/server.module.css';

interface ChannelTabProps {
  channel: Types.Channel;
}

const ChannelTab: React.FC<ChannelTabProps> = React.memo(({ channel }) => {
  // Hooks
  const { t } = useTranslation();
  const { showContextMenu } = useContextMenu();
  const { expandChannelHandlerRef } = useFindMeContext();
  const dispatch = useAppDispatch();

  // Selectors
  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
      permissionLevel: state.user.data.permissionLevel,
    }),
    shallowEqual,
  );

  const currentServer = useAppSelector(
    (state) => ({
      serverId: state.currentServer.data.serverId,
      permissionLevel: state.currentServer.data.permissionLevel,
      receptionLobbyId: state.currentServer.data.receptionLobbyId,
      lobbyId: state.currentServer.data.lobbyId,
    }),
    shallowEqual,
  );

  const currentChannel = useAppSelector(
    (state) => ({
      channelId: state.currentChannel.data.channelId,
      permissionLevel: state.currentChannel.data.permissionLevel,
    }),
    shallowEqual,
  );

  const onlineMembers = useAppSelector((state) => state.onlineMembers.data, shallowEqual);
  const isSelected = useAppSelector((state) => state.ui.selectedItemId === `channel-${channel.channelId}`, shallowEqual);

  // States
  const [isExpanded, setIsExpanded] = useState(true);

  // Variables
  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, channel.permissionLevel);
  const currentPermissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, currentChannel.permissionLevel);
  const channelMembers = useMemo(() => onlineMembers.filter((om) => om.currentChannelId === channel.channelId), [onlineMembers, channel.channelId]);
  const movableServerUserIds = useMemo(
    () => onlineMembers.filter((om) => om.userId !== user.userId && om.permissionLevel <= permissionLevel).map((om) => om.userId),
    [onlineMembers, user.userId, permissionLevel],
  );
  const movableChannelUserIds = useMemo(
    () => channelMembers.filter((cm) => cm.userId !== user.userId && cm.permissionLevel <= permissionLevel).map((cm) => cm.userId),
    [channelMembers, user.userId, permissionLevel],
  );
  const sortedChannelMembers = useMemo(() => [...channelMembers].sort((a, b) => b.lastJoinChannelAt - a.lastJoinChannelAt), [channelMembers]);
  const isInChannel = currentChannel.channelId === channel.channelId;
  const isLobby = currentServer.lobbyId === channel.channelId;
  const isReceptionLobby = currentServer.receptionLobbyId === channel.channelId;
  const isMemberChannel = channel.visibility === 'member';
  const isPrivateChannel = channel.visibility === 'private';
  const isReadonlyChannel = channel.visibility === 'readonly';
  const isFull = channel.userLimit && channel.userLimit <= channelMembers.length;
  const isDraggable = Permission.isChannelMod(permissionLevel) && movableChannelUserIds.length > 0;
  const isPasswordNeeded = !Permission.isChannelMod(permissionLevel) && isPrivateChannel;
  const canJoin = !isInChannel && !isReadonlyChannel && !(isMemberChannel && !Permission.isMember(permissionLevel)) && (!isFull || Permission.isServerAdmin(permissionLevel));

  // Functions
  const getTabContextMenuItems = () =>
    new CtxMenuBuilder()
      .addJoinChannelOption({ canJoin, isInChannel }, () => Popup.connectChannel(currentServer.serverId, channel.channelId, canJoin, isPasswordNeeded))
      .addViewOrEditOption(() => Popup.openChannelSetting(user.userId, currentServer.serverId, channel.channelId))
      .addSeparator()
      .addCreateChannelOption({ permissionLevel }, () => Popup.openCreateChannel(user.userId, currentServer.serverId, ''))
      .addCreateSubChannelOption({ permissionLevel }, () => Popup.openCreateChannel(user.userId, currentServer.serverId, channel.categoryId ? channel.categoryId : channel.channelId))
      .addDeleteChannelOption({ permissionLevel }, () => Popup.deleteChannel(currentServer.serverId, channel.channelId, channel.name))
      .addSeparator()
      .addBroadcastOption({ permissionLevel }, () => Popup.openServerBroadcast(currentServer.serverId, channel.channelId))
      .addSeparator()
      .addMoveAllUserToChannelOption({ isInChannel, currentPermissionLevel, permissionLevel, movableUserIds: movableChannelUserIds }, () =>
        Popup.moveAllUsersToChannel(movableChannelUserIds, currentServer.serverId, currentChannel.channelId),
      )
      .addEditChannelOrderOption({ permissionLevel }, () => Popup.openEditChannelOrder(user.userId, currentServer.serverId))
      .addSeparator()
      .addKickChannelUsersFromServerOption({ permissionLevel, movableUserIds: movableChannelUserIds }, () => Popup.kickUsersFromServer(movableChannelUserIds, currentServer.serverId))
      .addKickAllUsersFromServerOption({ permissionLevel, movableUserIds: movableServerUserIds }, () => Popup.kickUsersFromServer(movableServerUserIds, currentServer.serverId))
      .addSeparator()
      .addSetReceptionLobbyOption({ permissionLevel, isPrivateChannel, isReadonlyChannel, isReceptionLobby }, () => Popup.editServer(currentServer.serverId, { receptionLobbyId: channel.channelId }))
      .build();

  // Handlers
  const handleTabClick = () => {
    dispatch(setSelectedItemId(`channel-${channel.channelId}`));
  };

  const handleTabDoubleClick = () => {
    Popup.connectChannel(currentServer.serverId, channel.channelId, canJoin, isPasswordNeeded);
  };

  const handleTabDragStart = (e: React.DragEvent) => {
    if (!isDraggable) return;
    e.dataTransfer.setData('type', 'moveAllUsers');
    e.dataTransfer.setData('userIds', movableChannelUserIds.join(','));
    e.dataTransfer.setData('currentChannelId', channel.channelId);
  };

  const handleTabDragOver = (e: React.DragEvent) => {
    if (Permission.isChannelMod(permissionLevel) && !isReadonlyChannel) e.preventDefault();
    else e.dataTransfer.dropEffect = 'none';
  };

  const handleTabDrop = (e: React.DragEvent) => {
    if (isReadonlyChannel) return;
    e.preventDefault();
    const moveType = e.dataTransfer.getData('type');
    const currentChannelId = e.dataTransfer.getData('currentChannelId');
    if (!moveType || !currentChannelId || currentChannelId === channel.channelId || isReadonlyChannel) return;
    switch (moveType) {
      case 'moveUser':
        const targetUserId = e.dataTransfer.getData('userId');
        if (!targetUserId) return;
        Popup.moveUserToChannel(targetUserId, currentServer.serverId, channel.channelId);
        break;
      case 'moveAllUsers':
        const targetUserIds = e.dataTransfer.getData('userIds');
        if (!targetUserIds) return;
        Popup.moveAllUsersToChannel(targetUserIds.split(','), currentServer.serverId, channel.channelId);
        break;
    }
  };

  const handleTabContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', getTabContextMenuItems());
  };

  const handleTabExpandedClick = () => {
    if (isSelected) dispatch(setSelectedItemId(null));
    else dispatch(setSelectedItemId(`channel-${channel.channelId}`));
  };

  // Effect
  useEffect(() => {
    if (!isInChannel) return;
    expandChannelHandlerRef.current = () => setIsExpanded(true);
  }, [expandChannelHandlerRef, isInChannel]);

  return (
    <>
      <div
        className={`${styles['channel-tab']} ${isSelected ? styles['selected'] : ''}`}
        onClick={handleTabClick}
        onDoubleClick={handleTabDoubleClick}
        draggable={isDraggable}
        onDragStart={handleTabDragStart}
        onDragOver={handleTabDragOver}
        onDrop={handleTabDrop}
        onContextMenu={handleTabContextMenu}
      >
        <div className={`${styles['tab-icon']} ${isExpanded ? styles['expanded'] : ''} ${isLobby ? styles['lobby'] : styles[channel.visibility]}`} onClick={handleTabExpandedClick} />
        <div className={`${styles['channel-tab-label']} ${isReceptionLobby ? styles['is-reception-lobby'] : ''}`}>{isLobby ? t(`lobby`) : channel.name}</div>
        {!isReadonlyChannel && <div className={styles['channel-user-count-text']}>{`(${channelMembers.length}${channel.userLimit > 0 ? `/${channel.userLimit}` : ''})`}</div>}
        {isInChannel && !isExpanded && <div className={styles['my-location-icon']} />}
      </div>
      <div className={styles['user-list']} style={isExpanded ? {} : { display: 'none' }}>
        {sortedChannelMembers.map((member) => (
          <UserTab key={member.userId} member={member} channel={channel} canJoin={canJoin} isPasswordNeeded={isPasswordNeeded} />
        ))}
      </div>
    </>
  );
});

ChannelTab.displayName = 'ChannelTab';

export default ChannelTab;

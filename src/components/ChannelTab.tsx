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
  sortChannelMembersWithRules?: boolean;
}

const ChannelTab: React.FC<ChannelTabProps> = React.memo(({ channel, sortChannelMembersWithRules = false }) => {
  // Hooks
  const { t } = useTranslation();
  const { showContextMenu } = useContextMenu();
  const { setExpandedChannelHandlerRef } = useFindMeContext();
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

  const friends = useAppSelector((state) => state.friends.data, shallowEqual);

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
  const sortedChannelMembers = useMemo(() => {
    const friendIds = new Set(friends.map((f) => f.targetId));
    return [...channelMembers].sort((a, b) => {
      if (!sortChannelMembersWithRules) return b.lastJoinChannelAt - a.lastJoinChannelAt;

      // Self first
      if (a.userId === user.userId && b.userId !== user.userId) return -1;
      if (b.userId === user.userId && a.userId !== user.userId) return 1;

      // Friends next
      const aIsFriend = friendIds.has(a.userId);
      const bIsFriend = friendIds.has(b.userId);
      if (aIsFriend !== bIsFriend) return aIsFriend ? -1 : 1;

      // Then by permission level and last joined time
      return b.permissionLevel - a.permissionLevel || b.lastJoinChannelAt - a.lastJoinChannelAt;
    });
  }, [channelMembers, user, friends, sortChannelMembersWithRules]);

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
    if (isSelected) dispatch(setSelectedItemId(null));
    else dispatch(setSelectedItemId(`channel-${channel.channelId}`));
  };

  const handleTabDoubleClick = () => {
    Popup.connectChannel(currentServer.serverId, channel.channelId, canJoin, isPasswordNeeded);
  };

  const handleTabDragStart = (e: React.DragEvent) => {
    if (!isDraggable) return;
    e.dataTransfer.setData('moveUserEvent/userIds', JSON.stringify(movableChannelUserIds));
    e.dataTransfer.setData('moveUserEvent/currentChannelId', channel.channelId);
  };

  const handleTabDragOver = (e: React.DragEvent) => {
    if (Permission.isChannelMod(permissionLevel) && !isReadonlyChannel) e.preventDefault();
    else e.dataTransfer.dropEffect = 'none';
  };

  const handleTabDrop = (e: React.DragEvent) => {
    if (isReadonlyChannel) return;
    e.preventDefault();
    const userIds = JSON.parse(e.dataTransfer.getData('moveUserEvent/userIds')) as string[];
    const currentChannelId = e.dataTransfer.getData('moveUserEvent/currentChannelId');
    if (!currentChannelId || !userIds || userIds.length === 0) return;
    if (currentChannelId === channel.channelId || isReadonlyChannel) return;
    if (userIds.length === 1) Popup.moveUserToChannel(userIds[0], currentServer.serverId, channel.channelId);
    else Popup.moveAllUsersToChannel(userIds, currentServer.serverId, channel.channelId);
  };

  const handleTabContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', getTabContextMenuItems());
  };

  const handleTabExpandedClick = () => {
    setIsExpanded(!isExpanded);
  };

  // Effect
  useEffect(() => {
    if (!isInChannel) return;
    setExpandedChannelHandlerRef(() => setIsExpanded(true));
  }, [isInChannel, setExpandedChannelHandlerRef]);

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

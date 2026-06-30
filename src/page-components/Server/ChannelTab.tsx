import React, { useEffect, useState } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import * as Types from '@/types';

import * as Store from '@/store';

import { connectChannel, kickUsersFromServer, deleteChannel, moveAllUsersToChannel, openEditChannelOrder, openServerBroadcast, openChannelSetting, openCreateChannel, editServer } from '@/services';

import { useContextMenu } from '@/providers/ContextMenu';
import { useLocateMeContext } from '@/providers/LocateMe';

import { useAppDispatch, useAppSelector } from '@/hooks/useStore';

import ContextMenu from '@/utils/contextMenu';

import UserTab from './UserTab';

import styles from './Server.module.css';

interface ChannelTabProps {
  channel: Types.Channel;
}

const ChannelTab: React.FC<ChannelTabProps> = React.memo(({ channel }) => {
  const { t } = useTranslation();
  const { showContextMenu } = useContextMenu();
  const { setExpandChannelHandlerRef } = useLocateMeContext();
  const dispatch = useAppDispatch();

  const userId = useAppSelector((state) => state.user.data.userId);
  const permissionLevel = useAppSelector((state) => Math.max(state.user.data.permissionLevel, state.currentServer.data.permissionLevel, state.currentChannel.data.permissionLevel));
  const currentServerId = useAppSelector((state) => state.currentServer.data.serverId);
  const currentServerLobbyId = useAppSelector((state) => state.currentServer.data.lobbyId);
  const currentServerReceptionLobbyId = useAppSelector((state) => state.currentServer.data.receptionLobbyId);
  const currentChannelId = useAppSelector((state) => state.currentChannel.data.channelId);
  const onlineMembers = useAppSelector((state) => state.onlineMembers.data, shallowEqual);
  const isSelected = useAppSelector((state) => state.ui.selectedItemId === `channel-${channel.channelId}`);

  const [isExpanded, setIsExpanded] = useState(true);

  const channelMembers = onlineMembers.filter((om) => om.currentChannelId === channel.channelId);
  const sortedChannelMembers = [...channelMembers].sort((a, b) => b.permissionLevel - a.permissionLevel || b.lastJoinChannelAt - a.lastJoinChannelAt);
  const movableServerUserIds = onlineMembers.filter((om) => om.userId !== userId && om.permissionLevel <= permissionLevel).map((om) => om.userId);
  const movableChannelUserIds = channelMembers.filter((cm) => cm.userId !== userId && cm.permissionLevel <= permissionLevel).map((cm) => cm.userId);
  const isInChannel = currentChannelId === channel.channelId;
  const isChannelLobby = currentServerLobbyId === channel.channelId;
  const isChannelReceptionLobby = currentServerReceptionLobbyId === channel.channelId;
  const isChannelMember = channel.visibility === 'member';
  const isChannelPrivate = channel.visibility === 'private';
  const isChannelReadonly = channel.visibility === 'readonly';
  const isChannelFull = channel.userLimit && channel.userLimit <= channelMembers.length;
  const isChannelPasswordNeeded = permissionLevel < Types.Permission.ChannelMod && isChannelPrivate;
  const isChannelSubChannel = !!channel.categoryId;
  const isDraggable = permissionLevel >= Types.Permission.ChannelMod && movableChannelUserIds.length > 0;
  const canJoin = !(isInChannel || isChannelReadonly || (permissionLevel < Types.Permission.ServerAdmin && isChannelFull) || (permissionLevel < Types.Permission.Member && isChannelMember));

  const handleTabClick = () => {
    if (isSelected) {
      dispatch(Store.setSelectedItemId(null));
    } else {
      dispatch(Store.setSelectedItemId(`channel-${channel.channelId}`));
    }
  };

  const handleTabDoubleClick = () => {
    connectChannel(currentServerId, channel.channelId, canJoin, isChannelPasswordNeeded);
  };

  const handleTabDragStart = (e: React.DragEvent) => {
    if (!isDraggable) return;

    e.dataTransfer.clearData();
    e.dataTransfer.setData('moveUserEvent/userIds', JSON.stringify(movableChannelUserIds));
    e.dataTransfer.setData('moveUserEvent/currentChannelId', channel.channelId);
  };

  const handleTabDragOver = (e: React.DragEvent) => {
    if (permissionLevel >= Types.Permission.ChannelMod && !isChannelReadonly) {
      e.preventDefault();
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleTabDrop = (e: React.DragEvent) => {
    if (isChannelReadonly) return;

    e.stopPropagation();

    const userIds = JSON.parse(e.dataTransfer.getData('moveUserEvent/userIds')) as string[];
    const currentChannelId = e.dataTransfer.getData('moveUserEvent/currentChannelId');

    if (!currentChannelId || !userIds || userIds.length === 0 || currentChannelId === channel.channelId || isChannelReadonly) return;

    moveAllUsersToChannel(userIds, currentServerId, channel.channelId);

    e.dataTransfer.clearData();
  };

  const handleTabContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const { clientX: x, clientY: y } = e;

    const contextMenu = new ContextMenu()
      .addJoinChannelOption(
        {
          canJoin,
          isInChannel,
        },
        () => {
          connectChannel(currentServerId, channel.channelId, canJoin, isChannelPasswordNeeded);
        },
      )
      .addViewOrEditOption(() => {
        openChannelSetting(userId, currentServerId, channel.channelId);
      })
      .addSeparator()
      .addCreateChannelOption(
        {
          permissionLevel,
        },
        () => {
          openCreateChannel(userId, currentServerId);
        },
      )
      .addCreateSubChannelOption(
        {
          permissionLevel,
        },
        () => {
          openCreateChannel(userId, currentServerId, channel.categoryId ?? channel.channelId);
        },
      )
      .addDeleteChannelOption(
        {
          permissionLevel,
          isChannelSubChannel,
        },
        () => {
          deleteChannel(currentServerId, channel.channelId, channel.name);
        },
      )
      .addSeparator()
      .addBroadcastOption(
        {
          permissionLevel,
        },
        () => {
          openServerBroadcast(currentServerId, channel.channelId);
        },
      )
      .addSeparator()
      .addMoveAllUserToChannelOption(
        {
          permissionLevel,
          destinationPermissionLevel: channel.permissionLevel,
          isInChannel,
          userIdsToMove: movableChannelUserIds,
        },
        () => {
          moveAllUsersToChannel(movableChannelUserIds, currentServerId, currentChannelId);
        },
      )
      .addEditChannelOrderOption(
        {
          permissionLevel,
        },
        () => {
          openEditChannelOrder(userId, currentServerId);
        },
      )
      .addSeparator()
      .addKickChannelUsersFromServerOption(
        {
          permissionLevel,
          userIdsToKick: movableChannelUserIds,
        },
        () => {
          kickUsersFromServer(movableChannelUserIds, currentServerId);
        },
      )
      .addKickAllUsersFromServerOption(
        {
          permissionLevel,
          userIdsToKick: movableServerUserIds,
        },
        () => {
          kickUsersFromServer(movableServerUserIds, currentServerId);
        },
      )
      .addSeparator()
      .addSetReceptionLobbyOption(
        {
          permissionLevel,
          isChannelPrivate,
          isChannelReadonly,
          isChannelReceptionLobby,
        },
        () => {
          editServer(currentServerId, { receptionLobbyId: channel.channelId });
        },
      )
      .build();

    showContextMenu(x, y, 'right-bottom', contextMenu);
  };

  const handleTabExpandedClick = () => {
    setIsExpanded(!isExpanded);
  };

  useEffect(() => {
    if (!isInChannel) return;
    setExpandChannelHandlerRef(() => setIsExpanded(true));
  }, [isInChannel, setExpandChannelHandlerRef]);

  return (
    <>
      <div
        className={`${styles['channel']} ${isSelected ? styles['selected'] : ''}`}
        onClick={handleTabClick}
        onDoubleClick={handleTabDoubleClick}
        draggable={isDraggable}
        onDragStart={handleTabDragStart}
        onDragOver={handleTabDragOver}
        onDrop={handleTabDrop}
        onContextMenu={handleTabContextMenu}
      >
        <div className={`${styles['channel-icon']} ${isExpanded ? styles['expanded'] : ''} ${isChannelLobby ? styles['lobby'] : styles[channel.visibility]}`} onClick={handleTabExpandedClick} />
        <div className={`${styles['label']} ${isChannelReceptionLobby ? styles['is-reception-lobby'] : ''}`}>{isChannelLobby ? t(`lobby`) : channel.name}</div>
        {!isChannelReadonly && <div className={styles['user-count-text']}>{`(${channelMembers.length}${channel.userLimit > 0 ? `/${channel.userLimit}` : ''})`}</div>}
        {isInChannel && !isExpanded && <div className={styles['my-location-icon']} />}
      </div>
      <div className={styles['user-list']} style={isExpanded ? {} : { display: 'none' }}>
        {sortedChannelMembers.map((member) => (
          <UserTab key={member.userId} member={member} channel={channel} canJoin={canJoin} isPasswordNeeded={isChannelPasswordNeeded} />
        ))}
      </div>
    </>
  );
});

ChannelTab.displayName = 'ChannelTab';

export default ChannelTab;

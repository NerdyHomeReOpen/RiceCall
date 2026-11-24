import React, { useEffect, useState } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';
import { Permission } from '@/types';

import * as Store from '@/store';

import { connectChannel, moveAllUsersToChannel } from '@/services';

import { useContextMenu } from '@/providers/ContextMenu';
import { useLocateMeContext } from '@/providers/LocateMe';

import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { useChannelCtxMenu } from '@/hooks/context-menus/useChannelCtxMenu';

import UserTab from './UserTab';

interface ChannelTabProps {
  channel: Types.Channel;
}

const ICON_POSITIONS: Record<string, [string, string]> = {
  member: ['bg-[position:0_-14px]', 'bg-[position:-14px_-14px]'],
  private: ['bg-[position:-28px_0]', 'bg-[position:-28px_-14px]'],
  readonly: ['bg-[position:-42px_0]', 'bg-[position:-42px_-14px]'],
  lobby: ['bg-[position:-56px_0]', 'bg-[position:-56px_-14px]'],
};

const DEFAULT_ICON_POSITIONS: [string, string] = ['bg-[position:0_0]', 'bg-[position:-14px_0]'];

const ChannelTab: React.FC<ChannelTabProps> = React.memo(({ channel }) => {
  const { t } = useTranslation();
  const { showContextMenu } = useContextMenu();
  const { setExpandChannelHandlerRef } = useLocateMeContext();
  const dispatch = useAppDispatch();

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
  const [isExpanded, setIsExpanded] = useState(true);
  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, channel.permissionLevel);
  const channelMembers = onlineMembers.filter((om) => om.currentChannelId === channel.channelId);
  const movableServerUserIds = onlineMembers.filter((om) => om.userId !== user.userId && om.permissionLevel <= permissionLevel).map((om) => om.userId);
  const movableChannelUserIds = channelMembers.filter((cm) => cm.userId !== user.userId && cm.permissionLevel <= permissionLevel).map((cm) => cm.userId);

  const sortedChannelMembers = [...channelMembers].sort((a, b) => {
    if (a.userId === user.userId && b.userId !== user.userId) return -1;
    if (b.userId === user.userId && a.userId !== user.userId) return 1;
    return b.permissionLevel - a.permissionLevel || b.lastJoinChannelAt - a.lastJoinChannelAt;
  });

  const isInChannel = currentChannel.channelId === channel.channelId;
  const isLobby = currentServer.lobbyId === channel.channelId;
  const isReceptionLobby = currentServer.receptionLobbyId === channel.channelId;
  const isMemberChannel = channel.visibility === 'member';
  const isPrivateChannel = channel.visibility === 'private';
  const isReadonlyChannel = channel.visibility === 'readonly';
  const isFull = channel.userLimit && channel.userLimit <= channelMembers.length;
  const isDraggable = permissionLevel >= Permission.ChannelMod && movableChannelUserIds.length > 0;
  const isPasswordNeeded = permissionLevel < Permission.ChannelMod && isPrivateChannel;
  const canJoin = !isInChannel && !isReadonlyChannel && !(isMemberChannel && permissionLevel < Permission.Member) && (!isFull || permissionLevel >= Permission.ServerAdmin);

  const { buildContextMenu } = useChannelCtxMenu({
    user,
    currentServer,
    currentChannel,
    channel,
    movableChannelUserIds,
    movableServerUserIds,
    canJoin,
    isPasswordNeeded,
  });

  const handleTabClick = () => {
    if (isSelected) dispatch(Store.setSelectedItemId(null));
    else dispatch(Store.setSelectedItemId(`channel-${channel.channelId}`));
  };

  const handleTabDoubleClick = () => {
    connectChannel(currentServer.serverId, channel.channelId, canJoin, isPasswordNeeded);
  };

  const handleTabDragStart = (e: React.DragEvent) => {
    if (!isDraggable) return;
    e.dataTransfer.clearData();
    e.dataTransfer.setData('moveUserEvent/userIds', JSON.stringify(movableChannelUserIds));
    e.dataTransfer.setData('moveUserEvent/currentChannelId', channel.channelId);
  };

  const handleTabDragOver = (e: React.DragEvent) => {
    if (permissionLevel >= Permission.ChannelMod && !isReadonlyChannel) e.preventDefault();
    else e.dataTransfer.dropEffect = 'none';
  };

  const handleTabDrop = (e: React.DragEvent) => {
    if (isReadonlyChannel) return;
    e.stopPropagation();
    const userIds = JSON.parse(e.dataTransfer.getData('moveUserEvent/userIds')) as string[];
    const currentChannelId = e.dataTransfer.getData('moveUserEvent/currentChannelId');
    if (!currentChannelId || !userIds || userIds.length === 0) return;
    if (currentChannelId === channel.channelId || isReadonlyChannel) return;
    moveAllUsersToChannel(userIds, currentServer.serverId, channel.channelId);
    e.dataTransfer.clearData();
  };

  const handleTabContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', buildContextMenu());
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
        className={`relative flex gap-[2px] items-center h-[25px] py-[2px] pr-[20px] pl-[10px] mr-[5px] ${isSelected ? 'bg-selected' : 'hover:bg-hover'}`}
        onClick={handleTabClick}
        onDoubleClick={handleTabDoubleClick}
        draggable={isDraggable}
        onDragStart={handleTabDragStart}
        onDragOver={handleTabDragOver}
        onDrop={handleTabDrop}
        onContextMenu={handleTabContextMenu}
      >
        <div
          className={`inline-block min-w-[14px] min-h-[14px] cursor-pointer bg-[url('/channel/channelIcon.svg')] bg-no-repeat bg-auto ${(ICON_POSITIONS[isLobby ? 'lobby' : channel.visibility] ?? DEFAULT_ICON_POSITIONS)[isExpanded ? 1 : 0]}`}
          onClick={handleTabExpandedClick}
        />
        <div className={`truncate ${isReceptionLobby ? 'text-text-warning' : 'text-text-color-secondary'}`}>{isLobby ? t(`lobby`) : channel.name}</div>
        {!isReadonlyChannel && <div className="text-[#808080]">{`(${channelMembers.length}${channel.userLimit > 0 ? `/${channel.userLimit}` : ''})`}</div>}
        {isInChannel && !isExpanded && <div className="absolute right-[2px] min-w-[15px] min-h-[15px] cursor-pointer bg-[url('/mylocation.svg')] bg-no-repeat bg-cover" />}
      </div>
      <div className="pl-0!" style={isExpanded ? {} : { display: 'none' }}>
        {sortedChannelMembers.map((member) => (
          <UserTab key={member.userId} member={member} channel={channel} canJoin={canJoin} isPasswordNeeded={isPasswordNeeded} />
        ))}
      </div>
    </>
  );
});

ChannelTab.displayName = 'ChannelTab';

export default ChannelTab;

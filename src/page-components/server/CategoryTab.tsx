import React, { useEffect, useState } from 'react';
import { shallowEqual } from 'react-redux';

import type * as Types from '@/types';
import { Permission } from '@/types';

import * as Store from '@/store';

import { connectChannel, moveAllUsersToChannel } from '@/services';

import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { useChannelCtxMenu } from '@/hooks/context-menus/useChannelCtxMenu';

import { useContextMenu } from '@/providers/ContextMenu';
import { useLocateMeContext } from '@/providers/LocateMe';

import ChannelTab from './ChannelTab';
import UserTab from './UserTab';

interface CategoryTabProps {
  category: Types.Category;
}

const ICON_POSITIONS: Record<string, [string, string]> = {
  member: ['bg-[position:0_-14px]', 'bg-[position:-14px_-14px]'],
  private: ['bg-[position:-28px_0]', 'bg-[position:-28px_-14px]'],
  readonly: ['bg-[position:-42px_0]', 'bg-[position:-42px_-14px]'],
  lobby: ['bg-[position:-56px_0]', 'bg-[position:-56px_-14px]'],
};

const DEFAULT_ICON_POSITIONS: [string, string] = ['bg-[position:0_0]', 'bg-[position:-14px_0]'];

const CategoryTab: React.FC<CategoryTabProps> = React.memo(({ category }) => {
  const { showContextMenu } = useContextMenu();
  const { setExpandCategoryHandlerRef } = useLocateMeContext();
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

  const channels = useAppSelector((state) => state.channels.data, shallowEqual);
  const onlineMembers = useAppSelector((state) => state.onlineMembers.data, shallowEqual);
  const isSelected = useAppSelector((state) => state.ui.selectedItemId === `category-${category.channelId}`, shallowEqual);
  const [isExpanded, setIsExpanded] = useState(true);
  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, category.permissionLevel);
  const categoryChannels = channels.filter((c) => c.type === 'channel').filter((c) => c.categoryId === category.channelId);
  const categoryMembers = onlineMembers.filter((om) => om.currentChannelId === category.channelId);
  const movableServerUserIds = onlineMembers.filter((om) => om.userId !== user.userId && om.permissionLevel <= permissionLevel).map((om) => om.userId);
  const movableCategoryUserIds = categoryMembers.filter((cm) => cm.userId !== user.userId && cm.permissionLevel <= permissionLevel).map((cm) => cm.userId);
  const sortedCategoryChannels = [...categoryChannels].sort((a, b) => a.order - b.order);

  const sortedCategoryMembers = [...categoryMembers].sort((a, b) => {
    if (a.userId === user.userId && b.userId !== user.userId) return -1;
    if (b.userId === user.userId && a.userId !== user.userId) return 1;
    return b.permissionLevel - a.permissionLevel || b.lastJoinChannelAt - a.lastJoinChannelAt;
  });

  const isInChannel = currentChannel.channelId === category.channelId;
  const isInCategory = categoryMembers.some((m) => m.currentChannelId === currentChannel.channelId);
  const isReceptionLobby = currentServer.receptionLobbyId === category.channelId;
  const isMemberChannel = category.visibility === 'member';
  const isPrivateChannel = category.visibility === 'private';
  const isReadonlyChannel = category.visibility === 'readonly';
  const isFull = category.userLimit && category.userLimit <= categoryMembers.length;
  const isDraggable = permissionLevel >= Permission.ChannelMod && movableCategoryUserIds.length > 0;
  const isPasswordNeeded = permissionLevel < Permission.ChannelMod && isPrivateChannel;
  const canJoin = !isInChannel && !isReadonlyChannel && !(isMemberChannel && permissionLevel < Permission.Member) && (!isFull || permissionLevel >= Permission.ServerAdmin);

  const { buildContextMenu } = useChannelCtxMenu({
    user,
    currentServer,
    currentChannel,
    channel: category,
    category,
    movableChannelUserIds: movableCategoryUserIds,
    movableServerUserIds,
    canJoin,
    isPasswordNeeded,
  });

  const handleTabClick = () => {
    if (isSelected) dispatch(Store.setSelectedItemId(null));
    else dispatch(Store.setSelectedItemId(`category-${category.channelId}`));
  };

  const handleTabDoubleClick = () => {
    connectChannel(currentServer.serverId, category.channelId, canJoin, isPasswordNeeded);
  };

  const handleTabDragStart = (e: React.DragEvent) => {
    if (!isDraggable) return;
    e.dataTransfer.clearData();
    e.dataTransfer.setData('moveUserEvent/userIds', JSON.stringify(movableCategoryUserIds));
    e.dataTransfer.setData('moveUserEvent/currentChannelId', category.channelId);
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
    if (currentChannelId === category.channelId || isReadonlyChannel) return;
    moveAllUsersToChannel(userIds, currentServer.serverId, category.channelId);
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
    if (!isInCategory) return;
    setExpandCategoryHandlerRef(() => setIsExpanded(true));
  }, [isInCategory, setExpandCategoryHandlerRef]);

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
          className={`inline-block min-w-[14px] min-h-[14px] cursor-pointer bg-[url('/channel/channelIcon.svg')] bg-no-repeat bg-auto ${(ICON_POSITIONS[category.visibility] ?? DEFAULT_ICON_POSITIONS)[isExpanded ? 1 : 0]}`}
          onClick={handleTabExpandedClick}
        />
        <div className={`truncate ${isReceptionLobby ? 'text-text-warning' : 'text-text-color-secondary'}`}>{category.name}</div>
        {!isReadonlyChannel && <div className="text-[#808080]">{`(${categoryMembers.length}${category.userLimit > 0 ? `/${category.userLimit}` : ''})`}</div>}
        {!isExpanded && isInCategory && <div className="absolute right-[2px] min-w-[15px] min-h-[15px] cursor-pointer bg-[url('/mylocation.svg')] bg-no-repeat bg-cover" />}
      </div>
      <div style={isExpanded ? {} : { display: 'none' }}>
        {sortedCategoryMembers.map((member) => (
          <UserTab key={member.userId} member={member} channel={category} canJoin={canJoin} isPasswordNeeded={isPasswordNeeded} />
        ))}
      </div>
      <div className="flex flex-col [&>*]:pl-[25px]" style={isExpanded ? {} : { display: 'none' }}>
        {sortedCategoryChannels.map((channel) => (
          <ChannelTab key={channel.channelId} channel={channel} />
        ))}
      </div>
    </>
  );
});

CategoryTab.displayName = 'CategoryTab';

export default CategoryTab;

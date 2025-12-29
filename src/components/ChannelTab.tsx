import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hook';

import type * as Types from '@/types';

import { useContextMenu } from '@/providers/ContextMenu';
import { useFindMeContext } from '@/providers/FindMe';

import UserTab from '@/components/UserTab';

import * as Popup from '@/utils/popup';
import * as Permission from '@/utils/permission';
import CtxMenuBuilder from '@/utils/ctxMenuBuilder';

import styles from '@/styles/server.module.css';

interface ChannelTabProps {
  channel: Types.Channel;
  expanded?: Record<string, boolean>;
  selectedItemId: string | null;
  setExpanded?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setSelectedItemId: React.Dispatch<React.SetStateAction<string | null>>;
}

const ChannelTab: React.FC<ChannelTabProps> = React.memo(({ channel, expanded = { [channel.channelId]: true }, selectedItemId, setExpanded = () => {}, setSelectedItemId }) => {
  // Hooks
  const { t } = useTranslation();
  const { showContextMenu } = useContextMenu();
  const { handleChannelExpanded } = useFindMeContext();

  // Selectors
  const user = useAppSelector((state) => state.user.data);
  const currentServer = useAppSelector((state) => state.currentServer.data);
  const currentChannel = useAppSelector((state) => state.currentChannel.data);
  const onlineMembers = useAppSelector((state) => state.onlineMembers.data);

  // Variables
  const { userId } = user;
  const { serverId: currentServerId, lobbyId: currentServerLobbyId, receptionLobbyId: currentServerReceptionLobbyId } = currentServer;
  const { channelId: currentChannelId } = currentChannel;
  const { channelId, name: channelName, visibility: channelVisibility, userLimit: channelUserLimit, categoryId: channelCategoryId } = channel;
  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, channel.permissionLevel);
  const currentPermissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, currentChannel.permissionLevel);
  const channelMembers = onlineMembers.filter((om) => om.currentChannelId === channelId);
  const movableServerUserIds = onlineMembers.filter((om) => om.userId !== userId && om.permissionLevel <= permissionLevel).map((om) => om.userId);
  const movableChannelUserIds = channelMembers.filter((cm) => cm.userId !== userId && cm.permissionLevel <= permissionLevel).map((cm) => cm.userId);
  const isInChannel = currentChannelId === channelId;
  const isLobby = currentServerLobbyId === channelId;
  const isReceptionLobby = currentServerReceptionLobbyId === channelId;
  const isMemberChannel = channelVisibility === 'member';
  const isPrivateChannel = channelVisibility === 'private';
  const isReadonlyChannel = channelVisibility === 'readonly';
  const isFull = channelUserLimit && channelUserLimit <= channelMembers.length;
  const isSelected = selectedItemId === `channel-${channelId}`;
  const isDraggable = Permission.isChannelMod(permissionLevel) && movableChannelUserIds.length > 0;
  const isExpandable = expanded[channelId];
  const canJoin = !isInChannel && !isReadonlyChannel && !(isMemberChannel && !Permission.isMember(permissionLevel)) && (!isFull || Permission.isServerAdmin(permissionLevel));
  const needsPassword = !Permission.isChannelMod(permissionLevel) && isPrivateChannel;
  const filteredChannelMembers = [...channelMembers].sort((a, b) => b.lastJoinChannelAt - a.lastJoinChannelAt);

  // Handlers
  const getTabContextMenuItems = () =>
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

  const handleTabClick = () => {
    if (isSelected) setSelectedItemId(null);
    else setSelectedItemId(`channel-${channelId}`);
  };

  const handleTabDoubleClick = () => {
    Popup.connectChannel(currentServerId, channelId, canJoin, needsPassword);
  };

  const handleTabDragStart = (e: React.DragEvent) => {
    if (!isDraggable) return;
    e.dataTransfer.setData('type', 'moveAllUsers');
    e.dataTransfer.setData('userIds', movableChannelUserIds.join(','));
    e.dataTransfer.setData('currentChannelId', channelId);
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
    if (!moveType || !currentChannelId || currentChannelId === channelId || isReadonlyChannel) return;
    switch (moveType) {
      case 'moveUser':
        const targetUserId = e.dataTransfer.getData('userId');
        if (!targetUserId) return;
        Popup.moveUserToChannel(targetUserId, currentServerId, channelId);
        break;
      case 'moveAllUsers':
        const targetUserIds = e.dataTransfer.getData('userIds');
        if (!targetUserIds) return;
        Popup.moveAllUsersToChannel(targetUserIds.split(','), currentServerId, channelId);
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
    setExpanded((prev) => ({ ...prev, [channelId]: !prev[channelId] }));
  };

  // Effect
  useEffect(() => {
    if (!isInChannel) return;
    handleChannelExpanded.current = () => {
      setExpanded((prev) => ({ ...prev, [channelId]: true }));
    };
  }, [channelId, handleChannelExpanded, setExpanded, isInChannel]);

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
        <div className={`${styles['tab-icon']} ${isExpandable ? styles['expanded'] : ''} ${isLobby ? styles['lobby'] : styles[channelVisibility]}`} onClick={handleTabExpandedClick} />
        <div className={`${styles['channel-tab-label']} ${isReceptionLobby ? styles['is-reception-lobby'] : ''}`}>{isLobby ? t(`lobby`) : channelName}</div>
        {!isReadonlyChannel && <div className={styles['channel-user-count-text']}>{`(${channelMembers.length}${channelUserLimit > 0 ? `/${channelUserLimit}` : ''})`}</div>}
        {isInChannel && !isExpandable && <div className={styles['my-location-icon']} />}
      </div>
      <div className={styles['user-list']} style={isExpandable ? {} : { display: 'none' }}>
        {filteredChannelMembers.map((member) => (
          <UserTab key={member.userId} member={member} channel={channel} canJoin={canJoin} needsPassword={needsPassword} selectedItemId={selectedItemId} setSelectedItemId={setSelectedItemId} />
        ))}
      </div>
    </>
  );
});

ChannelTab.displayName = 'ChannelTab';

export default ChannelTab;

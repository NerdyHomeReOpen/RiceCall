import React, { useMemo } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hook';

import type * as Types from '@/types';

import MarkdownContent from '@/components/MarkdownContent';

import { useContextMenu } from '@/providers/ContextMenu';

import * as Permission from '@/utils/permission';
import * as Popup from '@/utils/popup';
import * as Language from '@/utils/language';
import CtxMenuBuilder from '@/utils/ctxMenuBuilder';

import { ALLOWED_MESSAGE_KEYS } from '@/constant';

import styles from '@/styles/message.module.css';
import permission from '@/styles/permission.module.css';
import vip from '@/styles/vip.module.css';

interface ChannelMessageProps {
  messageGroup: Types.ChannelMessage & { contents: string[] };
}

const ChannelMessage: React.FC<ChannelMessageProps> = React.memo(({ messageGroup }) => {
  // Hooks
  const { t } = useTranslation();
  const { showContextMenu } = useContextMenu();

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
      lobbyId: state.currentServer.data.lobbyId,
    }),
    shallowEqual,
  );

  const currentChannel = useAppSelector(
    (state) => ({
      channelId: state.currentChannel.data.channelId,
      permissionLevel: state.currentChannel.data.permissionLevel,
      categoryId: state.currentChannel.data.categoryId,
    }),
    shallowEqual,
  );

  // Variables
  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, currentChannel.permissionLevel);
  const isSelf = messageGroup.userId === user.userId;
  const isInLobby = messageGroup.currentChannelId === currentServer.lobbyId;
  const isLowerLevel = messageGroup.permissionLevel < permissionLevel;
  const hasVip = messageGroup.vip > 0;
  const formattedTimestamp = Language.getFormatTimestamp(t, messageGroup.timestamp);
  const formattedMessageContents = useMemo(
    () =>
      messageGroup.contents.map((content) =>
        content
          .split(' ')
          .map((c) => (ALLOWED_MESSAGE_KEYS.includes(c) ? t(c) : c))
          .join(' '),
      ),
    [messageGroup.contents, t],
  );

  // Functions
  const getMemberManagementSubmenuItems = () =>
    new CtxMenuBuilder()
      .addTerminateMemberOption({ permissionLevel, targetPermissionLevel: messageGroup.permissionLevel, isSelf, isLowerLevel }, () =>
        Popup.terminateMember(messageGroup.userId, currentServer.serverId, messageGroup.name),
      )
      .addSetChannelModOption({ permissionLevel, targetPermissionLevel: messageGroup.permissionLevel, isSelf, isLowerLevel, channelCategoryId: currentChannel.categoryId }, () =>
        Permission.isChannelMod(messageGroup.permissionLevel)
          ? Popup.editChannelPermission(messageGroup.userId, currentServer.serverId, currentChannel.channelId, { permissionLevel: 2 })
          : Popup.editChannelPermission(messageGroup.userId, currentServer.serverId, currentChannel.channelId, { permissionLevel: 3 }),
      )
      .addSetChannelAdminOption({ permissionLevel, targetPermissionLevel: messageGroup.permissionLevel, isSelf, isLowerLevel, channelCategoryId: currentChannel.categoryId }, () =>
        Permission.isChannelAdmin(messageGroup.permissionLevel)
          ? Popup.editChannelPermission(messageGroup.userId, currentServer.serverId, currentChannel.categoryId || currentChannel.channelId, { permissionLevel: 2 })
          : Popup.editChannelPermission(messageGroup.userId, currentServer.serverId, currentChannel.categoryId || currentChannel.channelId, { permissionLevel: 4 }),
      )
      .addSetServerAdminOption({ permissionLevel, targetPermissionLevel: messageGroup.permissionLevel, isSelf, isLowerLevel }, () =>
        Permission.isServerAdmin(messageGroup.permissionLevel)
          ? Popup.editServerPermission(messageGroup.userId, currentServer.serverId, { permissionLevel: 2 })
          : Popup.editServerPermission(messageGroup.userId, currentServer.serverId, { permissionLevel: 5 }),
      )
      .build();

  const getMessageContextMenuItems = () =>
    new CtxMenuBuilder()
      .addDirectMessageOption({ isSelf }, () => Popup.openDirectMessage(user.userId, messageGroup.userId))
      .addViewProfileOption(() => Popup.openUserInfo(user.userId, messageGroup.userId))
      .addKickUserFromChannelOption({ permissionLevel, isSelf, isLowerLevel, isInLobby }, () => Popup.openKickMemberFromChannel(messageGroup.userId, currentServer.serverId, currentChannel.channelId))
      .addKickUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => Popup.openKickMemberFromServer(messageGroup.userId, currentServer.serverId))
      .addBlockUserFromServerOption({ permissionLevel, isSelf, isLowerLevel }, () => Popup.openBlockMember(messageGroup.userId, currentServer.serverId))
      .addInviteToBeMemberOption({ permissionLevel, targetPermissionLevel: messageGroup.permissionLevel, isSelf, isLowerLevel }, () =>
        Popup.openInviteMember(messageGroup.userId, currentServer.serverId),
      )
      .addMemberManagementOption(
        { permissionLevel, targetPermissionLevel: messageGroup.permissionLevel, isSelf, isLowerLevel, channelCategoryId: currentChannel.categoryId },
        () => {},
        getMemberManagementSubmenuItems(),
      )
      .build();

  // Handlers
  const handleMessageContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', getMessageContextMenuItems());
  };

  const handleUsernameClick = () => {
    Popup.openUserInfo(user.userId, messageGroup.userId);
  };

  return (
    <div className={styles['message-box']}>
      <div className={`${styles['details']}`} onContextMenu={handleMessageContextMenu}>
        {Permission.isChannelMod(messageGroup.permissionLevel) && <div className={`${permission[messageGroup.gender]} ${permission[`lv-${messageGroup.permissionLevel}`]}`} />}
        {hasVip && <div className={`${vip['vip-icon']} ${vip[`vip-${messageGroup.vip}`]}`} />}
        <div className={`${styles['username-text']} ${hasVip ? `${vip['vip-name-color']}` : ''}`} onClick={handleUsernameClick}>
          {messageGroup.nickname || messageGroup.name}
        </div>
        <div className={styles['timestamp-text']}>{formattedTimestamp}</div>
      </div>
      {formattedMessageContents.map((content, index) => (
        <MarkdownContent key={index} markdownText={content} />
      ))}
    </div>
  );
});

ChannelMessage.displayName = 'ChannelMessage';

export default ChannelMessage;

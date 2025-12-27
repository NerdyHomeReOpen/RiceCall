import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

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
  user: Types.User;
  currentChannel: Types.Channel;
  currentServer: Types.Server;
  messageGroup: Types.ChannelMessage & { contents: string[] };
}

const ChannelMessage: React.FC<ChannelMessageProps> = React.memo(({ user, currentChannel, currentServer, messageGroup }) => {
  // Hooks
  const contextMenu = useContextMenu();
  const { t } = useTranslation();

  // Variables
  const { userId } = user;
  const { serverId: currentServerId, lobbyId: currentServerLobbyId } = currentServer;
  const { channelId: currentChannelId, categoryId: channelCategoryId, permissionLevel: channelPermissionLevel } = currentChannel;
  const {
    userId: senderUserId,
    name: senderName,
    nickname: senderNickname,
    vip: senderVip,
    gender: senderGender,
    permissionLevel: senderPermissionLevel,
    currentChannelId: senderCurrentChannelId,
    contents: messageContents,
    timestamp: messageTimestamp,
  } = messageGroup;

  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, channelPermissionLevel);
  const isSelf = senderUserId === userId;
  const isInLobby = senderCurrentChannelId === currentServerLobbyId;
  const isSuperior = permissionLevel > senderPermissionLevel;
  const senderHasVip = senderVip > 0;
  const formattedTimestamp = Language.getFormatTimestamp(t, messageTimestamp);
  const formattedMessageContents = useMemo(
    () =>
      messageContents.map((content) =>
        content
          .split(' ')
          .map((c) => (ALLOWED_MESSAGE_KEYS.includes(c) ? t(c) : c))
          .join(' '),
      ),
    [messageContents, t],
  );

  // Handlers
  const getMemberManagementSubmenuItems = () =>
    new CtxMenuBuilder()
      .addTerminateMemberOption({ permissionLevel, targetPermissionLevel: senderPermissionLevel, isSelf, isSuperior }, () => Popup.terminateMember(senderUserId, currentServerId, senderName))
      .addSetChannelModOption({ permissionLevel, targetPermissionLevel: senderPermissionLevel, isSelf, isSuperior, channelCategoryId }, () =>
        Permission.isChannelMod(senderPermissionLevel)
          ? Popup.editChannelPermission(senderUserId, currentServerId, currentChannelId, { permissionLevel: 2 })
          : Popup.editChannelPermission(senderUserId, currentServerId, currentChannelId, { permissionLevel: 3 }),
      )
      .addSetChannelAdminOption({ permissionLevel, targetPermissionLevel: senderPermissionLevel, isSelf, isSuperior, channelCategoryId }, () =>
        Permission.isChannelAdmin(senderPermissionLevel)
          ? Popup.editChannelPermission(senderUserId, currentServerId, channelCategoryId || currentChannelId, { permissionLevel: 2 })
          : Popup.editChannelPermission(senderUserId, currentServerId, channelCategoryId || currentChannelId, { permissionLevel: 4 }),
      )
      .addSetServerAdminOption({ permissionLevel, targetPermissionLevel: senderPermissionLevel, isSelf, isSuperior }, () =>
        Permission.isServerAdmin(senderPermissionLevel)
          ? Popup.editServerPermission(senderUserId, currentServerId, { permissionLevel: 2 })
          : Popup.editServerPermission(senderUserId, currentServerId, { permissionLevel: 5 }),
      )
      .build();

  const getContextMenuItems = () =>
    new CtxMenuBuilder()
      .addDirectMessageOption({ isSelf }, () => Popup.openDirectMessage(userId, senderUserId))
      .addViewProfileOption(() => Popup.openUserInfo(userId, senderUserId))
      .addKickUserFromChannelOption({ permissionLevel, isSelf, isSuperior, isInLobby }, () => Popup.openKickMemberFromChannel(senderUserId, currentServerId, currentChannelId))
      .addKickUserFromServerOption({ permissionLevel, isSelf, isSuperior }, () => Popup.openKickMemberFromServer(senderUserId, currentServerId))
      .addBlockUserFromServerOption({ permissionLevel, isSelf, isSuperior }, () => Popup.openBlockMember(senderUserId, currentServerId))
      .addInviteToBeMemberOption({ permissionLevel, targetPermissionLevel: senderPermissionLevel, isSelf, isSuperior }, () => Popup.openInviteMember(senderUserId, currentServerId))
      .addMemberManagementOption({ permissionLevel, targetPermissionLevel: senderPermissionLevel, isSelf, isSuperior, channelCategoryId }, () => {}, getMemberManagementSubmenuItems())
      .build();

  return (
    <div className={styles['message-box']}>
      <div
        className={`${styles['details']}`}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const { clientX: x, clientY: y } = e;
          contextMenu.showContextMenu(x, y, 'right-bottom', getContextMenuItems());
        }}
      >
        {Permission.isChannelMod(senderPermissionLevel) && <div className={`${permission[senderGender]} ${permission[`lv-${senderPermissionLevel}`]}`} />}
        {senderHasVip && <div className={`${vip['vip-icon']} ${vip[`vip-${senderVip}`]}`} />}
        <div className={`${styles['username-text']} ${senderHasVip ? `${vip['vip-name-color']}` : ''}`} onClick={() => Popup.openUserInfo(userId, senderUserId)}>
          {senderNickname || senderName}
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

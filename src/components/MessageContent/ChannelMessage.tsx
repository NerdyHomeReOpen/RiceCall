import React from 'react';
import { useTranslation } from 'react-i18next';

import * as Types from '@/types';

import {
  openBlockMember,
  openKickMemberFromServer,
  openKickMemberFromChannel,
  openDirectMessage,
  openUserInfo,
  openInviteMember,
  editServerPermission,
  editChannelPermission,
  terminateMember,
} from '@/services';

import { ALLOWED_MESSAGE_KEYS } from '@/constants';

import { useContextMenu } from '@/providers/ContextMenu';

import { useAppSelector } from '@/hooks/useStore';

import MarkdownContent from '@/components/MarkdownContent';

import ContextMenu from '@/utils/contextMenu';
import { getFormatTimestamp } from '@/utils/language';

import styles from './MessageContent.module.css';

interface ChannelMessageProps {
  messageGroup: Types.ChannelMessage & { contents: string[] };
}

const ChannelMessage: React.FC<ChannelMessageProps> = React.memo(({ messageGroup }) => {
  const { t } = useTranslation();
  const { showContextMenu } = useContextMenu();

  const userId = useAppSelector((state) => state.user.data.userId);
  const permissionLevel = useAppSelector((state) => Math.max(state.user.data.permissionLevel, state.currentServer.data.permissionLevel, state.currentChannel.data.permissionLevel));
  const currentServerId = useAppSelector((state) => state.currentServer.data.serverId);
  const currentServerLobbyId = useAppSelector((state) => state.currentServer.data.lobbyId);
  const currentChannelId = useAppSelector((state) => state.currentChannel.data.channelId);
  const currentChannelCategoryId = useAppSelector((state) => state.currentChannel.data.categoryId);

  const currentChannelIsSubChannel = currentChannelCategoryId !== null;
  const senderHasVip = messageGroup.vip > 0;
  const isSenderSelf = messageGroup.userId === userId;
  const isSenderInLobby = messageGroup.currentChannelId === currentServerLobbyId;
  const formattedTimestamp = getFormatTimestamp(messageGroup.timestamp);
  const formattedMessageContents = messageGroup.contents.map((content) =>
    content
      .split(' ')
      .map((c) => (ALLOWED_MESSAGE_KEYS.includes(c) ? t(c) : c))
      .join(' '),
  );

  const handleMessageContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const { clientX: x, clientY: y } = e;

    const contextMenu = new ContextMenu()
      .addDirectMessageOption(
        {
          isTargetSelf: isSenderSelf,
        },
        () => {
          openDirectMessage(userId, messageGroup.userId);
        },
      )
      .addViewProfileOption(() => {
        openUserInfo(userId, messageGroup.userId);
      })
      .addKickUserFromChannelOption(
        {
          permissionLevel,
          targetPermissionLevel: messageGroup.permissionLevel,
          isTargetSelf: isSenderSelf,
          isTargetInLobby: isSenderInLobby,
        },
        () => {
          openKickMemberFromChannel(messageGroup.userId, currentServerId, currentChannelId);
        },
      )
      .addKickUserFromServerOption(
        {
          permissionLevel,
          targetPermissionLevel: messageGroup.permissionLevel,
          isTargetSelf: isSenderSelf,
        },
        () => {
          openKickMemberFromServer(messageGroup.userId, currentServerId);
        },
      )
      .addBlockUserFromServerOption(
        {
          permissionLevel,
          targetPermissionLevel: messageGroup.permissionLevel,
          isTargetSelf: isSenderSelf,
        },
        () => {
          openBlockMember(messageGroup.userId, currentServerId);
        },
      )
      .addInviteToBeMemberOption(
        {
          permissionLevel,
          targetPermissionLevel: messageGroup.permissionLevel,
          isTargetSelf: isSenderSelf,
        },
        () => {
          openInviteMember(messageGroup.userId, currentServerId);
        },
      )
      .addMemberManagementOption(
        {
          permissionLevel,
          targetPermissionLevel: messageGroup.permissionLevel,
          isTargetSelf: isSenderSelf,
        },
        () => {},
        new ContextMenu()
          .addTerminateMemberOption(
            {
              permissionLevel,
              targetPermissionLevel: messageGroup.permissionLevel,
              isTargetSelf: isSenderSelf,
            },
            () => {
              terminateMember(messageGroup.userId, currentServerId, messageGroup.name);
            },
          )
          .addSetChannelModOption(
            {
              permissionLevel,
              targetPermissionLevel: messageGroup.permissionLevel,
              isChannelSubChannel: currentChannelIsSubChannel,
            },
            () => {
              if (messageGroup.permissionLevel >= Types.Permission.ChannelMod) {
                editChannelPermission(messageGroup.userId, currentServerId, currentChannelId, { permissionLevel: 2 });
              } else {
                editChannelPermission(messageGroup.userId, currentServerId, currentChannelId, { permissionLevel: 3 });
              }
            },
          )
          .addSetChannelAdminOption(
            {
              permissionLevel,
              targetPermissionLevel: messageGroup.permissionLevel,
            },
            () => {
              if (messageGroup.permissionLevel >= Types.Permission.ChannelAdmin) {
                editChannelPermission(messageGroup.userId, currentServerId, currentChannelId, { permissionLevel: 2 });
              } else {
                editChannelPermission(messageGroup.userId, currentServerId, currentChannelId, { permissionLevel: 4 });
              }
            },
          )
          .addSetServerAdminOption(
            {
              permissionLevel,
              targetPermissionLevel: messageGroup.permissionLevel,
            },
            () => () => {
              if (messageGroup.permissionLevel >= Types.Permission.ServerAdmin) {
                editServerPermission(messageGroup.userId, currentServerId, { permissionLevel: 2 });
              } else {
                editServerPermission(messageGroup.userId, currentServerId, { permissionLevel: 5 });
              }
            },
          )
          .build(),
      )
      .build();

    showContextMenu(x, y, 'right-bottom', contextMenu);
  };

  const handleUsernameClick = () => {
    openUserInfo(userId, messageGroup.userId);
  };

  return (
    <div className={styles['message-box']}>
      <div className={`${styles['details']}`} onContextMenu={handleMessageContextMenu}>
        {messageGroup.permissionLevel >= Types.Permission.ChannelMod && <div className={`permission-${messageGroup.gender} permission-lv-${messageGroup.permissionLevel}`} />}
        {senderHasVip && <div className={`vip-icon vip-${messageGroup.vip}`} />}
        <div className={`${styles['username-text']} ${senderHasVip ? styles['vip'] : ''}`} onClick={handleUsernameClick}>
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

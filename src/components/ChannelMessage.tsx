import React, { useMemo } from 'react';

// CSS
import styles from '@/styles/message.module.css';
import permission from '@/styles/permission.module.css';
import vip from '@/styles/vip.module.css';

// Types
import type { User, ChannelMessage, Server, Channel } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';

// Components
import MarkdownContent from '@/components/MarkdownContent';

// Utils
import { isMember, isServerOwner, isServerAdmin, isChannelAdmin, isChannelMod } from '@/utils/permission';
import {
  handleOpenDirectMessage,
  handleOpenUserInfo,
  handleOpenAlertDialog,
  handleOpenInviteMember,
  handleOpenBlockMember,
  handleOpenKickMemberFromChannel,
  handleOpenKickMemberFromServer,
} from '@/utils/popup';
import { getFormatTimestamp } from '@/utils/language';

// Constants
import { ALLOWED_MESSAGE_KEYS } from '@/constant';

// Services
import ipc from '@/services/ipc.service';

interface ChannelMessageProps {
  user: User;
  currentChannel: Channel;
  currentServer: Server;
  messageGroup: ChannelMessage & { contents: string[] };
}

const ChannelMessage: React.FC<ChannelMessageProps> = React.memo(({ user, currentChannel, currentServer, messageGroup }) => {
  // Hooks
  const contextMenu = useContextMenu();
  const { t } = useTranslation();

  // Variables
  const { userId } = user;
  const { serverId: currentServerId } = currentServer;
  const { channelId: currentChannelId, categoryId: channelCategoryId, permissionLevel: channelPermissionLevel } = currentChannel;
  const {
    userId: senderUserId,
    name: senderName,
    nickname: senderNickname,
    vip: senderVip,
    gender: senderGender,
    isTextMuted: senderIsTextMuted,
    isVoiceMuted: senderIsVoiceMuted,
    permissionLevel: senderPermissionLevel,
    currentChannelId: senderCurrentChannnelId,
    currentServerId: senderCurrentServerId,
    contents: messageContents,
    timestamp: messageTimestamp,
  } = messageGroup;

  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, channelPermissionLevel);
  const isUser = senderUserId === userId;
  const isSameChannel = senderCurrentChannnelId === currentChannelId;
  const isSameServer = senderCurrentServerId === currentServerId;
  const isSuperior = permissionLevel > senderPermissionLevel;
  const canUpdatePermission = false && !isUser && isSuperior && isMember(senderPermissionLevel);
  const formattedTimestamp = getFormatTimestamp(t, messageTimestamp);
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
  const getContextMenuItems = () => [
    {
      id: 'direct-message',
      label: t('direct-message'),
      show: !isUser,
      onClick: () => handleOpenDirectMessage(userId, senderUserId),
    },
    {
      id: 'view-profile',
      label: t('view-profile'),
      onClick: () => handleOpenUserInfo(userId, senderUserId),
    },
    {
      id: 'forbid-voice',
      label: senderIsVoiceMuted ? t('unforbid-voice') : t('forbid-voice'),
      show: !isUser && isChannelMod(permissionLevel) && isSuperior,
      onClick: () => handleForbidUserVoiceInChannel(senderUserId, currentServerId, currentChannelId, !senderIsVoiceMuted),
    },
    {
      id: 'forbid-text',
      label: senderIsTextMuted ? t('unforbid-text') : t('forbid-text'),
      show: !isUser && isChannelMod(permissionLevel) && isSuperior,
      onClick: () => handleForbidUserTextInChannel(senderUserId, currentServerId, currentChannelId, !senderIsTextMuted),
    },
    {
      id: 'kick-channel',
      label: t('kick-channel'),
      show: !isUser && isChannelMod(permissionLevel) && isSuperior && isSameChannel,
      onClick: () => handleOpenKickMemberFromChannel(senderUserId, currentServerId, currentChannelId),
    },
    {
      id: 'kick-server',
      label: t('kick-server'),
      show: !isUser && isServerAdmin(permissionLevel) && isSuperior && isSameServer,
      onClick: () => handleOpenKickMemberFromServer(senderUserId, currentServerId),
    },
    {
      id: 'block',
      label: t('block'),
      show: !isUser && isServerAdmin(permissionLevel) && isSuperior,
      onClick: () => handleOpenBlockMember(senderUserId, currentServerId),
    },
    {
      id: 'separator',
      label: '',
      show: !isUser && isServerAdmin(permissionLevel) && isSuperior,
    },
    {
      id: 'invite-to-be-member',
      label: t('invite-to-be-member'),
      show: !isUser && !isMember(senderPermissionLevel) && isServerAdmin(permissionLevel),
      onClick: () => handleOpenInviteMember(senderUserId, currentServerId),
    },
    {
      id: 'member-management',
      label: t('member-management'),
      show: canUpdatePermission && (channelCategoryId === null ? isServerAdmin(permissionLevel) : isChannelAdmin(permissionLevel)),
      icon: 'submenu',
      hasSubmenu: true,
      submenuItems: [
        {
          id: 'terminate-member',
          label: t('terminate-member'),
          show: !isUser && isServerAdmin(permissionLevel) && isSuperior && isMember(senderPermissionLevel) && !isServerOwner(senderPermissionLevel),
          onClick: () => handleTerminateMember(senderUserId, currentServerId, senderName),
        },
        {
          id: 'set-channel-mod',
          label: isChannelMod(senderPermissionLevel) ? t('unset-channel-mod') : t('set-channel-mod'),
          show: canUpdatePermission && isChannelAdmin(permissionLevel) && !isChannelAdmin(senderPermissionLevel) && channelCategoryId !== null,
          onClick: () =>
            isChannelMod(senderPermissionLevel)
              ? handleEditChannelPermission(senderUserId, currentServerId, currentChannelId, { permissionLevel: 2 })
              : handleEditChannelPermission(senderUserId, currentServerId, currentChannelId, { permissionLevel: 3 }),
        },
        {
          id: 'set-channel-admin',
          label: isChannelAdmin(senderPermissionLevel) ? t('unset-channel-admin') : t('set-channel-admin'),
          show: canUpdatePermission && isServerAdmin(permissionLevel) && !isServerAdmin(senderPermissionLevel),
          onClick: () =>
            isChannelAdmin(senderPermissionLevel)
              ? handleEditChannelPermission(senderUserId, currentServerId, channelCategoryId || currentChannelId, { permissionLevel: 2 })
              : handleEditChannelPermission(senderUserId, currentServerId, channelCategoryId || currentChannelId, { permissionLevel: 4 }),
        },
        {
          id: 'set-server-admin',
          label: isServerAdmin(senderPermissionLevel) ? t('unset-server-admin') : t('set-server-admin'),
          show: canUpdatePermission && isServerOwner(permissionLevel) && !isServerOwner(senderPermissionLevel),
          onClick: () =>
            isServerAdmin(senderPermissionLevel)
              ? handleEditServerPermission(senderUserId, currentServerId, { permissionLevel: 2 })
              : handleEditServerPermission(senderUserId, currentServerId, { permissionLevel: 5 }),
        },
      ],
    },
  ];

  const handleForbidUserTextInChannel = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId'], isTextMuted: boolean) => {
    ipc.socket.send('muteUserInChannel', { userId, serverId, channelId, mute: { isTextMuted } });
  };

  const handleForbidUserVoiceInChannel = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId'], isVoiceMuted: boolean) => {
    ipc.socket.send('muteUserInChannel', { userId, serverId, channelId, mute: { isVoiceMuted } });
  };

  const handleEditServerPermission = (userId: User['userId'], serverId: Server['serverId'], update: Partial<Server>) => {
    ipc.socket.send('editServerPermission', { userId, serverId, update });
  };

  const handleEditChannelPermission = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId'], update: Partial<Channel>) => {
    ipc.socket.send('editChannelPermission', { userId, serverId, channelId, update });
  };

  const handleTerminateMember = (userId: User['userId'], serverId: Server['serverId'], userName: User['name']) => {
    handleOpenAlertDialog(t('confirm-terminate-membership', { '0': userName }), () => ipc.socket.send('terminateMember', { userId, serverId }));
  };

  return (
    <div className={styles['message-box']}>
      <div className={`${styles['header']}`}>
        <div
          className={`${styles['details']}`}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const { clientX: x, clientY: y } = e;
            contextMenu.showContextMenu(x, y, 'right-bottom', getContextMenuItems());
          }}
        >
          <div className={`${senderPermissionLevel > 2 && permission[senderGender]} ${senderPermissionLevel > 2 && permission[`lv-${senderPermissionLevel}`]}`} />
          {senderVip > 0 && <div className={`${vip['vip-icon']} ${vip[`vip-${senderVip}`]}`} />}
          <div className={`${styles['username-text']} ${senderVip > 0 ? `${vip['vip-name-color']}` : ''}`} onClick={() => handleOpenUserInfo(userId, senderUserId)}>
            {senderNickname || senderName}
          </div>
          <div className={styles['timestamp-text']}>{formattedTimestamp}</div>
        </div>
      </div>
      {formattedMessageContents.map((content, index) => (
        <MarkdownContent key={index} markdownText={content} />
      ))}
    </div>
  );
});

ChannelMessage.displayName = 'ChannelMessage';

export default ChannelMessage;

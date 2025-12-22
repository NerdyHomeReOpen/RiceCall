import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import MarkdownContent from '@/components/MarkdownContent';

import { useContextMenu } from '@/providers/ContextMenu';

import * as Permission from '@/utils/permission';
import * as Popup from '@/utils/popup';
import * as Language from '@/utils/language';

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
  const { serverId: currentServerId } = currentServer;
  const { channelId: currentChannelId, categoryId: channelCategoryId, permissionLevel: channelPermissionLevel } = currentChannel;
  const {
    userId: senderUserId,
    name: senderName,
    nickname: senderNickname,
    vip: senderVip,
    gender: senderGender,
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
  const canUpdatePermission = false && !isUser && isSuperior && Permission.isMember(senderPermissionLevel);
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
  const getContextMenuItems = () => [
    {
      id: 'direct-message',
      label: t('direct-message'),
      show: !isUser,
      onClick: () => Popup.handleOpenDirectMessage(userId, senderUserId),
    },
    {
      id: 'view-profile',
      label: t('view-profile'),
      onClick: () => Popup.handleOpenUserInfo(userId, senderUserId),
    },
    {
      id: 'kick-channel',
      label: t('kick-channel'),
      show: !isUser && Permission.isChannelMod(permissionLevel) && isSuperior && isSameChannel,
      onClick: () => Popup.handleOpenKickMemberFromChannel(senderUserId, currentServerId, currentChannelId),
    },
    {
      id: 'kick-server',
      label: t('kick-server'),
      show: !isUser && Permission.isServerAdmin(permissionLevel) && isSuperior && isSameServer,
      onClick: () => Popup.handleOpenKickMemberFromServer(senderUserId, currentServerId),
    },
    {
      id: 'block',
      label: t('block'),
      show: !isUser && Permission.isServerAdmin(permissionLevel) && isSuperior,
      onClick: () => Popup.handleOpenBlockMember(senderUserId, currentServerId),
    },
    {
      id: 'separator',
      label: '',
      show: !isUser && Permission.isServerAdmin(permissionLevel) && isSuperior,
    },
    {
      id: 'invite-to-be-member',
      label: t('invite-to-be-member'),
      show: !isUser && !Permission.isMember(senderPermissionLevel) && Permission.isServerAdmin(permissionLevel),
      onClick: () => Popup.handleOpenInviteMember(senderUserId, currentServerId),
    },
    {
      id: 'member-management',
      label: t('member-management'),
      show: canUpdatePermission && (channelCategoryId === null ? Permission.isServerAdmin(permissionLevel) : Permission.isChannelAdmin(permissionLevel)),
      icon: 'submenu',
      hasSubmenu: true,
      submenuItems: [
        {
          id: 'terminate-member',
          label: t('terminate-member'),
          show: !isUser && Permission.isServerAdmin(permissionLevel) && isSuperior && Permission.isMember(senderPermissionLevel) && !Permission.isServerOwner(senderPermissionLevel),
          onClick: () => handleTerminateMember(senderUserId, currentServerId, senderName),
        },
        {
          id: 'set-channel-mod',
          label: Permission.isChannelMod(senderPermissionLevel) ? t('unset-channel-mod') : t('set-channel-mod'),
          show: canUpdatePermission && Permission.isChannelAdmin(permissionLevel) && !Permission.isChannelAdmin(senderPermissionLevel) && channelCategoryId !== null,
          onClick: () =>
            Permission.isChannelMod(senderPermissionLevel)
              ? handleEditChannelPermission(senderUserId, currentServerId, currentChannelId, { permissionLevel: 2 })
              : handleEditChannelPermission(senderUserId, currentServerId, currentChannelId, { permissionLevel: 3 }),
        },
        {
          id: 'set-channel-admin',
          label: Permission.isChannelAdmin(senderPermissionLevel) ? t('unset-channel-admin') : t('set-channel-admin'),
          show: canUpdatePermission && Permission.isServerAdmin(permissionLevel) && !Permission.isServerAdmin(senderPermissionLevel),
          onClick: () =>
            Permission.isChannelAdmin(senderPermissionLevel)
              ? handleEditChannelPermission(senderUserId, currentServerId, channelCategoryId || currentChannelId, { permissionLevel: 2 })
              : handleEditChannelPermission(senderUserId, currentServerId, channelCategoryId || currentChannelId, { permissionLevel: 4 }),
        },
        {
          id: 'set-server-admin',
          label: Permission.isServerAdmin(senderPermissionLevel) ? t('unset-server-admin') : t('set-server-admin'),
          show: canUpdatePermission && Permission.isServerOwner(permissionLevel) && !Permission.isServerOwner(senderPermissionLevel),
          onClick: () =>
            Permission.isServerAdmin(senderPermissionLevel)
              ? handleEditServerPermission(senderUserId, currentServerId, { permissionLevel: 2 })
              : handleEditServerPermission(senderUserId, currentServerId, { permissionLevel: 5 }),
        },
      ],
    },
  ];

  const handleEditServerPermission = (userId: Types.User['userId'], serverId: Types.Server['serverId'], update: Partial<Types.Server>) => {
    ipc.socket.send('editServerPermission', { userId, serverId, update });
  };

  const handleEditChannelPermission = (userId: Types.User['userId'], serverId: Types.Server['serverId'], channelId: Types.Channel['channelId'], update: Partial<Types.Channel>) => {
    ipc.socket.send('editChannelPermission', { userId, serverId, channelId, update });
  };

  const handleTerminateMember = (userId: Types.User['userId'], serverId: Types.Server['serverId'], userName: Types.User['name']) => {
    Popup.handleOpenAlertDialog(t('confirm-terminate-membership', { '0': userName }), () => ipc.socket.send('terminateMember', { userId, serverId }));
  };

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
        <div className={`${senderPermissionLevel > 2 && permission[senderGender]} ${senderPermissionLevel > 2 && permission[`lv-${senderPermissionLevel}`]}`} />
        {senderVip > 0 && <div className={`${vip['vip-icon']} ${vip[`vip-${senderVip}`]}`} />}
        <div className={`${styles['username-text']} ${senderVip > 0 ? `${vip['vip-name-color']}` : ''}`} onClick={() => Popup.handleOpenUserInfo(userId, senderUserId)}>
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

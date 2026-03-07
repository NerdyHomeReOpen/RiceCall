import React, { useMemo } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hook';

import type * as Types from '@/types';

import MarkdownContent from '@/components/MarkdownContent';

import { useContextMenu } from '@/providers/ContextMenu';

import * as Action from '@/action';

import * as Language from '@/utils/language';
import * as Permission from '@/utils/permission';

import { useMessageContextMenu } from '@/hooks/ctxMenus/messageCtxMenu';

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

  const { buildContextMenu: buildMessageContextMenu } = useMessageContextMenu({
    user,
    currentServer,
    currentChannel,
    member: messageGroup,
  });

  // Handlers
  const handleMessageContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', buildMessageContextMenu());
  };

  const handleUsernameClick = () => {
    Action.openUserInfo(user.userId, messageGroup.userId);
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

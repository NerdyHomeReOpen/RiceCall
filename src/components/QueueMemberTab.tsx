import React, { useRef } from 'react';

// CSS
import styles from '@/styles/pages/server.module.css';
import grade from '@/styles/grade.module.css';
import vip from '@/styles/vip.module.css';
import permission from '@/styles/permission.module.css';

// Types
import { User, QueueMember, Channel, Server } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';
import { useWebRTC } from '@/providers/WebRTC';

// Components
import BadgeListViewer from '@/components/BadgeList';

// Services
import ipcService from '@/services/ipc.service';

interface QueueMemberTabProps {
  queueMember: QueueMember;
  currentChannel: Channel;
  currentServer: Server;
}

const QueueMemberTab: React.FC<QueueMemberTabProps> = React.memo(({ queueMember, currentChannel, currentServer }) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();
  const webRTC = useWebRTC();

  // Refs
  const userTabRef = useRef<HTMLDivElement>(null);

  // Variables
  const {
    name: memberName,
    permissionLevel: memberPermission,
    nickname: memberNickname,
    level: memberLevel,
    gender: memberGender,
    badges: memberBadges,
    vip: memberVip,
    userId: memberUserId,
    currentChannelId: memberCurrentChannelId,
    position: memberPosition,
    leftTime: memberLeftTime,
  } = queueMember;
  const { userId, serverId, permissionLevel: userPermission } = currentServer;
  const { channelId: currentChannelId } = currentChannel;
  const isCurrentUser = memberUserId === userId;
  const isSameChannel = memberCurrentChannelId === currentChannelId;
  const speakingStatus = webRTC.volumePercent?.[memberUserId];
  const connectionStatus = webRTC.remoteUserStatusList?.[memberUserId] || 'connecting';
  const isLoading = connectionStatus === 'connecting' || !connectionStatus;
  const isSpeaking = speakingStatus !== 0;
  const isMuted = speakingStatus === -1;
  const isMutedByUser = webRTC.mutedIds.includes(memberUserId);
  const canManageMember = userPermission > 2 && userPermission >= memberPermission;
  const canIncreaseTime = canManageMember && memberPosition === 1;
  const canMoveToSecondPosition = canManageMember && memberPosition >= 3;
  const canMoveDown = canManageMember && memberPosition > 1;
  const canMoveUp = canManageMember && memberPosition > 2;

  const statusIcon = () => {
    if (isMuted || isMutedByUser) return 'muted';
    if (!isCurrentUser && isSameChannel && isLoading) return 'loading';
    if (isSpeaking) return 'play';
    return '';
  };

  // Handlers
  const handleIncreaseTime = () => {
    ipcService.socket.send('increaseQueueTime', { serverId, channelId: currentChannelId, userId: memberUserId, time: 10 });
  };

  const handleMoveDown = (userId: User['userId']) => {
    ipcService.socket.send('moveQueuePosition', { serverId, channelId: currentChannelId, userId, position: memberPosition + 1 });
  };

  const handleMoveUp = (userId: User['userId']) => {
    ipcService.socket.send('moveQueuePosition', { serverId, channelId: currentChannelId, userId, position: memberPosition - 1 });
  };

  const handleMoveSecondPosition = (userId: User['userId']) => {
    ipcService.socket.send('moveQueuePosition', { serverId, channelId: currentChannelId, userId, position: 2 });
  };

  const handleRemoveFromQueueConfirm = (userId: User['userId']) => {
    handleOpenAlertDialog(t('confirm-remove-from-queue', { '0': memberName }), () => {
      ipcService.socket.send('removeFromQueue', { serverId, channelId: currentChannelId, userId });
    });
  };

  const handleOpenDirectMessage = (userId: User['userId'], targetId: User['userId'], targetName: User['name']) => {
    ipcService.popup.open('directMessage', `directMessage-${targetId}`);
    ipcService.initialData.onRequest(`directMessage-${targetId}`, { userId, targetId, targetName });
  };

  const handleOpenUserInfo = (userId: User['userId'], targetId: User['userId']) => {
    ipcService.popup.open('userInfo', `userInfo-${targetId}`);
    ipcService.initialData.onRequest(`userInfo-${targetId}`, { userId, targetId });
  };

  const handleOpenAlertDialog = (message: string, callback: () => void) => {
    ipcService.popup.open('dialogAlert', 'alertDialog');
    ipcService.initialData.onRequest('alertDialog', { message, submitTo: 'alertDialog' });
    ipcService.popup.onSubmit('alertDialog', callback);
  };

  return (
    <div
      ref={userTabRef}
      key={memberUserId}
      className={`context-menu-container ${styles['user-tab']}`}
      onDoubleClick={() => {
        if (!userTabRef.current) return;
        const x = userTabRef.current.getBoundingClientRect().left + userTabRef.current.getBoundingClientRect().width;
        const y = userTabRef.current.getBoundingClientRect().top;
        contextMenu.showUserInfoBlock(x, y, false, queueMember);
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        const x = e.clientX;
        const y = e.clientY;
        contextMenu.showContextMenu(x, y, false, false, [
          {
            id: 'direct-message',
            label: t('direct-message'),
            show: !isCurrentUser,
            onClick: () => handleOpenDirectMessage(userId, memberUserId, memberName),
          },
          {
            id: 'view-profile',
            label: t('view-profile'),
            onClick: () => handleOpenUserInfo(userId, memberUserId),
          },
          {
            id: 'increase-time',
            label: t('increase-time'),
            show: canIncreaseTime,
            onClick: () => handleIncreaseTime(),
          },
          {
            id: 'move-up',
            label: t('move-up'),
            show: canMoveUp,
            onClick: () => handleMoveUp(memberUserId),
          },
          {
            id: 'move-down',
            label: t('move-down'),
            show: canMoveDown,
            onClick: () => handleMoveDown(memberUserId),
          },
          {
            id: 'move-to-second-position',
            label: t('move-to-second-position'),
            show: canMoveToSecondPosition,
            onClick: () => handleMoveSecondPosition(memberUserId),
          },
          {
            id: 'delete-from-queue',
            label: t('delete-from-queue'),
            show: canManageMember,
            onClick: () => handleRemoveFromQueueConfirm(memberUserId),
          },
        ]);
      }}
    >
      <div className={`${styles['user-audio-state']} ${styles[statusIcon()]}`} title={!isCurrentUser ? t('connection-status', { '0': t(`connection-status-${connectionStatus}`) }) : ''} />
      <div className={`${permission[memberGender]} ${permission[`lv-${memberPermission}`]}`} />
      {memberVip > 0 && <div className={`${vip['vip-icon']} ${vip[`vip-${memberVip}`]}`} />}
      <div className={`${styles['user-tab-name']} ${memberNickname ? styles['member'] : ''} ${memberVip > 0 ? vip['vip-name-color'] : ''}`}>{memberNickname || memberName}</div>
      <div className={`${grade['grade']} ${grade[`lv-${Math.min(56, memberLevel)}`]}`} style={{ cursor: 'default' }} />
      <BadgeListViewer badges={memberBadges} maxDisplay={5} />

      {memberPosition === 0 && <div className={styles['queue-seconds-remaining-box']}>{memberLeftTime}s</div>}
      {isCurrentUser && <div className={styles['my-location-icon']} />}
    </div>
  );
});

QueueMemberTab.displayName = 'QueueMemberTab';

export default QueueMemberTab;

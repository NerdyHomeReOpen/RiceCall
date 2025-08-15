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

// Utils
import { isMember } from '@/utils/permission';

interface QueueMemberTabProps {
  user: User;
  server: Server;
  channel: Channel;
  queueMember: QueueMember;
  selectedItemId: string | null;
  setSelectedItemId: React.Dispatch<React.SetStateAction<string | null>>;
}

const QueueMemberTab: React.FC<QueueMemberTabProps> = React.memo(({ user, server, channel, queueMember, selectedItemId, setSelectedItemId }) => {
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
  const { userId, permissionLevel: globalPermission } = user;
  const { serverId, permissionLevel: serverPermission } = server;
  const { channelId, permissionLevel: channelPermission } = channel;
  const permissionLevel = Math.max(globalPermission, serverPermission, channelPermission);
  const isCurrentUser = memberUserId === userId;
  const isSameChannel = memberCurrentChannelId === channelId;
  const speakingStatus = webRTC.volumePercent?.[memberUserId];
  const connectionStatus = webRTC.remoteUserStatusList?.[memberUserId] || 'connecting';
  const isLoading = connectionStatus === 'connecting' || !connectionStatus;
  const isSpeaking = !!speakingStatus;
  const isMuted = speakingStatus === -1;
  const isMutedByUser = webRTC.mutedIds.includes(memberUserId);
  const canManageMember = isMember(permissionLevel) && permissionLevel >= memberPermission;

  const statusIcon = () => {
    if (isMuted || isMutedByUser) return 'muted';
    if (!isCurrentUser && isSameChannel && isLoading) return 'loading';
    if (isSpeaking) return 'play';
    return '';
  };

  // Handlers
  const handleIncreaseQueueTime = () => {
    ipcService.socket.send('increaseQueueTime', { serverId, channelId, userId: memberUserId });
  };

  const handleMoveDownQueue = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId'], position: number) => {
    ipcService.socket.send('moveQueuePosition', { serverId, channelId, userId, position });
  };

  const handleMoveUpQueue = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId'], position: number) => {
    ipcService.socket.send('moveQueuePosition', { serverId, channelId, userId, position });
  };

  const handleRemoveFromQueue = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId']) => {
    handleOpenAlertDialog(t('confirm-remove-from-queue', { '0': memberName }), () => {
      ipcService.socket.send('removeFromQueue', { serverId, channelId, userId });
    });
  };

  const handleOpenAlertDialog = (message: string, callback: () => void) => {
    ipcService.popup.open('dialogAlert', 'dialogAlert', { message, submitTo: 'dialogAlert' });
    ipcService.popup.onSubmit('dialogAlert', callback);
  };

  return (
    <div
      ref={userTabRef}
      key={memberUserId}
      className={`context-menu-container ${styles['user-tab']} ${selectedItemId === `queue-${memberUserId}` ? styles['selected'] : ''}`}
      onClick={() => {
        if (selectedItemId === `queue-${memberUserId}`) setSelectedItemId(null);
        else setSelectedItemId(`queue-${memberUserId}`);
      }}
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
            id: 'increase-queue-time',
            label: t('increase-queue-time'),
            show: canManageMember,
            onClick: () => handleIncreaseQueueTime(),
          },
          {
            id: 'move-up-queue',
            label: t('move-up-queue'),
            show: canManageMember,
            onClick: () => handleMoveUpQueue(memberUserId, serverId, channelId, memberPosition - 1),
          },
          {
            id: 'move-down-queue',
            label: t('move-down-queue'),
            show: canManageMember,
            onClick: () => handleMoveDownQueue(memberUserId, serverId, channelId, memberPosition + 1),
          },
          {
            id: 'remove-from-queue',
            label: t('remove-from-queue'),
            show: canManageMember,
            onClick: () => handleRemoveFromQueue(memberUserId, serverId, channelId),
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

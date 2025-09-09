import React, { useMemo } from 'react';

// CSS
import styles from '@/styles/pages/server.module.css';
import vip from '@/styles/vip.module.css';
import permission from '@/styles/permission.module.css';

// Types
import { User, QueueMember, Channel, Server } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';
import { useWebRTC } from '@/providers/WebRTC';

// Components
import BadgeList from '@/components/BadgeList';
import LevelIcon from '@/components/LevelIcon';

// Services
import ipc from '@/services/ipc.service';

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

  // Destructuring
  const {
    userId: memberUserId,
    name: memberName,
    permissionLevel: memberPermission,
    nickname: memberNickname,
    level: memberLevel,
    xp: memberXp,
    requiredXp: memberRequiredXp,
    gender: memberGender,
    badges: memberBadges,
    vip: memberVip,
    isTextMuted: memberIsTextMuted,
    isVoiceMuted: memberIsVoiceMuted,
    currentChannelId: memberCurrentChannelId,
    position: memberPosition,
    leftTime: memberLeftTime,
  } = queueMember;
  const { userId, permissionLevel: globalPermission } = user;
  const { serverId, permissionLevel: serverPermission } = server;
  const { channelId, permissionLevel: channelPermission } = channel;

  // Memos
  const permissionLevel = useMemo(() => Math.max(globalPermission, serverPermission, channelPermission), [globalPermission, serverPermission, channelPermission]);
  const connectionStatus = useMemo(() => webRTC.remoteUserStatusList?.[memberUserId] || 'connecting', [memberUserId, webRTC.remoteUserStatusList]);
  const isUser = useMemo(() => memberUserId === userId, [memberUserId, userId]);
  const isSameChannel = useMemo(() => memberCurrentChannelId === channelId, [memberCurrentChannelId, channelId]);
  const isConnecting = useMemo(() => connectionStatus === 'connecting', [connectionStatus]);
  const isSpeaking = useMemo(() => !!webRTC.volumePercent?.[memberUserId], [memberUserId, webRTC.volumePercent]);
  const isVoiceMuted = useMemo(() => webRTC.volumePercent?.[memberUserId] === -1 || webRTC.mutedIds.includes(memberUserId), [memberUserId, webRTC.mutedIds, webRTC.volumePercent]);
  const isSuperior = useMemo(() => permissionLevel > memberPermission, [permissionLevel, memberPermission]);
  const statusIcon = useMemo(() => {
    if (isVoiceMuted || memberIsVoiceMuted) return 'muted';
    if (isSpeaking) return 'play';
    if (memberIsTextMuted) return 'no-text';
    if (!isUser && isSameChannel && isConnecting) return 'loading';
    return '';
  }, [isUser, isSameChannel, isConnecting, isSpeaking, memberIsTextMuted, isVoiceMuted, memberIsVoiceMuted]);

  // Handlers
  const handleIncreaseUserQueueTime = () => {
    ipc.socket.send('increaseUserQueueTime', { serverId, channelId, userId: memberUserId });
  };

  const handleMoveUserQueuePositionDown = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId'], position: number) => {
    ipc.socket.send('moveUserQueuePosition', { serverId, channelId, userId, position });
  };

  const handleMoveUserQueuePositionUp = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId'], position: number) => {
    ipc.socket.send('moveUserQueuePosition', { serverId, channelId, userId, position });
  };

  const handleRemoveUserFromQueue = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId']) => {
    handleOpenAlertDialog(t('confirm-remove-from-queue', { '0': memberName }), () => {
      ipc.socket.send('removeUserFromQueue', { serverId, channelId, userId });
    });
  };

  const handleOpenAlertDialog = (message: string, callback: () => void) => {
    ipc.popup.open('dialogAlert', 'dialogAlert', { message, submitTo: 'dialogAlert' });
    ipc.popup.onSubmit('dialogAlert', callback);
  };

  return (
    <div
      className={`user-info-card-container ${styles['user-tab']} ${selectedItemId === `queue-${memberUserId}` ? styles['selected'] : ''}`}
      onClick={() => {
        if (selectedItemId === `queue-${memberUserId}`) setSelectedItemId(null);
        else setSelectedItemId(`queue-${memberUserId}`);
      }}
      onDoubleClick={(e) => {
        const x = e.currentTarget.getBoundingClientRect().right;
        const y = e.currentTarget.getBoundingClientRect().top;
        contextMenu.showUserInfoBlock(x, y, 'right-bottom', queueMember);
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        const x = e.clientX;
        const y = e.clientY;
        contextMenu.showContextMenu(x, y, 'right-bottom', [
          {
            id: 'increase-queue-time',
            label: t('increase-queue-time'),
            show: isUser || isSuperior,
            onClick: () => handleIncreaseUserQueueTime(),
          },
          {
            id: 'move-up-queue',
            label: t('move-up-queue'),
            show: isUser || isSuperior,
            onClick: () => handleMoveUserQueuePositionUp(memberUserId, serverId, channelId, memberPosition - 1),
          },
          {
            id: 'move-down-queue',
            label: t('move-down-queue'),
            show: isUser || isSuperior,
            onClick: () => handleMoveUserQueuePositionDown(memberUserId, serverId, channelId, memberPosition + 1),
          },
          {
            id: 'remove-from-queue',
            label: t('remove-from-queue'),
            show: isUser || isSuperior,
            onClick: () => handleRemoveUserFromQueue(memberUserId, serverId, channelId),
          },
        ]);
      }}
    >
      <div className={`${styles['user-audio-state']} ${styles[statusIcon]}`} title={memberUserId !== userId ? t('connection-status', { '0': t(`connection-status-${connectionStatus}`) }) : ''} />
      <div className={`${permission[memberGender]} ${permission[`lv-${memberPermission}`]}`} />
      {memberVip > 0 && <div className={`${vip['vip-icon']} ${vip[`vip-${memberVip}`]}`} />}
      <div
        className={`${styles['user-tab-name']} ${memberNickname ? styles['member'] : ''} ${memberVip > 0 ? vip['vip-name-color'] : ''}`}
      >{`${memberPosition + 1}. ${memberNickname || memberName}`}</div>
      <LevelIcon level={memberLevel} xp={memberXp} requiredXp={memberRequiredXp} />
      <BadgeList badges={JSON.parse(memberBadges)} position="left-bottom" direction="right-bottom" maxDisplay={5} />
      {memberPosition === 0 && <div className={styles['queue-seconds-remaining-box']}>{memberLeftTime}s</div>}
      {isUser && <div className={styles['my-location-icon']} />}
    </div>
  );
});

QueueMemberTab.displayName = 'QueueMemberTab';

export default QueueMemberTab;

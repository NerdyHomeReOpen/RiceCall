import React, { useMemo, useRef } from 'react';

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
import BadgeList from '@/components/BadgeList';

// Services
import ipcService from '@/services/ipc.service';

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

  // Memos
  const permissionLevel = useMemo(() => {
    return Math.max(globalPermission, serverPermission, channelPermission);
  }, [globalPermission, serverPermission, channelPermission]);

  const isUser = useMemo(() => {
    return memberUserId === userId;
  }, [memberUserId, userId]);

  const isSameChannel = useMemo(() => {
    return memberCurrentChannelId === channelId;
  }, [memberCurrentChannelId, channelId]);

  const connectionStatus = useMemo(() => {
    return webRTC.remoteUserStatusList?.[memberUserId] || 'connecting';
  }, [memberUserId, webRTC.remoteUserStatusList]);

  const isSpeaking = useMemo(() => {
    return !!webRTC.volumePercent?.[memberUserId];
  }, [memberUserId, webRTC.volumePercent]);

  const isMuted = useMemo(() => {
    return webRTC.volumePercent?.[memberUserId] === -1 || webRTC.mutedIds.includes(memberUserId);
  }, [memberUserId, webRTC.mutedIds, webRTC.volumePercent]);

  const isSuperior = useMemo(() => {
    return permissionLevel > memberPermission;
  }, [permissionLevel, memberPermission]);

  const statusIcon = useMemo(() => {
    if (isMuted) return 'muted';
    if (!isUser && isSameChannel && connectionStatus !== 'connected') return 'loading';
    if (isSpeaking) return 'play';
    return '';
  }, [isUser, isSameChannel, isMuted, isSpeaking, connectionStatus]);

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
            show: isSuperior,
            onClick: () => handleIncreaseQueueTime(),
          },
          {
            id: 'move-up-queue',
            label: t('move-up-queue'),
            show: isSuperior,
            onClick: () => handleMoveUpQueue(memberUserId, serverId, channelId, memberPosition - 1),
          },
          {
            id: 'move-down-queue',
            label: t('move-down-queue'),
            show: isSuperior,
            onClick: () => handleMoveDownQueue(memberUserId, serverId, channelId, memberPosition + 1),
          },
          {
            id: 'remove-from-queue',
            label: t('remove-from-queue'),
            show: isSuperior,
            onClick: () => handleRemoveFromQueue(memberUserId, serverId, channelId),
          },
        ]);
      }}
    >
      <div className={`${styles['user-audio-state']} ${styles[statusIcon]}`} title={memberUserId !== userId ? t('connection-status', { '0': t(`connection-status-${connectionStatus}`) }) : ''} />
      <div className={`${permission[memberGender]} ${permission[`lv-${memberPermission}`]}`} />
      {memberVip > 0 && <div className={`${vip['vip-icon']} ${vip[`vip-${memberVip}`]}`} />}
      <div className={`${styles['user-tab-name']} ${memberNickname ? styles['member'] : ''} ${memberVip > 0 ? vip['vip-name-color'] : ''}`}>{memberNickname || memberName}</div>
      <div className={`${grade['grade']} ${grade[`lv-${Math.min(56, memberLevel)}`]}`} style={{ cursor: 'default' }} />
      <BadgeList badges={JSON.parse(memberBadges)} maxDisplay={5} />
      {memberPosition === 0 && <div className={styles['queue-seconds-remaining-box']}>{memberLeftTime}s</div>}
      {isUser && <div className={styles['my-location-icon']} />}
    </div>
  );
});

QueueMemberTab.displayName = 'QueueMemberTab';

export default QueueMemberTab;

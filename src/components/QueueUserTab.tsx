import React, { useEffect, useRef, useState } from 'react';

// CSS
import styles from '@/styles/pages/server.module.css';
import grade from '@/styles/grade.module.css';
import vip from '@/styles/vip.module.css';
import permission from '@/styles/permission.module.css';

// Types
import { PopupType, Channel, User, UserServer, QueueUser } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useSocket } from '@/providers/Socket';
import { useContextMenu } from '@/providers/ContextMenu';
import { useWebRTC } from '@/providers/WebRTC';

// Components
import BadgeListViewer from '@/components/BadgeList';

// Services
import ipcService from '@/services/ipc.service';

interface QueueUserTabProps {
  queueUser: QueueUser;
  currentChannel: Channel;
  currentServer: UserServer; 
  totalUsersInQueue: number;
}

const QueueUserTab: React.FC<QueueUserTabProps> = React.memo(({ queueUser, currentChannel, currentServer, totalUsersInQueue}) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();
  const socket = useSocket();
  const webRTC = useWebRTC();

  // States
  const [secondsRemaining, setSecondsRemaining] = useState(currentChannel.queueSecs);

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
    currentServerId: memberCurrentServerId,
    queueSince: memberSince,
    queueUntil: memberUntil,
    queueJoined: memberQueueJoined,
    queuePosition: memberPosition
  } = queueUser;
  const { userId, serverId, permissionLevel: userPermission, lobbyId: serverLobbyId } = currentServer;
  const { channelId: currentChannelId } = currentChannel;
  const isCurrentUser = memberUserId === userId;
  const isSameChannel = memberCurrentChannelId === currentChannelId;
  const speakingStatus = webRTC.speakStatus?.[memberUserId] || (isCurrentUser && webRTC.volumePercent) || 0;
  const connectionStatus = webRTC.connectionStatus?.[memberUserId];
  const isLoading = connectionStatus === 'connecting' || connectionStatus === 'failed' || connectionStatus === 'closed' || !connectionStatus;
  const isSpeaking = speakingStatus !== 0;
  const isMuted = speakingStatus === -1;
  const isMutedByUser = webRTC.muteList.includes(memberUserId);
  const canManageMember = !isCurrentUser && userPermission > 2 && userPermission >= memberPermission;  
  const canMoveToSecondPosition = canManageMember && memberPosition >= 3;
  const canMoveDown = canManageMember && memberPosition > 1 && (memberPosition < totalUsersInQueue);
  const canMoveUp = canManageMember && memberPosition > 2;

  const statusIcon = () => {
    if (isMuted || isMutedByUser) return 'muted';
    if (!isCurrentUser && isSameChannel && isLoading) return 'loading';
    if (isSpeaking) return 'play';
    return '';
  };

  // Handlers 
  const handleOpenDirectMessage = (userId: User['userId'], targetId: User['userId'], targetName: User['name']) => {
    ipcService.popup.open(PopupType.DIRECT_MESSAGE, `directMessage-${targetId}`);
    ipcService.initialData.onRequest(`directMessage-${targetId}`, { userId, targetId, targetName });
  };

  const handleOpenUserInfo = (userId: User['userId'], targetId: User['userId']) => {
    ipcService.popup.open(PopupType.USER_INFO, `userInfo-${targetId}`);
    ipcService.initialData.onRequest(`userInfo-${targetId}`, { userId, targetId });
  };

  const handleMoveDown = (targetId: User['userId']) => {
    if (!socket) return;
    socket.send.moveToQueuePosition({serverId, channelId: currentChannelId, targetId, position: memberPosition + 1});
  };

  const handleMoveUp = (targetId: User['userId']) => {
    if (!socket) return;
    socket.send.moveToQueuePosition({serverId, channelId: currentChannelId, targetId, position: memberPosition - 1});
  };

  const handleMoveSecondPosition = (targetId: User['userId']) => {
    if (!socket) return;
    socket.send.moveToQueuePosition({serverId, channelId: currentChannelId,  targetId, position: 2});
  };

  const handleDeleteFromQueueConfirm = (targetId: User['userId']) => {
      handleOpenAlertDialog(t('confirm-remove-from-queue', { '0': memberName }), () => {
        handleDeleteFromQueue(targetId);
      });   
  };

  const handleDeleteFromQueue = (targetId: User['userId']) => {
      if (!socket) return;
      socket.send.deleteFromQueue({serverId, channelId: currentChannelId, targetId});
  };


  const handleOpenAlertDialog = (message: string, callback: () => void) => {
    ipcService.popup.open(PopupType.DIALOG_ALERT, 'alertDialog');
    ipcService.initialData.onRequest('alertDialog', { message, submitTo: 'alertDialog' });
    ipcService.popup.onSubmit('alertDialog', callback);
  };  

  //Effects
    useEffect(() => {
    const interval = setInterval(() => {
         setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval); // limpiar al desmontar
    }, []);

    useEffect(() => {
        if (memberPosition === 1) {
            setSecondsRemaining(currentChannel.queueSecs);
        }
    }, [memberPosition]);

  return (
    <div
      ref={userTabRef}
      key={memberUserId}
      className={`context-menu-container ${styles['user-tab']} ${styles['selected']}`}
      onDoubleClick={() => {
        if (!userTabRef.current) return;
        const x = userTabRef.current.getBoundingClientRect().left + userTabRef.current.getBoundingClientRect().width;
        const y = userTabRef.current.getBoundingClientRect().top;
        contextMenu.showUserInfoBlock(x, y, false, queueUser);
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
            onClick: () => handleDeleteFromQueueConfirm(memberUserId),
          }
        ]);
      }}
    >      
      <div className={`${styles['user-audio-state']} ${styles[statusIcon()]}`} title={!isCurrentUser ? t('connection-status', { '0': t(`connection-status-${connectionStatus}`) }) : ''} />
      <div className={styles['queue-position']}>{memberPosition}.</div>
      <div className={`${permission[memberGender]} ${permission[`lv-${memberPermission}`]}`} />
      {memberVip > 0 && <div className={`${vip['vip-icon']} ${vip[`vip-${memberVip}`]}`} />}
      <div className={`${styles['user-tab-name']} ${memberNickname ? styles['member'] : ''} ${memberVip > 0 ? vip['vip-name-color'] : ''}`}>{memberNickname || memberName}</div>
      <div className={`${grade['grade']} ${grade[`lv-${Math.min(56, memberLevel)}`]}`} style={{ cursor: 'default' }} />
      <BadgeListViewer badges={memberBadges} maxDisplay={5} />

      {memberPosition === 1 && <div className={styles['queue-seconds-remaining-box']}>{secondsRemaining}</div>}

      {isCurrentUser && <div className={styles['my-location-icon']} />}
    </div>
  );
});

QueueUserTab.displayName = 'QueueUserTab';

export default QueueUserTab;

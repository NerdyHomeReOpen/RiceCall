import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import * as Types from '@/types';

import * as ipc from '@/main/ipc';

import { leaveQueue, joinQueue } from '@/services';

import { useWebRTC } from '@/providers/WebRTC';
import { useContextMenu } from '@/providers/ContextMenu';

import { useAppSelector } from '@/hooks/useStore';

import styles from './Server.module.css';

const MicButton: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const { showMicContextMenu } = useContextMenu();
  const { takeMic, releaseMic, stopMixing } = useWebRTC();

  const userId = useAppSelector((state) => state.user.data.userId);
  const userPermissionLevel = useAppSelector((state) => state.user.data.permissionLevel);
  const currentServerId = useAppSelector((state) => state.currentServer.data.serverId);
  const currentServerPermissionLevel = useAppSelector((state) => state.currentServer.data.permissionLevel);
  const currentChannelId = useAppSelector((state) => state.currentChannel.data.channelId);
  const currentChannelPermissionLevel = useAppSelector((state) => state.currentChannel.data.permissionLevel);
  const currentChannelVoiceMode = useAppSelector((state) => state.currentChannel.data.voiceMode);
  const currentChannelIsVoiceMuted = useAppSelector((state) => state.currentChannel.data.isVoiceMuted);
  const queuePosition = useAppSelector((state) => state.queueUsers.data.find((q) => q.userId === userId)?.position);
  const isQueueControlled = useAppSelector((state) => state.queueUsers.data.some((q) => q.isQueueControlled));
  const isSpeakKeyPressed = useAppSelector((state) => state.webrtc.isSpeakKeyPressed);
  const isMixModeActive = useAppSelector((state) => state.webrtc.isMixModeActive);
  const isMicMuted = useAppSelector((state) => state.webrtc.isMicMuted);
  const volumeLevel = useAppSelector((state) => state.webrtc.volumeLevel);

  const [speakingMode, setSpeakingMode] = useState<Types.SpeakingMode>('key');
  const [speakingKey, setSpeakingKey] = useState<string>('');

  const permissionLevel = Math.max(userPermissionLevel, currentServerPermissionLevel, currentChannelPermissionLevel);
  const isCurrentChannelQueueMode = currentChannelVoiceMode === 'queue';
  const isControlled = permissionLevel < Types.Permission.ChannelMod && isQueueControlled;
  const isQueuing = queuePosition !== undefined && queuePosition > 0;
  const isMicTaken = queuePosition !== undefined && queuePosition <= 0;
  const isIdling = !isMicTaken && !isQueuing;

  const getMicText = () => {
    if (isMicTaken) return t('mic-taken');
    if (isQueuing) return t('mic-queued');
    return t('take-mic');
  };

  const getMicSubText = () => {
    if (isIdling) return '';
    if (isQueuing) return t('in-queue-position', { '0': queuePosition });
    if (currentChannelIsVoiceMuted) return t('mic-forbidden');
    if (isControlled) return t('mic-controlled');
    if (speakingMode === 'key' && !isSpeakKeyPressed) {
      return t('press-key-to-speak', { '0': speakingKey });
    }
    if (isMixModeActive) return t('speaking-with-mix');
    if (isMicMuted) return t('mic-muted');
    return t('speaking');
  };

  const getMicBtnClass = () => {
    let className = styles['mic-button'];
    if (isMicTaken) className += ` ${styles['speaking']}`;
    if (isQueuing) className += ` ${styles['queuing']}`;
    if (currentChannelIsVoiceMuted || isControlled) className += ` ${styles['muted']}`;
    if (!isCurrentChannelQueueMode || (permissionLevel < Types.Permission.ChannelMod && isIdling)) className += ` ${styles['no-selection']}`;
    return className;
  };

  const handleMicBtnClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isCurrentChannelQueueMode) {
      if (!isIdling) {
        const { left: x, top: y } = e.currentTarget.getBoundingClientRect();
        showMicContextMenu(x, y, 'right-top', [
          {
            id: 'untake-mic',
            label: t('untake-mic'),
            show: isCurrentChannelQueueMode,
            onClick: () => leaveQueue(currentServerId, currentChannelId),
          },
        ]);
      } else if (permissionLevel >= Types.Permission.ChannelMod) {
        const { left: x, top: y } = e.currentTarget.getBoundingClientRect();
        showMicContextMenu(x, y, 'right-top', [
          {
            id: 'take-mic-in-queue',
            label: t('take-mic-in-queue'),
            show: isCurrentChannelQueueMode,
            onClick: () => joinQueue(currentServerId, currentChannelId),
          },
          {
            id: 'separator',
            label: '',
          },
          {
            id: 'take-mic-directly',
            label: t('take-mic-directly'),
            show: isCurrentChannelQueueMode,
            onClick: () => joinQueue(currentServerId, currentChannelId, -2),
          },
        ]);
      } else {
        joinQueue(currentServerId, currentChannelId);
      }
    } else {
      if (isMicTaken) {
        leaveQueue(currentServerId, currentChannelId);
      } else {
        joinQueue(currentServerId, currentChannelId);
      }
    }
  };

  useEffect(() => {
    if (isMicTaken && !isControlled) takeMic(currentChannelId);
    else releaseMic();
    stopMixing();
  }, [isMicTaken, isControlled, currentChannelId, takeMic, releaseMic, stopMixing]);

  useEffect(() => {
    const changeSpeakingMode = (speakingMode: Types.SpeakingMode) => {
      setSpeakingMode(speakingMode);
    };
    const changeDefaultSpeakingKey = (key: string) => {
      setSpeakingKey(key);
    };
    changeSpeakingMode(ipc.systemSettings.speakingMode.get());
    changeDefaultSpeakingKey(ipc.systemSettings.defaultSpeakingKey.get());
    const unsubs = [ipc.systemSettings.speakingMode.onUpdate(changeSpeakingMode), ipc.systemSettings.defaultSpeakingKey.onUpdate(changeDefaultSpeakingKey)];
    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  return (
    <div className={getMicBtnClass()} onClick={handleMicBtnClick}>
      <div className={`${styles['mic-button-icon']} ${isMicTaken ? styles[`level${volumeLevel}`] : ''}`} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className={styles['mic-button-text']} style={{ fontSize: isIdling ? '1.3rem' : '1.1rem' }}>
          {getMicText()}
        </div>
        <div className={styles['mic-button-sub-text']}>{getMicSubText()}</div>
      </div>
    </div>
  );
});

MicButton.displayName = 'MicButton';

export default MicButton;

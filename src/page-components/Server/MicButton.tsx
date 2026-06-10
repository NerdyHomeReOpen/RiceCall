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
  const permissionLevel = useAppSelector((state) => Math.max(state.user.data.permissionLevel, state.currentServer.data.permissionLevel, state.currentChannel.data.permissionLevel));
  const currentServerId = useAppSelector((state) => state.currentServer.data.serverId);
  const currentChannelId = useAppSelector((state) => state.currentChannel.data.channelId);
  const currentChannelVoiceMode = useAppSelector((state) => state.currentChannel.data.voiceMode);
  const currentChannelIsVoiceMuted = useAppSelector((state) => state.currentChannel.data.isVoiceMuted);
  const queuePosition = useAppSelector((state) => state.queueUsers.data.find((q) => q.userId === userId)?.position);
  const queueIsControlled = useAppSelector((state) => state.queueUsers.data.some((q) => q.isQueueControlled));
  const speakKeyIsPressed = useAppSelector((state) => state.webrtc.speakKeyIsPressed);
  const mixModeIsActive = useAppSelector((state) => state.webrtc.mixModeIsActive);
  const micIsMuted = useAppSelector((state) => state.webrtc.micIsMuted);
  const volumeLevel = useAppSelector((state) => state.webrtc.volumeLevel);

  const [speakingMode, setSpeakingMode] = useState<Types.SpeakingMode>('key');
  const [speakingKey, setSpeakingKey] = useState<string>('');

  const currentChannelIsQueueMode = currentChannelVoiceMode === 'queue';
  const userIsControlled = permissionLevel < Types.Permission.ChannelMod && queueIsControlled;
  const userIsQueuing = queuePosition !== undefined && queuePosition > 0;
  const userIsSpeaking = queuePosition !== undefined && queuePosition <= 0;
  const userIsIdle = !userIsSpeaking && !userIsQueuing;

  const getMicText = () => {
    if (userIsSpeaking) return t('mic-taken');
    if (userIsQueuing) return t('mic-queued');
    return t('take-mic');
  };

  const getMicSubText = () => {
    if (userIsIdle) return '';
    if (userIsQueuing) return t('in-queue-position', { '0': queuePosition });
    if (currentChannelIsVoiceMuted) return t('mic-forbidden');
    if (userIsControlled) return t('mic-controlled');
    if (speakingMode === 'key' && !speakKeyIsPressed) return t('press-key-to-speak', { '0': speakingKey });
    if (mixModeIsActive) return t('speaking-with-mix');
    if (micIsMuted) return t('mic-muted');
    return t('speaking');
  };

  const getMicBtnClass = () => {
    let className = styles['mic-button'];
    if (userIsSpeaking) className += ` ${styles['speaking']}`;
    if (userIsQueuing) className += ` ${styles['queuing']}`;
    if (currentChannelIsVoiceMuted || userIsControlled) className += ` ${styles['muted']}`;
    if (!currentChannelIsQueueMode || (permissionLevel < Types.Permission.ChannelMod && userIsIdle)) className += ` ${styles['no-selection']}`;
    return className;
  };

  const handleMicBtnClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (currentChannelIsQueueMode) {
      if (!userIsIdle) {
        const { left: x, top: y } = e.currentTarget.getBoundingClientRect();

        showMicContextMenu(x, y, 'right-top', [
          {
            id: 'untake-mic',
            label: t('untake-mic'),
            show: currentChannelIsQueueMode,
            onClick: () => leaveQueue(currentServerId, currentChannelId),
          },
        ]);
      } else if (permissionLevel >= Types.Permission.ChannelMod) {
        const { left: x, top: y } = e.currentTarget.getBoundingClientRect();

        showMicContextMenu(x, y, 'right-top', [
          {
            id: 'take-mic-in-queue',
            label: t('take-mic-in-queue'),
            show: currentChannelIsQueueMode,
            onClick: () => joinQueue(currentServerId, currentChannelId),
          },
          {
            id: 'separator',
            label: '',
          },
          {
            id: 'take-mic-directly',
            label: t('take-mic-directly'),
            show: currentChannelIsQueueMode,
            onClick: () => joinQueue(currentServerId, currentChannelId, -2),
          },
        ]);
      } else {
        joinQueue(currentServerId, currentChannelId);
      }
    } else {
      if (userIsSpeaking) {
        leaveQueue(currentServerId, currentChannelId);
      } else {
        joinQueue(currentServerId, currentChannelId);
      }
    }
  };

  useEffect(() => {
    if (userIsSpeaking && !userIsControlled) {
      takeMic(currentChannelId);
    } else {
      releaseMic();
    }

    stopMixing();
  }, [userIsSpeaking, userIsControlled, currentChannelId, takeMic, releaseMic, stopMixing]);

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
      <div className={`${styles['mic-button-icon']} ${userIsSpeaking ? styles[`level${volumeLevel}`] : ''}`} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className={styles['mic-button-text']} style={{ fontSize: userIsIdle ? '1.3rem' : '1.1rem' }}>
          {getMicText()}
        </div>
        <div className={styles['mic-button-sub-text']}>{getMicSubText()}</div>
      </div>
    </div>
  );
});

MicButton.displayName = 'MicButton';

export default MicButton;

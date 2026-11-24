import React, { useState, useEffect } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';
import { Permission } from '@/types';

import * as ipc from '@/main/ipc';

import { leaveQueue, joinQueue } from '@/services';

import { useWebRTC } from '@/providers/WebRTC';
import { useContextMenu } from '@/providers/ContextMenu';

import { useAppSelector } from '@/hooks/useStore';

const VOLUME_LEVEL_POSITIONS: Record<number, string> = {
  1: 'bg-[position:-24px_0]',
  2: 'bg-[position:-48px_0]',
  3: 'bg-[position:-72px_0]',
  4: 'bg-[position:-96px_0]',
  5: 'bg-[position:-120px_0]',
  6: 'bg-[position:-144px_0]',
  7: 'bg-[position:-168px_0]',
  8: 'bg-[position:-192px_0]',
  9: 'bg-[position:-216px_0]',
};

const MicButton: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const { showMicContextMenu } = useContextMenu();
  const { takeMic, releaseMic, stopMixing } = useWebRTC();

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
    }),
    shallowEqual,
  );

  const currentChannel = useAppSelector(
    (state) => ({
      channelId: state.currentChannel.data.channelId,
      permissionLevel: state.currentChannel.data.permissionLevel,
      voiceMode: state.currentChannel.data.voiceMode,
      isVoiceMuted: state.currentChannel.data.isVoiceMuted,
    }),
    shallowEqual,
  );

  const queuePosition = useAppSelector((state) => state.queueUsers.data.find((q) => q.userId === user.userId)?.position, shallowEqual);
  const isQueueControlled = useAppSelector((state) => state.queueUsers.data.some((q) => q.isQueueControlled), shallowEqual);
  const isSpeakKeyPressed = useAppSelector((state) => state.webrtc.isSpeakKeyPressed, shallowEqual);
  const isMixModeActive = useAppSelector((state) => state.webrtc.isMixModeActive, shallowEqual);
  const isMicMuted = useAppSelector((state) => state.webrtc.isMicMuted, shallowEqual);
  const volumeLevel = useAppSelector((state) => state.webrtc.volumeLevel, shallowEqual);
  const [speakingMode, setSpeakingMode] = useState<Types.SpeakingMode>('key');
  const [speakingKey, setSpeakingKey] = useState<string>('');
  const permissionLevel = Math.max(user.permissionLevel, currentServer.permissionLevel, currentChannel.permissionLevel);
  const isCurrentChannelQueueMode = currentChannel.voiceMode === 'queue';
  const isControlled = permissionLevel < Permission.ChannelMod && isQueueControlled;
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
    if (currentChannel.isVoiceMuted) return t('mic-forbidden');
    if (isControlled) return t('mic-controlled');

    if (speakingMode === 'key' && !isSpeakKeyPressed) {
      return t('press-key-to-speak', { '0': speakingKey });
    }

    if (isMixModeActive) return t('speaking-with-mix');
    if (isMicMuted) return t('mic-muted');
    return t('speaking');
  };

  const isMicMutedByChannel = currentChannel.isVoiceMuted || isControlled;
  const isSelectionHidden = !isCurrentChannelQueueMode || (permissionLevel < Permission.ChannelMod && isIdling);

  const getMicBtnClass = () => {
    let className =
      "flex items-center justify-between min-w-[154px] max-w-[154px] min-h-[50px] max-h-[50px] px-[10px] font-[Arial,Helvetica,sans-serif] cursor-pointer bg-no-repeat bg-[position:0_2px] bg-auto hover:bg-[position:-154px_2px] active:bg-[position:-308px_2px] after:block after:min-w-[11px] after:min-h-[7px] after:cursor-pointer after:content-[''] after:bg-no-repeat";

    if (isMicTaken) className += " bg-[url('/channel/mic_state_speaking.svg')] after:bg-[position:-22px_0]";
    else if (isQueuing) className += " bg-[url('/channel/mic_state_queuing.svg')] after:bg-[position:-11px_0]";
    else className += " bg-[url('/channel/mic_state_menu.svg')] after:bg-[position:0_0]";

    className += isSelectionHidden ? ' after:bg-none' : " after:bg-[url('/channel/icon_mic_triangle.svg')]";
    return className;
  };

  const getMicIconClass = () => {
    let className = 'min-w-[24px] min-h-[30px] bg-no-repeat bg-cover';

    if (isMicTaken && !isMicMutedByChannel) className += ` bg-[url('/channel/icon_speaking_vol.svg')] ${VOLUME_LEVEL_POSITIONS[volumeLevel] ?? ''}`;
    else if (isMicMutedByChannel) className += " bg-[url('/channel/icon_mic_state.svg')] bg-[position:-72px_0]";
    else if (isQueuing) className += " bg-[url('/channel/icon_mic_state.svg')] bg-[position:-24px_0]";
    else className += " bg-[url('/channel/icon_mic_state.svg')]";

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
            onClick: () => leaveQueue(currentServer.serverId, currentChannel.channelId),
          },
        ]);
      } else if (permissionLevel >= Permission.ChannelMod) {
        const { left: x, top: y } = e.currentTarget.getBoundingClientRect();

        showMicContextMenu(x, y, 'right-top', [
          {
            id: 'take-mic-in-queue',
            label: t('take-mic-in-queue'),
            show: isCurrentChannelQueueMode,
            onClick: () => joinQueue(currentServer.serverId, currentChannel.channelId),
          },
          {
            id: 'separator',
            label: '',
          },
          {
            id: 'take-mic-directly',
            label: t('take-mic-directly'),
            show: isCurrentChannelQueueMode,
            onClick: () => joinQueue(currentServer.serverId, currentChannel.channelId, -2),
          },
        ]);
      } else {
        joinQueue(currentServer.serverId, currentChannel.channelId);
      }
    } else {
      if (isMicTaken) {
        leaveQueue(currentServer.serverId, currentChannel.channelId);
      } else {
        joinQueue(currentServer.serverId, currentChannel.channelId);
      }
    }
  };

  useEffect(() => {
    if (isMicTaken && !isControlled) takeMic(currentChannel.channelId);
    else releaseMic();

    stopMixing();
  }, [isMicTaken, isControlled, currentChannel.channelId, takeMic, releaseMic, stopMixing]);

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
      <div className={getMicIconClass()} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className={isMicTaken ? 'text-[#62a35b]' : isQueuing ? 'text-[#dda11e]' : 'text-[#2594ca]'} style={{ fontSize: isIdling ? '1.3rem' : '1.1rem' }}>
          {getMicText()}
        </div>
        <div className="text-[12px] text-[#777]">{getMicSubText()}</div>
      </div>
    </div>
  );
});

MicButton.displayName = 'MicButton';

export default MicButton;

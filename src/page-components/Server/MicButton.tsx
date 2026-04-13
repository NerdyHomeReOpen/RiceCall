import React, { useState, useEffect } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';
import { Permission } from '@/types';

import ipc from '@/main/ipc';

import * as Actions from '@/action';

import { useWebRTC } from '@/providers/WebRTC';
import { useContextMenu } from '@/providers/ContextMenu';

import { useAppSelector } from '@/hooks/Store';

import styles from './Server.module.css';

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

    const getMicBtnClass = () => {
        let className = styles['mic-button'];
        if (isMicTaken) className += ` ${styles['speaking']}`;
        if (isQueuing) className += ` ${styles['queuing']}`;
        if (currentChannel.isVoiceMuted || isControlled) className += ` ${styles['muted']}`;
        if (!isCurrentChannelQueueMode || (permissionLevel < Permission.ChannelMod && isIdling)) className += ` ${styles['no-selection']}`;
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
                        onClick: () => Actions.leaveQueue(currentServer.serverId, currentChannel.channelId),
                    },
                ]);
            } else if (permissionLevel >= Permission.ChannelMod) {
                const { left: x, top: y } = e.currentTarget.getBoundingClientRect();
                showMicContextMenu(x, y, 'right-top', [
                    {
                        id: 'take-mic-in-queue',
                        label: t('take-mic-in-queue'),
                        show: isCurrentChannelQueueMode,
                        onClick: () => Actions.joinQueue(currentServer.serverId, currentChannel.channelId),
                    },
                    {
                        id: 'separator',
                        label: '',
                    },
                    {
                        id: 'take-mic-directly',
                        label: t('take-mic-directly'),
                        show: isCurrentChannelQueueMode,
                        onClick: () => Actions.joinQueue(currentServer.serverId, currentChannel.channelId, -2),
                    },
                ]);
            } else {
                Actions.joinQueue(currentServer.serverId, currentChannel.channelId);
            }
        } else {
            if (isMicTaken) {
                Actions.leaveQueue(currentServer.serverId, currentChannel.channelId);
            } else {
                Actions.joinQueue(currentServer.serverId, currentChannel.channelId);
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
        const unsubs = [
            ipc.systemSettings.speakingMode.onUpdate(changeSpeakingMode),
            ipc.systemSettings.defaultSpeakingKey.onUpdate(changeDefaultSpeakingKey),
        ];
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
import React, { createContext, ReactNode, useContext, useEffect, useRef, useCallback, useMemo } from 'react';

import * as ipc from '@/main/ipc';

import Logger from '@/utils/logger';

interface SoundPlayerContextType {
  playSound: (sound: 'enterVoiceChannel' | 'leaveVoiceChannel' | 'receiveChannelMessage' | 'receiveDirectMessage' | 'startSpeaking' | 'stopSpeaking', force?: boolean) => void;
}

const SoundPlayerContext = createContext<SoundPlayerContextType | null>(null);

export const useSoundPlayer = (): SoundPlayerContextType => {
  const context = useContext(SoundPlayerContext);
  if (!context) throw new Error('useSoundPlayer must be used within a SoundEffectProvider');
  return context;
};

interface SoundPlayerProviderProps {
  children: ReactNode;
}

const SoundPlayerProvider = ({ children }: SoundPlayerProviderProps): React.JSX.Element => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const disableAllSoundEffectRef = useRef(false);
  const isEnterVoiceChannelSoundEnabledRef = useRef(false);
  const isLeaveVoiceChannelSoundEnabledRef = useRef(false);
  const isStartSpeakingSoundEnabledRef = useRef(false);
  const isStopSpeakingSoundEnabledRef = useRef(false);
  const isReceiveDirectMessageSoundEnabledRef = useRef(false);
  const isReceiveChannelMessageSoundEnabledRef = useRef(false);
  const outputDeviceIdRef = useRef<string | null>(null);

  const playSound = useCallback((sound: 'enterVoiceChannel' | 'leaveVoiceChannel' | 'receiveChannelMessage' | 'receiveDirectMessage' | 'startSpeaking' | 'stopSpeaking', force?: boolean) => {
    new Logger('SOUND_PLAYER').info(`Play sound: ${sound} in ${window.location.href}`);

    if (disableAllSoundEffectRef.current && !force) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (sound === 'enterVoiceChannel') {
      if (!isEnterVoiceChannelSoundEnabledRef.current && !force) return;
      audioRef.current = new Audio('/sounds/JoinVoiceChannel.mp3');
      audioRef.current.setSinkId(outputDeviceIdRef.current || '');
      audioRef.current.volume = 0.5;
      audioRef.current.play();
    }
    if (sound === 'leaveVoiceChannel') {
      if (!isLeaveVoiceChannelSoundEnabledRef.current && !force) return;
      audioRef.current = new Audio('/sounds/LeaveVoiceChannel.mp3');
      audioRef.current.setSinkId(outputDeviceIdRef.current || '');
      audioRef.current.volume = 0.5;
      audioRef.current.play();
    }
    if (sound === 'receiveChannelMessage') {
      if (!isReceiveChannelMessageSoundEnabledRef.current && !force) return;
      audioRef.current = new Audio('/sounds/ReceiveChannelMsg.mp3');
      audioRef.current.setSinkId(outputDeviceIdRef.current || '');
      audioRef.current.volume = 0.5;
      audioRef.current.play();
    }
    if (sound === 'receiveDirectMessage') {
      if (!isReceiveDirectMessageSoundEnabledRef.current && !force) return;
      audioRef.current = new Audio('/sounds/ReceiveDirectMsg.mp3');
      audioRef.current.setSinkId(outputDeviceIdRef.current || '');
      audioRef.current.volume = 0.5;
      audioRef.current.play();
    }
    if (sound === 'startSpeaking') {
      if (!isStartSpeakingSoundEnabledRef.current && !force) return;
      audioRef.current = new Audio('/sounds/MicKeyDown.mp3');
      audioRef.current.setSinkId(outputDeviceIdRef.current || '');
      audioRef.current.volume = 0.5;
      audioRef.current.play();
    }
    if (sound === 'stopSpeaking') {
      if (!isStopSpeakingSoundEnabledRef.current && !force) return;
      audioRef.current = new Audio('/sounds/MicKeyUp.mp3');
      audioRef.current.setSinkId(outputDeviceIdRef.current || '');
      audioRef.current.volume = 0.5;
      audioRef.current.play();
    }
  }, []);

  useEffect(() => {
    const changeOutputAudioDevice = (deviceId: string) => {
      new Logger('SOUND_PLAYER').info(`Output device updated: ${deviceId}`);
      outputDeviceIdRef.current = deviceId || null;
    };
    const changeDisableAllSoundEffect = (enabled: boolean) => {
      new Logger('SOUND_PLAYER').info(`Disable all sound effect updated: ${enabled}`);
      disableAllSoundEffectRef.current = enabled;
    };
    const changeIsEnterVoiceChannelSoundEnabled = (enabled: boolean) => {
      new Logger('SOUND_PLAYER').info(`Enter voice channel sound updated: ${enabled}`);
      isEnterVoiceChannelSoundEnabledRef.current = enabled;
    };
    const changeIsLeaveVoiceChannelSoundEnabled = (enabled: boolean) => {
      new Logger('SOUND_PLAYER').info(`Leave voice channel sound updated: ${enabled}`);
      isLeaveVoiceChannelSoundEnabledRef.current = enabled;
    };
    const changeIsStartSpeakingSoundEnabled = (enabled: boolean) => {
      new Logger('SOUND_PLAYER').info(`Start speaking sound updated: ${enabled}`);
      isStartSpeakingSoundEnabledRef.current = enabled;
    };
    const changeIsStopSpeakingSoundEnabled = (enabled: boolean) => {
      new Logger('SOUND_PLAYER').info(`Stop speaking sound updated: ${enabled}`);
      isStopSpeakingSoundEnabledRef.current = enabled;
    };
    const changeIsReceiveDirectMessageSoundEnabled = (enabled: boolean) => {
      new Logger('SOUND_PLAYER').info(`Receive direct message sound updated: ${enabled}`);
      isReceiveDirectMessageSoundEnabledRef.current = enabled;
    };
    const changeIsReceiveChannelMessageSoundEnabled = (enabled: boolean) => {
      new Logger('SOUND_PLAYER').info(`Receive channel message sound updated: ${enabled}`);
      isReceiveChannelMessageSoundEnabledRef.current = enabled;
    };

    changeOutputAudioDevice(ipc.systemSettings.outputAudioDevice.get());
    changeDisableAllSoundEffect(ipc.systemSettings.disableAllSoundEffect.get());
    changeIsEnterVoiceChannelSoundEnabled(ipc.systemSettings.isEnterVoiceChannelSoundEnabled.get());
    changeIsLeaveVoiceChannelSoundEnabled(ipc.systemSettings.isLeaveVoiceChannelSoundEnabled.get());
    changeIsStartSpeakingSoundEnabled(ipc.systemSettings.isStartSpeakingSoundEnabled.get());
    changeIsStopSpeakingSoundEnabled(ipc.systemSettings.isStopSpeakingSoundEnabled.get());
    changeIsReceiveDirectMessageSoundEnabled(ipc.systemSettings.isReceiveDirectMessageSoundEnabled.get());
    changeIsReceiveChannelMessageSoundEnabled(ipc.systemSettings.isReceiveChannelMessageSoundEnabled.get());

    const unsubs = [
      ipc.systemSettings.outputAudioDevice.onUpdate(changeOutputAudioDevice),
      ipc.systemSettings.disableAllSoundEffect.onUpdate(changeDisableAllSoundEffect),
      ipc.systemSettings.isEnterVoiceChannelSoundEnabled.onUpdate(changeIsEnterVoiceChannelSoundEnabled),
      ipc.systemSettings.isLeaveVoiceChannelSoundEnabled.onUpdate(changeIsLeaveVoiceChannelSoundEnabled),
      ipc.systemSettings.isStartSpeakingSoundEnabled.onUpdate(changeIsStartSpeakingSoundEnabled),
      ipc.systemSettings.isStopSpeakingSoundEnabled.onUpdate(changeIsStopSpeakingSoundEnabled),
      ipc.systemSettings.isReceiveDirectMessageSoundEnabled.onUpdate(changeIsReceiveDirectMessageSoundEnabled),
      ipc.systemSettings.isReceiveChannelMessageSoundEnabled.onUpdate(changeIsReceiveChannelMessageSoundEnabled),
    ];
    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  const contextValue = useMemo(() => ({ playSound }), [playSound]);

  return <SoundPlayerContext.Provider value={contextValue}>{children}</SoundPlayerContext.Provider>;
};

SoundPlayerProvider.displayName = 'SoundPlayerProvider';

export default SoundPlayerProvider;

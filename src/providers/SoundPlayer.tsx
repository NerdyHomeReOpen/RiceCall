import { createContext, ReactNode, useContext, useEffect, useRef } from 'react';
import ipc from '@/ipc';

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

const SoundPlayerProvider = ({ children }: SoundPlayerProviderProps) => {
  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const disableAllSoundEffectRef = useRef(false);
  const enterVoiceChannelSoundRef = useRef(false);
  const leaveVoiceChannelSoundRef = useRef(false);
  const startSpeakingSoundRef = useRef(false);
  const stopSpeakingSoundRef = useRef(false);
  const receiveDirectMessageSoundRef = useRef(false);
  const receiveChannelMessageSoundRef = useRef(false);
  const outputDeviceIdRef = useRef<string | null>(null);

  const playSound = (sound: 'enterVoiceChannel' | 'leaveVoiceChannel' | 'receiveChannelMessage' | 'receiveDirectMessage' | 'startSpeaking' | 'stopSpeaking', force?: boolean) => {
    new Logger('SoundPlayer').info(`play sound: ${sound}, force: ${force}`);

    if (disableAllSoundEffectRef.current && !force) return;

    if (audioRef.current) {
      audioRef.current = null;
    }

    if (sound === 'enterVoiceChannel') {
      if (!enterVoiceChannelSoundRef.current && !force) return;
      audioRef.current = new Audio('./sounds/JoinVoiceChannel.wav');
      audioRef.current.setSinkId(outputDeviceIdRef.current || '');
      audioRef.current.volume = 0.5;
      audioRef.current.play();
    }
    if (sound === 'leaveVoiceChannel') {
      if (!leaveVoiceChannelSoundRef.current && !force) return;
      audioRef.current = new Audio('./sounds/LeaveVoiceChannel.wav');
      audioRef.current.setSinkId(outputDeviceIdRef.current || '');
      audioRef.current.volume = 0.5;
      audioRef.current.play();
    }
    if (sound === 'receiveChannelMessage') {
      if (!receiveChannelMessageSoundRef.current && !force) return;
      audioRef.current = new Audio('./sounds/ReceiveChannelMsg.wav');
      audioRef.current.setSinkId(outputDeviceIdRef.current || '');
      audioRef.current.volume = 0.5;
      audioRef.current.play();
    }
    if (sound === 'receiveDirectMessage') {
      if (!receiveDirectMessageSoundRef.current && !force) return;
      audioRef.current = new Audio('./sounds/ReceiveDirectMsg.wav');
      audioRef.current.setSinkId(outputDeviceIdRef.current || '');
      audioRef.current.volume = 0.5;
      audioRef.current.play();
    }
    if (sound === 'startSpeaking') {
      if (!startSpeakingSoundRef.current && !force) return;
      audioRef.current = new Audio('./sounds/MicKeyDown.wav');
      audioRef.current.setSinkId(outputDeviceIdRef.current || '');
      audioRef.current.volume = 0.5;
      audioRef.current.play();
    }
    if (sound === 'stopSpeaking') {
      if (!stopSpeakingSoundRef.current && !force) return;
      audioRef.current = new Audio('./sounds/MicKeyUp.wav');
      audioRef.current.setSinkId(outputDeviceIdRef.current || '');
      audioRef.current.volume = 0.5;
      audioRef.current.play();
    }
  };

  // Effects
  useEffect(() => {
    const changeOutputAudioDevice = (deviceId: string) => {
      new Logger('SoundPlayer').info(`output device updated: ${deviceId}`);
      outputDeviceIdRef.current = deviceId || null;
    };
    changeOutputAudioDevice(ipc.systemSettings.outputAudioDevice.get());
    const unsub = ipc.systemSettings.outputAudioDevice.onUpdate(changeOutputAudioDevice);
    return () => unsub();
  }, []);

  useEffect(() => {
    const changeDisableAllSoundEffect = (enabled: boolean) => {
      new Logger('SoundPlayer').info(`disable all sound effect updated: ${enabled}`);
      disableAllSoundEffectRef.current = enabled;
    };
    changeDisableAllSoundEffect(ipc.systemSettings.disableAllSoundEffect.get());
    const unsub = ipc.systemSettings.disableAllSoundEffect.onUpdate(changeDisableAllSoundEffect);
    return () => unsub();
  }, []);

  useEffect(() => {
    const changeEnterVoiceChannelSound = (enabled: boolean) => {
      new Logger('SoundPlayer').info(`enter voice channel sound updated: ${enabled}`);
      enterVoiceChannelSoundRef.current = enabled;
    };
    changeEnterVoiceChannelSound(ipc.systemSettings.enterVoiceChannelSound.get());
    const unsub = ipc.systemSettings.enterVoiceChannelSound.onUpdate(changeEnterVoiceChannelSound);
    return () => unsub();
  }, []);

  useEffect(() => {
    const changeLeaveVoiceChannelSound = (enabled: boolean) => {
      new Logger('SoundPlayer').info(`leave voice channel sound updated: ${enabled}`);
      leaveVoiceChannelSoundRef.current = enabled;
    };
    changeLeaveVoiceChannelSound(ipc.systemSettings.leaveVoiceChannelSound.get());
    const unsub = ipc.systemSettings.leaveVoiceChannelSound.onUpdate(changeLeaveVoiceChannelSound);
    return () => unsub();
  }, []);

  useEffect(() => {
    const changeStartSpeakingSound = (enabled: boolean) => {
      new Logger('SoundPlayer').info(`start speaking sound updated: ${enabled}`);
      startSpeakingSoundRef.current = enabled;
    };
    changeStartSpeakingSound(ipc.systemSettings.startSpeakingSound.get());
    const unsub = ipc.systemSettings.startSpeakingSound.onUpdate(changeStartSpeakingSound);
    return () => unsub();
  }, []);

  useEffect(() => {
    const changeStopSpeakingSound = (enabled: boolean) => {
      new Logger('SoundPlayer').info(`stop speaking sound updated: ${enabled}`);
      stopSpeakingSoundRef.current = enabled;
    };
    changeStopSpeakingSound(ipc.systemSettings.stopSpeakingSound.get());
    const unsub = ipc.systemSettings.stopSpeakingSound.onUpdate(changeStopSpeakingSound);
    return () => unsub();
  }, []);

  useEffect(() => {
    const changeReceiveDirectMessageSound = (enabled: boolean) => {
      new Logger('SoundPlayer').info(`receive direct message sound updated: ${enabled}`);
      receiveDirectMessageSoundRef.current = enabled;
    };
    changeReceiveDirectMessageSound(ipc.systemSettings.receiveDirectMessageSound.get());
    const unsub = ipc.systemSettings.receiveDirectMessageSound.onUpdate(changeReceiveDirectMessageSound);
    return () => unsub();
  }, []);

  useEffect(() => {
    const changeReceiveChannelMessageSound = (enabled: boolean) => {
      new Logger('SoundPlayer').info(`receive channel message sound updated: ${enabled}`);
      receiveChannelMessageSoundRef.current = enabled;
    };
    changeReceiveChannelMessageSound(ipc.systemSettings.receiveChannelMessageSound.get());
    const unsub = ipc.systemSettings.receiveChannelMessageSound.onUpdate(changeReceiveChannelMessageSound);
    return () => unsub();
  }, []);

  return <SoundPlayerContext.Provider value={{ playSound }}>{children}</SoundPlayerContext.Provider>;
};

SoundPlayerProvider.displayName = 'SoundPlayerProvider';

export default SoundPlayerProvider;

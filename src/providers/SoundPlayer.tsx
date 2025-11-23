import { createContext, ReactNode, useContext, useEffect, useRef } from 'react';

// Services
import ipc from '@/services/ipc.service';

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
    console.info('[SoundPlayer] play sound: ', sound, force);

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
    const changeDisableAllSoundEffect = (enabled: boolean) => {
      console.info('[SoundPlayer] disable all sound effect updated: ', enabled);
      disableAllSoundEffectRef.current = enabled;
    };
    const changeOutputAudioDevice = (deviceId: string) => {
      console.info('[SoundPlayer] output device updated: ', deviceId);
      outputDeviceIdRef.current = deviceId || null;
    };
    const changeEnterVoiceChannelSound = (enabled: boolean) => {
      console.info('[SoundPlayer] enter voice channel sound updated: ', enabled);
      enterVoiceChannelSoundRef.current = enabled;
    };
    const changeLeaveVoiceChannelSound = (enabled: boolean) => {
      console.info('[SoundPlayer] leave voice channel sound updated: ', enabled);
      leaveVoiceChannelSoundRef.current = enabled;
    };
    const changeStartSpeakingSound = (enabled: boolean) => {
      console.info('[SoundPlayer] start speaking sound updated: ', enabled);
      startSpeakingSoundRef.current = enabled;
    };
    const changeStopSpeakingSound = (enabled: boolean) => {
      console.info('[SoundPlayer] stop speaking sound updated: ', enabled);
      stopSpeakingSoundRef.current = enabled;
    };
    const changeReceiveDirectMessageSound = (enabled: boolean) => {
      console.info('[SoundPlayer] receive direct message sound updated: ', enabled);
      receiveDirectMessageSoundRef.current = enabled;
    };
    const changeReceiveChannelMessageSound = (enabled: boolean) => {
      console.info('[SoundPlayer] receive channel message sound updated: ', enabled);
      receiveChannelMessageSoundRef.current = enabled;
    };

    changeOutputAudioDevice(ipc.systemSettings.outputAudioDevice.get());
    changeDisableAllSoundEffect(ipc.systemSettings.disableAllSoundEffect.get());
    changeEnterVoiceChannelSound(ipc.systemSettings.enterVoiceChannelSound.get());
    changeLeaveVoiceChannelSound(ipc.systemSettings.leaveVoiceChannelSound.get());
    changeStartSpeakingSound(ipc.systemSettings.startSpeakingSound.get());
    changeStopSpeakingSound(ipc.systemSettings.stopSpeakingSound.get());
    changeReceiveDirectMessageSound(ipc.systemSettings.receiveDirectMessageSound.get());
    changeReceiveChannelMessageSound(ipc.systemSettings.receiveChannelMessageSound.get());

    const unsubs = [
      ipc.systemSettings.outputAudioDevice.onUpdate(changeOutputAudioDevice),
      ipc.systemSettings.disableAllSoundEffect.onUpdate(changeDisableAllSoundEffect),
      ipc.systemSettings.enterVoiceChannelSound.onUpdate(changeEnterVoiceChannelSound),
      ipc.systemSettings.leaveVoiceChannelSound.onUpdate(changeLeaveVoiceChannelSound),
      ipc.systemSettings.startSpeakingSound.onUpdate(changeStartSpeakingSound),
      ipc.systemSettings.stopSpeakingSound.onUpdate(changeStopSpeakingSound),
      ipc.systemSettings.receiveDirectMessageSound.onUpdate(changeReceiveDirectMessageSound),
      ipc.systemSettings.receiveChannelMessageSound.onUpdate(changeReceiveChannelMessageSound),
    ];
    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  return <SoundPlayerContext.Provider value={{ playSound }}>{children}</SoundPlayerContext.Provider>;
};

SoundPlayerProvider.displayName = 'SoundPlayerProvider';

export default SoundPlayerProvider;

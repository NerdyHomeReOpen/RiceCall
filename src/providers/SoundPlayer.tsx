import { createContext, ReactNode, useContext, useEffect, useRef } from 'react';

// Services
import ipcService from '@/services/ipc.service';

interface SoundPlayerContextType {
  playSound: (sound: 'enterVoiceChannel' | 'leaveVoiceChannel' | 'receiveChannelMessage' | 'receiveDirectMessage' | 'startSpeaking' | 'stopSpeaking') => void;
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

  const handlePlaySound = (sound: 'enterVoiceChannel' | 'leaveVoiceChannel' | 'receiveChannelMessage' | 'receiveDirectMessage' | 'startSpeaking' | 'stopSpeaking') => {
    if (disableAllSoundEffectRef.current) return;

    if (audioRef.current) {
      audioRef.current = null;
    }

    if (sound === 'enterVoiceChannel' && enterVoiceChannelSoundRef.current) {
      audioRef.current = new Audio('./sounds/JoinVoiceChannel.wav');
      audioRef.current.setSinkId(outputDeviceIdRef.current || '');
      audioRef.current.volume = 0.5;
      audioRef.current.play();
    }
    if (sound === 'leaveVoiceChannel' && leaveVoiceChannelSoundRef.current) {
      audioRef.current = new Audio('./sounds/LeaveVoiceChannel.wav');
      audioRef.current.setSinkId(outputDeviceIdRef.current || '');
      audioRef.current.volume = 0.5;
      audioRef.current.play();
    }
    if (sound === 'receiveChannelMessage' && receiveChannelMessageSoundRef.current) {
      audioRef.current = new Audio('./sounds/ReceiveChannelMsg.wav');
      audioRef.current.setSinkId(outputDeviceIdRef.current || '');
      audioRef.current.volume = 0.5;
      audioRef.current.play();
    }
    if (sound === 'receiveDirectMessage' && receiveDirectMessageSoundRef.current) {
      audioRef.current = new Audio('./sounds/ReceiveDirectMsg.wav');
      audioRef.current.setSinkId(outputDeviceIdRef.current || '');
      audioRef.current.volume = 0.5;
      audioRef.current.play();
    }
    if (sound === 'startSpeaking' && startSpeakingSoundRef.current) {
      audioRef.current = new Audio('./sounds/StartSpeaking.wav');
      audioRef.current.setSinkId(outputDeviceIdRef.current || '');
      audioRef.current.volume = 0.5;
      audioRef.current.play();
    }
    if (sound === 'stopSpeaking' && stopSpeakingSoundRef.current) {
      audioRef.current = new Audio('./sounds/StopSpeaking.wav');
      audioRef.current.setSinkId(outputDeviceIdRef.current || '');
      audioRef.current.volume = 0.5;
      audioRef.current.play();
    }
  };

  // Effects
  useEffect(() => {
    ipcService.systemSettings.disableAllSoundEffect.get(() => {});
    ipcService.systemSettings.outputAudioDevice.get(() => {});
    ipcService.systemSettings.enterVoiceChannelSound.get(() => {});
    ipcService.systemSettings.leaveVoiceChannelSound.get(() => {});
    ipcService.systemSettings.startSpeakingSound.get(() => {});
    ipcService.systemSettings.stopSpeakingSound.get(() => {});
    ipcService.systemSettings.receiveDirectMessageSound.get(() => {});
    ipcService.systemSettings.receiveChannelMessageSound.get(() => {});

    const offUpdateOutput = ipcService.systemSettings.outputAudioDevice.onUpdate((deviceId) => {
      outputDeviceIdRef.current = deviceId || null;
    });
    const offUpdateDisableAllSoundEffect = ipcService.systemSettings.disableAllSoundEffect.onUpdate((enabled) => {
      disableAllSoundEffectRef.current = enabled;
    });
    const offUpdateEnterVoiceChannelSound = ipcService.systemSettings.enterVoiceChannelSound.onUpdate((enabled) => {
      enterVoiceChannelSoundRef.current = enabled;
    });
    const offUpdateLeaveVoiceChannelSound = ipcService.systemSettings.leaveVoiceChannelSound.onUpdate((enabled) => {
      leaveVoiceChannelSoundRef.current = enabled;
    });
    const offUpdateStartSpeakingSound = ipcService.systemSettings.startSpeakingSound.onUpdate((enabled) => {
      startSpeakingSoundRef.current = enabled;
    });
    const offUpdateStopSpeakingSound = ipcService.systemSettings.stopSpeakingSound.onUpdate((enabled) => {
      stopSpeakingSoundRef.current = enabled;
    });
    const offUpdateReceiveDirectMessageSound = ipcService.systemSettings.receiveDirectMessageSound.onUpdate((enabled) => {
      receiveDirectMessageSoundRef.current = enabled;
    });
    const offUpdateReceiveChannelMessageSound = ipcService.systemSettings.receiveChannelMessageSound.onUpdate((enabled) => {
      receiveChannelMessageSoundRef.current = enabled;
    });

    return () => {
      offUpdateOutput();
      offUpdateDisableAllSoundEffect();
      offUpdateEnterVoiceChannelSound();
      offUpdateLeaveVoiceChannelSound();
      offUpdateStartSpeakingSound();
      offUpdateStopSpeakingSound();
      offUpdateReceiveDirectMessageSound();
      offUpdateReceiveChannelMessageSound();
    };
  }, []);

  return <SoundPlayerContext.Provider value={{ playSound: handlePlaySound }}>{children}</SoundPlayerContext.Provider>;
};

SoundPlayerProvider.displayName = 'SoundPlayerProvider';

export default SoundPlayerProvider;

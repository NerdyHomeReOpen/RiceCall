import { createContext, ReactNode, useCallback, useContext, useEffect, useRef } from 'react';

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

  const handleEditOutputStream = useCallback((deviceId: string) => {
    audioRef.current?.setSinkId(deviceId).catch((err) => console.error('Error accessing speaker:', err));
  }, []);

  const handlePlaySound = (sound: 'enterVoiceChannel' | 'leaveVoiceChannel' | 'receiveChannelMessage' | 'receiveDirectMessage' | 'startSpeaking' | 'stopSpeaking') => {
    if (disableAllSoundEffectRef.current) return;

    if (audioRef.current) {
      audioRef.current = null;
    }

    console.log('sound', sound);

    if (sound === 'enterVoiceChannel' && enterVoiceChannelSoundRef.current) {
      audioRef.current = new Audio('./sounds/JoinVoiceChannel.wav');
      audioRef.current.volume = 0.5;
      audioRef.current.play();
    }
    if (sound === 'leaveVoiceChannel' && leaveVoiceChannelSoundRef.current) {
      audioRef.current = new Audio('./sounds/LeaveVoiceChannel.wav');
      audioRef.current.volume = 0.5;
      audioRef.current.play();
    }
    if (sound === 'receiveChannelMessage' && receiveChannelMessageSoundRef.current) {
      audioRef.current = new Audio('./sounds/ReceiveChannelMsg.wav');
      audioRef.current.volume = 0.5;
      audioRef.current.play();
    }
    if (sound === 'receiveDirectMessage' && receiveDirectMessageSoundRef.current) {
      audioRef.current = new Audio('./sounds/ReceiveDirectMsg.wav');
      audioRef.current.volume = 0.5;
      audioRef.current.play();
    }
    if (sound === 'startSpeaking' && startSpeakingSoundRef.current) {
      audioRef.current = new Audio('./sounds/StartSpeaking.wav');
      audioRef.current.volume = 0.5;
      audioRef.current.play();
    }
    if (sound === 'stopSpeaking' && stopSpeakingSoundRef.current) {
      audioRef.current = new Audio('./sounds/StopSpeaking.wav');
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
      console.log('deviceId', deviceId);
      handleEditOutputStream(deviceId || '');
    });
    const offUpdateDisableAllSoundEffect = ipcService.systemSettings.disableAllSoundEffect.onUpdate((enabled) => {
      console.log('disableAllSoundEffect enabled', enabled);
      disableAllSoundEffectRef.current = enabled;
    });
    const offUpdateEnterVoiceChannelSound = ipcService.systemSettings.enterVoiceChannelSound.onUpdate((enabled) => {
      console.log('enterVoiceChannelSound enabled', enabled);
      enterVoiceChannelSoundRef.current = enabled;
    });
    const offUpdateLeaveVoiceChannelSound = ipcService.systemSettings.leaveVoiceChannelSound.onUpdate((enabled) => {
      console.log('leaveVoiceChannelSound enabled', enabled);
      leaveVoiceChannelSoundRef.current = enabled;
    });
    const offUpdateStartSpeakingSound = ipcService.systemSettings.startSpeakingSound.onUpdate((enabled) => {
      console.log('startSpeakingSound enabled', enabled);
      startSpeakingSoundRef.current = enabled;
    });
    const offUpdateStopSpeakingSound = ipcService.systemSettings.stopSpeakingSound.onUpdate((enabled) => {
      console.log('stopSpeakingSound enabled', enabled);
      stopSpeakingSoundRef.current = enabled;
    });
    const offUpdateReceiveDirectMessageSound = ipcService.systemSettings.receiveDirectMessageSound.onUpdate((enabled) => {
      console.log('receiveDirectMessageSound enabled', enabled);
      receiveDirectMessageSoundRef.current = enabled;
    });
    const offUpdateReceiveChannelMessageSound = ipcService.systemSettings.receiveChannelMessageSound.onUpdate((enabled) => {
      console.log('receiveChannelMessageSound enabled', enabled);
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
  }, [handleEditOutputStream]);

  return <SoundPlayerContext.Provider value={{ playSound: handlePlaySound }}>{children}</SoundPlayerContext.Provider>;
};

SoundPlayerProvider.displayName = 'SoundPlayerProvider';

export default SoundPlayerProvider;

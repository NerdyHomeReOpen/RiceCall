import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';

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
  const audioRef = useRef<HTMLAudioElement>(null);

  // Statas
  const [enterVoiceChannelSound, setEnterVoiceChannelSound] = useState(false);
  const [leaveVoiceChannelSound, setLeaveVoiceChannelSound] = useState(false);
  const [startSpeakingSound, setStartSpeakingSound] = useState(false);
  const [stopSpeakingSound, setStopSpeakingSound] = useState(false);
  const [receiveDirectMessageSound, setReceiveDirectMessageSound] = useState(false);
  const [receiveChannelMessageSound, setReceiveChannelMessageSound] = useState(false);

  const handleEditOutputStream = useCallback((deviceId: string) => {
    audioRef.current?.setSinkId(deviceId).catch((err) => console.error('Error accessing speaker:', err));
  }, []);

  const handlePlaySound = useCallback(
    (sound: 'enterVoiceChannel' | 'leaveVoiceChannel' | 'receiveChannelMessage' | 'receiveDirectMessage' | 'startSpeaking' | 'stopSpeaking') => {
      if (!enterVoiceChannelSound) return;

      if (audioRef.current) {
        audioRef.current.pause();
      }

      switch (sound) {
        case 'enterVoiceChannel':
          if (!enterVoiceChannelSound) return;
          audioRef.current = new Audio('./sounds/Yconnect.wav');
          break;
        case 'leaveVoiceChannel':
          if (!leaveVoiceChannelSound) return;
          audioRef.current = new Audio('./sounds/Yconnect.wav');
          break;
        case 'receiveChannelMessage':
          if (!receiveChannelMessageSound) return;
          audioRef.current = new Audio('./sounds/ReceiveChannelMsg.wav');
          break;
        case 'receiveDirectMessage':
          if (!receiveDirectMessageSound) return;
          audioRef.current = new Audio('./sounds/ReceiveDirectMsg.wav');
          break;
        case 'startSpeaking':
          if (!startSpeakingSound) return;
          audioRef.current = new Audio('./sounds/StartSpeaking.wav');
          break;
        case 'stopSpeaking':
          if (!stopSpeakingSound) return;
          audioRef.current = new Audio('./sounds/StopSpeaking.wav');
          break;
        default:
          audioRef.current = new Audio();
          break;
      }

      audioRef.current.volume = 0.5;
      audioRef.current.play();
    },
    [enterVoiceChannelSound, leaveVoiceChannelSound, receiveChannelMessageSound, receiveDirectMessageSound, startSpeakingSound, stopSpeakingSound],
  );

  // Effects
  useEffect(() => {
    ipcService.systemSettings.outputAudioDevice.get(() => {});
    ipcService.systemSettings.enterVoiceChannelSound.get(() => {});
    ipcService.systemSettings.leaveVoiceChannelSound.get(() => {});
    ipcService.systemSettings.startSpeakingSound.get(() => {});
    ipcService.systemSettings.stopSpeakingSound.get(() => {});
    ipcService.systemSettings.receiveDirectMessageSound.get(() => {});
    ipcService.systemSettings.receiveChannelMessageSound.get(() => {});

    const offUpdateOutput = ipcService.systemSettings.outputAudioDevice.onUpdate((deviceId) => {
      handleEditOutputStream(deviceId || '');
    });
    const offUpdateEnterVoiceChannelSound = ipcService.systemSettings.enterVoiceChannelSound.onUpdate((enabled) => {
      setEnterVoiceChannelSound(enabled);
    });
    const offUpdateLeaveVoiceChannelSound = ipcService.systemSettings.leaveVoiceChannelSound.onUpdate((enabled) => {
      setLeaveVoiceChannelSound(enabled);
    });
    const offUpdateStartSpeakingSound = ipcService.systemSettings.startSpeakingSound.onUpdate((enabled) => {
      setStartSpeakingSound(enabled);
    });
    const offUpdateStopSpeakingSound = ipcService.systemSettings.stopSpeakingSound.onUpdate((enabled) => {
      setStopSpeakingSound(enabled);
    });
    const offUpdateReceiveDirectMessageSound = ipcService.systemSettings.receiveDirectMessageSound.onUpdate((enabled) => {
      setReceiveDirectMessageSound(enabled);
    });
    const offUpdateReceiveChannelMessageSound = ipcService.systemSettings.receiveChannelMessageSound.onUpdate((enabled) => {
      setReceiveChannelMessageSound(enabled);
    });

    return () => {
      offUpdateOutput();
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

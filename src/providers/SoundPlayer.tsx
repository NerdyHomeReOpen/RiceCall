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

    const unsubscribe = [
      ipcService.systemSettings.outputAudioDevice.get(changeOutputAudioDevice),
      ipcService.systemSettings.disableAllSoundEffect.get(changeDisableAllSoundEffect),
      ipcService.systemSettings.enterVoiceChannelSound.get(changeEnterVoiceChannelSound),
      ipcService.systemSettings.leaveVoiceChannelSound.get(changeLeaveVoiceChannelSound),
      ipcService.systemSettings.startSpeakingSound.get(changeStartSpeakingSound),
      ipcService.systemSettings.stopSpeakingSound.get(changeStopSpeakingSound),
      ipcService.systemSettings.receiveDirectMessageSound.get(changeReceiveDirectMessageSound),
      ipcService.systemSettings.receiveChannelMessageSound.get(changeReceiveChannelMessageSound),
    ];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, []);

  return <SoundPlayerContext.Provider value={{ playSound: handlePlaySound }}>{children}</SoundPlayerContext.Provider>;
};

SoundPlayerProvider.displayName = 'SoundPlayerProvider';

export default SoundPlayerProvider;

import { useEffect, useRef, useState } from 'react';

// Types
import { SocketServerEvent } from '@/types';

// Providers
import { useSocket } from '@/providers/Socket';

// Services
import ipcService from '@/services/ipc.service';

export const SoundEffectPlayer = () => {
  // Hooks
  const socket = useSocket();

  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);

  // Statas
  const [soundEffect, setSoundEffect] = useState(false);

  // Effects
  useEffect(() => {
    ipcService.systemSettings.soundEffect.get((enabled) => {
      setSoundEffect(enabled);
    });

    const offUpdate = ipcService.systemSettings.soundEffect.onUpdate(
      (enabled) => {
        setSoundEffect(enabled);
      },
    );

    return () => offUpdate();
  }, []);

  const handlePlaySound = (sound: string) => {
    if (!soundEffect) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    switch (sound) {
      case 'leave':
        audioRef.current = new Audio('./sounds/Ydisconnect.wav');
        break;
      case 'join':
        audioRef.current = new Audio('./sounds/Yconnect.wav');
        break;
      case 'recieveChannelMessage':
        audioRef.current = new Audio('./sounds/ReceiveChannelMsg.wav');
        break;
      default:
        audioRef.current = new Audio();
        break;
    }

    audioRef.current.volume = 0.5;
    audioRef.current.play();
  };

  useEffect(() => {
    if (!socket) return;

    const eventHandlers = {
      [SocketServerEvent.PLAY_SOUND]: handlePlaySound,
    };
    const unsubscribe: (() => void)[] = [];

    Object.entries(eventHandlers).forEach(([event, handler]) => {
      const unsub = socket.on[event as SocketServerEvent](handler);
      unsubscribe.push(unsub);
    });

    return () => {
      unsubscribe.forEach((unsub) => unsub());
    };
  }, [socket]);

  return null;
};

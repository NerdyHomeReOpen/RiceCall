import React, { useContext, createContext, ReactNode, useRef, useEffect, useCallback, useState } from 'react';

// Providers
import { useWebRTC } from '@/providers/WebRTC';

// Services
import ipcService from '@/services/ipc.service';

const BASE_VOLUME = 5;

type ActionScannerContextType = {
  isKeepAlive: boolean;
};

const ActionScannerContext = createContext<ActionScannerContextType | null>(null);

export const useActionScanner = () => {
  const context = useContext(ActionScannerContext);
  if (!context) throw new Error('useActionScanner must be used within a ActionScannerProvider');
  return context;
};

interface ActionScannerProviderProps {
  children: ReactNode;
}

const ActionScannerProvider = ({ children }: ActionScannerProviderProps) => {
  // Hooks
  const webRTC = useWebRTC();

  // Refs
  const idleCheck = useRef<boolean>(false);
  const idleMinutes = useRef<number>(0);
  const speakingKeyRef = useRef<string>('v');
  const openMainWindowKeyRef = useRef<string>('F1');
  const increaseVolumeKeyRef = useRef<string>('Ctrl+m');
  const decreaseVolumeKeyRef = useRef<string>('Shift+m');
  const toggleSpeakerKeyRef = useRef<string>('Alt+m');
  const toggleMicrophoneKeyRef = useRef<string>('Alt+v');

  // States
  const [isKeepAlive, setIsKeepAlive] = useState<boolean>(true);
  const [keepAliveTime, setKeepAliveTime] = useState<number>(Date.now());

  // Handlers
  const startSpeak = useCallback(() => {
    webRTC.handlePressKeyToSpeak(true);
  }, []);

  const stopSpeak = useCallback(() => {
    webRTC.handlePressKeyToSpeak(false);
  }, []);

  const toggleMainWindows = useCallback(() => {
    // TODO: key detection in background
  }, []);

  const toggleUpVolume = useCallback(() => {
    const newValue = Math.min(100, webRTC.speakerVolume + BASE_VOLUME);
    webRTC.handleEditSpeakerVolume(newValue);
  }, [webRTC]);

  const toggleDownVolume = useCallback(() => {
    const newValue = Math.max(0, webRTC.speakerVolume - BASE_VOLUME);
    webRTC.handleEditSpeakerVolume(newValue);
  }, [webRTC]);

  const toggleSpeakerMute = useCallback(() => {
    webRTC.handleToggleSpeakerMute();
  }, [webRTC]);

  const toggleMicMute = useCallback(() => {
    webRTC.handleToggleMicMute();
  }, [webRTC]);

  // Effects
  useEffect(() => {
    ipcService.systemSettings.statusAutoIdle.get(() => {});
    ipcService.systemSettings.statusAutoIdleMinutes.get(() => {});
    ipcService.systemSettings.defaultSpeakingKey.get(() => {});
    ipcService.systemSettings.hotKeyOpenMainWindow.get(() => {});
    ipcService.systemSettings.hotKeyIncreaseVolume.get(() => {});
    ipcService.systemSettings.hotKeyDecreaseVolume.get(() => {});
    ipcService.systemSettings.hotKeyToggleSpeaker.get(() => {});
    ipcService.systemSettings.hotKeyToggleMicrophone.get(() => {});

    const offUpdateStatusAutoIdle = ipcService.systemSettings.statusAutoIdle.onUpdate((key) => {
      idleCheck.current = key;
      setKeepAliveTime(Date.now());
    });
    const offUpdateStatusAutoIdleMinutes = ipcService.systemSettings.statusAutoIdleMinutes.onUpdate((value) => {
      idleMinutes.current = value;
      setKeepAliveTime(Date.now());
    });
    const offUpdateDefaultSpeakingKey = ipcService.systemSettings.defaultSpeakingKey.onUpdate((key) => {
      speakingKeyRef.current = key;
    });
    const offUpdateHotKeyOpenMainWindow = ipcService.systemSettings.hotKeyOpenMainWindow.onUpdate((key) => {
      openMainWindowKeyRef.current = key;
    });
    const offUpdateHotKeyIncreaseVolume = ipcService.systemSettings.hotKeyIncreaseVolume.onUpdate((key) => {
      increaseVolumeKeyRef.current = key;
    });
    const offUpdateHotKeyDecreaseVolume = ipcService.systemSettings.hotKeyDecreaseVolume.onUpdate((key) => {
      decreaseVolumeKeyRef.current = key;
    });
    const offUpdateHotKeyToggleSpeaker = ipcService.systemSettings.hotKeyToggleSpeaker.onUpdate((key) => {
      toggleSpeakerKeyRef.current = key;
    });
    const offUpdateHotKeyToggleMicrophone = ipcService.systemSettings.hotKeyToggleMicrophone.onUpdate((key) => {
      toggleMicrophoneKeyRef.current = key;
    });

    return () => {
      offUpdateStatusAutoIdle();
      offUpdateStatusAutoIdleMinutes();
      offUpdateDefaultSpeakingKey();
      offUpdateHotKeyOpenMainWindow();
      offUpdateHotKeyIncreaseVolume();
      offUpdateHotKeyDecreaseVolume();
      offUpdateHotKeyToggleSpeaker();
      offUpdateHotKeyToggleMicrophone();
    };
  }, []);

  useEffect(() => {
    if (!idleCheck.current || !isKeepAlive) return;
    const timer = setInterval(() => {
      const now = Date.now();
      if (now - keepAliveTime >= idleMinutes.current * 60 * 1000) {
        setIsKeepAlive(false);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [keepAliveTime, idleCheck, !isKeepAlive]);

  useEffect(() => {
    const updateActivity = () => {
      setIsKeepAlive(true);
      setKeepAliveTime(Date.now());
    };

    const events = ['click', 'mousemove', 'mousedown', 'keydown', 'scroll'];

    for (const event of events) {
      window.addEventListener(event, updateActivity);
    }

    return () => {
      for (const event of events) {
        window.removeEventListener(event, updateActivity);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (new Set(['Shift', 'Control', 'Alt', 'Meta']).has(e.key)) return;

      const parts = [];
      if (e.ctrlKey) parts.push('Ctrl');
      if (e.shiftKey) parts.push('Shift');
      if (e.altKey) parts.push('Alt');

      let key = e.key;

      if (key === ' ') key = 'Space';
      if (key === 'Meta') key = 'Cmd';
      if (/^f\d+$/i.test(key)) key = key.toUpperCase();

      parts.push(key.length === 1 ? key.toLowerCase() : key);
      const mergeKey = parts.join('+');

      switch (mergeKey) {
        case speakingKeyRef.current:
          startSpeak();
          break;
        case openMainWindowKeyRef.current:
          toggleMainWindows();
          break;
        case increaseVolumeKeyRef.current:
          toggleUpVolume();
          break;
        case decreaseVolumeKeyRef.current:
          toggleDownVolume();
          break;
        case toggleSpeakerKeyRef.current:
          toggleSpeakerMute();
          break;
        case toggleMicrophoneKeyRef.current:
          toggleMicMute();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (new Set(['Shift', 'Control', 'Alt', 'Meta']).has(e.key)) return;

      const parts = [];
      if (e.ctrlKey) parts.push('Ctrl');
      if (e.shiftKey) parts.push('Shift');
      if (e.altKey) parts.push('Alt');

      let key = e.key;

      if (key === ' ') key = 'Space';
      if (key === 'Meta') key = 'Cmd';
      if (/^f\d+$/i.test(key)) key = key.toUpperCase();

      parts.push(key.length === 1 ? key.toLowerCase() : key);
      const mergeKey = parts.join('+');

      switch (mergeKey) {
        case speakingKeyRef.current:
          stopSpeak();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [startSpeak, stopSpeak, toggleMainWindows, toggleUpVolume, toggleDownVolume, toggleSpeakerMute, toggleMicMute]);

  return <ActionScannerContext.Provider value={{ isKeepAlive }}>{children}</ActionScannerContext.Provider>;
};

ActionScannerProvider.displayName = 'ActionScannerProvider';

export default ActionScannerProvider;

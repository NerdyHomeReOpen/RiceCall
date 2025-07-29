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
    webRTC.handleToggleSpeakKey(true);
  }, [webRTC]);

  const stopSpeak = useCallback(() => {
    webRTC.handleToggleSpeakKey(false);
  }, [webRTC]);

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
    const changeStatusAutoIdle = (enable: boolean) => {
      console.info('[ActionScanner] status auto idle updated: ', enable);
      idleCheck.current = enable;
      setKeepAliveTime(Date.now());
    };
    const changeStatusAutoIdleMinutes = (value: number) => {
      console.info('[ActionScanner] status auto idle minutes updated: ', value);
      idleMinutes.current = value;
      setKeepAliveTime(Date.now());
    };
    const changeDefaultSpeakingKey = (key: string) => {
      console.info('[ActionScanner] default speaking key updated: ', key);
      speakingKeyRef.current = key;
    };
    const changeHotKeyOpenMainWindow = (key: string) => {
      console.info('[ActionScanner] hot key open main window updated: ', key);
      openMainWindowKeyRef.current = key;
    };
    const changeHotKeyIncreaseVolume = (key: string) => {
      console.info('[ActionScanner] hot key increase volume updated: ', key);
      increaseVolumeKeyRef.current = key;
    };
    const changeHotKeyDecreaseVolume = (key: string) => {
      console.info('[ActionScanner] hot key decrease volume updated: ', key);
      decreaseVolumeKeyRef.current = key;
    };
    const changeHotKeyToggleSpeaker = (key: string) => {
      console.info('[ActionScanner] hot key toggle speaker updated: ', key);
      toggleSpeakerKeyRef.current = key;
    };
    const changeHotKeyToggleMicrophone = (key: string) => {
      console.info('[ActionScanner] hot key toggle microphone updated: ', key);
      toggleMicrophoneKeyRef.current = key;
    };

    const unsubscribe: (() => void)[] = [
      ipcService.systemSettings.statusAutoIdle.get(changeStatusAutoIdle),
      ipcService.systemSettings.statusAutoIdleMinutes.get(changeStatusAutoIdleMinutes),
      ipcService.systemSettings.defaultSpeakingKey.get(changeDefaultSpeakingKey),
      ipcService.systemSettings.hotKeyOpenMainWindow.get(changeHotKeyOpenMainWindow),
      ipcService.systemSettings.hotKeyIncreaseVolume.get(changeHotKeyIncreaseVolume),
      ipcService.systemSettings.hotKeyDecreaseVolume.get(changeHotKeyDecreaseVolume),
      ipcService.systemSettings.hotKeyToggleSpeaker.get(changeHotKeyToggleSpeaker),
      ipcService.systemSettings.hotKeyToggleMicrophone.get(changeHotKeyToggleMicrophone),
    ];
    return () => unsubscribe.forEach((unsub) => unsub());
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
  }, [keepAliveTime, idleCheck, isKeepAlive]);

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

import React, { useContext, createContext, ReactNode, useRef, useEffect, useCallback, useState } from 'react';

// Providers
import { useWebRTC } from '@/providers/WebRTC';

// Services
import ipc from '@/services/ipc.service';

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
  const lastActiveRef = useRef<number>(Date.now());
  const isSpeakingRef = useRef(false);

  // States
  const [isKeepAlive, setIsKeepAlive] = useState<boolean>(true);

  // Handlers
  const buildKey = (e: KeyboardEvent) => {
    const parts: string[] = [];
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.shiftKey) parts.push('Shift');
    if (e.altKey) parts.push('Alt');
    if (e.metaKey) parts.push('Cmd');

    let key = e.key;
    if (key === ' ') key = 'Space';
    if (/^f\d+$/i.test(key)) key = key.toUpperCase();
    if (key === 'Meta') key = 'Cmd';

    parts.push(key.length === 1 ? key.toLowerCase() : key);
    return parts.join('+');
  };

  const startSpeak = useCallback(() => {
    if (isSpeakingRef.current) return;
    isSpeakingRef.current = true;
    webRTC.pressSpeakKey();
  }, [webRTC]);

  const stopSpeak = useCallback(() => {
    if (!isSpeakingRef.current) return;
    isSpeakingRef.current = false;
    webRTC.releaseSpeakKey();
  }, [webRTC]);

  const toggleMainWindows = useCallback(() => {
    // TODO: key detection in background
  }, []);

  const toggleUpVolume = useCallback(() => {
    const newValue = Math.min(100, webRTC.speakerVolume + BASE_VOLUME);
    webRTC.changeSpeakerVolume(newValue);
  }, [webRTC]);

  const toggleDownVolume = useCallback(() => {
    const newValue = Math.max(0, webRTC.speakerVolume - BASE_VOLUME);
    webRTC.changeSpeakerVolume(newValue);
  }, [webRTC]);

  const toggleSpeakerMute = useCallback(() => {
    webRTC.toggleSpeakerMuted();
  }, [webRTC]);

  const toggleMicMute = useCallback(() => {
    webRTC.toggleMicMuted();
  }, [webRTC]);

  // Effects
  useEffect(() => {
    if (!idleCheck.current) return;
    const interval = setInterval(() => {
      const now = Date.now();
      if (isKeepAlive && now - lastActiveRef.current >= idleMinutes.current * 60_000) {
        setIsKeepAlive(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isKeepAlive]);

  useEffect(() => {
    let ticking = false;

    const updateActivity = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          lastActiveRef.current = Date.now();
          if (!isKeepAlive) setIsKeepAlive(true);
          ticking = false;
        });
      }
    };

    const events: Array<[keyof WindowEventMap, AddEventListenerOptions?]> = [
      ['click', { passive: true }],
      ['mousemove', { passive: true }],
      ['mousedown', { passive: true }],
      ['keydown'],
      ['scroll', { passive: true }],
    ];

    events.forEach(([e, opt]) => window.addEventListener(e, updateActivity, opt));
    return () => events.forEach(([e, opt]) => window.removeEventListener(e, updateActivity, opt));
  }, [isKeepAlive]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (new Set(['Shift', 'Control', 'Alt', 'Meta']).has(e.key)) return;
      if (e.repeat) return;
      const mk = buildKey(e);
      switch (mk) {
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

    const onKeyUp = (e: KeyboardEvent) => {
      if (new Set(['Shift', 'Control', 'Alt', 'Meta']).has(e.key)) return;
      const mk = buildKey(e);
      switch (mk) {
        case speakingKeyRef.current:
          stopSpeak();
          break;
      }
    };

    // TODO: Use system event instead of window event
    const onBlur = () => stopSpeak();
    const onVisibility = () => {
      if (document.hidden) stopSpeak();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [startSpeak, stopSpeak, toggleMainWindows, toggleUpVolume, toggleDownVolume, toggleSpeakerMute, toggleMicMute]);

  useEffect(() => {
    const changeStatusAutoIdle = (enable: boolean) => {
      console.info('[ActionScanner] status auto idle updated: ', enable);
      idleCheck.current = enable;
      lastActiveRef.current = Date.now();
    };
    changeStatusAutoIdle(ipc.systemSettings.statusAutoIdle.get());
    const unsub = ipc.systemSettings.statusAutoIdle.onUpdate(changeStatusAutoIdle);
    return () => unsub();
  }, []);

  useEffect(() => {
    const changeStatusAutoIdleMinutes = (value: number) => {
      console.info('[ActionScanner] status auto idle minutes updated: ', value);
      idleMinutes.current = value;
    };
    changeStatusAutoIdleMinutes(ipc.systemSettings.statusAutoIdleMinutes.get());
    const unsub = ipc.systemSettings.statusAutoIdleMinutes.onUpdate(changeStatusAutoIdleMinutes);
    return () => unsub();
  }, []);

  useEffect(() => {
    const changeDefaultSpeakingKey = (key: string) => {
      console.info('[ActionScanner] default speaking key updated: ', key);
      speakingKeyRef.current = key;
    };
    changeDefaultSpeakingKey(ipc.systemSettings.defaultSpeakingKey.get());
    const unsub = ipc.systemSettings.defaultSpeakingKey.onUpdate(changeDefaultSpeakingKey);
    return () => unsub();
  }, []);

  useEffect(() => {
    const changeHotKeyOpenMainWindow = (key: string) => {
      console.info('[ActionScanner] hot key open main window updated: ', key);
      openMainWindowKeyRef.current = key;
    };
    changeHotKeyOpenMainWindow(ipc.systemSettings.hotKeyOpenMainWindow.get());
    const unsub = ipc.systemSettings.hotKeyOpenMainWindow.onUpdate(changeHotKeyOpenMainWindow);
    return () => unsub();
  }, []);

  useEffect(() => {
    const changeHotKeyIncreaseVolume = (key: string) => {
      console.info('[ActionScanner] hot key increase volume updated: ', key);
      increaseVolumeKeyRef.current = key;
    };
    changeHotKeyIncreaseVolume(ipc.systemSettings.hotKeyIncreaseVolume.get());
    const unsub = ipc.systemSettings.hotKeyIncreaseVolume.onUpdate(changeHotKeyIncreaseVolume);
    return () => unsub();
  }, []);

  useEffect(() => {
    const changeHotKeyDecreaseVolume = (key: string) => {
      console.info('[ActionScanner] hot key decrease volume updated: ', key);
      decreaseVolumeKeyRef.current = key;
    };
    changeHotKeyDecreaseVolume(ipc.systemSettings.hotKeyDecreaseVolume.get());
    const unsub = ipc.systemSettings.hotKeyDecreaseVolume.onUpdate(changeHotKeyDecreaseVolume);
    return () => unsub();
  }, []);

  useEffect(() => {
    const changeHotKeyToggleSpeaker = (key: string) => {
      console.info('[ActionScanner] hot key toggle speaker updated: ', key);
      toggleSpeakerKeyRef.current = key;
    };
    changeHotKeyToggleSpeaker(ipc.systemSettings.hotKeyToggleSpeaker.get());
    const unsub = ipc.systemSettings.hotKeyToggleSpeaker.onUpdate(changeHotKeyToggleSpeaker);
    return () => unsub();
  }, []);

  useEffect(() => {
    const changeHotKeyToggleMicrophone = (key: string) => {
      console.info('[ActionScanner] hot key toggle microphone updated: ', key);
      toggleMicrophoneKeyRef.current = key;
    };
    changeHotKeyToggleMicrophone(ipc.systemSettings.hotKeyToggleMicrophone.get());
    const unsub = ipc.systemSettings.hotKeyToggleMicrophone.onUpdate(changeHotKeyToggleMicrophone);
    return () => unsub();
  }, []);

  return <ActionScannerContext.Provider value={{ isKeepAlive }}>{children}</ActionScannerContext.Provider>;
};

ActionScannerProvider.displayName = 'ActionScannerProvider';

export default ActionScannerProvider;

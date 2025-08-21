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
  const speakingActiveRef = useRef(false);

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
    if (speakingActiveRef.current) return;
    speakingActiveRef.current = true;
    webRTC.toggleSpeakKey(true);
  }, [webRTC]);

  const stopSpeak = useCallback(() => {
    if (!speakingActiveRef.current) return;
    speakingActiveRef.current = false;
    webRTC.toggleSpeakKey(false);
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
    webRTC.toggleSpeakerMute();
  }, [webRTC]);

  const toggleMicMute = useCallback(() => {
    webRTC.toggleMicMute();
  }, [webRTC]);

  // Effects
  useEffect(() => {
    if (!idleCheck.current) return;
    const id = setInterval(() => {
      const now = Date.now();
      if (isKeepAlive && now - lastActiveRef.current >= idleMinutes.current * 60_000) {
        setIsKeepAlive(false);
      }
    }, 1000);
    return () => clearInterval(id);
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
    const changeStatusAutoIdleMinutes = (value: number) => {
      console.info('[ActionScanner] status auto idle minutes updated: ', value);
      idleMinutes.current = value;
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

    const unsubscribe = [
      ipc.systemSettings.statusAutoIdle.get(changeStatusAutoIdle),
      ipc.systemSettings.statusAutoIdleMinutes.get(changeStatusAutoIdleMinutes),
      ipc.systemSettings.defaultSpeakingKey.get(changeDefaultSpeakingKey),
      ipc.systemSettings.hotKeyOpenMainWindow.get(changeHotKeyOpenMainWindow),
      ipc.systemSettings.hotKeyIncreaseVolume.get(changeHotKeyIncreaseVolume),
      ipc.systemSettings.hotKeyDecreaseVolume.get(changeHotKeyDecreaseVolume),
      ipc.systemSettings.hotKeyToggleSpeaker.get(changeHotKeyToggleSpeaker),
      ipc.systemSettings.hotKeyToggleMicrophone.get(changeHotKeyToggleMicrophone),
    ];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, []);

  return <ActionScannerContext.Provider value={{ isKeepAlive }}>{children}</ActionScannerContext.Provider>;
};

ActionScannerProvider.displayName = 'ActionScannerProvider';

export default ActionScannerProvider;

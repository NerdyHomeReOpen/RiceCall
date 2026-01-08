import React, { useContext, createContext, ReactNode, useRef, useEffect, useCallback, useState, useMemo } from 'react';
import ipc from '@/ipc';

import { useWebRTC } from '@/providers/WebRTC';

import Logger from '@/utils/logger';

const BASE_VOLUME = 5;

type ActionScannerContextType = {
  isIdling: boolean;
  isManualIdling: boolean;
  setIsManualIdling: (value: boolean) => void;
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
  const { pressSpeakKey, releaseSpeakKey, changeSpeakerVolume, toggleSpeakerMuted, toggleMicMuted, speakerVolume } = useWebRTC();

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
  const isSpeakingRef = useRef<boolean>(false);
  const isManualIdlingRef = useRef<boolean>(false);

  // States
  const [isIdling, setIsIdling] = useState<boolean>(false);

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
    pressSpeakKey();
  }, [pressSpeakKey]);

  const stopSpeak = useCallback(() => {
    if (!isSpeakingRef.current) return;
    isSpeakingRef.current = false;
    releaseSpeakKey();
  }, [releaseSpeakKey]);

  const toggleMainWindows = useCallback(() => {
    // TODO: key detection in background
  }, []);

  const toggleUpVolume = useCallback(() => {
    const newValue = Math.min(100, speakerVolume + BASE_VOLUME);
    changeSpeakerVolume(newValue);
  }, [changeSpeakerVolume, speakerVolume]);

  const toggleDownVolume = useCallback(() => {
    const newValue = Math.max(0, speakerVolume - BASE_VOLUME);
    changeSpeakerVolume(newValue);
  }, [changeSpeakerVolume, speakerVolume]);

  const toggleSpeakerMute = useCallback(() => {
    toggleSpeakerMuted();
  }, [toggleSpeakerMuted]);

  const toggleMicMute = useCallback(() => {
    toggleMicMuted();
  }, [toggleMicMuted]);

  const setIsManualIdling = useCallback((value: boolean) => {
    isManualIdlingRef.current = value;
    requestAnimationFrame(() => {
      setIsIdling(value);
    });
  }, []);

  // Effects
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (idleCheck.current && now - lastActiveRef.current >= idleMinutes.current * 60_000) {
        setIsIdling(true);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let ticking = false;

    const updateActivity = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          lastActiveRef.current = Date.now();
          if (isIdling && !isManualIdlingRef.current) setIsIdling(false);
          ticking = false;
        });
      }
    };

    const events: Array<[keyof WindowEventMap, AddEventListenerOptions?]> = [
      ['mousemove', { passive: true }],
      ['scroll', { passive: true }],
    ];

    events.forEach(([e, opt]) => window.addEventListener(e, updateActivity, opt));
    return () => events.forEach(([e, opt]) => window.removeEventListener(e, updateActivity, opt));
  }, [isIdling]);

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
      new Logger('ActionScanner').info(`Status auto idle updated: ${enable}`);
      idleCheck.current = enable;
      lastActiveRef.current = Date.now();
    };
    changeStatusAutoIdle(ipc.systemSettings.statusAutoIdle.get());
    const unsub = ipc.systemSettings.statusAutoIdle.onUpdate(changeStatusAutoIdle);
    return () => unsub();
  }, []);

  useEffect(() => {
    const changeStatusAutoIdleMinutes = (value: number) => {
      new Logger('ActionScanner').info(`Status auto idle minutes updated: ${value}`);
      idleMinutes.current = value;
    };
    changeStatusAutoIdleMinutes(ipc.systemSettings.statusAutoIdleMinutes.get());
    const unsub = ipc.systemSettings.statusAutoIdleMinutes.onUpdate(changeStatusAutoIdleMinutes);
    return () => unsub();
  }, []);

  useEffect(() => {
    const changeDefaultSpeakingKey = (key: string) => {
      new Logger('ActionScanner').info(`Default speaking key updated: ${key}`);
      speakingKeyRef.current = key;
    };
    changeDefaultSpeakingKey(ipc.systemSettings.defaultSpeakingKey.get());
    const unsub = ipc.systemSettings.defaultSpeakingKey.onUpdate(changeDefaultSpeakingKey);
    return () => unsub();
  }, []);

  useEffect(() => {
    const changeHotKeyOpenMainWindow = (key: string) => {
      new Logger('ActionScanner').info(`Hot key open main window updated: ${key}`);
      openMainWindowKeyRef.current = key;
    };
    changeHotKeyOpenMainWindow(ipc.systemSettings.hotKeyOpenMainWindow.get());
    const unsub = ipc.systemSettings.hotKeyOpenMainWindow.onUpdate(changeHotKeyOpenMainWindow);
    return () => unsub();
  }, []);

  useEffect(() => {
    const changeHotKeyIncreaseVolume = (key: string) => {
      new Logger('ActionScanner').info(`Hot key increase volume updated: ${key}`);
      increaseVolumeKeyRef.current = key;
    };
    changeHotKeyIncreaseVolume(ipc.systemSettings.hotKeyIncreaseVolume.get());
    const unsub = ipc.systemSettings.hotKeyIncreaseVolume.onUpdate(changeHotKeyIncreaseVolume);
    return () => unsub();
  }, []);

  useEffect(() => {
    const changeHotKeyDecreaseVolume = (key: string) => {
      new Logger('ActionScanner').info(`Hot key decrease volume updated: ${key}`);
      decreaseVolumeKeyRef.current = key;
    };
    changeHotKeyDecreaseVolume(ipc.systemSettings.hotKeyDecreaseVolume.get());
    const unsub = ipc.systemSettings.hotKeyDecreaseVolume.onUpdate(changeHotKeyDecreaseVolume);
    return () => unsub();
  }, []);

  useEffect(() => {
    const changeHotKeyToggleSpeaker = (key: string) => {
      new Logger('ActionScanner').info(`Hot key toggle speaker updated: ${key}`);
      toggleSpeakerKeyRef.current = key;
    };
    changeHotKeyToggleSpeaker(ipc.systemSettings.hotKeyToggleSpeaker.get());
    const unsub = ipc.systemSettings.hotKeyToggleSpeaker.onUpdate(changeHotKeyToggleSpeaker);
    return () => unsub();
  }, []);

  useEffect(() => {
    const changeHotKeyToggleMicrophone = (key: string) => {
      new Logger('ActionScanner').info(`Hot key toggle microphone updated: ${key}`);
      toggleMicrophoneKeyRef.current = key;
    };
    changeHotKeyToggleMicrophone(ipc.systemSettings.hotKeyToggleMicrophone.get());
    const unsub = ipc.systemSettings.hotKeyToggleMicrophone.onUpdate(changeHotKeyToggleMicrophone);
    return () => unsub();
  }, []);

  const contextValue = useMemo(() => ({ isIdling, isManualIdling: isManualIdlingRef.current, setIsManualIdling }), [isIdling, setIsManualIdling]);

  return <ActionScannerContext.Provider value={contextValue}>{children}</ActionScannerContext.Provider>;
};

ActionScannerProvider.displayName = 'ActionScannerProvider';

export default ActionScannerProvider;

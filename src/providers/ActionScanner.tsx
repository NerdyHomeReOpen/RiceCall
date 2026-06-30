import React, { useContext, createContext, ReactNode, useRef, useEffect, useCallback, useState, useMemo } from 'react';

import * as ipc from '@/main/ipc';

import Logger from '@/utils/logger';

import { useWebRTC } from '@/providers/WebRTC';

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
  const { pressSpeakKey, releaseSpeakKey, addSpeakerVolume, subtractSpeakerVolume, toggleSpeakerMuted, toggleMicMuted } = useWebRTC();

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

  const [isIdling, setIsIdling] = useState<boolean>(false);

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
    addSpeakerVolume();
  }, [addSpeakerVolume]);

  const toggleDownVolume = useCallback(() => {
    subtractSpeakerVolume();
  }, [subtractSpeakerVolume]);

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
    const handleKeyDown = (e: KeyboardEvent) => {
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

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startSpeak, stopSpeak, toggleMainWindows, toggleUpVolume, toggleDownVolume, toggleSpeakerMute, toggleMicMute]);

  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if (new Set(['Shift', 'Control', 'Alt', 'Meta']).has(e.key)) return;
      const mk = buildKey(e);
      switch (mk) {
        case speakingKeyRef.current:
          stopSpeak();
          break;
      }
    };

    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  }, [stopSpeak]);

  // TODO: Use system event instead of window event
  useEffect(() => {
    const handleBlur = () => {
      stopSpeak();
    };

    document.addEventListener('blur', handleBlur);
    return () => document.removeEventListener('blur', handleBlur);
  }, [stopSpeak]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) stopSpeak();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [stopSpeak]);

  useEffect(() => {
    const handleStatusAutoIdleUpdate = (enable: boolean) => {
      new Logger('ActionScanner').info(`Status auto idle updated: ${enable}`);
      idleCheck.current = enable;
      lastActiveRef.current = Date.now();
    };

    handleStatusAutoIdleUpdate(ipc.systemSettings.statusAutoIdle.get());

    const unsub = ipc.systemSettings.statusAutoIdle.onUpdate(handleStatusAutoIdleUpdate);
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleStatusAutoIdleMinutesUpdate = (value: number) => {
      new Logger('ActionScanner').info(`Status auto idle minutes updated: ${value}`);
      idleMinutes.current = value;
    };

    handleStatusAutoIdleMinutesUpdate(ipc.systemSettings.statusAutoIdleMinutes.get());

    const unsub = ipc.systemSettings.statusAutoIdleMinutes.onUpdate(handleStatusAutoIdleMinutesUpdate);
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleDefaultSpeakingKeyUpdate = (key: string) => {
      new Logger('ActionScanner').info(`Default speaking key updated: ${key}`);
      speakingKeyRef.current = key;
    };

    handleDefaultSpeakingKeyUpdate(ipc.systemSettings.defaultSpeakingKey.get());

    const unsub = ipc.systemSettings.defaultSpeakingKey.onUpdate(handleDefaultSpeakingKeyUpdate);
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleHotKeyOpenMainWindowUpdate = (key: string) => {
      new Logger('ActionScanner').info(`Hot key open main window updated: ${key}`);
      openMainWindowKeyRef.current = key;
    };

    handleHotKeyOpenMainWindowUpdate(ipc.systemSettings.hotKeyOpenMainWindow.get());

    const unsub = ipc.systemSettings.hotKeyOpenMainWindow.onUpdate(handleHotKeyOpenMainWindowUpdate);
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleHotKeyIncreaseVolumeUpdate = (key: string) => {
      new Logger('ActionScanner').info(`Hot key increase volume updated: ${key}`);
      increaseVolumeKeyRef.current = key;
    };

    handleHotKeyIncreaseVolumeUpdate(ipc.systemSettings.hotKeyIncreaseVolume.get());

    const unsub = ipc.systemSettings.hotKeyIncreaseVolume.onUpdate(handleHotKeyIncreaseVolumeUpdate);
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleHotKeyDecreaseVolumeUpdate = (key: string) => {
      new Logger('ActionScanner').info(`Hot key decrease volume updated: ${key}`);
      decreaseVolumeKeyRef.current = key;
    };

    handleHotKeyDecreaseVolumeUpdate(ipc.systemSettings.hotKeyDecreaseVolume.get());

    const unsub = ipc.systemSettings.hotKeyDecreaseVolume.onUpdate(handleHotKeyDecreaseVolumeUpdate);
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleHotKeyToggleSpeakerUpdate = (key: string) => {
      new Logger('ActionScanner').info(`Hot key toggle speaker updated: ${key}`);
      toggleSpeakerKeyRef.current = key;
    };

    handleHotKeyToggleSpeakerUpdate(ipc.systemSettings.hotKeyToggleSpeaker.get());

    const unsub = ipc.systemSettings.hotKeyToggleSpeaker.onUpdate(handleHotKeyToggleSpeakerUpdate);
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleHotKeyToggleMicrophoneUpdate = (key: string) => {
      new Logger('ActionScanner').info(`Hot key toggle microphone updated: ${key}`);
      toggleMicrophoneKeyRef.current = key;
    };

    handleHotKeyToggleMicrophoneUpdate(ipc.systemSettings.hotKeyToggleMicrophone.get());

    const unsub = ipc.systemSettings.hotKeyToggleMicrophone.onUpdate(handleHotKeyToggleMicrophoneUpdate);
    return () => unsub();
  }, []);

  const contextValue = useMemo(() => ({ isIdling, isManualIdling: isManualIdlingRef.current, setIsManualIdling }), [isIdling, setIsManualIdling]);

  return <ActionScannerContext.Provider value={contextValue}>{children}</ActionScannerContext.Provider>;
};

ActionScannerProvider.displayName = 'ActionScannerProvider';

export default ActionScannerProvider;

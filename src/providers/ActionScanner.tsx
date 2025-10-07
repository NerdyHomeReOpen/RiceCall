import React, { useContext, createContext, ReactNode, useRef, useEffect, useCallback, useState } from 'react';

// Providers
import { useWebRTC } from '@/providers/WebRTC';

// Services
import ipc from '@/services/ipc.service';

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
  const speakingKeyPressedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // States
  const [isKeepAlive, setIsKeepAlive] = useState<boolean>(true);

  // Handlers
  const handleSpeakingKeyToggled = useCallback(() => {
    if (speakingKeyPressedTimeoutRef.current) clearTimeout(speakingKeyPressedTimeoutRef.current);
    speakingKeyPressedTimeoutRef.current = setTimeout(() => {
      speakingActiveRef.current = false;
      webRTC.setSpeakKeyPressed(false);
    }, 600);

    if (speakingActiveRef.current || !webRTC.isMicTaken) return;
    speakingActiveRef.current = true;
    webRTC.setSpeakKeyPressed(true);
  }, [webRTC]);

  const handleOpenMainWindowToggled = useCallback(() => {
    // TODO: key detection in background
  }, []);

  const handleIncreaseVolumeToggled = useCallback(() => {
    const newValue = Math.min(100, webRTC.speakerVolume + 5);
    webRTC.changeSpeakerVolume(newValue);
  }, [webRTC]);

  const handleDecreaseVolumeToggled = useCallback(() => {
    const newValue = Math.max(0, webRTC.speakerVolume - 5);
    webRTC.changeSpeakerVolume(newValue);
  }, [webRTC]);

  const handleSpeakerMuteToggled = useCallback(() => {
    webRTC.toggleSpeakerMuted();
  }, [webRTC]);

  const handleMicMuteToggled = useCallback(() => {
    webRTC.toggleMicMuted();
  }, [webRTC]);

  // Effects
  useEffect(() => {
    const unsubscribe = [
      ipc.detectKey.onDefaultSpeakingKeyToggled(handleSpeakingKeyToggled),
      ipc.detectKey.onHotKeyOpenMainWindowToggled(handleOpenMainWindowToggled),
      ipc.detectKey.onHotKeyIncreaseVolumeToggled(handleIncreaseVolumeToggled),
      ipc.detectKey.onHotKeyDecreaseVolumeToggled(handleDecreaseVolumeToggled),
      ipc.detectKey.onHotKeyToggleSpeakerToggled(handleSpeakerMuteToggled),
      ipc.detectKey.onHotKeyToggleMicrophoneToggled(handleMicMuteToggled),
    ];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, [handleSpeakingKeyToggled, handleOpenMainWindowToggled, handleIncreaseVolumeToggled, handleDecreaseVolumeToggled, handleSpeakerMuteToggled, handleMicMuteToggled]);

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

    changeStatusAutoIdle(ipc.systemSettings.statusAutoIdle.get());
    changeStatusAutoIdleMinutes(ipc.systemSettings.statusAutoIdleMinutes.get());
    changeDefaultSpeakingKey(ipc.systemSettings.defaultSpeakingKey.get());
    changeHotKeyOpenMainWindow(ipc.systemSettings.hotKeyOpenMainWindow.get());
    changeHotKeyIncreaseVolume(ipc.systemSettings.hotKeyIncreaseVolume.get());
    changeHotKeyDecreaseVolume(ipc.systemSettings.hotKeyDecreaseVolume.get());
    changeHotKeyToggleSpeaker(ipc.systemSettings.hotKeyToggleSpeaker.get());
    changeHotKeyToggleMicrophone(ipc.systemSettings.hotKeyToggleMicrophone.get());

    const unsubscribe = [
      ipc.systemSettings.statusAutoIdle.onUpdate(changeStatusAutoIdle),
      ipc.systemSettings.statusAutoIdleMinutes.onUpdate(changeStatusAutoIdleMinutes),
      ipc.systemSettings.defaultSpeakingKey.onUpdate(changeDefaultSpeakingKey),
      ipc.systemSettings.hotKeyOpenMainWindow.onUpdate(changeHotKeyOpenMainWindow),
      ipc.systemSettings.hotKeyIncreaseVolume.onUpdate(changeHotKeyIncreaseVolume),
      ipc.systemSettings.hotKeyDecreaseVolume.onUpdate(changeHotKeyDecreaseVolume),
      ipc.systemSettings.hotKeyToggleSpeaker.onUpdate(changeHotKeyToggleSpeaker),
      ipc.systemSettings.hotKeyToggleMicrophone.onUpdate(changeHotKeyToggleMicrophone),
    ];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, []);

  return <ActionScannerContext.Provider value={{ isKeepAlive }}>{children}</ActionScannerContext.Provider>;
};

ActionScannerProvider.displayName = 'ActionScannerProvider';

export default ActionScannerProvider;

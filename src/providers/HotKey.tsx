import React, { useContext, createContext, ReactNode, useRef, useState, useEffect } from 'react';

// Providers
import { useWebRTC } from '@/providers/WebRTC';

// Services
import ipcService from '@/services/ipc.service';

const BASE_VOLUME = 5;

type HotkeyAction = (e: KeyboardEvent) => void;

const HotKeyContext = createContext<Map<string, HotkeyAction>>(new Map());

export const useHotKey = () => {
  const context = useContext(HotKeyContext);
  if (!context) throw new Error('useHotKey must be used within a HotKeyProvider');
  return context;
};

interface HotKeyProviderProps {
  children: ReactNode;
}

const HotKeyProvider = ({ children }: HotKeyProviderProps) => {
  // Hooks
  const webRTC = useWebRTC();

  // Ref
  const hotkeyMapRef = useRef<Map<string, HotkeyAction>>(new Map());

  // State
  const [hotKeys, setHotKeys] = useState<Record<string, string>>({
    speakingKey: 'v',
    openMainWindow: 'F1',
    increaseVolume: 'Ctrl+m',
    decreaseVolume: 'Shift+m',
    toggleSpeaker: 'Alt+m',
    toggleMicrophone: 'Alt+v',
  });

  // Handlers
  const updateHotkey = (index: string, key: string): void => {
    setHotKeys((prev) => {
      const newState = { ...prev };
      newState[index] = key;
      return newState;
    });
  };

  const toggleSpeak = () => {};

  const toggleMainWindows = () => {};

  const toggleUpVolume = () => {
    console.log('[Action] toggleUpVolume');
    const newValue = Math.min(100, webRTC.speakerVolume + BASE_VOLUME);
    webRTC.handleEditSpeakerVolume(newValue);
    console.log('[Up]', webRTC.speakerVolume, '=>', newValue);
  };

  const toggleDownVolume = () => {
    console.log('[Action] toggleDownVolume');
    const newValue = Math.max(0, webRTC.speakerVolume - BASE_VOLUME);
    webRTC.handleEditSpeakerVolume(newValue);
    console.log('[Down]', webRTC.speakerVolume, '=>', newValue);
  };

  const toggleSpeakerMute = () => {
    console.log('[Action] toggleSpeakerMute');
    if (webRTC.speakerVolume === 0) {
      const prevVolume = parseInt(localStorage.getItem('previous-speaker-volume') || '50');
      webRTC.handleEditSpeakerVolume(prevVolume);
    } else {
      localStorage.setItem('previous-speaker-volume', webRTC.speakerVolume.toString());
      webRTC.handleEditSpeakerVolume(0);
    }
  };

  const toggleMicMute = () => {
    console.log('[Action] toggleMicMute');
    if (webRTC.speakerVolume === 0) {
      const prevVolume = parseInt(localStorage.getItem('previous-mic-volume') || '50');
      webRTC.handleEditMicVolume(prevVolume);
    } else {
      localStorage.setItem('previous-mic-volume', webRTC.micVolume.toString());
      webRTC.handleEditMicVolume(0);
    }
  };

  // Effects
  useEffect(() => {
    ipcService.systemSettings.defaultSpeakingKey.get(() => {});
    ipcService.systemSettings.hotKeyOpenMainWindow.get(() => {});
    ipcService.systemSettings.hotKeyIncreaseVolume.get(() => {});
    ipcService.systemSettings.hotKeyDecreaseVolume.get(() => {});
    ipcService.systemSettings.hotKeyToggleSpeaker.get(() => {});
    ipcService.systemSettings.hotKeyToggleMicrophone.get(() => {});

    const offUpdateDefaultSpeakingKey = ipcService.systemSettings.defaultSpeakingKey.onUpdate((key) => {
      console.log('[update] speakingKey', key);
      hotkeyMapRef.current.delete(hotKeys.speakingKey);
      hotkeyMapRef.current.set(key, toggleSpeak);
      updateHotkey('speakingKey', key);
    });
    const offUpdateHotKeyOpenMainWindow = ipcService.systemSettings.hotKeyOpenMainWindow.onUpdate((key) => {
      console.log('[update] openMainWindow', key);
      hotkeyMapRef.current.delete(hotKeys.openMainWindow);
      hotkeyMapRef.current.set(key, toggleMainWindows);
      updateHotkey('openMainWindow', key);
    });
    const offUpdateHotKeyIncreaseVolume = ipcService.systemSettings.hotKeyIncreaseVolume.onUpdate((key) => {
      console.log('[update] increaseVolume', key);
      hotkeyMapRef.current.delete(hotKeys.increaseVolume);
      hotkeyMapRef.current.set(key, toggleUpVolume);
      updateHotkey('increaseVolume', key);
    });
    const offUpdateHotKeyDecreaseVolume = ipcService.systemSettings.hotKeyDecreaseVolume.onUpdate((key) => {
      console.log('[update] decreaseVolume', key);
      hotkeyMapRef.current.delete(hotKeys.decreaseVolume);
      hotkeyMapRef.current.set(key, toggleDownVolume);
      updateHotkey('decreaseVolume', key);
    });
    const offUpdateHotKeyToggleSpeaker = ipcService.systemSettings.hotKeyToggleSpeaker.onUpdate((key) => {
      console.log('[update] toggleSpeaker', key);
      hotkeyMapRef.current.delete(hotKeys.toggleSpeaker);
      hotkeyMapRef.current.set(key, toggleMicMute);
      updateHotkey('toggleSpeaker', key);
    });
    const offUpdateHotKeyToggleMicrophone = ipcService.systemSettings.hotKeyToggleMicrophone.onUpdate((key) => {
      console.log('[update] toggleMicrophone', key);
      hotkeyMapRef.current.delete(hotKeys.toggleMicrophone);
      hotkeyMapRef.current.set(key, toggleSpeakerMute);
      updateHotkey('toggleMicrophone', key);
    });

    return () => {
      offUpdateDefaultSpeakingKey();
      offUpdateHotKeyOpenMainWindow();
      offUpdateHotKeyIncreaseVolume();
      offUpdateHotKeyDecreaseVolume();
      offUpdateHotKeyToggleSpeaker();
      offUpdateHotKeyToggleMicrophone();
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

      const action = hotkeyMapRef.current.get(mergeKey);
      console.log(mergeKey);
      if (action) {
        e.preventDefault();
        action(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return <HotKeyContext.Provider value={hotkeyMapRef.current}>{children}</HotKeyContext.Provider>;
};

HotKeyProvider.displayName = 'HotKeyProvider';

export default HotKeyProvider;

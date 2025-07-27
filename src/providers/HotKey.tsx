import React, { useContext, createContext, ReactNode, useRef, useEffect, useCallback } from 'react';

// Providers
import { useWebRTC } from '@/providers/WebRTC';

// Services
import ipcService from '@/services/ipc.service';

const BASE_VOLUME = 5;

const HotKeyContext = createContext<Map<string, () => void>>(new Map());

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
  const speakingKeyRef = useRef<string>('v');
  const openMainWindowKeyRef = useRef<string>('F1');
  const increaseVolumeKeyRef = useRef<string>('Ctrl+m');
  const decreaseVolumeKeyRef = useRef<string>('Shift+m');
  const toggleSpeakerKeyRef = useRef<string>('Alt+m');
  const toggleMicrophoneKeyRef = useRef<string>('Alt+v');

  // Handlers
  const toggleSpeak = useCallback(() => {
    console.log('[Action] toggleSpeak');
  }, []);

  const toggleMainWindows = useCallback(() => {
    console.log('[Action] toggleMainWindows');
  }, []);

  const toggleUpVolume = useCallback(() => {
    console.log('[Action] toggleUpVolume');
    const newValue = Math.min(100, webRTC.speakerVolume + BASE_VOLUME);
    webRTC.handleEditSpeakerVolume(newValue);
    console.log('[Up]', webRTC.speakerVolume, '=>', newValue);
  }, [webRTC]);

  const toggleDownVolume = useCallback(() => {
    console.log('[Action] toggleDownVolume');
    const newValue = Math.max(0, webRTC.speakerVolume - BASE_VOLUME);
    webRTC.handleEditSpeakerVolume(newValue);
    console.log('[Down]', webRTC.speakerVolume, '=>', newValue);
  }, [webRTC]);

  const toggleSpeakerMute = useCallback(() => {
    console.log('[Action] toggleSpeakerMute');
    webRTC.handleToggleSpeakerMute();
  }, [webRTC]);

  const toggleMicMute = useCallback(() => {
    console.log('[Action] toggleMicMute');
    webRTC.handleToggleMicMute();
  }, [webRTC]);

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
      speakingKeyRef.current = key;
    });
    const offUpdateHotKeyOpenMainWindow = ipcService.systemSettings.hotKeyOpenMainWindow.onUpdate((key) => {
      console.log('[update] openMainWindow', key);
      openMainWindowKeyRef.current = key;
    });
    const offUpdateHotKeyIncreaseVolume = ipcService.systemSettings.hotKeyIncreaseVolume.onUpdate((key) => {
      console.log('[update] increaseVolume', key);
      increaseVolumeKeyRef.current = key;
    });
    const offUpdateHotKeyDecreaseVolume = ipcService.systemSettings.hotKeyDecreaseVolume.onUpdate((key) => {
      console.log('[update] decreaseVolume', key);
      decreaseVolumeKeyRef.current = key;
    });
    const offUpdateHotKeyToggleSpeaker = ipcService.systemSettings.hotKeyToggleSpeaker.onUpdate((key) => {
      console.log('[update] toggleSpeaker', key);
      toggleSpeakerKeyRef.current = key;
    });
    const offUpdateHotKeyToggleMicrophone = ipcService.systemSettings.hotKeyToggleMicrophone.onUpdate((key) => {
      console.log('[update] toggleMicrophone', key);
      toggleMicrophoneKeyRef.current = key;
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

      switch (mergeKey) {
        case speakingKeyRef.current:
          toggleSpeak();
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
  }, [toggleSpeak, toggleMainWindows, toggleUpVolume, toggleDownVolume, toggleSpeakerMute, toggleMicMute]);

  return <HotKeyContext.Provider value={new Map()}>{children}</HotKeyContext.Provider>;
};

HotKeyProvider.displayName = 'HotKeyProvider';

export default HotKeyProvider;

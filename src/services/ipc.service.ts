/* eslint-disable @typescript-eslint/no-explicit-any */
import { DiscordPresence, PopupType, SpeakingMode, MixMode, ServerToClientEvents, ClientToServerEvents, ChannelUIMode } from '@/types';

// Safe reference to electron's ipcRenderer
let ipcRenderer: any = null;

// Initialize ipcRenderer only in client-side and Electron environment
if (typeof window !== 'undefined' && window.require) {
  try {
    const electron = window.require('electron');
    ipcRenderer = electron.ipcRenderer;
  } catch (error) {
    console.warn('Not in Electron environment:', error);
  }
}

const isElectron = !!ipcRenderer;

const ipcService = {
  exit: () => {
    if (!isElectron) return;
    ipcRenderer.send('exit');
  },

  socket: {
    send: <T extends keyof ClientToServerEvents>(event: T, ...args: Parameters<ClientToServerEvents[T]>) => {
      if (!isElectron) return;
      ipcRenderer.send(event, ...args);
    },
    on: <T extends keyof ServerToClientEvents>(event: T, callback: (...args: Parameters<ServerToClientEvents[T]>) => ReturnType<ServerToClientEvents[T]>) => {
      if (!isElectron) return () => {};
      ipcRenderer.on(event, (_: any, ...args: Parameters<ServerToClientEvents[T]>) => callback(...args));
      return () => ipcRenderer.removeAllListeners(event);
    },
  },

  deepLink: {
    onDeepLink: (callback: (serverId: string) => void) => {
      if (!isElectron) return () => {};
      ipcRenderer.on('deepLink', (_: any, serverId: string) => callback(serverId));
      return () => ipcRenderer.removeAllListeners('deepLink');
    },
  },

  window: {
    resize: (width: number, height: number) => {
      if (!isElectron) return;
      ipcRenderer.send('resize', width, height);
    },

    minimize: () => {
      if (!isElectron) return;
      ipcRenderer.send('window-control', 'minimize');
    },

    maximize: () => {
      if (!isElectron) return;
      ipcRenderer.send('window-control', 'maximize');
    },

    unmaximize: () => {
      if (!isElectron) return;
      ipcRenderer.send('window-control', 'unmaximize');
    },

    openExternal: (url: string) => {
      if (!isElectron) return;
      ipcRenderer.send('open-external', url);
    },

    close: () => {
      if (!isElectron) return;
      ipcRenderer.send('window-control', 'close');
    },

    onMaximize: (callback: () => void) => {
      if (!isElectron) return () => {};
      ipcRenderer.on('maximize', callback);
      return () => ipcRenderer.removeAllListeners('maximize');
    },

    onUnmaximize: (callback: () => void) => {
      if (!isElectron) return () => {};
      ipcRenderer.on('unmaximize', callback);
      return () => ipcRenderer.removeAllListeners('unmaximize');
    },
  },

  initialData: {
    on: (callback: (data: any) => void) => {
      if (!isElectron) return;
      ipcRenderer.once('initial-data', (_: any, data: any) => callback(data));
    },
  },

  popup: {
    open: (type: PopupType, id: string, data: any, force?: boolean) => {
      if (!isElectron) return;
      ipcRenderer.send('open-popup', type, id, data, force);
    },

    close: (id: string) => {
      if (!isElectron) return;
      ipcRenderer.send('close-popup', id);
    },

    closeAll: () => {
      if (!isElectron) return;
      ipcRenderer.send('close-all-popups');
    },

    submit: (to: string, data?: any) => {
      if (!isElectron) return;
      ipcRenderer.send('popup-submit', to, data);
    },

    onSubmit: (host: string, callback: (data: any) => void) => {
      if (!isElectron) return;
      ipcRenderer.on('popup-submit', (_: any, from: string, data?: any) => {
        if (from != host) return;
        callback(data);
        ipcRenderer.removeAllListeners('popup-submit');
      });
    },
  },

  auth: {
    login: (token: string) => {
      if (!isElectron) return;
      ipcRenderer.send('login', token);
    },

    logout: () => {
      if (!isElectron) return;
      ipcRenderer.send('logout');
    },
  },

  discord: {
    updatePresence: (presence: DiscordPresence) => {
      if (!isElectron) return;
      ipcRenderer.send('update-discord-presence', presence);
    },
  },

  fontList: {
    get: (callback: (fonts: string[]) => void) => {
      if (!isElectron) return;
      ipcRenderer.send('get-font-list');
      ipcRenderer.once('font-list', (_: any, fonts: string[]) => {
        callback(fonts);
      });
    },
  },

  systemSettings: {
    get: (
      callback: (data: {
        // Basic settings
        autoLogin: boolean;
        autoLaunch: boolean;
        alwaysOnTop: boolean;
        statusAutoIdle: boolean;
        statusAutoIdleMinutes: number;
        statusAutoDnd: boolean;
        channelUIMode: ChannelUIMode;
        closeToTray: boolean;
        fontSize: number;
        font: string;

        // Mix settings
        inputAudioDevice: string;
        outputAudioDevice: string;
        mixEffect: boolean;
        mixEffectType: string;
        autoMixSetting: boolean;
        echoCancellation: boolean;
        noiseCancellation: boolean;
        microphoneAmplification: boolean;
        manualMixMode: boolean;
        mixMode: MixMode;

        // Voice settings
        speakingMode: SpeakingMode;
        defaultSpeakingKey: string;

        // Privacy settings
        notSaveMessageHistory: boolean;

        // Hotheys Settings
        hotKeyOpenMainWindow: string;
        hotKeyScreenshot: string;
        hotKeyIncreaseVolume: string;
        hotKeyDecreaseVolume: string;
        hotKeyToggleSpeaker: string;
        hotKeyToggleMicrophone: string;

        // SoundEffect Setting
        disableAllSoundEffect: boolean;
        enterVoiceChannelSound: boolean;
        leaveVoiceChannelSound: boolean;
        startSpeakingSound: boolean;
        stopSpeakingSound: boolean;
        receiveDirectMessageSound: boolean;
        receiveChannelMessageSound: boolean;
      }) => void,
    ) => {
      if (!isElectron) return;
      ipcRenderer.send('get-system-settings');
      ipcRenderer.once('system-settings', (_: any, data: any) => {
        callback(data);
      });
    },

    autoLogin: {
      set: (enable: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-auto-login', enable);
      },

      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const handler = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.send('get-auto-login');
        ipcRenderer.on('auto-login', handler);
        return () => ipcRenderer.off('auto-login', handler);
      },
    },

    autoLaunch: {
      set: (enable: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-auto-launch', enable);
      },

      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const handler = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.send('get-auto-launch');
        ipcRenderer.on('auto-launch', handler);
        return () => ipcRenderer.off('auto-launch', handler);
      },
    },

    alwaysOnTop: {
      set: (enable: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-always-on-top', enable);
      },

      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const handler = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.send('get-always-on-top');
        ipcRenderer.on('always-on-top', handler);
        return () => ipcRenderer.off('always-on-top', handler);
      },
    },

    statusAutoIdle: {
      set: (enable: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-status-auto-idle', enable);
      },

      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const handler = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.send('get-status-auto-idle');
        ipcRenderer.on('status-auto-idle', handler);
        return () => ipcRenderer.off('status-auto-idle', handler);
      },
    },

    statusAutoIdleMinutes: {
      set: (fontSize: number) => {
        if (!isElectron) return;
        ipcRenderer.send('set-status-auto-idle-minutes', fontSize);
      },

      get: (callback: (fontSize: number) => void) => {
        if (!isElectron) return () => {};
        const handler = (_: any, fontSize: number) => callback(fontSize);
        ipcRenderer.send('get-status-auto-idle-minutes');
        ipcRenderer.on('status-auto-idle-minutes', handler);
        return () => ipcRenderer.off('status-auto-idle-minutes', handler);
      },
    },

    statusAutoDnd: {
      set: (enable: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-status-auto-dnd', enable);
      },

      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const handler = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.send('get-status-auto-dnd');
        ipcRenderer.on('status-auto-dnd', handler);
        return () => ipcRenderer.off('status-auto-dnd', handler);
      },
    },

    channelUIMode: {
      set: (key: ChannelUIMode) => {
        if (!isElectron) return;
        ipcRenderer.send('set-channel-ui-mode', key);
      },

      get: (callback: (key: ChannelUIMode) => void) => {
        if (!isElectron) return () => {};
        const handler = (_: any, key: ChannelUIMode) => callback(key);
        ipcRenderer.send('get-channel-ui-mode');
        ipcRenderer.on('channel-ui-mode', handler);
        return () => ipcRenderer.off('channel-ui-mode', handler);
      },
    },

    closeToTray: {
      set: (enable: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-close-to-tray', enable);
      },

      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const handler = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.send('get-close-to-tray');
        ipcRenderer.on('close-to-tray', handler);
        return () => ipcRenderer.off('close-to-tray', handler);
      },
    },

    disclaimer: {
      dontShowNextTime: () => {
        if (!isElectron) return;
        ipcRenderer.send('dont-show-disclaimer-next-time');
      },
    },

    font: {
      set: (font: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-font', font);
      },

      get: (callback: (font: string) => void) => {
        if (!isElectron) return () => {};
        const handler = (_: any, font: string) => callback(font);
        ipcRenderer.send('get-font');
        ipcRenderer.on('font', handler);
        return () => ipcRenderer.off('font', handler);
      },
    },

    fontSize: {
      set: (fontSize: number) => {
        if (!isElectron) return;
        ipcRenderer.send('set-font-size', fontSize);
      },

      get: (callback: (fontSize: number) => void) => {
        if (!isElectron) return () => {};
        const handler = (_: any, fontSize: number) => callback(fontSize);
        ipcRenderer.send('get-font-size');
        ipcRenderer.on('font-size', handler);
        return () => ipcRenderer.off('font-size', handler);
      },
    },

    inputAudioDevice: {
      set: (deviceId: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-input-audio-device', deviceId);
      },

      get: (callback: (deviceId: string) => void) => {
        if (!isElectron) return () => {};
        const handler = (_: any, deviceId: string) => callback(deviceId);
        ipcRenderer.send('get-input-audio-device');
        ipcRenderer.on('input-audio-device', handler);
        return () => ipcRenderer.off('input-audio-device', handler);
      },
    },

    outputAudioDevice: {
      set: (deviceId: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-output-audio-device', deviceId);
      },

      get: (callback: (deviceId: string) => void) => {
        if (!isElectron) return () => {};
        const handler = (_: any, deviceId: string) => callback(deviceId);
        ipcRenderer.send('get-output-audio-device');
        ipcRenderer.on('output-audio-device', handler);
        return () => ipcRenderer.off('output-audio-device', handler);
      },
    },

    mixEffect: {
      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-mix-effect', enabled);
      },

      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const handler = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.send('get-mix-effect');
        ipcRenderer.on('mix-effect', handler);
        return () => ipcRenderer.off('mix-effect', handler);
      },
    },

    mixEffectType: {
      set: (key: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-mix-effect-type', key);
      },

      get: (callback: (key: string) => void) => {
        if (!isElectron) return () => {};
        const handler = (_: any, key: string) => callback(key);
        ipcRenderer.send('get-mix-effect-type');
        ipcRenderer.on('mix-effect-type', handler);
        return () => ipcRenderer.off('mix-effect-type', handler);
      },
    },

    autoMixSetting: {
      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-auto-mix-setting', enabled);
      },

      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const handler = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.send('get-auto-mix-setting');
        ipcRenderer.on('auto-mix-setting', handler);
        return () => ipcRenderer.off('auto-mix-setting', handler);
      },
    },

    echoCancellation: {
      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-echo-cancellation', enabled);
      },

      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const handler = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.send('get-echo-cancellation');
        ipcRenderer.on('echo-cancellation', handler);
        return () => ipcRenderer.off('echo-cancellation', handler);
      },
    },

    noiseCancellation: {
      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-noise-cancellation', enabled);
      },

      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const handler = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.send('get-noise-cancellation');
        ipcRenderer.on('noise-cancellation', handler);
        return () => ipcRenderer.off('noise-cancellation', handler);
      },
    },

    microphoneAmplification: {
      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-microphone-amplification', enabled);
      },

      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const handler = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.send('get-microphone-amplification');
        ipcRenderer.on('microphone-amplification', handler);
        return () => ipcRenderer.off('microphone-amplification', handler);
      },
    },

    manualMixMode: {
      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-manual-mix-mode', enabled);
      },

      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const handler = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.send('get-manual-mix-mode');
        ipcRenderer.on('manual-mix-mode', handler);
        return () => ipcRenderer.off('manual-mix-mode', handler);
      },
    },

    mixMode: {
      set: (key: MixMode) => {
        if (!isElectron) return;
        ipcRenderer.send('set-mix-mode', key);
      },

      get: (callback: (key: MixMode) => void) => {
        if (!isElectron) return () => {};
        const handler = (_: any, key: MixMode) => callback(key);
        ipcRenderer.send('get-mix-mode');
        ipcRenderer.on('mix-mode', handler);
        return () => ipcRenderer.off('mix-mode', handler);
      },
    },

    speakingMode: {
      set: (key: SpeakingMode) => {
        if (!isElectron) return;
        ipcRenderer.send('set-speaking-mode', key);
      },

      get: (callback: (key: SpeakingMode) => void) => {
        if (!isElectron) return () => {};
        const handler = (_: any, key: SpeakingMode) => callback(key);
        ipcRenderer.send('get-speaking-mode');
        ipcRenderer.on('speaking-mode', handler);
        return () => ipcRenderer.off('speaking-mode', handler);
      },
    },

    defaultSpeakingKey: {
      set: (key: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-default-speaking-key', key);
      },

      get: (callback: (key: string) => void) => {
        if (!isElectron) return () => {};
        const handler = (_: any, key: string) => callback(key);
        ipcRenderer.send('get-default-speaking-key');
        ipcRenderer.on('default-speaking-key', handler);
        return () => ipcRenderer.off('default-speaking-key', handler);
      },
    },

    notSaveMessageHistory: {
      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-not-save-message-history', enabled);
      },

      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const handler = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.send('get-not-save-message-history');
        ipcRenderer.on('not-save-message-history', handler);
        return () => ipcRenderer.off('not-save-message-history', handler);
      },
    },

    hotKeyOpenMainWindow: {
      set: (key: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-hot-key-open-main-window', key);
      },

      get: (callback: (key: string) => void) => {
        if (!isElectron) return () => {};
        const handler = (_: any, key: string) => callback(key);
        ipcRenderer.send('get-hot-key-open-main-window');
        ipcRenderer.on('hot-key-open-main-window', handler);
        return () => ipcRenderer.off('hot-key-open-main-window', handler);
      },
    },

    hotKeyIncreaseVolume: {
      set: (key: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-hot-key-increase-volume', key);
      },

      get: (callback: (key: string) => void) => {
        if (!isElectron) return () => {};
        const handler = (_: any, key: string) => callback(key);
        ipcRenderer.send('get-hot-key-increase-volume');
        ipcRenderer.on('hot-key-increase-volume', handler);
        return () => ipcRenderer.off('hot-key-increase-volume', handler);
      },
    },

    hotKeyDecreaseVolume: {
      set: (key: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-hot-key-decrease-volume', key);
      },

      get: (callback: (key: string) => void) => {
        if (!isElectron) return () => {};
        const handler = (_: any, key: string) => callback(key);
        ipcRenderer.send('get-hot-key-decrease-volume');
        ipcRenderer.on('hot-key-decrease-volume', handler);
        return () => ipcRenderer.off('hot-key-decrease-volume', handler);
      },
    },

    hotKeyToggleSpeaker: {
      set: (key: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-hot-key-toggle-speaker', key);
      },

      get: (callback: (key: string) => void) => {
        if (!isElectron) return () => {};
        const handler = (_: any, key: string) => callback(key);
        ipcRenderer.send('get-hot-key-toggle-speaker');
        ipcRenderer.on('hot-key-toggle-speaker', handler);
        return () => ipcRenderer.off('hot-key-toggle-speaker', handler);
      },
    },

    hotKeyToggleMicrophone: {
      set: (key: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-hot-key-toggle-microphone', key);
      },

      get: (callback: (key: string) => void) => {
        if (!isElectron) return () => {};
        const handler = (_: any, key: string) => callback(key);
        ipcRenderer.send('get-hot-key-toggle-microphone');
        ipcRenderer.on('hot-key-toggle-microphone', handler);
        return () => ipcRenderer.off('hot-key-toggle-microphone', handler);
      },
    },

    disableAllSoundEffect: {
      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-disable-all-sound-effect', enabled);
      },

      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const handler = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.send('get-disable-all-sound-effect');
        ipcRenderer.on('disable-all-sound-effect', handler);
        return () => ipcRenderer.off('disable-all-sound-effect', handler);
      },
    },

    enterVoiceChannelSound: {
      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-enter-voice-channel-sound', enabled);
      },

      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const handler = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.send('get-enter-voice-channel-sound');
        ipcRenderer.on('enter-voice-channel-sound', handler);
        return () => ipcRenderer.off('enter-voice-channel-sound', handler);
      },
    },

    leaveVoiceChannelSound: {
      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-leave-voice-channel-sound', enabled);
      },

      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const handler = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.send('get-leave-voice-channel-sound');
        ipcRenderer.on('leave-voice-channel-sound', handler);
        return () => ipcRenderer.off('leave-voice-channel-sound', handler);
      },
    },

    startSpeakingSound: {
      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-start-speaking-sound', enabled);
      },

      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const handler = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.send('get-start-speaking-sound');
        ipcRenderer.on('start-speaking-sound', handler);
        return () => ipcRenderer.off('start-speaking-sound', handler);
      },
    },

    stopSpeakingSound: {
      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-stop-speaking-sound', enabled);
      },

      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const handler = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.send('get-stop-speaking-sound');
        ipcRenderer.on('stop-speaking-sound', handler);
        return () => ipcRenderer.off('stop-speaking-sound', handler);
      },
    },

    receiveDirectMessageSound: {
      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-receive-direct-message-sound', enabled);
      },

      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const handler = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.send('get-receive-direct-message-sound');
        ipcRenderer.on('receive-direct-message-sound', handler);
        return () => ipcRenderer.off('receive-direct-message-sound', handler);
      },
    },

    receiveChannelMessageSound: {
      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-receive-channel-message-sound', enabled);
      },

      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const handler = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.send('get-receive-channel-message-sound');
        ipcRenderer.on('receive-channel-message-sound', handler);
        return () => ipcRenderer.off('receive-channel-message-sound', handler);
      },
    },
  },
};

export default ipcService;

/* eslint-disable @typescript-eslint/no-explicit-any */
import { DiscordPresence, PopupType, SpeakingMode, MixMode, ServerToClientEvents, ClientToServerEvents } from '@/types';

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

  // Remove specific listener
  removeListener: (event: string) => {
    if (!isElectron) return;
    ipcRenderer.removeAllListeners(event);
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

  // DeepLink methods
  deepLink: {
    onDeepLink: (callback: (serverId: string) => void) => {
      if (!isElectron) return () => {};
      ipcRenderer.on('deepLink', (_: any, serverId: string) => callback(serverId));
      return () => ipcRenderer.removeAllListeners('deepLink');
    },
  },

  // Initial data methods
  initialData: {
    request: (to: string, callback: (data: any) => void) => {
      if (!isElectron) return;
      ipcRenderer.send('request-initial-data', to);
      ipcRenderer.on('response-initial-data', (_: any, from: string, data: any) => {
        if (from != to) return;
        ipcRenderer.removeAllListeners('response-initial-data');
        callback(data);
      });
    },

    onRequest: (host: string, data: any, callback?: () => void) => {
      if (!isElectron) return;
      ipcRenderer.on('request-initial-data', (_: any, from: string) => {
        if (from != host) return;
        ipcRenderer.send('response-initial-data', from, data);
        ipcRenderer.removeAllListeners('request-initial-data');
        if (callback) callback();
      });
    },
  },

  // Window control methods
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

    onShakeWindow: (callback: () => void) => {
      if (!isElectron) return () => {};
      ipcRenderer.on('shakeWindow', callback);
      return () => ipcRenderer.removeAllListeners('shakeWindow');
    },
  },

  popup: {
    open: (type: PopupType, id: string, force?: boolean) => {
      if (!isElectron) return;
      ipcRenderer.send('open-popup', type, id, force);
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

  // Auth related methods
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

        channelUIMode: channelUIMode;
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
      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-auto-login');
        ipcRenderer.once('auto-login', (_: any, enabled: boolean) => {
          callback(enabled);
        });
      },

      set: (enable: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-auto-login', enable);
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('auto-login', (_: any, enabled: boolean) => {
          callback(enabled);
        });
        return () => ipcRenderer.removeAllListeners('auto-login');
      },
    },

    autoLaunch: {
      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-auto-launch');
        ipcRenderer.once('auto-launch', (_: any, enabled: boolean) => {
          callback(enabled);
        });
      },

      set: (enable: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-auto-launch', enable);
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('auto-launch', (_: any, enabled: boolean) => {
          callback(enabled);
        });
        return () => ipcRenderer.removeAllListeners('auto-launch');
      },
    },

    alwaysOnTop: {
      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-always-on-top');
        ipcRenderer.once('always-on-top', (_: any, enabled: boolean) => {
          callback(enabled);
        });
      },

      set: (enable: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-always-on-top', enable);
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('always-on-top', (_: any, enabled: boolean) => {
          callback(enabled);
        });
        return () => ipcRenderer.removeAllListeners('always-on-top');
      },
    },

    statusAutoIdle: {
      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-status-auto-idle');
        ipcRenderer.once('status-auto-idle', (_: any, enabled: boolean) => {
          callback(enabled);
        });
      },

      set: (enable: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-status-auto-idle', enable);
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('status-auto-idle', (_: any, enabled: boolean) => {
          callback(enabled);
        });
        return () => ipcRenderer.removeAllListeners('status-auto-idle');
      },
    },

    statusAutoIdleMinutes: {
      get: (callback: (fontSize: number) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-status-auto-idle-minutes');
        ipcRenderer.once('status-auto-idle-minutes', (_: any, fontSize: number) => {
          callback(fontSize);
        });
      },

      set: (fontSize: number) => {
        if (!isElectron) return;
        ipcRenderer.send('set-status-auto-idle-minutes', fontSize);
      },

      onUpdate: (callback: (fontSize: number) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('status-auto-idle-minutes', (_: any, fontSize: number) => {
          callback(fontSize);
        });
        return () => ipcRenderer.removeAllListeners('status-auto-idle-minutes');
      },
    },

    statusAutoDnd: {
      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-status-auto-dnd');
        ipcRenderer.once('status-auto-dnd', (_: any, enabled: boolean) => {
          callback(enabled);
        });
      },

      set: (enable: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-status-auto-dnd', enable);
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('status-auto-dnd', (_: any, enabled: boolean) => {
          callback(enabled);
        });
        return () => ipcRenderer.removeAllListeners('status-auto-dnd');
      },
    },

    channelUIMode: {
      get: (callback: (key: channelUIMode) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-channel-ui-mode');
        ipcRenderer.once('channel-ui-mode', (_: any, key: channelUIMode) => {
          callback(key);
        });
      },

      set: (key: channelUIMode) => {
        if (!isElectron) return;
        ipcRenderer.send('set-channel-ui-mode', key);
      },

      onUpdate: (callback: (key: channelUIMode) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('channel-ui-mode', (_: any, key: channelUIMode) => {
          callback(key);
        });
        return () => ipcRenderer.removeAllListeners('channel-ui-mode');
      },
    },

    closeToTray: {
      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-close-to-tray');
        ipcRenderer.once('close-to-tray', (_: any, enabled: boolean) => {
          callback(enabled);
        });
      },

      set: (enable: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-close-to-tray', enable);
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('close-to-tray', (_: any, enabled: boolean) => {
          callback(enabled);
        });
        return () => ipcRenderer.removeAllListeners('close-to-tray');
      },
    },

    disclaimer: {
      dontShowNextTime: () => {
        if (!isElectron) return;
        ipcRenderer.send('dont-show-disclaimer-next-time');
      },
    },

    font: {
      get: (callback: (font: string) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-font');
        ipcRenderer.once('font', (_: any, font: string) => {
          callback(font);
        });
      },

      set: (font: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-font', font);
      },

      onUpdate: (callback: (font: string) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('font', (_: any, font: string) => {
          callback(font);
        });
        return () => ipcRenderer.removeAllListeners('font');
      },
    },

    fontSize: {
      get: (callback: (fontSize: number) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-font-size');
        ipcRenderer.once('font-size', (_: any, fontSize: number) => {
          callback(fontSize);
        });
      },

      set: (fontSize: number) => {
        if (!isElectron) return;
        ipcRenderer.send('set-font-size', fontSize);
      },

      onUpdate: (callback: (fontSize: number) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('font-size', (_: any, fontSize: number) => {
          callback(fontSize);
        });
        return () => ipcRenderer.removeAllListeners('font-size');
      },
    },

    // Mix settings

    inputAudioDevice: {
      get: (callback: (deviceId: string) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-input-audio-device');
        ipcRenderer.once('input-audio-device', (_: any, deviceId: string) => {
          callback(deviceId);
        });
      },

      set: (deviceId: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-input-audio-device', deviceId);
      },

      onUpdate: (callback: (deviceId: string) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('input-audio-device', (_: any, deviceId: string) => {
          callback(deviceId);
        });
        return () => ipcRenderer.removeAllListeners('input-audio-device');
      },
    },

    outputAudioDevice: {
      get: (callback: (deviceId: string) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-output-audio-device');
        ipcRenderer.once('output-audio-device', (_: any, deviceId: string) => {
          callback(deviceId);
        });
      },

      set: (deviceId: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-output-audio-device', deviceId);
      },

      onUpdate: (callback: (deviceId: string) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('output-audio-device', (_: any, deviceId: string) => {
          callback(deviceId);
        });
        return () => ipcRenderer.removeAllListeners('output-audio-device');
      },
    },

    mixEffect: {
      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-mix-effect');
        ipcRenderer.once('mix-effect', (_: any, enabled: boolean) => {
          callback(enabled);
        });
      },

      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-mix-effect', enabled);
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('mix-effect', (_: any, enabled: boolean) => {
          callback(enabled);
        });
        return () => ipcRenderer.removeAllListeners('mix-effect');
      },
    },

    mixEffectType: {
      get: (callback: (key: string) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-mix-effect-type');
        ipcRenderer.once('mix-effect-type', (_: any, key: string) => {
          callback(key);
        });
      },

      set: (key: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-mix-effect-type', key);
      },

      onUpdate: (callback: (key: string) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('mix-effect-type', (_: any, key: string) => {
          callback(key);
        });
        return () => ipcRenderer.removeAllListeners('mix-effect-type');
      },
    },

    autoMixSetting: {
      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-auto-mix-setting');
        ipcRenderer.once('auto-mix-setting', (_: any, enabled: boolean) => {
          callback(enabled);
        });
      },

      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-auto-mix-setting', enabled);
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('auto-mix-setting', (_: any, enabled: boolean) => {
          callback(enabled);
        });
        return () => ipcRenderer.removeAllListeners('auto-mix-setting');
      },
    },

    echoCancellation: {
      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-echo-cancellation');
        ipcRenderer.once('echo-cancellation', (_: any, enabled: boolean) => {
          callback(enabled);
        });
      },

      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-echo-cancellation', enabled);
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('echo-cancellation', (_: any, enabled: boolean) => {
          callback(enabled);
        });
        return () => ipcRenderer.removeAllListeners('echo-cancellation');
      },
    },

    noiseCancellation: {
      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-noise-cancellation');
        ipcRenderer.once('noise-cancellation', (_: any, enabled: boolean) => {
          callback(enabled);
        });
      },

      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-noise-cancellation', enabled);
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('noise-cancellation', (_: any, enabled: boolean) => {
          callback(enabled);
        });
        return () => ipcRenderer.removeAllListeners('noise-cancellation');
      },
    },

    microphoneAmplification: {
      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-microphone-amplification');
        ipcRenderer.once('microphone-amplification', (_: any, enabled: boolean) => {
          callback(enabled);
        });
      },

      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-microphone-amplification', enabled);
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('microphone-amplification', (_: any, enabled: boolean) => {
          callback(enabled);
        });
        return () => ipcRenderer.removeAllListeners('microphone-amplification');
      },
    },

    manualMixMode: {
      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-manual-mix-mode');
        ipcRenderer.once('manual-mix-mode', (_: any, enabled: boolean) => {
          callback(enabled);
        });
      },

      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-manual-mix-mode', enabled);
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('manual-mix-mode', (_: any, enabled: boolean) => {
          callback(enabled);
        });
        return () => ipcRenderer.removeAllListeners('manual-mix-mode');
      },
    },

    mixMode: {
      get: (callback: (key: MixMode) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-mix-mode');
        ipcRenderer.once('mix-mode', (_: any, key: MixMode) => {
          callback(key);
        });
      },

      set: (key: MixMode) => {
        if (!isElectron) return;
        ipcRenderer.send('set-mix-mode', key);
      },

      onUpdate: (callback: (key: MixMode) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('mix-mode', (_: any, key: MixMode) => {
          callback(key);
        });
        return () => ipcRenderer.removeAllListeners('mix-mode');
      },
    },

    // Voice settings

    speakingMode: {
      get: (callback: (key: SpeakingMode) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-speaking-mode');
        ipcRenderer.once('speaking-mode', (_: any, key: SpeakingMode) => {
          callback(key);
        });
      },

      set: (key: SpeakingMode) => {
        if (!isElectron) return;
        ipcRenderer.send('set-speaking-mode', key);
      },

      onUpdate: (callback: (key: SpeakingMode) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('speaking-mode', (_: any, key: SpeakingMode) => {
          callback(key);
        });
        return () => ipcRenderer.removeAllListeners('speaking-mode');
      },
    },

    defaultSpeakingKey: {
      get: (callback: (key: string) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-default-speaking-key');
        ipcRenderer.once('default-speaking-key', (_: any, key: string) => {
          callback(key);
        });
      },

      set: (key: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-default-speaking-key', key);
      },

      onUpdate: (callback: (key: string) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('default-speaking-key', (_: any, key: string) => {
          callback(key);
        });
        return () => ipcRenderer.removeAllListeners('default-speaking-key');
      },
    },

    // Privacy settings

    notSaveMessageHistory: {
      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-not-save-message-history');
        ipcRenderer.once('not-save-message-history', (_: any, enabled: boolean) => {
          callback(enabled);
        });
      },

      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-not-save-message-history', enabled);
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('not-save-message-history', (_: any, enabled: boolean) => {
          callback(enabled);
        });
        return () => ipcRenderer.removeAllListeners('not-save-message-history');
      },
    },

    // Hotkeys settings

    hotKeyOpenMainWindow: {
      get: (callback: (key: string) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-hot-key-open-main-window');
        ipcRenderer.once('hot-key-open-main-window', (_: any, key: string) => {
          callback(key);
        });
      },

      set: (key: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-hot-key-open-main-window', key);
      },

      onUpdate: (callback: (key: string) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('hot-key-open-main-window', (_: any, key: string) => {
          callback(key);
        });
        return () => ipcRenderer.removeAllListeners('hot-key-open-main-window');
      },
    },

    hotKeyIncreaseVolume: {
      get: (callback: (key: string) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-hot-key-increase-volume');
        ipcRenderer.once('hot-key-increase-volume', (_: any, key: string) => {
          callback(key);
        });
      },

      set: (key: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-hot-key-increase-volume', key);
      },

      onUpdate: (callback: (key: string) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('hot-key-increase-volume', (_: any, key: string) => {
          callback(key);
        });
        return () => ipcRenderer.removeAllListeners('hot-key-increase-volume');
      },
    },

    hotKeyDecreaseVolume: {
      get: (callback: (key: string) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-hot-key-decrease-volume');
        ipcRenderer.once('hot-key-decrease-volume', (_: any, key: string) => {
          callback(key);
        });
      },

      set: (key: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-hot-key-decrease-volume', key);
      },

      onUpdate: (callback: (key: string) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('hot-key-decrease-volume', (_: any, key: string) => {
          callback(key);
        });
        return () => ipcRenderer.removeAllListeners('hot-key-decrease-volume');
      },
    },

    hotKeyToggleSpeaker: {
      get: (callback: (key: string) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-hot-key-toggle-speaker');
        ipcRenderer.once('hot-key-toggle-speaker', (_: any, key: string) => {
          callback(key);
        });
      },

      set: (key: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-hot-key-toggle-speaker', key);
      },

      onUpdate: (callback: (key: string) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('hot-key-toggle-speaker', (_: any, key: string) => {
          callback(key);
        });
        return () => ipcRenderer.removeAllListeners('hot-key-toggle-speaker');
      },
    },

    hotKeyToggleMicrophone: {
      get: (callback: (key: string) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-hot-key-toggle-microphone');
        ipcRenderer.once('hot-key-toggle-microphone', (_: any, key: string) => {
          callback(key);
        });
      },

      set: (key: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-hot-key-toggle-microphone', key);
      },

      onUpdate: (callback: (key: string) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('hot-key-toggle-microphone', (_: any, key: string) => {
          callback(key);
        });
        return () => ipcRenderer.removeAllListeners('hot-key-toggle-microphone');
      },
    },

    // SoundEffect

    disableAllSoundEffect: {
      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-disable-all-sound-effect');
        ipcRenderer.once('disable-all-sound-effect', (_: any, enabled: boolean) => {
          callback(enabled);
        });
      },

      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-disable-all-sound-effect', enabled);
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('disable-all-sound-effect', (_: any, enabled: boolean) => {
          callback(enabled);
        });
        return () => ipcRenderer.removeAllListeners('disable-all-sound-effect');
      },
    },

    enterVoiceChannelSound: {
      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-enter-voice-channel-sound');
        ipcRenderer.once('enter-voice-channel-sound', (_: any, enabled: boolean) => {
          callback(enabled);
        });
      },

      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-enter-voice-channel-sound', enabled);
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('enter-voice-channel-sound', (_: any, enabled: boolean) => {
          callback(enabled);
        });
        return () => ipcRenderer.removeAllListeners('enter-voice-channel-sound');
      },
    },

    leaveVoiceChannelSound: {
      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-leave-voice-channel-sound');
        ipcRenderer.once('leave-voice-channel-sound', (_: any, enabled: boolean) => {
          callback(enabled);
        });
      },

      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-leave-voice-channel-sound', enabled);
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('leave-voice-channel-sound', (_: any, enabled: boolean) => {
          callback(enabled);
        });
        return () => ipcRenderer.removeAllListeners('leave-voice-channel-sound');
      },
    },

    startSpeakingSound: {
      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-start-speaking-sound');
        ipcRenderer.once('start-speaking-sound', (_: any, enabled: boolean) => {
          callback(enabled);
        });
      },

      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-start-speaking-sound', enabled);
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('start-speaking-sound', (_: any, enabled: boolean) => {
          callback(enabled);
        });
        return () => ipcRenderer.removeAllListeners('start-speaking-sound');
      },
    },

    stopSpeakingSound: {
      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-stop-speaking-sound');
        ipcRenderer.once('stop-speaking-sound', (_: any, enabled: boolean) => {
          callback(enabled);
        });
      },

      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-stop-speaking-sound', enabled);
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('stop-speaking-sound', (_: any, enabled: boolean) => {
          callback(enabled);
        });
        return () => ipcRenderer.removeAllListeners('stop-speaking-sound');
      },
    },

    receiveDirectMessageSound: {
      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-receive-direct-message-sound');
        ipcRenderer.once('receive-direct-message-sound', (_: any, enabled: boolean) => {
          callback(enabled);
        });
      },

      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-receive-direct-message-sound', enabled);
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('receive-direct-message-sound', (_: any, enabled: boolean) => {
          callback(enabled);
        });
        return () => ipcRenderer.removeAllListeners('receive-direct-message-sound');
      },
    },

    receiveChannelMessageSound: {
      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-receive-channel-message-sound');
        ipcRenderer.once('receive-channel-message-sound', (_: any, enabled: boolean) => {
          callback(enabled);
        });
      },

      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-receive-channel-message-sound', enabled);
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('receive-channel-message-sound', (_: any, enabled: boolean) => {
          callback(enabled);
        });
        return () => ipcRenderer.removeAllListeners('receive-channel-message-sound');
      },
    },
  },
};

export default ipcService;

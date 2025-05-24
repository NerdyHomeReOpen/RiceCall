/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  DiscordPresence,
  PopupSize,
  PopupType,
  SocketClientEvent,
  SocketServerEvent,
} from '@/types';

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
    send: (event: SocketClientEvent, ...args: any[]) => {
      if (!isElectron) return;
      ipcRenderer.send(event, ...args);
    },
    on: (
      event:
        | SocketServerEvent
        | 'connect'
        | 'reconnect'
        | 'disconnect'
        | 'connect_error'
        | 'reconnect_error'
        | 'error',
      callback: (...args: any[]) => void,
    ) => {
      if (!isElectron) return () => {};
      ipcRenderer.on(event, (_: any, ...args: any[]) => callback(...args));
      return () => ipcRenderer.removeAllListeners(event);
    },
  },

  // DeepLink methods
  deepLink: {
    onDeepLink: (callback: (serverId: string) => void) => {
      if (!isElectron) return () => {};
      ipcRenderer.on('deepLink', (_: any, serverId: string) =>
        callback(serverId),
      );
      return () => ipcRenderer.removeAllListeners('deepLink');
    },
  },

  // Initial data methods
  initialData: {
    request: (id: string, callback: (data: any) => void) => {
      if (!isElectron) return;
      ipcRenderer.send('request-initial-data', id);
      ipcRenderer.on(
        'response-initial-data',
        (_: any, to: string, data: any) => {
          if (to != id) return;
          ipcRenderer.removeAllListeners('response-initial-data');
          callback(data);
        },
      );
    },

    onRequest: (id: string, data: any, callback?: () => void) => {
      if (!isElectron) return;
      ipcRenderer.on('request-initial-data', (_: any, from: string) => {
        if (from != id) return;
        ipcRenderer.send('response-initial-data', id, data);
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
    open: (type: PopupType, id: string) => {
      if (!isElectron) return;
      ipcRenderer.send(
        'open-popup',
        type,
        id,
        PopupSize[type].height,
        PopupSize[type].width,
      );
    },

    submit: (to: string, data?: any) => {
      if (!isElectron) return;
      ipcRenderer.send('popup-submit', to, data);
    },

    onSubmit: (host: string, callback: (data: any) => void) => {
      if (!isElectron) return;
      ipcRenderer.on('popup-submit', (_: any, to: string, data?: any) => {
        if (to != host) return;
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

  systemSettings: {
    autoLaunch: {
      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-auto-launch');
        ipcRenderer.once('auto-launch-status', (_: any, enabled: boolean) => {
          callback(enabled);
        });
      },

      set: (enable: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-auto-launch', enable);
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('auto-launch-status', (_: any, enabled: boolean) => {
          callback(enabled);
        });
        return () => ipcRenderer.removeAllListeners('auto-launch-status');
      },
    },

    soundEffect: {
      get: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-sound-effect');
        ipcRenderer.once('sound-effect-status', (_: any, enabled: boolean) => {
          callback(enabled);
        });
      },

      set: (enable: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-sound-effect', enable);
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on('sound-effect-status', (_: any, enabled: boolean) => {
          callback(enabled);
        });
        return () => ipcRenderer.removeAllListeners('sound-effect-status');
      },
    },

    inputAudioDevice: {
      get: (callback: (deviceId: string) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-input-audio-device');
        ipcRenderer.once(
          'input-audio-device-status',
          (_: any, deviceId: string) => {
            callback(deviceId);
          },
        );
      },

      set: (deviceId: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-input-audio-device', deviceId);
      },

      onUpdate: (callback: (deviceId: string) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on(
          'input-audio-device-status',
          (_: any, deviceId: string) => {
            callback(deviceId);
          },
        );
        return () =>
          ipcRenderer.removeAllListeners('input-audio-device-status');
      },
    },

    outputAudioDevice: {
      get: (callback: (deviceId: string) => void) => {
        if (!isElectron) return;
        ipcRenderer.send('get-output-audio-device');
        ipcRenderer.once(
          'output-audio-device-status',
          (_: any, deviceId: string) => {
            callback(deviceId);
          },
        );
      },

      set: (deviceId: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-output-audio-device', deviceId);
      },

      onUpdate: (callback: (deviceId: string) => void) => {
        if (!isElectron) return () => {};
        ipcRenderer.on(
          'output-audio-device-status',
          (_: any, deviceId: string) => {
            callback(deviceId);
          },
        );
        return () =>
          ipcRenderer.removeAllListeners('output-audio-device-status');
      },
    },

    get: (
      callback: (data: {
        autoLaunch: boolean;
        soundEffect: boolean;
        inputAudioDevice: string;
        outputAudioDevice: string;
      }) => void,
    ) => {
      if (!isElectron) return;
      ipcRenderer.send('get-system-settings');
      ipcRenderer.once('system-settings-status', (_: any, data: any) => {
        callback(data);
      });
    },
  },
};

export default ipcService;

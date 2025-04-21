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
  // Socket event methods
  sendSocketEvent: (event: SocketClientEvent, ...args: any[]) => {
    if (isElectron) {
      ipcRenderer.send(event, ...args);
    } else {
      console.warn('IPC not available - not in Electron environment');
    }
  },
  onSocketEvent: (
    event:
      | SocketServerEvent
      | 'connect'
      | 'connect_error'
      | 'reconnect'
      | 'reconnect_error'
      | 'disconnect',
    callback: (...args: any[]) => void,
  ) => {
    if (isElectron) {
      ipcRenderer.on(event, (_: any, ...args: any[]) => callback(...args));
    } else {
      console.warn('IPC not available - not in Electron environment');
    }
  },

  // Remove specific listener
  removeListener: (event: string) => {
    if (isElectron) {
      ipcRenderer.removeAllListeners(event);
    } else {
      console.warn('IPC not available - not in Electron environment');
    }
  },

  // Initial data methods
  initialData: {
    request: (id: string, callback: (data: any) => void) => {
      if (isElectron) {
        ipcRenderer.send('request-initial-data', id);
        ipcRenderer.on(
          'response-initial-data',
          (_: any, to: string, data: any) => {
            if (to != id) return;
            ipcRenderer.removeAllListeners('response-initial-data');
            callback(data);
          },
        );
      } else {
        console.warn('IPC not available - not in Electron environment');
      }
    },
    onRequest: (id: string, data: any, callback?: () => void) => {
      if (isElectron) {
        ipcRenderer.on('request-initial-data', (_: any, from: string) => {
          if (from != id) return;
          ipcRenderer.send('response-initial-data', id, data);
          ipcRenderer.removeAllListeners('request-initial-data');
          if (callback) callback();
        });
      } else {
        console.warn('IPC not available - not in Electron environment');
      }
    },
  },

  // Window control methods
  window: {
    resize: (width: number, height: number) => {
      if (isElectron) {
        ipcRenderer.send('resize', width, height);
      }
    },
    minimize: () => {
      if (isElectron) {
        ipcRenderer.send('window-control', 'minimize');
      } else {
        window.close();
      }
    },
    maximize: () => {
      if (isElectron) {
        ipcRenderer.send('window-control', 'maximize');
      } else {
        document.documentElement.requestFullscreen();
      }
    },
    unmaximize: () => {
      if (isElectron) {
        ipcRenderer.send('window-control', 'unmaximize');
      } else {
        document.exitFullscreen();
      }
    },
    close: () => {
      if (isElectron) {
        ipcRenderer.send('window-control', 'close');
      } else {
        window.close();
      }
    },
    onMaximize: (callback: () => void) => {
      if (isElectron) {
        ipcRenderer.on('maximize', callback);
      }
    },
    onUnmaximize: (callback: () => void) => {
      if (isElectron) {
        ipcRenderer.on('unmaximize', callback);
      }
    },
    openExternal: (url: string) => {
      if (isElectron) {
        ipcRenderer.send('open-external', url);
      } else {
        window.open(url, '_blank');
      }
    },
  },

  popup: {
    open: (type: PopupType, id: string) => {
      if (isElectron) {
        ipcRenderer.send(
          'open-popup',
          type,
          id,
          PopupSize[type].height,
          PopupSize[type].width,
        );
      }
    },
    submit: (to: string, data?: any) => {
      if (isElectron) {
        ipcRenderer.send('popup-submit', to, data);
      }
    },
    onSubmit: (host: string, callback: (data: any) => void) => {
      if (isElectron) {
        ipcRenderer.on('popup-submit', (_: any, to: string, data?: any) => {
          if (to != host) return;
          callback(data);
          ipcRenderer.removeAllListeners('popup-submit');
        });
      }
    },
  },

  // Auth related methods
  auth: {
    login: (token: string) => {
      if (isElectron) {
        ipcRenderer.send('login', token);
      }
    },
    logout: () => {
      if (isElectron) {
        ipcRenderer.send('logout');
      }
    },
  },

  discord: {
    updatePresence: (presence: DiscordPresence) => {
      if (isElectron) {
        ipcRenderer.send('update-discord-presence', presence);
      }
    },
  },

  systemSettings: {
    get: {
      all: (
        callback: (data: {
          autoLaunch: boolean;
          inputAudioDevice: string;
          outputAudioDevice: string;
        }) => void,
      ) => {
        if (isElectron) {
          ipcRenderer.send('get-system-settings');
          ipcRenderer.once('system-settings-status', (_: any, data: any) => {
            callback(data);
          });
        }
      },
      autoLaunch: (callback: (enabled: boolean) => void) => {
        if (isElectron) {
          ipcRenderer.send('get-auto-launch');
          ipcRenderer.once('auto-launch-status', (_: any, enabled: boolean) => {
            callback(enabled);
          });
        }
      },
      inputAudioDevice: (callback: (deviceId: string) => void) => {
        if (isElectron) {
          ipcRenderer.send('get-input-audio-device');
          ipcRenderer.once(
            'input-audio-device-status',
            (_: any, deviceId: string) => {
              callback(deviceId);
            },
          );
        }
      },
      outputAudioDevice: (callback: (deviceId: string) => void) => {
        if (isElectron) {
          ipcRenderer.send('get-output-audio-device');
          ipcRenderer.once(
            'output-audio-device-status',
            (_: any, deviceId: string) => {
              callback(deviceId);
            },
          );
        }
      },
    },
    set: {
      autoLaunch: (enable: boolean) => {
        if (isElectron) {
          ipcRenderer.send('set-auto-launch', enable);
        }
      },
      inputAudioDevice: (deviceId: string) => {
        if (isElectron) {
          ipcRenderer.send('set-input-audio-device', deviceId);
        }
      },
      outputAudioDevice: (deviceId: string) => {
        if (isElectron) {
          ipcRenderer.send('set-output-audio-device', deviceId);
        }
      },
    },
  },

  // autoLaunch: {
  //   set: (enable: boolean) => {
  //     if (isElectron) {
  //       ipcRenderer.send('set-auto-launch', enable);
  //     }
  //   },
  //   get: (callback: (enabled: boolean) => void) => {
  //     if (isElectron) {
  //       ipcRenderer.send('get-auto-launch');
  //       ipcRenderer.once('auto-launch-status', (_: any, enabled: boolean) => {
  //         callback(enabled);
  //       });
  //     }
  //   },
  // },

  // audio: {
  //   set: (deviceId: string, type: 'input' | 'output') => {
  //     if (isElectron) {
  //       ipcRenderer.send('set-audio-device', deviceId, type);
  //     }
  //   },
  //   get: (
  //     type: 'input' | 'output',
  //     callback: (deviceId: string | null) => void,
  //   ) => {
  //     if (isElectron) {
  //       ipcRenderer.send('get-audio-device', type);
  //       ipcRenderer.once(
  //         'audio-device-status',
  //         (_: any, _type: string, _deviceId: string | null) => {
  //           if (_type === type) callback(_deviceId);
  //         },
  //       );
  //     }
  //   },
  //   update: (
  //     type: 'input' | 'output',
  //     callback: (deviceId: string | null) => void,
  //   ) => {
  //     if (isElectron) {
  //       ipcRenderer.on(
  //         'audio-device-status',
  //         (_: any, _type: string, _deviceId: string | null) => {
  //           if (_type === type) callback(_deviceId);
  //         },
  //       );
  //     }
  //   },
  // },
};

export default ipcService;

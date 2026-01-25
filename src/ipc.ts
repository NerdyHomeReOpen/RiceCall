/* eslint-disable @typescript-eslint/no-explicit-any */
import * as Types from '@/types';

import { Logger } from '@/utils/logger';
import { getApiClient } from '@/platform/api';
import { getDataClient, type DataClient } from '@/platform/data';
import packageJson from '../package.json';
import { closeInAppPopup, minimizeInAppPopup } from '@/platform/popup/inAppPopupHost';
import { getPopupController } from '@/platform/popup';

// Web-mode realtime: use socket.io-client directly in the browser.
// This mirrors Electron main's `src/socket.ts` behavior (query token, websocket transport).
import { io as webIo, type Socket as WebSocketIO } from 'socket.io-client';

// Safe reference to electron's ipcRenderer
let ipcRenderer: any = null;

// Initialize ipcRenderer only in client-side and Electron environment
if (typeof window !== 'undefined' && window.require) {
  try {
    const electron = window.require('electron');
    ipcRenderer = electron.ipcRenderer;
  } catch (error) {
    new Logger('IPC').warn(`Not in Electron environment: ${error}`);
  }
}

const isElectron = !!ipcRenderer;

const isWeb = typeof window !== 'undefined' && !isElectron;

// Debug: log which mode we're in
if (typeof window !== 'undefined') {
  new Logger('IPC').info(`Mode: isElectron=${isElectron}, isWeb=${isWeb}, ipcRenderer=${!!ipcRenderer}`);
}

let webSocket: WebSocketIO | null = null;
let webSeq = 0;
let webHeartbeatInterval: number | null = null;

// In pure-web mode, use a lightweight HTTP client to talk to backend directly.
const api = !isElectron ? getApiClient() : null;

// Platform-agnostic data client (lazy initialized)
let dataClient: DataClient | null = null;
function getDataClientSingleton(): DataClient {
  if (!dataClient) {
    dataClient = getDataClient();
  }
  return dataClient;
}

const ipc = {
  exit: () => {
    if (!isElectron) return;
    ipcRenderer.send('exit');
  },

  socket: {
    send: <T extends keyof Types.ClientToServerEvents>(event: T, ...args: Parameters<Types.ClientToServerEvents[T]>) => {
      if (isElectron) {
        ipcRenderer.send(event, ...args);
        return;
      }
      if (!webSocket) return;
      (webSocket as any).emit(event, ...args);
    },
    on: <T extends keyof Types.ServerToClientEvents>(event: T, callback: (...args: Parameters<Types.ServerToClientEvents[T]>) => ReturnType<Types.ServerToClientEvents[T]>) => {
      if (isElectron) {
        const listener = (_: any, ...args: Parameters<Types.ServerToClientEvents[T]>) => callback(...args);
        ipcRenderer.on(event, listener);
        return () => ipcRenderer.removeListener(event, listener);
      }
      if (!webSocket) return () => {};
      const listener = (...args: Parameters<Types.ServerToClientEvents[T]>) => callback(...args);
      (webSocket as any).on(event, listener);
      return () => (webSocket as any).off(event, listener);
    },
    emit: <T extends keyof Types.ClientToServerEventsWithAck>(event: T, payload: Parameters<Types.ClientToServerEventsWithAck[T]>[0]): Promise<ReturnType<Types.ClientToServerEventsWithAck[T]>> => {
      if (isElectron) {
        return new Promise((resolve, reject) => {
          ipcRenderer.invoke(event, payload).then((ack: Types.ACK<ReturnType<Types.ClientToServerEventsWithAck[T]>>) => {
            if (ack?.ok) resolve(ack.data);
            else reject(new Error(ack?.error || 'unknown error'));
          });
        });
      }
      if (!webSocket) return Promise.reject(new Error('socket not connected'));
      return new Promise((resolve, reject) => {
        (webSocket as any).timeout(5000).emit(event, payload, (err: unknown, ack: Types.ACK<ReturnType<Types.ClientToServerEventsWithAck[T]>>) => {
          if (err) return reject(err);
          if (ack?.ok) return resolve(ack.data);
          reject(new Error(ack?.error || 'unknown error'));
        });
      });
    },
  },

  // Expose a minimal connect/disconnect for web mode.
  // In Electron this is managed in main; renderer learns via `connect|disconnect` events.
  socketClient: {
    connect: (token: string) => {
      if (!isWeb) return;
      if (!token) return;

      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!wsUrl) {
        new Logger('Socket').warn('Missing NEXT_PUBLIC_WS_URL (or NEXT_PUBLIC_API_BASE_URL fallback) for web socket connection');
        return;
      }

      // Clean up existing
      try {
        webSocket?.removeAllListeners();
        webSocket?.disconnect();
      } catch {
        // ignore
      }
      webSocket = null;

      webSeq = 0;

      webSocket = webIo(wsUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 20000,
        timeout: 10000,
        autoConnect: false,
        query: { token },
      });

      const sendHeartbeat = () => {
        (webSocket as any)
          ?.timeout(5000)
          .emit('heartbeat', { seq: ++webSeq }, (err: unknown) => {
            if (err) return;
          });
      };

      // bubble basic connection lifecycle to match Electron main behavior
      webSocket.on('connect', () => {
        if (webHeartbeatInterval) window.clearInterval(webHeartbeatInterval);
        sendHeartbeat();
        webHeartbeatInterval = window.setInterval(sendHeartbeat, 30000);
      });

      webSocket.on('disconnect', () => {
        if (webHeartbeatInterval) window.clearInterval(webHeartbeatInterval);
        webHeartbeatInterval = null;
      });

      webSocket.connect();
    },
    disconnect: () => {
      if (!isWeb) return;
      try {
        webSocket?.removeAllListeners();
        webSocket?.disconnect();
      } finally {
        webSocket = null;
        if (webHeartbeatInterval) window.clearInterval(webHeartbeatInterval);
        webHeartbeatInterval = null;
      }
    },
  },

  auth: {
    login: async (formData: { account: string; password: string }): Promise<{ success: true; token: string } | { success: false }> => {
      if (!isElectron) {
        try {
          const res = await api!.post<{ token?: string }>('/account/login', {
            ...formData,
            // maintain current backend contract
            version: packageJson.version,
          });
          if (!res?.token) return { success: false };
          return { success: true, token: res.token };
        } catch (e) {
          new Logger('Auth').warn(`Web login failed: ${String(e)}`);
          return { success: false };
        }
      }
      return await ipcRenderer.invoke('auth-login', formData);
    },

    logout: async (): Promise<void> => {
      new Logger('IPC').info(`logout called: isElectron=${isElectron}`);
      
      // Always clear localStorage first (before any reload that might interrupt execution)
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
      } catch {
        // ignore
      }
      
      if (!isElectron) {
        // Web mode: disconnect socket and redirect
        new Logger('IPC').info('logout: Web mode, disconnecting socket...');
        ipc.socketClient.disconnect();
        // Redirect to auth page
        if (typeof window !== 'undefined') {
          window.location.href = '/auth';
        }
        return;
      }
      new Logger('IPC').info('logout: Electron mode, invoking auth-logout...');
      return await ipcRenderer.invoke('auth-logout');
    },

    register: async (formData: { account: string; password: string; email: string; username: string; locale: string }): Promise<{ success: true; message: string } | { success: false }> => {
      if (!isElectron) {
        try {
          await api!.post('/account/register', {
            ...formData,
          });
          return { success: true, message: 'ok' };
        } catch (e) {
          new Logger('Auth').warn(`Web register failed: ${String(e)}`);
          return { success: false };
        }
      }
      return await ipcRenderer.invoke('auth-register', formData);
    },

    autoLogin: async (token: string): Promise<{ success: true; token: string } | { success: false }> => {
      if (!isElectron) {
        try {
          const res = await api!.post<{ token?: string }>('/token/verify', {
            token,
            version: packageJson.version,
          });
          if (!res?.token) return { success: false };
          return { success: true, token: res.token };
        } catch (e) {
          new Logger('Auth').warn(`Web autoLogin failed: ${String(e)}`);
          return { success: false };
        }
      }
      return await ipcRenderer.invoke('auth-auto-login', token);
    },
  },

  // Data operations are delegated to the platform-agnostic DataClient.
  // Uses Proxy to auto-forward all method calls - no manual mapping needed.
  // Adding new data methods only requires updating dataService.ts!
  data: new Proxy({} as DataClient, {
    get(_target, prop: string) {
      const client = getDataClientSingleton();
      return (client as unknown as Record<string, unknown>)[prop];
    },
  }),

  deepLink: {
    onDeepLink: (callback: (serverId: string) => void) => {
      if (!isElectron) return () => {};
      const listener = (_: any, serverId: string) => callback(serverId);
      ipcRenderer.on('deepLink', listener);
      return () => ipcRenderer.removeListener('deepLink', listener);
    },
  },

  window: {
    resize: (width: number, height: number) => {
      if (!isElectron) return;
      ipcRenderer.send('resize', width, height);
    },

    minimize: () => {
      if (isElectron) {
        ipcRenderer.send('window-control-minimize');
        return;
      }

      // Web in-app popup mode: minimize the current popup instance.
      try {
        const id = new URL(window.location.href).searchParams.get('id') || (globalThis as any).__ricecallCurrentPopupId;
        if (id) minimizeInAppPopup(id);
      } catch {
        // ignore
      }
    },

    maximize: () => {
      if (!isElectron) return;
      ipcRenderer.send('window-control-maximize');
    },

    unmaximize: () => {
      if (!isElectron) return;
      ipcRenderer.send('window-control-unmaximize');
    },

    close: () => {
      if (isElectron) {
        ipcRenderer.send('window-control-close');
        return;
      }

      // Web in-app popup mode: most popup components call `ipc.window.close()`.
      // Emulate Electron by closing the current popup instance (from URL `?id=...`).
      try {
        const id = new URL(window.location.href).searchParams.get('id') || (globalThis as any).__ricecallCurrentPopupId;
        if (id) closeInAppPopup(id);
      } catch {
        // ignore
      }
    },

    onMaximize: (callback: () => void) => {
      if (!isElectron) return () => {};
      const listener = () => callback();
      ipcRenderer.on('maximize', listener);
      return () => ipcRenderer.removeListener('maximize', listener);
    },

    onUnmaximize: (callback: () => void) => {
      if (!isElectron) return () => {};
      const listener = () => callback();
      ipcRenderer.on('unmaximize', listener);
      return () => ipcRenderer.removeListener('unmaximize', listener);
    },
  },

  initialData: {
    get: (id: string): Record<string, any> | null => {
      if (!isElectron) return null;
      return ipcRenderer.sendSync(`get-initial-data?id=${id}`);
    },
  },

  popup: {
    open: (type: Types.PopupType, id: string, initialData: any, force?: boolean) => {
      if (!isElectron) return;
      ipcRenderer.send('open-popup', type, id, initialData, force);
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
      if (isElectron) {
        ipcRenderer.send('popup-submit', to, data);
        return;
      }
      // Web in-app popup mode: delegate to the popup controller.
      getPopupController().submit(to, data);
    },

    onSubmit: <T>(host: string, callback: (data: T) => void) => {
      if (isElectron) {
        ipcRenderer.removeAllListeners('popup-submit');
        const listener = (_: any, from: string, data: T) => {
          if (from === host) callback(data);
          ipcRenderer.removeAllListeners('popup-submit');
        };
        ipcRenderer.on('popup-submit', listener);
        return () => ipcRenderer.removeListener('popup-submit', listener);
      }
      // Web in-app popup mode: delegate to the popup controller.
      return getPopupController().onSubmit(host, callback);
    },
  },

  accounts: {
    get: (): Record<string, { autoLogin: boolean; rememberAccount: boolean; password: string }> => {
      if (!isElectron) return {};
      return ipcRenderer.sendSync('get-accounts');
    },

    add: (account: string, { autoLogin, rememberAccount, password }: { autoLogin: boolean; rememberAccount: boolean; password: string }) => {
      if (!isElectron) return;
      ipcRenderer.send('add-account', account, { autoLogin, rememberAccount, password });
    },

    delete: (account: string) => {
      if (!isElectron) return;
      ipcRenderer.send('delete-account', account);
    },

    onUpdate: (callback: (accounts: Record<string, { autoLogin: boolean; rememberAccount: boolean; password: string }>) => void) => {
      if (!isElectron) return () => {};
      ipcRenderer.removeAllListeners('accounts');
      const listener = (_: any, accounts: Record<string, { autoLogin: boolean; rememberAccount: boolean; password: string }>) => callback(accounts);
      ipcRenderer.on('accounts', listener);
      return () => ipcRenderer.removeListener('accounts', listener);
    },
  },

  language: {
    get: (): Types.LanguageKey => {
      if (!isElectron) return 'zh-TW';
      return ipcRenderer.sendSync('get-language');
    },

    set: (language: Types.LanguageKey) => {
      if (!isElectron) return;
      ipcRenderer.send('set-language', language);
    },

    onUpdate: (callback: (language: Types.LanguageKey) => void) => {
      if (!isElectron) return () => {};
      ipcRenderer.removeAllListeners('language');
      const listener = (_: any, language: Types.LanguageKey) => callback(language);
      ipcRenderer.on('language', listener);
      return () => ipcRenderer.removeListener('language', listener);
    },
  },

  customThemes: {
    get: (): Types.Theme[] => {
      if (!isElectron) return [];
      return ipcRenderer.sendSync('get-custom-themes');
    },

    add: (theme: Types.Theme) => {
      if (!isElectron) return;
      ipcRenderer.send('add-custom-theme', theme);
    },

    delete: (index: number) => {
      if (!isElectron) return;
      ipcRenderer.send('delete-custom-theme', index);
    },

    onUpdate: (callback: (themes: Types.Theme[]) => void) => {
      if (!isElectron) return () => [];
      ipcRenderer.removeAllListeners('custom-themes');
      const listener = (_: any, themes: Types.Theme[]) => callback(themes);
      ipcRenderer.on('custom-themes', listener);
      return () => ipcRenderer.removeListener('custom-themes', listener);
    },

    current: {
      get: (): Types.Theme | null => {
        if (!isElectron) return null;
        return ipcRenderer.sendSync('get-current-theme');
      },

      set: (theme: Types.Theme | null) => {
        if (!isElectron) return;
        ipcRenderer.send('set-current-theme', theme);
      },

      onUpdate: (callback: (theme: Types.Theme | null) => void) => {
        if (!isElectron) return () => null;
        ipcRenderer.removeAllListeners('current-theme');
        const listener = (_: any, theme: Types.Theme | null) => callback(theme);
        ipcRenderer.on('current-theme', listener);
        return () => ipcRenderer.removeListener('current-theme', listener);
      },
    },
  },

  discord: {
    updatePresence: (presence: Types.DiscordPresence) => {
      if (!isElectron) return;
      ipcRenderer.send('update-discord-presence', presence);
    },
  },

  fontList: {
    get: (): string[] => {
      if (!isElectron) return [];
      return ipcRenderer.sendSync('get-font-list');
    },
  },

  record: {
    save: (record: ArrayBuffer) => {
      if (!isElectron) return;
      ipcRenderer.send('save-record', record);
    },

    savePath: {
      select: async (): Promise<string | null> => {
        if (!isElectron) return null;
        return await ipcRenderer.invoke('select-record-save-path');
      },
    },
  },

  systemSettings: {
    set: (settings: Partial<Types.SystemSettings>) => {
      if (!isElectron) return;
      if (settings.autoLogin !== undefined) ipcRenderer.send('set-auto-login', settings.autoLogin);
      if (settings.autoLaunch !== undefined) ipcRenderer.send('set-auto-launch', settings.autoLaunch);
      if (settings.alwaysOnTop !== undefined) ipcRenderer.send('set-always-on-top', settings.alwaysOnTop);
      if (settings.statusAutoIdle !== undefined) ipcRenderer.send('set-status-auto-idle', settings.statusAutoIdle);
      if (settings.statusAutoIdleMinutes !== undefined) ipcRenderer.send('set-status-auto-idle-minutes', settings.statusAutoIdleMinutes);
      if (settings.statusAutoDnd !== undefined) ipcRenderer.send('set-status-auto-dnd', settings.statusAutoDnd);
      if (settings.channelUIMode !== undefined) ipcRenderer.send('set-channel-ui-mode', settings.channelUIMode);
      if (settings.closeToTray !== undefined) ipcRenderer.send('set-close-to-tray', settings.closeToTray);
      if (settings.font !== undefined) ipcRenderer.send('set-font', settings.font);
      if (settings.fontSize !== undefined) ipcRenderer.send('set-font-size', settings.fontSize);
      if (settings.inputAudioDevice !== undefined) ipcRenderer.send('set-input-audio-device', settings.inputAudioDevice);
      if (settings.outputAudioDevice !== undefined) ipcRenderer.send('set-output-audio-device', settings.outputAudioDevice);
      if (settings.recordFormat !== undefined) ipcRenderer.send('set-record-format', settings.recordFormat);
      if (settings.recordSavePath !== undefined) ipcRenderer.send('set-record-save-path', settings.recordSavePath);
      if (settings.mixEffect !== undefined) ipcRenderer.send('set-mix-effect', settings.mixEffect);
      if (settings.mixEffectType !== undefined) ipcRenderer.send('set-mix-effect-type', settings.mixEffectType);
      if (settings.autoMixSetting !== undefined) ipcRenderer.send('set-auto-mix-setting', settings.autoMixSetting);
      if (settings.echoCancellation !== undefined) ipcRenderer.send('set-echo-cancellation', settings.echoCancellation);
      if (settings.noiseCancellation !== undefined) ipcRenderer.send('set-noise-cancellation', settings.noiseCancellation);
      if (settings.microphoneAmplification !== undefined) ipcRenderer.send('set-microphone-amplification', settings.microphoneAmplification);
      if (settings.manualMixMode !== undefined) ipcRenderer.send('set-manual-mix-mode', settings.manualMixMode);
      if (settings.mixMode !== undefined) ipcRenderer.send('set-mix-mode', settings.mixMode);
      if (settings.speakingMode !== undefined) ipcRenderer.send('set-speaking-mode', settings.speakingMode);
      if (settings.defaultSpeakingKey !== undefined) ipcRenderer.send('set-default-speaking-key', settings.defaultSpeakingKey);
      if (settings.notSaveMessageHistory !== undefined) ipcRenderer.send('set-not-save-message-history', settings.notSaveMessageHistory);
      if (settings.hotKeyOpenMainWindow !== undefined) ipcRenderer.send('set-hot-key-open-main-window', settings.hotKeyOpenMainWindow);
      if (settings.hotKeyIncreaseVolume !== undefined) ipcRenderer.send('set-hot-key-increase-volume', settings.hotKeyIncreaseVolume);
      if (settings.hotKeyDecreaseVolume !== undefined) ipcRenderer.send('set-hot-key-decrease-volume', settings.hotKeyDecreaseVolume);
      if (settings.hotKeyToggleSpeaker !== undefined) ipcRenderer.send('set-hot-key-toggle-speaker', settings.hotKeyToggleSpeaker);
      if (settings.hotKeyToggleMicrophone !== undefined) ipcRenderer.send('set-hot-key-toggle-microphone', settings.hotKeyToggleMicrophone);
      if (settings.disableAllSoundEffect !== undefined) ipcRenderer.send('set-disable-all-sound-effect', settings.disableAllSoundEffect);
      if (settings.enterVoiceChannelSound !== undefined) ipcRenderer.send('set-enter-voice-channel-sound', settings.enterVoiceChannelSound);
      if (settings.leaveVoiceChannelSound !== undefined) ipcRenderer.send('set-leave-voice-channel-sound', settings.leaveVoiceChannelSound);
      if (settings.startSpeakingSound !== undefined) ipcRenderer.send('set-start-speaking-sound', settings.startSpeakingSound);
      if (settings.stopSpeakingSound !== undefined) ipcRenderer.send('set-stop-speaking-sound', settings.stopSpeakingSound);
      if (settings.receiveDirectMessageSound !== undefined) ipcRenderer.send('set-receive-direct-message-sound', settings.receiveDirectMessageSound);
      if (settings.receiveChannelMessageSound !== undefined) ipcRenderer.send('set-receive-channel-message-sound', settings.receiveChannelMessageSound);
      if (settings.autoCheckForUpdates !== undefined) ipcRenderer.send('set-auto-check-for-updates', settings.autoCheckForUpdates);
      if (settings.updateCheckInterval !== undefined) ipcRenderer.send('set-update-check-interval', settings.updateCheckInterval);
      if (settings.updateChannel !== undefined) ipcRenderer.send('set-update-channel', settings.updateChannel);
    },

    get: (): Types.SystemSettings | null => {
      if (!isElectron) return null;
      return ipcRenderer.sendSync('get-system-settings');
    },

    autoLogin: {
      set: (enable: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-auto-login', enable);
      },

      get: (): boolean => {
        if (!isElectron) return false;
        return ipcRenderer.sendSync('get-auto-login');
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.on('auto-login', listener);
        return () => ipcRenderer.removeListener('auto-login', listener);
      },
    },

    autoLaunch: {
      set: (enable: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-auto-launch', enable);
      },

      get: (): boolean => {
        if (!isElectron) return false;
        return ipcRenderer.sendSync('get-auto-launch');
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.on('auto-launch', listener);
        return () => ipcRenderer.removeListener('auto-launch', listener);
      },
    },

    alwaysOnTop: {
      set: (enable: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-always-on-top', enable);
      },

      get: (): boolean => {
        if (!isElectron) return false;
        return ipcRenderer.sendSync('get-always-on-top');
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.on('always-on-top', listener);
        return () => ipcRenderer.removeListener('always-on-top', listener);
      },
    },

    statusAutoIdle: {
      set: (enable: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-status-auto-idle', enable);
      },

      get: (): boolean => {
        if (!isElectron) return false;
        return ipcRenderer.sendSync('get-status-auto-idle');
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.on('status-auto-idle', listener);
        return () => ipcRenderer.removeListener('status-auto-idle', listener);
      },
    },

    statusAutoIdleMinutes: {
      set: (fontSize: number) => {
        if (!isElectron) return;
        ipcRenderer.send('set-status-auto-idle-minutes', fontSize);
      },

      get: (): number => {
        if (!isElectron) return 0;
        return ipcRenderer.sendSync('get-status-auto-idle-minutes');
      },

      onUpdate: (callback: (fontSize: number) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, fontSize: number) => callback(fontSize);
        ipcRenderer.on('status-auto-idle-minutes', listener);
        return () => ipcRenderer.removeListener('status-auto-idle-minutes', listener);
      },
    },

    statusAutoDnd: {
      set: (enable: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-status-auto-dnd', enable);
      },

      get: (): boolean => {
        if (!isElectron) return false;
        return ipcRenderer.sendSync('get-status-auto-dnd');
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.on('status-auto-dnd', listener);
        return () => ipcRenderer.removeListener('status-auto-dnd', listener);
      },
    },

    channelUIMode: {
      set: (key: Types.ChannelUIMode) => {
        if (!isElectron) return;
        ipcRenderer.send('set-channel-ui-mode', key);
      },

      get: (): Types.ChannelUIMode => {
        if (!isElectron) return 'classic';
        return ipcRenderer.sendSync('get-channel-ui-mode');
      },

      onUpdate: (callback: (key: Types.ChannelUIMode) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, channelUIMode: Types.ChannelUIMode) => callback(channelUIMode);
        ipcRenderer.on('channel-ui-mode', listener);
        return () => ipcRenderer.removeListener('channel-ui-mode', listener);
      },
    },

    closeToTray: {
      set: (enable: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-close-to-tray', enable);
      },

      get: (): boolean => {
        if (!isElectron) return false;
        return ipcRenderer.sendSync('get-close-to-tray');
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.on('close-to-tray', listener);
        return () => ipcRenderer.removeListener('close-to-tray', listener);
      },
    },

    font: {
      set: (font: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-font', font);
      },

      get: (): string => {
        if (!isElectron) return '';
        return ipcRenderer.sendSync('get-font');
      },

      onUpdate: (callback: (font: string) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, font: string) => callback(font);
        ipcRenderer.on('font', listener);
        return () => ipcRenderer.removeListener('font', listener);
      },
    },

    fontSize: {
      set: (fontSize: number) => {
        if (!isElectron) return;
        ipcRenderer.send('set-font-size', fontSize);
      },

      get: (): number => {
        if (!isElectron) return 0;
        return ipcRenderer.sendSync('get-font-size');
      },

      onUpdate: (callback: (fontSize: number) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, fontSize: number) => callback(fontSize);
        ipcRenderer.on('font-size', listener);
        return () => ipcRenderer.removeListener('font-size', listener);
      },
    },

    inputAudioDevice: {
      set: (deviceId: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-input-audio-device', deviceId);
      },

      get: (): string => {
        if (!isElectron) return '';
        return ipcRenderer.sendSync('get-input-audio-device');
      },

      onUpdate: (callback: (deviceId: string) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, deviceId: string) => callback(deviceId);
        ipcRenderer.on('input-audio-device', listener);
        return () => ipcRenderer.removeListener('input-audio-device', listener);
      },
    },

    outputAudioDevice: {
      set: (deviceId: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-output-audio-device', deviceId);
      },

      get: (): string => {
        if (!isElectron) return '';
        return ipcRenderer.sendSync('get-output-audio-device');
      },

      onUpdate: (callback: (deviceId: string) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, deviceId: string) => callback(deviceId);
        ipcRenderer.on('output-audio-device', listener);
        return () => ipcRenderer.removeListener('output-audio-device', listener);
      },
    },

    recordFormat: {
      set: (format: Types.RecordFormat) => {
        if (!isElectron) return;
        ipcRenderer.send('set-record-format', format);
      },

      get: (): Types.RecordFormat => {
        if (!isElectron) return 'wav';
        return ipcRenderer.sendSync('get-record-format');
      },

      onUpdate: (callback: (format: Types.RecordFormat) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, format: Types.RecordFormat) => callback(format);
        ipcRenderer.on('record-format', listener);
        return () => ipcRenderer.removeListener('record-format', listener);
      },
    },

    recordSavePath: {
      set: (path: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-record-save-path', path);
      },

      get: (): string => {
        if (!isElectron) return '';
        return ipcRenderer.sendSync('get-record-save-path');
      },

      onUpdate: (callback: (path: string) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, path: string) => callback(path);
        ipcRenderer.on('record-save-path', listener);
        return () => ipcRenderer.removeListener('record-save-path', listener);
      },
    },

    mixEffect: {
      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-mix-effect', enabled);
      },

      get: (): boolean => {
        if (!isElectron) return false;
        return ipcRenderer.sendSync('get-mix-effect');
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.on('mix-effect', listener);
        return () => ipcRenderer.removeListener('mix-effect', listener);
      },
    },

    mixEffectType: {
      set: (key: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-mix-effect-type', key);
      },

      get: (): string => {
        if (!isElectron) return '';
        return ipcRenderer.sendSync('get-mix-effect-type');
      },

      onUpdate: (callback: (key: string) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, key: string) => callback(key);
        ipcRenderer.on('mix-effect-type', listener);
        return () => ipcRenderer.removeListener('mix-effect-type', listener);
      },
    },

    autoMixSetting: {
      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-auto-mix-setting', enabled);
      },

      get: (): boolean => {
        if (!isElectron) return false;
        return ipcRenderer.sendSync('get-auto-mix-setting');
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.on('auto-mix-setting', listener);
        return () => ipcRenderer.removeListener('auto-mix-setting', listener);
      },
    },

    echoCancellation: {
      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-echo-cancellation', enabled);
      },

      get: (): boolean => {
        if (!isElectron) return false;
        return ipcRenderer.sendSync('get-echo-cancellation');
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.on('echo-cancellation', listener);
        return () => ipcRenderer.removeListener('echo-cancellation', listener);
      },
    },

    noiseCancellation: {
      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-noise-cancellation', enabled);
      },

      get: (): boolean => {
        if (!isElectron) return false;
        return ipcRenderer.sendSync('get-noise-cancellation');
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.on('noise-cancellation', listener);
        return () => ipcRenderer.removeListener('noise-cancellation', listener);
      },
    },

    microphoneAmplification: {
      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-microphone-amplification', enabled);
      },

      get: (): boolean => {
        if (!isElectron) return false;
        return ipcRenderer.sendSync('get-microphone-amplification');
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.on('microphone-amplification', listener);
        return () => ipcRenderer.removeListener('microphone-amplification', listener);
      },
    },

    manualMixMode: {
      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-manual-mix-mode', enabled);
      },

      get: (): boolean => {
        if (!isElectron) return false;
        return ipcRenderer.sendSync('get-manual-mix-mode');
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.on('manual-mix-mode', listener);
        return () => ipcRenderer.removeListener('manual-mix-mode', listener);
      },
    },

    mixMode: {
      set: (key: Types.MixMode) => {
        if (!isElectron) return;
        ipcRenderer.send('set-mix-mode', key);
      },

      get: (): Types.MixMode => {
        if (!isElectron) return 'app';
        return ipcRenderer.sendSync('get-mix-mode');
      },

      onUpdate: (callback: (key: Types.MixMode) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, key: Types.MixMode) => callback(key);
        ipcRenderer.on('mix-mode', listener);
        return () => ipcRenderer.removeListener('mix-mode', listener);
      },
    },

    speakingMode: {
      set: (key: Types.SpeakingMode) => {
        if (!isElectron) return;
        ipcRenderer.send('set-speaking-mode', key);
      },

      get: (): Types.SpeakingMode => {
        if (!isElectron) return 'auto';
        return ipcRenderer.sendSync('get-speaking-mode');
      },

      onUpdate: (callback: (key: Types.SpeakingMode) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, key: Types.SpeakingMode) => callback(key);
        ipcRenderer.on('speaking-mode', listener);
        return () => ipcRenderer.removeListener('speaking-mode', listener);
      },
    },

    defaultSpeakingKey: {
      set: (key: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-default-speaking-key', key);
      },

      get: (): string => {
        if (!isElectron) return '';
        return ipcRenderer.sendSync('get-default-speaking-key');
      },

      onUpdate: (callback: (key: string) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, key: string) => callback(key);
        ipcRenderer.on('default-speaking-key', listener);
        return () => ipcRenderer.removeListener('default-speaking-key', listener);
      },
    },

    notSaveMessageHistory: {
      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-not-save-message-history', enabled);
      },

      get: (): boolean => {
        if (!isElectron) return false;
        return ipcRenderer.sendSync('get-not-save-message-history');
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.on('not-save-message-history', listener);
        return () => ipcRenderer.removeListener('not-save-message-history', listener);
      },
    },

    hotKeyOpenMainWindow: {
      set: (key: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-hot-key-open-main-window', key);
      },

      get: (): string => {
        if (!isElectron) return '';
        return ipcRenderer.sendSync('get-hot-key-open-main-window');
      },

      onUpdate: (callback: (key: string) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, key: string) => callback(key);
        ipcRenderer.on('hot-key-open-main-window', listener);
        return () => ipcRenderer.removeListener('hot-key-open-main-window', listener);
      },
    },

    hotKeyIncreaseVolume: {
      set: (key: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-hot-key-increase-volume', key);
      },

      get: (): string => {
        if (!isElectron) return '';
        return ipcRenderer.sendSync('get-hot-key-increase-volume');
      },

      onUpdate: (callback: (key: string) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, key: string) => callback(key);
        ipcRenderer.on('hot-key-increase-volume', listener);
        return () => ipcRenderer.removeListener('hot-key-increase-volume', listener);
      },
    },

    hotKeyDecreaseVolume: {
      set: (key: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-hot-key-decrease-volume', key);
      },

      get: (): string => {
        if (!isElectron) return '';
        return ipcRenderer.sendSync('get-hot-key-decrease-volume');
      },

      onUpdate: (callback: (key: string) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, key: string) => callback(key);
        ipcRenderer.on('hot-key-decrease-volume', listener);
        return () => ipcRenderer.removeListener('hot-key-decrease-volume', listener);
      },
    },

    hotKeyToggleSpeaker: {
      set: (key: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-hot-key-toggle-speaker', key);
      },

      get: (): string => {
        if (!isElectron) return '';
        return ipcRenderer.sendSync('get-hot-key-toggle-speaker');
      },

      onUpdate: (callback: (key: string) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, key: string) => callback(key);
        ipcRenderer.on('hot-key-toggle-speaker', listener);
        return () => ipcRenderer.removeListener('hot-key-toggle-speaker', listener);
      },
    },

    hotKeyToggleMicrophone: {
      set: (key: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-hot-key-toggle-microphone', key);
      },

      get: (): string => {
        if (!isElectron) return '';
        return ipcRenderer.sendSync('get-hot-key-toggle-microphone');
      },

      onUpdate: (callback: (key: string) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, key: string) => callback(key);
        ipcRenderer.on('hot-key-toggle-microphone', listener);
        return () => ipcRenderer.removeListener('hot-key-toggle-microphone', listener);
      },
    },

    disableAllSoundEffect: {
      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-disable-all-sound-effect', enabled);
      },

      get: (): boolean => {
        if (!isElectron) return false;
        return ipcRenderer.sendSync('get-disable-all-sound-effect');
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.on('disable-all-sound-effect', listener);
        return () => ipcRenderer.removeListener('disable-all-sound-effect', listener);
      },
    },

    enterVoiceChannelSound: {
      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-enter-voice-channel-sound', enabled);
      },

      get: (): boolean => {
        if (!isElectron) return true; // Web mode: enable sound by default
        return ipcRenderer.sendSync('get-enter-voice-channel-sound');
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.on('enter-voice-channel-sound', listener);
        return () => ipcRenderer.removeListener('enter-voice-channel-sound', listener);
      },
    },

    leaveVoiceChannelSound: {
      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-leave-voice-channel-sound', enabled);
      },

      get: (): boolean => {
        if (!isElectron) return true; // Web mode: enable sound by default
        return ipcRenderer.sendSync('get-leave-voice-channel-sound');
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.on('leave-voice-channel-sound', listener);
        return () => ipcRenderer.removeListener('leave-voice-channel-sound', listener);
      },
    },

    startSpeakingSound: {
      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-start-speaking-sound', enabled);
      },

      get: (): boolean => {
        if (!isElectron) return true; // Web mode: enable sound by default
        return ipcRenderer.sendSync('get-start-speaking-sound');
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.on('start-speaking-sound', listener);
        return () => ipcRenderer.removeListener('start-speaking-sound', listener);
      },
    },

    stopSpeakingSound: {
      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-stop-speaking-sound', enabled);
      },

      get: (): boolean => {
        if (!isElectron) return true; // Web mode: enable sound by default
        return ipcRenderer.sendSync('get-stop-speaking-sound');
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.on('stop-speaking-sound', listener);
        return () => ipcRenderer.removeListener('stop-speaking-sound', listener);
      },
    },

    receiveDirectMessageSound: {
      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-receive-direct-message-sound', enabled);
      },

      get: (): boolean => {
        if (!isElectron) return true; // Web mode: enable sound by default
        return ipcRenderer.sendSync('get-receive-direct-message-sound');
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.on('receive-direct-message-sound', listener);
        return () => ipcRenderer.removeListener('receive-direct-message-sound', listener);
      },
    },

    receiveChannelMessageSound: {
      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-receive-channel-message-sound', enabled);
      },

      get: (): boolean => {
        if (!isElectron) return true; // Web mode: enable sound by default
        return ipcRenderer.sendSync('get-receive-channel-message-sound');
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.on('receive-channel-message-sound', listener);
        return () => ipcRenderer.removeListener('receive-channel-message-sound', listener);
      },
    },

    autoCheckForUpdates: {
      set: (enabled: boolean) => {
        if (!isElectron) return;
        ipcRenderer.send('set-auto-check-for-updates', enabled);
      },

      get: (): boolean => {
        if (!isElectron) return false;
        return ipcRenderer.sendSync('get-auto-check-for-updates');
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.on('auto-check-for-updates', listener);
        return () => ipcRenderer.removeListener('auto-check-for-updates', listener);
      },
    },

    updateCheckInterval: {
      set: (interval: number) => {
        if (!isElectron) return;
        ipcRenderer.send('set-update-check-interval', interval);
      },

      get: (): number => {
        if (!isElectron) return 0;
        return ipcRenderer.sendSync('get-update-check-interval');
      },

      onUpdate: (callback: (interval: number) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, interval: number) => callback(interval);
        ipcRenderer.on('update-check-interval', listener);
        return () => ipcRenderer.removeListener('update-check-interval', listener);
      },
    },

    updateChannel: {
      set: (channel: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-update-channel', channel);
      },

      get: (): string => {
        if (!isElectron) return '';
        return ipcRenderer.sendSync('get-update-channel');
      },

      onUpdate: (callback: (channel: string) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, channel: string) => callback(channel);
        ipcRenderer.on('update-channel', listener);
        return () => ipcRenderer.removeListener('update-channel', listener);
      },
    },
  },

  tray: {
    title: {
      set: (title: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-tray-title', title);
      },
    },
  },

  dontShowDisclaimerNextTime: () => {
    if (!isElectron) return;
    ipcRenderer.send('dont-show-disclaimer-next-time');
  },

  loopbackAudio: {
    enable: () => {
      if (!isElectron) return;
      ipcRenderer.invoke('enable-loopback-audio');
    },

    disable: () => {
      if (!isElectron) return;
      ipcRenderer.invoke('disable-loopback-audio');
    },
  },

  checkForUpdates: () => {
    if (!isElectron) return;
    ipcRenderer.send('check-for-updates');
  },

  changeServer: (server: 'prod' | 'dev') => {
    if (!isElectron) return;
    ipcRenderer.send('change-server', server);
  },

  env: {
    get: (): Record<string, string> => {
      if (!isElectron) return {};
      return ipcRenderer.sendSync('get-env');
    },
  },
};

export default ipc;

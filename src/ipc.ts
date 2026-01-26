/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * IPC Facade - Unified interface for Renderer process
 * 
 * This module provides a clean API for the renderer (React components) to communicate
 * with the main process (Electron) or directly with handlers (Web).
 * 
 * Architecture:
 * - Uses platform abstractions which return appropriate implementations
 * - Electron: Real ipcRenderer, main process socket, native window controls
 * - Web: Fake ipcRenderer, direct socket.io, in-app popup controls
 * 
 * NO platform checks (isElectron) exist in this file!
 * All platform-specific logic is encapsulated in platform/* modules.
 */

import * as Types from '@/types';
import { getIpcRenderer, type IpcRenderer } from '@/platform/ipc';
import { getDataClient, type DataClient } from '@/platform/data';
import { getPopupController } from '@/platform/popup';
import { getSocketClient, type SocketClient } from '@/platform/socket';
import { getWindowController, type WindowController } from '@/platform/window';

// Lazy-initialized singletons
let ipc: IpcRenderer | null = null;
let dataClient: DataClient | null = null;
let socketClient: SocketClient | null = null;
let windowController: WindowController | null = null;

function getIpc(): IpcRenderer {
  if (!ipc) ipc = getIpcRenderer();
  return ipc;
}

function getDataClientSingleton(): DataClient {
  if (!dataClient) dataClient = getDataClient();
  return dataClient;
}

function getSocket(): SocketClient {
  if (!socketClient) socketClient = getSocketClient();
  return socketClient;
}

function getWindow(): WindowController {
  if (!windowController) windowController = getWindowController();
  return windowController;
}

// ============================================================================
// IPC Facade Object
// ============================================================================

const ipcFacade = {
  // -------------------------------------------------------------------------
  // Application Control
  // -------------------------------------------------------------------------
  exit: () => {
    getIpc().send('exit');
  },

  // -------------------------------------------------------------------------
  // Socket Communication (delegated to platform/socket)
  // -------------------------------------------------------------------------
  socket: {
    send: <T extends keyof Types.ClientToServerEvents>(
      event: T,
      ...args: Parameters<Types.ClientToServerEvents[T]>
    ) => getSocket().send(event, ...args),

    on: <T extends keyof Types.ServerToClientEvents>(
      event: T,
      callback: (...args: Parameters<Types.ServerToClientEvents[T]>) => ReturnType<Types.ServerToClientEvents[T]>
    ) => getSocket().on(event, callback),

    emit: <T extends keyof Types.ClientToServerEventsWithAck>(
      event: T,
      payload: Parameters<Types.ClientToServerEventsWithAck[T]>[0]
    ): Promise<ReturnType<Types.ClientToServerEventsWithAck[T]>> => getSocket().emit(event, payload),
  },

  // Socket client management (delegated to platform/socket)
  socketClient: {
    connect: (token: string) => getSocket().connect(token),
    disconnect: () => getSocket().disconnect(),
  },

  // -------------------------------------------------------------------------
  // Authentication
  // -------------------------------------------------------------------------
  auth: {
    login: async (formData: { account: string; password: string }): Promise<{ success: true; token: string } | { success: false }> => {
      return await getIpc().invoke('auth-login', formData);
    },

    logout: async (): Promise<void> => {
      // Clear localStorage (works in both modes)
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
      } catch {
        // ignore
      }

      // Invoke logout handler
      await getIpc().invoke('auth-logout');

      // Socket disconnection is handled by the platform
      // For Web: the handler will disconnect and redirect
    },

    register: async (formData: { account: string; password: string; email: string; username: string; locale: string }): Promise<{ success: true; message: string } | { success: false }> => {
      return await getIpc().invoke('auth-register', formData);
    },

    autoLogin: async (token: string): Promise<{ success: true; token: string } | { success: false }> => {
      return await getIpc().invoke('auth-auto-login', token);
    },
  },

  // -------------------------------------------------------------------------
  // Data Operations (uses platform/data abstraction)
  // -------------------------------------------------------------------------
  data: new Proxy({} as DataClient, {
    get(_target, prop: string) {
      const client = getDataClientSingleton();
      return (client as unknown as Record<string, unknown>)[prop];
    },
  }),

  // -------------------------------------------------------------------------
  // Deep Link
  // -------------------------------------------------------------------------
  deepLink: {
    onDeepLink: (callback: (serverId: string) => void) => {
      const listener = (_: any, serverId: string) => callback(serverId);
      getIpc().on('deepLink', listener);
      return () => getIpc().removeListener('deepLink', listener);
    },
  },

  // -------------------------------------------------------------------------
  // Window Control (delegated to platform/window)
  // -------------------------------------------------------------------------
  window: {
    resize: (width: number, height: number) => getWindow().resize(width, height),
    minimize: () => getWindow().minimize(),
    maximize: () => getWindow().maximize(),
    unmaximize: () => getWindow().unmaximize(),
    close: () => getWindow().close(),
    onMaximize: (callback: () => void) => getWindow().onMaximize(callback),
    onUnmaximize: (callback: () => void) => getWindow().onUnmaximize(callback),
  },

  // -------------------------------------------------------------------------
  // Initial Data (for popup windows)
  // -------------------------------------------------------------------------
  initialData: {
    get: (id: string): Record<string, any> | null => {
      return getIpc().sendSync(`get-initial-data?id=${id}`);
    },
  },

  // -------------------------------------------------------------------------
  // Popup Management (delegated to platform/popup)
  // -------------------------------------------------------------------------
  popup: {
    open: (type: Types.PopupType, id: string, initialData: any, force?: boolean) => {
      getPopupController().open(type, id, initialData, { force });
    },

    close: (id: string) => {
      getPopupController().close(id);
    },

    closeAll: () => {
      getPopupController().closeAll();
    },

    submit: (to: string, data?: any) => {
      getPopupController().submit(to, data);
    },

    onSubmit: <T>(host: string, callback: (data: T) => void) => {
      return getPopupController().onSubmit(host, callback);
    },
  },

  // -------------------------------------------------------------------------
  // Account Storage
  // -------------------------------------------------------------------------
  accounts: {
    get: (): Record<string, { autoLogin: boolean; rememberAccount: boolean; password: string }> => {
      return getIpc().sendSync('get-accounts') ?? {};
    },

    add: (account: string, options: { autoLogin: boolean; rememberAccount: boolean; password: string }) => {
      getIpc().send('add-account', account, options);
    },

    delete: (account: string) => {
      getIpc().send('delete-account', account);
    },

    onUpdate: (callback: (accounts: Record<string, { autoLogin: boolean; rememberAccount: boolean; password: string }>) => void) => {
      getIpc().removeAllListeners('accounts');
      const listener = (_: any, accounts: Record<string, { autoLogin: boolean; rememberAccount: boolean; password: string }>) => callback(accounts);
      getIpc().on('accounts', listener);
      return () => getIpc().removeListener('accounts', listener);
    },
  },

  // -------------------------------------------------------------------------
  // Language
  // -------------------------------------------------------------------------
  language: {
    get: (): Types.LanguageKey => {
      return getIpc().sendSync('get-language') ?? 'zh-TW';
    },

    set: (language: Types.LanguageKey) => {
      getIpc().send('set-language', language);
    },

    onUpdate: (callback: (language: Types.LanguageKey) => void) => {
      getIpc().removeAllListeners('language');
      const listener = (_: any, language: Types.LanguageKey) => callback(language);
      getIpc().on('language', listener);
      return () => getIpc().removeListener('language', listener);
    },
  },

  // -------------------------------------------------------------------------
  // Custom Themes
  // -------------------------------------------------------------------------
  customThemes: {
    get: (): Types.Theme[] => {
      return getIpc().sendSync('get-custom-themes') ?? [];
    },

    add: (theme: Types.Theme) => {
      getIpc().send('add-custom-theme', theme);
    },

    delete: (index: number) => {
      getIpc().send('delete-custom-theme', index);
    },

    onUpdate: (callback: (themes: Types.Theme[]) => void) => {
      getIpc().removeAllListeners('custom-themes');
      const listener = (_: any, themes: Types.Theme[]) => callback(themes);
      getIpc().on('custom-themes', listener);
      return () => getIpc().removeListener('custom-themes', listener);
    },

    current: {
      get: (): Types.Theme | null => {
        return getIpc().sendSync('get-current-theme') ?? null;
      },

      set: (theme: Types.Theme | null) => {
        getIpc().send('set-current-theme', theme);
      },

      onUpdate: (callback: (theme: Types.Theme | null) => void) => {
        getIpc().removeAllListeners('current-theme');
        const listener = (_: any, theme: Types.Theme | null) => callback(theme);
        getIpc().on('current-theme', listener);
        return () => getIpc().removeListener('current-theme', listener);
      },
    },
  },

  // -------------------------------------------------------------------------
  // Discord Presence
  // -------------------------------------------------------------------------
  discord: {
    updatePresence: (presence: Types.DiscordPresence) => {
      getIpc().send('update-discord-presence', presence);
    },
  },

  // -------------------------------------------------------------------------
  // Font List
  // -------------------------------------------------------------------------
  fontList: {
    get: (): string[] => {
      return getIpc().sendSync('get-font-list') ?? [];
    },
  },

  // -------------------------------------------------------------------------
  // Record
  // -------------------------------------------------------------------------
  record: {
    save: (record: ArrayBuffer) => {
      getIpc().send('save-record', record);
    },

    savePath: {
      select: async (): Promise<string | null> => {
        return await getIpc().invoke('select-record-save-path');
      },
    },
  },

  // -------------------------------------------------------------------------
  // System Settings
  // -------------------------------------------------------------------------
  systemSettings: {
    set: (settings: Partial<Types.SystemSettings>) => {
      // Send each setting individually
      const settingMap: Record<keyof Types.SystemSettings, string> = {
        autoLogin: 'set-auto-login',
        autoLaunch: 'set-auto-launch',
        alwaysOnTop: 'set-always-on-top',
        statusAutoIdle: 'set-status-auto-idle',
        statusAutoIdleMinutes: 'set-status-auto-idle-minutes',
        statusAutoDnd: 'set-status-auto-dnd',
        channelUIMode: 'set-channel-ui-mode',
        closeToTray: 'set-close-to-tray',
        font: 'set-font',
        fontSize: 'set-font-size',
        inputAudioDevice: 'set-input-audio-device',
        outputAudioDevice: 'set-output-audio-device',
        recordFormat: 'set-record-format',
        recordSavePath: 'set-record-save-path',
        mixEffect: 'set-mix-effect',
        mixEffectType: 'set-mix-effect-type',
        autoMixSetting: 'set-auto-mix-setting',
        echoCancellation: 'set-echo-cancellation',
        noiseCancellation: 'set-noise-cancellation',
        microphoneAmplification: 'set-microphone-amplification',
        manualMixMode: 'set-manual-mix-mode',
        mixMode: 'set-mix-mode',
        speakingMode: 'set-speaking-mode',
        defaultSpeakingKey: 'set-default-speaking-key',
        notSaveMessageHistory: 'set-not-save-message-history',
        hotKeyOpenMainWindow: 'set-hot-key-open-main-window',
        hotKeyIncreaseVolume: 'set-hot-key-increase-volume',
        hotKeyDecreaseVolume: 'set-hot-key-decrease-volume',
        hotKeyToggleSpeaker: 'set-hot-key-toggle-speaker',
        hotKeyToggleMicrophone: 'set-hot-key-toggle-microphone',
        hotKeyScreenshot: 'set-hot-key-screenshot',
        disableAllSoundEffect: 'set-disable-all-sound-effect',
        enterVoiceChannelSound: 'set-enter-voice-channel-sound',
        leaveVoiceChannelSound: 'set-leave-voice-channel-sound',
        startSpeakingSound: 'set-start-speaking-sound',
        stopSpeakingSound: 'set-stop-speaking-sound',
        receiveDirectMessageSound: 'set-receive-direct-message-sound',
        receiveChannelMessageSound: 'set-receive-channel-message-sound',
        autoCheckForUpdates: 'set-auto-check-for-updates',
        updateCheckInterval: 'set-update-check-interval',
        updateChannel: 'set-update-channel',
      };

      for (const [key, channel] of Object.entries(settingMap)) {
        const value = settings[key as keyof Types.SystemSettings];
        if (value !== undefined) {
          getIpc().send(channel, value);
        }
      }
    },

    get: (): Types.SystemSettings | null => {
      return getIpc().sendSync('get-system-settings');
    },

    // Helper function to create setting accessor
    ...createSettingAccessors(),
  },

  // -------------------------------------------------------------------------
  // Tray
  // -------------------------------------------------------------------------
  tray: {
    title: {
      set: (title: string) => {
        getIpc().send('set-tray-title', title);
      },
    },
  },

  // -------------------------------------------------------------------------
  // Misc
  // -------------------------------------------------------------------------
  dontShowDisclaimerNextTime: () => {
    getIpc().send('dont-show-disclaimer-next-time');
  },

  loopbackAudio: {
    enable: () => {
      getIpc().invoke('enable-loopback-audio');
    },
    disable: () => {
      getIpc().invoke('disable-loopback-audio');
    },
  },

  checkForUpdates: () => {
    getIpc().send('check-for-updates');
  },

  changeServer: (server: 'prod' | 'dev') => {
    getIpc().send('change-server', server);
  },

  env: {
    get: (): Record<string, string> => {
      return getIpc().sendSync('get-env') ?? {};
    },
  },
};

// ============================================================================
// System Settings Accessors (auto-generated pattern)
// ============================================================================

type SettingConfig<T> = {
  getChannel: string;
  setChannel: string;
  updateChannel: string;
  defaultValue: T;
};

function createSettingAccessor<T>(config: SettingConfig<T>) {
  return {
    get: (): T => {
      return getIpc().sendSync(config.getChannel) ?? config.defaultValue;
    },
    set: (value: T) => {
      getIpc().send(config.setChannel, value);
    },
    onUpdate: (callback: (value: T) => void) => {
      const listener = (_: any, value: T) => callback(value);
      getIpc().on(config.updateChannel, listener);
      return () => getIpc().removeListener(config.updateChannel, listener);
    },
  };
}

function createSettingAccessors() {
  return {
    autoLogin: createSettingAccessor({ getChannel: 'get-auto-login', setChannel: 'set-auto-login', updateChannel: 'auto-login', defaultValue: false }),
    autoLaunch: createSettingAccessor({ getChannel: 'get-auto-launch', setChannel: 'set-auto-launch', updateChannel: 'auto-launch', defaultValue: false }),
    alwaysOnTop: createSettingAccessor({ getChannel: 'get-always-on-top', setChannel: 'set-always-on-top', updateChannel: 'always-on-top', defaultValue: false }),
    statusAutoIdle: createSettingAccessor({ getChannel: 'get-status-auto-idle', setChannel: 'set-status-auto-idle', updateChannel: 'status-auto-idle', defaultValue: false }),
    statusAutoIdleMinutes: createSettingAccessor({ getChannel: 'get-status-auto-idle-minutes', setChannel: 'set-status-auto-idle-minutes', updateChannel: 'status-auto-idle-minutes', defaultValue: 0 }),
    statusAutoDnd: createSettingAccessor({ getChannel: 'get-status-auto-dnd', setChannel: 'set-status-auto-dnd', updateChannel: 'status-auto-dnd', defaultValue: false }),
    channelUIMode: createSettingAccessor<Types.ChannelUIMode>({ getChannel: 'get-channel-ui-mode', setChannel: 'set-channel-ui-mode', updateChannel: 'channel-ui-mode', defaultValue: 'classic' }),
    closeToTray: createSettingAccessor({ getChannel: 'get-close-to-tray', setChannel: 'set-close-to-tray', updateChannel: 'close-to-tray', defaultValue: false }),
    font: createSettingAccessor({ getChannel: 'get-font', setChannel: 'set-font', updateChannel: 'font', defaultValue: '' }),
    fontSize: createSettingAccessor({ getChannel: 'get-font-size', setChannel: 'set-font-size', updateChannel: 'font-size', defaultValue: 0 }),
    inputAudioDevice: createSettingAccessor({ getChannel: 'get-input-audio-device', setChannel: 'set-input-audio-device', updateChannel: 'input-audio-device', defaultValue: '' }),
    outputAudioDevice: createSettingAccessor({ getChannel: 'get-output-audio-device', setChannel: 'set-output-audio-device', updateChannel: 'output-audio-device', defaultValue: '' }),
    recordFormat: createSettingAccessor<Types.RecordFormat>({ getChannel: 'get-record-format', setChannel: 'set-record-format', updateChannel: 'record-format', defaultValue: 'wav' }),
    recordSavePath: createSettingAccessor({ getChannel: 'get-record-save-path', setChannel: 'set-record-save-path', updateChannel: 'record-save-path', defaultValue: '' }),
    mixEffect: createSettingAccessor({ getChannel: 'get-mix-effect', setChannel: 'set-mix-effect', updateChannel: 'mix-effect', defaultValue: false }),
    mixEffectType: createSettingAccessor({ getChannel: 'get-mix-effect-type', setChannel: 'set-mix-effect-type', updateChannel: 'mix-effect-type', defaultValue: '' }),
    autoMixSetting: createSettingAccessor({ getChannel: 'get-auto-mix-setting', setChannel: 'set-auto-mix-setting', updateChannel: 'auto-mix-setting', defaultValue: false }),
    echoCancellation: createSettingAccessor({ getChannel: 'get-echo-cancellation', setChannel: 'set-echo-cancellation', updateChannel: 'echo-cancellation', defaultValue: false }),
    noiseCancellation: createSettingAccessor({ getChannel: 'get-noise-cancellation', setChannel: 'set-noise-cancellation', updateChannel: 'noise-cancellation', defaultValue: false }),
    microphoneAmplification: createSettingAccessor({ getChannel: 'get-microphone-amplification', setChannel: 'set-microphone-amplification', updateChannel: 'microphone-amplification', defaultValue: false }),
    manualMixMode: createSettingAccessor({ getChannel: 'get-manual-mix-mode', setChannel: 'set-manual-mix-mode', updateChannel: 'manual-mix-mode', defaultValue: false }),
    mixMode: createSettingAccessor<Types.MixMode>({ getChannel: 'get-mix-mode', setChannel: 'set-mix-mode', updateChannel: 'mix-mode', defaultValue: 'app' }),
    speakingMode: createSettingAccessor<Types.SpeakingMode>({ getChannel: 'get-speaking-mode', setChannel: 'set-speaking-mode', updateChannel: 'speaking-mode', defaultValue: 'auto' }),
    defaultSpeakingKey: createSettingAccessor({ getChannel: 'get-default-speaking-key', setChannel: 'set-default-speaking-key', updateChannel: 'default-speaking-key', defaultValue: '' }),
    notSaveMessageHistory: createSettingAccessor({ getChannel: 'get-not-save-message-history', setChannel: 'set-not-save-message-history', updateChannel: 'not-save-message-history', defaultValue: false }),
    hotKeyOpenMainWindow: createSettingAccessor({ getChannel: 'get-hot-key-open-main-window', setChannel: 'set-hot-key-open-main-window', updateChannel: 'hot-key-open-main-window', defaultValue: '' }),
    hotKeyIncreaseVolume: createSettingAccessor({ getChannel: 'get-hot-key-increase-volume', setChannel: 'set-hot-key-increase-volume', updateChannel: 'hot-key-increase-volume', defaultValue: '' }),
    hotKeyDecreaseVolume: createSettingAccessor({ getChannel: 'get-hot-key-decrease-volume', setChannel: 'set-hot-key-decrease-volume', updateChannel: 'hot-key-decrease-volume', defaultValue: '' }),
    hotKeyToggleSpeaker: createSettingAccessor({ getChannel: 'get-hot-key-toggle-speaker', setChannel: 'set-hot-key-toggle-speaker', updateChannel: 'hot-key-toggle-speaker', defaultValue: '' }),
    hotKeyToggleMicrophone: createSettingAccessor({ getChannel: 'get-hot-key-toggle-microphone', setChannel: 'set-hot-key-toggle-microphone', updateChannel: 'hot-key-toggle-microphone', defaultValue: '' }),
    hotKeyScreenshot: createSettingAccessor({ getChannel: 'get-hot-key-screenshot', setChannel: 'set-hot-key-screenshot', updateChannel: 'hot-key-screenshot', defaultValue: '' }),
    disableAllSoundEffect: createSettingAccessor({ getChannel: 'get-disable-all-sound-effect', setChannel: 'set-disable-all-sound-effect', updateChannel: 'disable-all-sound-effect', defaultValue: false }),
    enterVoiceChannelSound: createSettingAccessor({ getChannel: 'get-enter-voice-channel-sound', setChannel: 'set-enter-voice-channel-sound', updateChannel: 'enter-voice-channel-sound', defaultValue: true }),
    leaveVoiceChannelSound: createSettingAccessor({ getChannel: 'get-leave-voice-channel-sound', setChannel: 'set-leave-voice-channel-sound', updateChannel: 'leave-voice-channel-sound', defaultValue: true }),
    startSpeakingSound: createSettingAccessor({ getChannel: 'get-start-speaking-sound', setChannel: 'set-start-speaking-sound', updateChannel: 'start-speaking-sound', defaultValue: true }),
    stopSpeakingSound: createSettingAccessor({ getChannel: 'get-stop-speaking-sound', setChannel: 'set-stop-speaking-sound', updateChannel: 'stop-speaking-sound', defaultValue: true }),
    receiveDirectMessageSound: createSettingAccessor({ getChannel: 'get-receive-direct-message-sound', setChannel: 'set-receive-direct-message-sound', updateChannel: 'receive-direct-message-sound', defaultValue: true }),
    receiveChannelMessageSound: createSettingAccessor({ getChannel: 'get-receive-channel-message-sound', setChannel: 'set-receive-channel-message-sound', updateChannel: 'receive-channel-message-sound', defaultValue: true }),
    autoCheckForUpdates: createSettingAccessor({ getChannel: 'get-auto-check-for-updates', setChannel: 'set-auto-check-for-updates', updateChannel: 'auto-check-for-updates', defaultValue: false }),
    updateCheckInterval: createSettingAccessor({ getChannel: 'get-update-check-interval', setChannel: 'set-update-check-interval', updateChannel: 'update-check-interval', defaultValue: 0 }),
    updateChannel: createSettingAccessor({ getChannel: 'get-update-channel', setChannel: 'set-update-channel', updateChannel: 'update-channel', defaultValue: '' }),
  };
}

export default ipcFacade;

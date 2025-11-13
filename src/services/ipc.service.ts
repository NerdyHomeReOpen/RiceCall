/* eslint-disable @typescript-eslint/no-explicit-any */
import { DiscordPresence, PopupType, SpeakingMode, MixMode, ServerToClientEvents, ClientToServerEvents, ChannelUIMode, ACK, Theme, SystemSettings } from '@/types';
import { LanguageKey } from '@/i18n';

// Services
import data from '@/services/data.service';

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
      const listener = (_: any, ...args: Parameters<ServerToClientEvents[T]>) => callback(...args);
      ipcRenderer.on(event, listener);
      return () => ipcRenderer.removeListener(event, listener);
    },
    emit: <T, R>(event: string, payload: T): Promise<R> => {
      if (!isElectron) return Promise.resolve(null as R);
      return new Promise((resolve, reject) => {
        ipcRenderer.invoke(event, payload).then((ack: ACK<R>) => {
          if (ack?.ok) resolve(ack.data);
          else reject(new Error(ack?.error || 'unknown error'));
        });
      });
    },
  },

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

    close: () => {
      if (!isElectron) return;
      ipcRenderer.send('window-control', 'close');
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
    open: (type: PopupType, id: string, initialData: any, force?: boolean) => {
      if (!isElectron) return;
      if (type === 'applyMember') {
        const { userId, serverId } = initialData;
        Promise.all([data.server({ userId, serverId }), data.memberApplication({ userId, serverId })]).then(([server, memberApplication]) => {
          if (!server) return;
          ipcRenderer.send('open-popup', type, id, { server, memberApplication }, force);
        });
      } else if (type === 'applyFriend') {
        const { userId, targetId } = initialData;
        Promise.all([
          data.user({ userId: targetId }),
          data.friendGroups({ userId }),
          data.friendApplication({ senderId: userId, receiverId: targetId }),
          data.friendApplication({ senderId: targetId, receiverId: userId }),
        ]).then(([target, friendGroups, friendApplication, receivedFriendApplication]) => {
          if (!target || !friendGroups) return;
          if (!receivedFriendApplication) {
            ipcRenderer.send('open-popup', 'applyFriend', 'applyFriend', { userId, targetId, target, friendGroups, friendApplication }, force);
          } else {
            ipcRenderer.send('open-popup', 'approveFriend', 'approveFriend', { targetId, friendGroups }, force);
          }
        });
      } else if (type === 'approveFriend') {
        const { userId, targetId } = initialData;
        Promise.all([data.friendGroups({ userId })]).then(([friendGroups]) => {
          if (!friendGroups) return;
          ipcRenderer.send('open-popup', type, id, { targetId, friendGroups }, force);
        });
      } else if (type === 'blockMember') {
        const { userId, serverId } = initialData;
        Promise.all([data.member({ userId, serverId })]).then(([member]) => {
          if (!member) return;
          ipcRenderer.send('open-popup', type, id, { userId, serverId, member }, force);
        });
      } else if (type === 'channelSetting') {
        const { userId, serverId, channelId } = initialData;
        Promise.all([data.user({ userId }), data.server({ userId, serverId }), data.channel({ userId, serverId, channelId }), data.channelMembers({ serverId, channelId })]).then(
          ([user, server, channel, channelMembers]) => {
            if (!user || !server || !channel || !channelMembers) return;
            const title = channel.name ?? '';
            ipcRenderer.send('open-popup', type, id, { userId, serverId, channelId, user, server, channel, channelMembers }, force, title);
          },
        );
      } else if (type === 'createServer') {
        const { userId } = initialData;
        Promise.all([data.user({ userId }), data.servers({ userId })]).then(([user, servers]) => {
          if (!user || !servers) return;
          ipcRenderer.send('open-popup', type, id, { userId, user, servers }, force);
        });
      } else if (type === 'createChannel') {
        const { userId, serverId, channelId } = initialData;
        if (!channelId) {
          ipcRenderer.send('open-popup', type, id, { userId, serverId }, force);
        } else {
          Promise.all([data.channel({ userId, serverId, channelId })]).then(([parent]) => {
            if (!parent) return;
            ipcRenderer.send('open-popup', type, id, { userId, serverId, channelId, parent }, force);
          });
        }
      } else if (type === 'chatHistory') {
        const { userId, targetId } = initialData;
        Promise.all([data.user({ userId }), data.friend({ userId, targetId }), data.user({ userId: targetId })]).then(([user, friend, target]) => {
          if (!user || !target) return;
          const title = target.name ?? '';
          ipcRenderer.send('open-popup', type, id, { userId, targetId, user, friend, target }, force, title);
        });
      } else if (type === 'directMessage') {
        const { userId, targetId, event, message } = initialData;
        Promise.all([data.user({ userId }), data.friend({ userId, targetId }), data.user({ userId: targetId })]).then(([user, friend, target]) => {
          if (!user || !target) return;
          const title = target.name ?? '';
          ipcRenderer.send('open-popup', type, id, { userId, targetId, user, friend, target, event, message }, force, title);
        });
      } else if (type === 'editChannelOrder') {
        const { userId, serverId } = initialData;
        Promise.all([data.channels({ userId, serverId })]).then(([serverChannels]) => {
          if (!serverChannels) return;
          ipcRenderer.send('open-popup', type, id, { userId, serverId, serverChannels }, force);
        });
      } else if (type === 'editChannelName') {
        const { userId, serverId, channelId } = initialData;
        Promise.all([data.channel({ userId, serverId, channelId })]).then(([channel]) => {
          if (!channel) return;
          ipcRenderer.send('open-popup', type, id, { userId, serverId, channelId, channel }, force);
        });
      } else if (type === 'editFriendNote') {
        const { userId, targetId } = initialData;
        Promise.all([data.friend({ userId, targetId }), data.friendGroups({ userId })]).then(([friend, friendGroups]) => {
          if (!friend || !friendGroups) return;
          ipcRenderer.send('open-popup', type, id, { userId, targetId, friend, friendGroups }, force);
        });
      } else if (type === 'editFriendGroupName') {
        const { userId, friendGroupId } = initialData;
        Promise.all([data.friendGroup({ userId, friendGroupId })]).then(([friendGroup]) => {
          if (!friendGroup) return;
          ipcRenderer.send('open-popup', type, id, { userId, friendGroupId, friendGroup }, force);
        });
      } else if (type === 'editNickname') {
        const { userId, serverId } = initialData;
        Promise.all([data.member({ userId, serverId })]).then(([member]) => {
          if (!member) return;
          ipcRenderer.send('open-popup', type, id, { userId, serverId, member }, force);
        });
      } else if (type === 'friendVerification') {
        const { userId } = initialData;
        Promise.all([data.friendApplications({ receiverId: userId })]).then(([friendApplications]) => {
          if (!friendApplications) return;
          ipcRenderer.send('open-popup', type, id, { userId, friendApplications }, force);
        });
      } else if (type === 'inviteMember') {
        const { userId, serverId } = initialData;
        Promise.all([data.member({ userId, serverId }), data.memberInvitation({ serverId, receiverId: userId })]).then(([target, memberInvitation]) => {
          if (!target) return;
          ipcRenderer.send('open-popup', type, id, { userId, serverId, target, memberInvitation }, force);
        });
      } else if (type === 'memberApplicationSetting') {
        const { userId, serverId } = initialData;
        Promise.all([data.server({ userId, serverId })]).then(([server]) => {
          if (!server) return;
          ipcRenderer.send('open-popup', type, id, { userId, serverId, server }, force);
        });
      } else if (type === 'memberInvitation') {
        const { userId } = initialData;
        Promise.all([data.memberInvitations({ receiverId: userId })]).then(([memberInvitations]) => {
          if (!memberInvitations) return;
          ipcRenderer.send('open-popup', type, id, { userId, memberInvitations }, force);
        });
      } else if (type === 'serverSetting') {
        const { userId, serverId } = initialData;
        Promise.all([data.user({ userId }), data.server({ userId, serverId }), data.serverMembers({ serverId }), data.memberApplications({ serverId })]).then(
          ([user, server, serverMembers, memberApplications]) => {
            if (!user || !server || !serverMembers || !memberApplications) return;
            const title = server.name ?? '';
            ipcRenderer.send('open-popup', type, id, { userId, serverId, user, server, serverMembers, memberApplications }, force, title);
          },
        );
      } else if (type === 'systemSetting') {
        const { userId } = initialData;
        const systemSettings = ipcService.systemSettings.get();
        Promise.all([data.user({ userId })]).then(([user]) => {
          if (!user) return;
          ipcRenderer.send('open-popup', type, id, { userId, user, systemSettings }, force);
        });
      } else if (type === 'userInfo') {
        const { userId, targetId } = initialData;
        Promise.all([data.friend({ userId, targetId }), data.user({ userId: targetId }), data.servers({ userId: targetId })]).then(([friend, target, targetServers]) => {
          if (!target || !targetServers) return;
          const title = target.name ?? '';
          ipcRenderer.send('open-popup', type, id, { userId, targetId, friend, target, targetServers }, force, title);
        });
      } else {
        ipcRenderer.send('open-popup', type, id, initialData, force);
      }
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
      if (!isElectron) return () => {};
      ipcRenderer.removeAllListeners('popup-submit');
      const listener = (_: any, from: string, data?: any) => {
        if (from != host) return;
        callback(data);
        ipcRenderer.removeAllListeners('popup-submit');
      };
      ipcRenderer.on('popup-submit', listener);
      return () => ipcRenderer.removeListener('popup-submit', listener);
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
    get: (): LanguageKey => {
      if (!isElectron) return 'zh-TW';
      return ipcRenderer.sendSync('get-language');
    },

    set: (language: LanguageKey) => {
      if (!isElectron) return;
      ipcRenderer.send('set-language', language);
    },

    onUpdate: (callback: (language: LanguageKey) => void) => {
      if (!isElectron) return () => {};
      ipcRenderer.removeAllListeners('language');
      const listener = (_: any, language: LanguageKey) => callback(language);
      ipcRenderer.on('language', listener);
      return () => ipcRenderer.removeListener('language', listener);
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

  customThemes: {
    get: (): Theme[] => {
      if (!isElectron) return [];
      return ipcRenderer.sendSync('get-custom-themes');
    },

    add: (theme: Theme) => {
      if (!isElectron) return;
      ipcRenderer.send('add-custom-theme', theme);
    },

    delete: (index: number) => {
      if (!isElectron) return;
      ipcRenderer.send('delete-custom-theme', index);
    },

    onUpdate: (callback: (themes: Theme[]) => void) => {
      if (!isElectron) return () => [];
      ipcRenderer.removeAllListeners('custom-themes');
      const listener = (_: any, themes: Theme[]) => callback(themes);
      ipcRenderer.on('custom-themes', listener);
      return () => ipcRenderer.removeListener('custom-themes', listener);
    },

    current: {
      get: (): Theme | null => {
        if (!isElectron) return null;
        return ipcRenderer.sendSync('get-current-theme');
      },

      set: (theme: Theme | null) => {
        if (!isElectron) return;
        ipcRenderer.send('set-current-theme', theme);
      },

      onUpdate: (callback: (theme: Theme | null) => void) => {
        if (!isElectron) return () => null;
        ipcRenderer.removeAllListeners('current-theme');
        const listener = (_: any, theme: Theme | null) => callback(theme);
        ipcRenderer.on('current-theme', listener);
        return () => ipcRenderer.removeListener('current-theme', listener);
      },
    },
  },

  discord: {
    updatePresence: (presence: DiscordPresence) => {
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

  systemSettings: {
    get: (): SystemSettings | null => {
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
      set: (key: ChannelUIMode) => {
        if (!isElectron) return;
        ipcRenderer.send('set-channel-ui-mode', key);
      },

      get: (): ChannelUIMode => {
        if (!isElectron) return 'classic';
        return ipcRenderer.sendSync('get-channel-ui-mode');
      },

      onUpdate: (callback: (key: ChannelUIMode) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, channelUIMode: ChannelUIMode) => callback(channelUIMode);
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
      set: (format: 'wav' | 'mp3') => {
        if (!isElectron) return;
        ipcRenderer.send('set-record-format', format);
      },

      get: (): 'wav' | 'mp3' => {
        if (!isElectron) return 'wav';
        return ipcRenderer.sendSync('get-record-format');
      },

      onUpdate: (callback: (format: 'wav' | 'mp3') => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, format: 'wav' | 'mp3') => callback(format);
        ipcRenderer.on('record-format', listener);
        return () => ipcRenderer.removeListener('record-format', listener);
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
      set: (key: MixMode) => {
        if (!isElectron) return;
        ipcRenderer.send('set-mix-mode', key);
      },

      get: (): MixMode => {
        if (!isElectron) return 'app';
        return ipcRenderer.sendSync('get-mix-mode');
      },

      onUpdate: (callback: (key: MixMode) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, key: MixMode) => callback(key);
        ipcRenderer.on('mix-mode', listener);
        return () => ipcRenderer.removeListener('mix-mode', listener);
      },
    },

    speakingMode: {
      set: (key: SpeakingMode) => {
        if (!isElectron) return;
        ipcRenderer.send('set-speaking-mode', key);
      },

      get: (): SpeakingMode => {
        if (!isElectron) return 'auto';
        return ipcRenderer.sendSync('get-speaking-mode');
      },

      onUpdate: (callback: (key: SpeakingMode) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, key: SpeakingMode) => callback(key);
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
        if (!isElectron) return false;
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
        if (!isElectron) return false;
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
        if (!isElectron) return false;
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
        if (!isElectron) return false;
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
        if (!isElectron) return false;
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
        if (!isElectron) return false;
        return ipcRenderer.sendSync('get-receive-channel-message-sound');
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (!isElectron) return () => {};
        const listener = (_: any, enabled: boolean) => callback(enabled);
        ipcRenderer.on('receive-channel-message-sound', listener);
        return () => ipcRenderer.removeListener('receive-channel-message-sound', listener);
      },
    },
  },

  toolbar: {
    title: {
      set: (title: string) => {
        if (!isElectron) return;
        ipcRenderer.send('set-toolbar-title', title);
      },
    },
  },

  detectKey: {
    onDefaultSpeakingKeyToggled: (callback: () => void) => {
      if (!isElectron) return () => {};
      const listener = () => callback();
      ipcRenderer.on('toggle-default-speaking-key', listener);
      return () => ipcRenderer.removeListener('toggle-default-speaking-key', listener);
    },

    onHotKeyOpenMainWindowToggled: (callback: () => void) => {
      if (!isElectron) return () => {};
      const listener = () => callback();
      ipcRenderer.on('toggle-hot-key-open-main-window', listener);
      return () => ipcRenderer.removeListener('toggle-hot-key-open-main-window', listener);
    },

    onHotKeyIncreaseVolumeToggled: (callback: () => void) => {
      if (!isElectron) return () => {};
      const listener = () => callback();
      ipcRenderer.on('toggle-hot-key-increase-volume', listener);
      return () => ipcRenderer.removeListener('toggle-hot-key-increase-volume', listener);
    },

    onHotKeyDecreaseVolumeToggled: (callback: () => void) => {
      if (!isElectron) return () => {};
      const listener = () => callback();
      ipcRenderer.on('toggle-hot-key-decrease-volume', listener);
      return () => ipcRenderer.removeListener('toggle-hot-key-decrease-volume', listener);
    },

    onHotKeyToggleSpeakerToggled: (callback: () => void) => {
      if (!isElectron) return () => {};
      const listener = () => callback();
      ipcRenderer.on('toggle-hot-key-toggle-speaker', listener);
      return () => ipcRenderer.removeListener('toggle-hot-key-toggle-speaker', listener);
    },

    onHotKeyToggleMicrophoneToggled: (callback: () => void) => {
      if (!isElectron) return () => {};
      const listener = () => callback();
      ipcRenderer.on('toggle-hot-key-toggle-microphone', listener);
      return () => ipcRenderer.removeListener('toggle-hot-key-toggle-microphone', listener);
    },
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

  latency: {
    get: (): number => {
      if (!isElectron) return 0;
      return ipcRenderer.sendSync('get-latency');
    },
  },
};

export default ipcService;

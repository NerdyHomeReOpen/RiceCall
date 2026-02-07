/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */
import { isElectron, isRenderer, isWebsite } from '@/platform/isElectron';

import * as Types from '@/types';

import Logger from '@/logger';

// Safe references initialized on first use
let ipcRenderer: any = null;
let webMain: any = null;

if (isElectron()) {
  // In Renderer environment, supplement ipcRenderer
  if (!ipcRenderer && isRenderer()) {
    try {
      ipcRenderer = window.require('electron').ipcRenderer;
    } catch (error) {
      new Logger('IPC').error(`Failed to require electron: ${error}`);
    }
  }
} else {
  webMain = require('@/web/main');
}

const ipc = {
  exit: () => {
    if (isWebsite()) {
      webMain.exit();
    } else if (isRenderer()) {
      ipcRenderer.send('exit');
    } else {
      throw new Error('Unsupported platform');
    }
  },

  socket: {
    send: <T extends keyof Types.ClientToServerEvents>(event: T, ...args: Parameters<Types.ClientToServerEvents[T]>) => {
      if (isWebsite()) {
        return webMain.socketSend(event, ...args);
      } else if (isRenderer()) {
        ipcRenderer.send(event, ...args);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    on: <T extends keyof Types.ServerToClientEvents>(event: T, callback: (...args: Parameters<Types.ServerToClientEvents[T]>) => ReturnType<Types.ServerToClientEvents[T]>) => {
      if (isWebsite()) {
        const listener = (...args: Parameters<Types.ServerToClientEvents[T]>) => callback(...args);
        webMain.webEventEmitter.on(event, listener);
        return () => webMain.webEventEmitter.removeListener(event, listener);
      } else if (isRenderer()) {
        const listener = (_: any, ...args: Parameters<Types.ServerToClientEvents[T]>) => callback(...args);
        ipcRenderer.on(event, listener);
        return () => ipcRenderer.removeListener(event, listener);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    emit: <T extends keyof Types.ClientToServerEventsWithAck>(event: T, payload: Parameters<Types.ClientToServerEventsWithAck[T]>[0]): Promise<ReturnType<Types.ClientToServerEventsWithAck[T]>> => {
      if (isWebsite()) {
        return webMain.socketEmit(event, payload);
      } else if (isRenderer()) {
        return new Promise((resolve, reject) => {
          ipcRenderer.invoke(event, payload).then((ack: Types.ACK<ReturnType<Types.ClientToServerEventsWithAck[T]>>) => {
            if (ack?.ok) resolve(ack.data);
            else reject(new Error(ack?.error || 'unknown error'));
          });
        });
      } else {
        throw new Error('Unsupported platform');
      }
    },
  },

  auth: {
    login: async (formData: { account: string; password: string }): Promise<{ success: true; token: string } | { success: false }> => {
      if (isWebsite()) {
        return await webMain.login(formData);
      } else if (isRenderer()) {
        return await ipcRenderer.invoke('auth-login', formData);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    logout: async (): Promise<void> => {
      if (isWebsite()) {
        return await webMain.logout();
      } else if (isRenderer()) {
        return await ipcRenderer.invoke('auth-logout');
      } else {
        throw new Error('Unsupported platform');
      }
    },

    register: async (formData: { account: string; password: string; email: string; username: string; locale: string }): Promise<{ success: true; message: string } | { success: false }> => {
      if (isWebsite()) {
        return await webMain.register(formData);
      } else if (isRenderer()) {
        return await ipcRenderer.invoke('auth-register', formData);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    autoLogin: async (token: string): Promise<{ success: true; token: string } | { success: false }> => {
      if (isWebsite()) {
        return await webMain.autoLogin(token);
      } else if (isRenderer()) {
        return await ipcRenderer.invoke('auth-auto-login', token);
      } else {
        throw new Error('Unsupported platform');
      }
    },
  },

  data: {
    user: async (params: { userId: string }): Promise<Types.User | null> => {
      if (isWebsite()) {
        return await webMain.dataUser(params);
      } else if (isRenderer()) {
        return await ipcRenderer.invoke('data-user', params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    userHotReload: async (params: { userId: string }): Promise<Types.User | null> => {
      if (isWebsite()) {
        return await webMain.dataUserHotReload(params);
      } else if (isRenderer()) {
        return await ipcRenderer.invoke('data-user-hot-reload', params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    friend: async (params: { userId: string; targetId: string }): Promise<Types.Friend | null> => {
      if (isWebsite()) {
        return await webMain.dataFriend(params);
      } else if (isRenderer()) {
        return await ipcRenderer.invoke('data-friend', params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    friends: async (params: { userId: string }): Promise<Types.Friend[]> => {
      if (isWebsite()) {
        return await webMain.dataFriends(params);
      } else if (isRenderer()) {
        return await ipcRenderer.invoke('data-friends', params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    friendActivities: async (params: { userId: string }): Promise<Types.FriendActivity[]> => {
      if (isWebsite()) {
        return await webMain.dataFriendActivities(params);
      } else if (isRenderer()) {
        return await ipcRenderer.invoke('data-friendActivities', params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    friendGroup: async (params: { userId: string; friendGroupId: string }): Promise<Types.FriendGroup | null> => {
      if (isWebsite()) {
        return await webMain.dataFriendGroup(params);
      } else if (isRenderer()) {
        return await ipcRenderer.invoke('data-friendGroup', params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    friendGroups: async (params: { userId: string }): Promise<Types.FriendGroup[]> => {
      if (isWebsite()) {
        return await webMain.dataFriendGroups(params);
      } else if (isRenderer()) {
        return await ipcRenderer.invoke('data-friendGroups', params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    friendApplication: async (params: { receiverId: string; senderId: string }): Promise<Types.FriendApplication | null> => {
      if (isWebsite()) {
        return await webMain.dataFriendApplication(params);
      } else if (isRenderer()) {
        return await ipcRenderer.invoke('data-friendApplication', params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    friendApplications: async (params: { receiverId: string }): Promise<Types.FriendApplication[]> => {
      if (isWebsite()) {
        return await webMain.dataFriendApplications(params);
      } else if (isRenderer()) {
        return await ipcRenderer.invoke('data-friendApplications', params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    server: async (params: { userId: string; serverId: string }): Promise<Types.Server | null> => {
      if (isWebsite()) {
        return await webMain.dataServer(params);
      } else if (isRenderer()) {
        return await ipcRenderer.invoke('data-server', params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    servers: async (params: { userId: string }): Promise<Types.Server[]> => {
      if (isWebsite()) {
        return await webMain.dataServers(params);
      } else if (isRenderer()) {
        return await ipcRenderer.invoke('data-servers', params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    serverMembers: async (params: { serverId: string }): Promise<Types.Member[]> => {
      if (isWebsite()) {
        return await webMain.dataServerMembers(params);
      } else if (isRenderer()) {
        return await ipcRenderer.invoke('data-serverMembers', params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    serverOnlineMembers: async (params: { serverId: string }): Promise<Types.OnlineMember[]> => {
      if (isWebsite()) {
        return await webMain.dataServerOnlineMembers(params);
      } else if (isRenderer()) {
        return await ipcRenderer.invoke('data-serverOnlineMembers', params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    channel: async (params: { userId: string; serverId: string; channelId: string }): Promise<Types.Channel | null> => {
      if (isWebsite()) {
        return await webMain.dataChannel(params);
      } else if (isRenderer()) {
        return await ipcRenderer.invoke('data-channel', params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    channels: async (params: { userId: string; serverId: string }): Promise<Types.Channel[]> => {
      if (isWebsite()) {
        return await webMain.dataChannels(params);
      } else if (isRenderer()) {
        return await ipcRenderer.invoke('data-channels', params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    channelMembers: async (params: { serverId: string; channelId: string }): Promise<Types.Member[]> => {
      if (isWebsite()) {
        return await webMain.dataChannelMembers(params);
      } else if (isRenderer()) {
        return await ipcRenderer.invoke('data-channelMembers', params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    member: async (params: { userId: string; serverId: string; channelId?: string }): Promise<Types.Member | null> => {
      if (isWebsite()) {
        return await webMain.dataMember(params);
      } else if (isRenderer()) {
        return await ipcRenderer.invoke('data-member', params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    memberApplication: async (params: { userId: string; serverId: string }): Promise<Types.MemberApplication | null> => {
      if (isWebsite()) {
        return await webMain.dataMemberApplication(params);
      } else if (isRenderer()) {
        return await ipcRenderer.invoke('data-memberApplication', params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    memberApplications: async (params: { serverId: string }): Promise<Types.MemberApplication[]> => {
      if (isWebsite()) {
        return await webMain.dataMemberApplications(params);
      } else if (isRenderer()) {
        return await ipcRenderer.invoke('data-memberApplications', params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    memberInvitation: async (params: { receiverId: string; serverId: string }): Promise<Types.MemberInvitation | null> => {
      if (isWebsite()) {
        return await webMain.dataMemberInvitation(params);
      } else if (isRenderer()) {
        return await ipcRenderer.invoke('data-memberInvitation', params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    memberInvitations: async (params: { receiverId: string }): Promise<Types.MemberInvitation[]> => {
      if (isWebsite()) {
        return await webMain.dataMemberInvitations(params);
      } else if (isRenderer()) {
        return await ipcRenderer.invoke('data-memberInvitations', params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    notifications: async (params: { region: Types.LanguageKey }): Promise<Types.Notification[]> => {
      if (isWebsite()) {
        return await webMain.dataNotifications(params);
      } else if (isRenderer()) {
        return await ipcRenderer.invoke('data-notifications', params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    announcements: async (params: { region: Types.LanguageKey }): Promise<Types.Announcement[]> => {
      if (isWebsite()) {
        return await webMain.dataAnnouncements(params);
      } else if (isRenderer()) {
        return await ipcRenderer.invoke('data-announcements', params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    recommendServers: async (params: { region: Types.LanguageKey }): Promise<Types.RecommendServer[]> => {
      if (isWebsite()) {
        return await webMain.dataRecommendServers(params);
      } else if (isRenderer()) {
        return await ipcRenderer.invoke('data-recommendServers', params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    uploadImage: async (params: { folder: string; imageName: string; imageUnit8Array: Uint8Array }): Promise<{ imageName: string; imageUrl: string } | null> => {
      if (isWebsite()) {
        return await webMain.dataUploadImage(params);
      } else if (isRenderer()) {
        return await ipcRenderer.invoke('data-uploadImage', params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    searchServer: async (params: { query: string }): Promise<Types.Server[]> => {
      if (isWebsite()) {
        return await webMain.dataSearchServer(params);
      } else if (isRenderer()) {
        return await ipcRenderer.invoke('data-searchServer', params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    searchUser: async (params: { query: string }): Promise<Types.User[]> => {
      if (isWebsite()) {
        return await webMain.dataSearchUser(params);
      } else if (isRenderer()) {
        return await ipcRenderer.invoke('data-searchUser', params);
      } else {
        throw new Error('Unsupported platform');
      }
    },
  },

  deepLink: {
    onDeepLink: (callback: (serverId: string) => void) => {
      if (isWebsite()) {
        return () => {};
      } else if (isRenderer()) {
        const listener = (_: any, serverId: string) => callback(serverId);
        ipcRenderer.on('deepLink', listener);
        return () => ipcRenderer.removeListener('deepLink', listener);
      } else {
        throw new Error('Unsupported platform');
      }
    },
  },

  window: {
    minimize: (popupId?: string) => {
      if (isWebsite()) {
        if (popupId) webMain.windowMinimize(popupId);
      } else if (isRenderer()) {
        ipcRenderer.send('window-control-minimize');
      } else {
        throw new Error('Unsupported platform');
      }
    },

    maximize: () => {
      if (isWebsite()) {
        // ignore
      } else if (isRenderer()) {
        ipcRenderer.send('window-control-maximize');
      } else {
        throw new Error('Unsupported platform');
      }
    },

    unmaximize: () => {
      if (isWebsite()) {
        // ignore
      } else if (isRenderer()) {
        ipcRenderer.send('window-control-unmaximize');
      } else {
        throw new Error('Unsupported platform');
      }
    },

    close: () => {
      if (isWebsite()) {
        // ignore
      } else if (isRenderer()) {
        ipcRenderer.send('window-control-close');
      } else {
        throw new Error('Unsupported platform');
      }
    },

    onMaximize: (callback: () => void) => {
      if (isWebsite()) {
        return () => {};
      } else if (isRenderer()) {
        const listener = () => callback();
        ipcRenderer.on('maximize', listener);
        return () => ipcRenderer.removeListener('maximize', listener);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    onUnmaximize: (callback: () => void) => {
      if (isWebsite()) {
        return () => {};
      } else if (isRenderer()) {
        const listener = () => callback();
        ipcRenderer.on('unmaximize', listener);
        return () => ipcRenderer.removeListener('unmaximize', listener);
      } else {
        throw new Error('Unsupported platform');
      }
    },
  },

  initialData: {
    get: (id: string): Record<string, any> | null => {
      if (isWebsite()) {
        return webMain.getInitialData(id);
      } else if (isRenderer()) {
        return ipcRenderer.sendSync(`get-initial-data?id=${id}`);
      } else {
        throw new Error('Unsupported platform');
      }
    },
  },

  popup: {
    open: (type: Types.PopupType, id: string, initialData: any, force?: boolean) => {
      if (isWebsite()) {
        return webMain.openPopup(type, id, initialData, force);
      } else if (isRenderer()) {
        ipcRenderer.send('open-popup', type, id, initialData, force);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    close: (id: string) => {
      if (isWebsite()) {
        return webMain.closePopup(id);
      } else if (isRenderer()) {
        ipcRenderer.send('close-popup', id);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    closeAll: () => {
      if (isWebsite()) {
        return webMain.closeAllPopups();
      } else if (isRenderer()) {
        ipcRenderer.send('close-all-popups');
      } else {
        throw new Error('Unsupported platform');
      }
    },

    submit: (to: string, data?: any) => {
      if (isWebsite()) {
        webMain.webEventEmitter.emit('popup-submit', to, data);
      } else if (isRenderer()) {
        ipcRenderer.send('popup-submit', to, data);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    onSubmit: <T>(host: string, callback: (data: T) => void) => {
      if (isWebsite()) {
        const listener = (from: string, data: T) => {
          if (from === host) callback(data);
          webMain.webEventEmitter.removeListener('popup-submit', listener);
        };
        webMain.webEventEmitter.removeListener('popup-submit', listener);
        webMain.webEventEmitter.on('popup-submit', listener);
        return () => webMain.webEventEmitter.removeListener('popup-submit', listener);
      } else if (isRenderer()) {
        const listener = (_: any, from: string, data: T) => {
          if (from === host) callback(data);
          ipcRenderer.removeListener('popup-submit', listener);
        };
        ipcRenderer.removeListener('popup-submit', listener);
        ipcRenderer.on('popup-submit', listener);
        return () => ipcRenderer.removeListener('popup-submit', listener);
      } else {
        throw new Error('Unsupported platform');
      }
    },
  },

  accounts: {
    get: (): Record<string, { autoLogin: boolean; rememberAccount: boolean; password: string }> => {
      if (isWebsite()) {
        return webMain.getAccounts();
      } else if (isRenderer()) {
        return ipcRenderer.sendSync('get-accounts');
      } else {
        throw new Error('Unsupported platform');
      }
    },

    add: (account: string, { autoLogin, rememberAccount, password }: { autoLogin: boolean; rememberAccount: boolean; password: string }) => {
      if (isWebsite()) {
        return webMain.addAccount(account, { autoLogin, rememberAccount, password });
      } else if (isRenderer()) {
        ipcRenderer.send('add-account', account, { autoLogin, rememberAccount, password });
      } else {
        throw new Error('Unsupported platform');
      }
    },

    delete: (account: string) => {
      if (isWebsite()) {
        return webMain.deleteAccount(account);
      } else if (isRenderer()) {
        ipcRenderer.send('delete-account', account);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    onUpdate: (callback: (accounts: Record<string, { autoLogin: boolean; rememberAccount: boolean; password: string }>) => void) => {
      if (isWebsite()) {
        const listener = (accounts: Record<string, { autoLogin: boolean; rememberAccount: boolean; password: string }>) => callback(accounts);
        webMain.webEventEmitter.on('accounts', listener);
        return () => webMain.webEventEmitter.removeListener('accounts', listener);
      } else if (isRenderer()) {
        const listener = (_: any, accounts: Record<string, { autoLogin: boolean; rememberAccount: boolean; password: string }>) => callback(accounts);
        ipcRenderer.on('accounts', listener);
        return () => ipcRenderer.removeListener('accounts', listener);
      } else {
        throw new Error('Unsupported platform');
      }
    },
  },

  language: {
    get: (): Types.LanguageKey => {
      if (isWebsite()) {
        return webMain.getLanguage();
      } else if (isRenderer()) {
        return ipcRenderer.sendSync('get-language');
      } else {
        throw new Error('Unsupported platform');
      }
    },

    set: (language: Types.LanguageKey) => {
      if (isWebsite()) {
        webMain.setLanguage(language);
      } else if (isRenderer()) {
        ipcRenderer.send('set-language', language);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    onUpdate: (callback: (language: Types.LanguageKey) => void) => {
      if (isWebsite()) {
        const listener = (language: Types.LanguageKey) => callback(language);
        webMain.webEventEmitter.on('language', listener);
        return () => webMain.webEventEmitter.removeListener('language', listener);
      } else if (isRenderer()) {
        const listener = (_: any, language: Types.LanguageKey) => callback(language);
        ipcRenderer.on('language', listener);
        return () => ipcRenderer.removeListener('language', listener);
      } else {
        throw new Error('Unsupported platform');
      }
    },
  },

  customThemes: {
    get: (): Types.Theme[] => {
      if (isWebsite()) {
        return webMain.getCustomThemes();
      } else if (isRenderer()) {
        return ipcRenderer.sendSync('get-custom-themes');
      } else {
        throw new Error('Unsupported platform');
      }
    },

    add: (theme: Types.Theme) => {
      if (isWebsite()) {
        webMain.addCustomTheme(theme);
      } else if (isRenderer()) {
        ipcRenderer.send('add-custom-theme', theme);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    delete: (index: number) => {
      if (isWebsite()) {
        webMain.deleteCustomTheme(index);
      } else if (isRenderer()) {
        ipcRenderer.send('delete-custom-theme', index);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    onUpdate: (callback: (themes: Types.Theme[]) => void) => {
      if (isWebsite()) {
        const listener = (themes: Types.Theme[]) => callback(themes);
        webMain.webEventEmitter.on('custom-themes', listener);
        return () => webMain.webEventEmitter.removeListener('custom-themes', listener);
      } else if (isRenderer()) {
        const listener = (_: any, themes: Types.Theme[]) => callback(themes);
        ipcRenderer.on('custom-themes', listener);
        return () => ipcRenderer.removeListener('custom-themes', listener);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    saveImage: async (buffer: ArrayBuffer, directory: string, filenamePrefix: string, extension: string): Promise<string | null> => {
      if (isWebsite()) {
        return await webMain.saveImage(buffer);
      } else if (isRenderer()) {
        return await ipcRenderer.invoke('save-image', buffer, directory, filenamePrefix, extension);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    current: {
      get: (): Types.Theme | null => {
        if (isWebsite()) {
          return webMain.getCurrentTheme();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-current-theme');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      set: (theme: Types.Theme | null) => {
        if (isWebsite()) {
          webMain.setCurrentTheme(theme);
        } else if (isRenderer()) {
          ipcRenderer.send('set-current-theme', theme);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (theme: Types.Theme | null) => void) => {
        if (isWebsite()) {
          const listener = (theme: Types.Theme | null) => callback(theme);
          webMain.webEventEmitter.on('current-theme', listener);
          return () => webMain.webEventEmitter.removeListener('current-theme', listener);
        } else if (isRenderer()) {
          const listener = (_: any, theme: Types.Theme | null) => callback(theme);
          ipcRenderer.on('current-theme', listener);
          return () => ipcRenderer.removeListener('current-theme', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },
  },

  discord: {
    updatePresence: (presence: Types.DiscordPresence) => {
      if (isWebsite()) {
        // ignore
      } else if (isRenderer()) {
        ipcRenderer.send('update-discord-presence', presence);
      } else {
        throw new Error('Unsupported platform');
      }
    },
  },

  fontList: {
    get: (): string[] => {
      if (isWebsite()) {
        return webMain.getFontList();
      } else if (isRenderer()) {
        return ipcRenderer.sendSync('get-font-list');
      } else {
        throw new Error('Unsupported platform');
      }
    },
  },

  record: {
    save: (record: ArrayBuffer) => {
      if (isWebsite()) {
        return webMain.saveRecord(record);
      } else if (isRenderer()) {
        ipcRenderer.send('save-record', record);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    savePath: {
      select: async (): Promise<string | null> => {
        if (isWebsite()) {
          return null;
        } else if (isRenderer()) {
          return await ipcRenderer.invoke('select-record-save-path');
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },
  },

  tray: {
    title: {
      set: (title: string) => {
        if (isWebsite()) {
          // ignore
        } else if (isRenderer()) {
          ipcRenderer.send('set-tray-title', title);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },
  },

  loopbackAudio: {
    enable: () => {
      if (isWebsite()) {
        // ignore
      } else if (isRenderer()) {
        ipcRenderer.invoke('enable-loopback-audio');
      } else {
        throw new Error('Unsupported platform');
      }
    },

    disable: () => {
      if (isWebsite()) {
        // ignore
      } else if (isRenderer()) {
        ipcRenderer.invoke('disable-loopback-audio');
      } else {
        throw new Error('Unsupported platform');
      }
    },
  },

  dontShowDisclaimerNextTime: () => {
    if (isWebsite()) {
      webMain.dontShowDisclaimerNextTime();
    } else if (isRenderer()) {
      ipcRenderer.send('dont-show-disclaimer-next-time');
    } else {
      throw new Error('Unsupported platform');
    }
  },

  checkForUpdates: () => {
    if (isWebsite()) {
      // ignore
    } else if (isRenderer()) {
      ipcRenderer.send('check-for-updates');
    } else {
      throw new Error('Unsupported platform');
    }
  },

  changeServer: (server: 'prod' | 'dev') => {
    if (isWebsite()) {
      webMain.changeServer(server);
    } else if (isRenderer()) {
      ipcRenderer.send('change-server', server);
    } else {
      throw new Error('Unsupported platform');
    }
  },

  sendServerSelect: (data: { serverDisplayId: Types.Server['displayId']; serverId: Types.Server['serverId']; timestamp: number }) => {
    if (isWebsite()) {
      webMain.webEventEmitter.emit('server-select', data);
    } else if (isRenderer()) {
      localStorage.setItem('server-select', JSON.stringify(data));
    } else {
      throw new Error('Unsupported platform');
    }
  },

  systemSettings: {
    set: (settings: Partial<Types.SystemSettings>) => {
      if (isWebsite()) {
        if (settings.autoLogin !== undefined) webMain.setAutoLogin(settings.autoLogin);
        if (settings.autoLaunch !== undefined) webMain.setAutoLaunch(settings.autoLaunch);
        if (settings.alwaysOnTop !== undefined) webMain.setAlwaysOnTop(settings.alwaysOnTop);
        if (settings.statusAutoIdle !== undefined) webMain.setStatusAutoIdle(settings.statusAutoIdle);
        if (settings.statusAutoIdleMinutes !== undefined) webMain.setStatusAutoIdleMinutes(settings.statusAutoIdleMinutes);
        if (settings.channelUIMode !== undefined) webMain.setChannelUIMode(settings.channelUIMode);
        if (settings.closeToTray !== undefined) webMain.setCloseToTray(settings.closeToTray);
        if (settings.font !== undefined) webMain.setFont(settings.font);
        if (settings.fontSize !== undefined) webMain.setFontSize(settings.fontSize);
        if (settings.inputAudioDevice !== undefined) webMain.setInputAudioDevice(settings.inputAudioDevice);
        if (settings.outputAudioDevice !== undefined) webMain.setOutputAudioDevice(settings.outputAudioDevice);
        if (settings.recordFormat !== undefined) webMain.setRecordFormat(settings.recordFormat);
        if (settings.recordSavePath !== undefined) webMain.setRecordSavePath(settings.recordSavePath);
        if (settings.mixEffect !== undefined) webMain.setMixEffect(settings.mixEffect);
        if (settings.mixEffectType !== undefined) webMain.setMixEffectType(settings.mixEffectType);
        if (settings.autoMixSetting !== undefined) webMain.setAutoMixSetting(settings.autoMixSetting);
        if (settings.echoCancellation !== undefined) webMain.setEchoCancellation(settings.echoCancellation);
        if (settings.noiseCancellation !== undefined) webMain.setNoiseCancellation(settings.noiseCancellation);
        if (settings.microphoneAmplification !== undefined) webMain.setMicrophoneAmplification(settings.microphoneAmplification);
        if (settings.manualMixMode !== undefined) webMain.setManualMixMode(settings.manualMixMode);
        if (settings.mixMode !== undefined) webMain.setMixMode(settings.mixMode);
        if (settings.speakingMode !== undefined) webMain.setSpeakingMode(settings.speakingMode);
        if (settings.defaultSpeakingKey !== undefined) webMain.setDefaultSpeakingKey(settings.defaultSpeakingKey);
        if (settings.notSaveMessageHistory !== undefined) webMain.setNotSaveMessageHistory(settings.notSaveMessageHistory);
        if (settings.hotKeyOpenMainWindow !== undefined) webMain.setHotKeyOpenMainWindow(settings.hotKeyOpenMainWindow);
        if (settings.hotKeyIncreaseVolume !== undefined) webMain.setHotKeyIncreaseVolume(settings.hotKeyIncreaseVolume);
        if (settings.hotKeyDecreaseVolume !== undefined) webMain.setHotKeyDecreaseVolume(settings.hotKeyDecreaseVolume);
        if (settings.hotKeyToggleSpeaker !== undefined) webMain.setHotKeyToggleSpeaker(settings.hotKeyToggleSpeaker);
        if (settings.hotKeyToggleMicrophone !== undefined) webMain.setHotKeyToggleMicrophone(settings.hotKeyToggleMicrophone);
        if (settings.disableAllSoundEffect !== undefined) webMain.setDisableAllSoundEffect(settings.disableAllSoundEffect);
        if (settings.enterVoiceChannelSound !== undefined) webMain.setEnterVoiceChannelSound(settings.enterVoiceChannelSound);
        if (settings.leaveVoiceChannelSound !== undefined) webMain.setLeaveVoiceChannelSound(settings.leaveVoiceChannelSound);
        if (settings.startSpeakingSound !== undefined) webMain.setStartSpeakingSound(settings.startSpeakingSound);
        if (settings.stopSpeakingSound !== undefined) webMain.setStopSpeakingSound(settings.stopSpeakingSound);
        if (settings.receiveDirectMessageSound !== undefined) webMain.setReceiveDirectMessageSound(settings.receiveDirectMessageSound);
        if (settings.receiveChannelMessageSound !== undefined) webMain.setReceiveChannelMessageSound(settings.receiveChannelMessageSound);
        if (settings.autoCheckForUpdates !== undefined) webMain.setAutoCheckForUpdates(settings.autoCheckForUpdates);
        if (settings.updateCheckInterval !== undefined) webMain.setUpdateCheckInterval(settings.updateCheckInterval);
        if (settings.updateChannel !== undefined) webMain.setUpdateChannel(settings.updateChannel);
      } else if (isRenderer()) {
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
      } else {
        throw new Error('Unsupported platform');
      }
    },

    get: (): Types.SystemSettings | null => {
      if (isWebsite()) {
        return webMain.getSystemSettings();
      } else if (isRenderer()) {
        return ipcRenderer.sendSync('get-system-settings');
      } else {
        throw new Error('Unsupported platform');
      }
    },

    autoLogin: {
      set: (enable: boolean) => {
        if (isWebsite()) {
          webMain.setAutoLogin(enable);
        } else if (isRenderer()) {
          ipcRenderer.send('set-auto-login', enable);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return false;
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-auto-login');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          webMain.webEventEmitter.on('auto-login', listener);
          return () => webMain.webEventEmitter.removeListener('auto-login', listener);
        } else if (isRenderer()) {
          const listener = (_: any, enabled: boolean) => callback(enabled);
          ipcRenderer.on('auto-login', listener);
          return () => ipcRenderer.removeListener('auto-login', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    autoLaunch: {
      set: (enable: boolean) => {
        if (isWebsite()) {
          // ignore
        } else if (isRenderer()) {
          ipcRenderer.send('set-auto-launch', enable);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return webMain.getAutoLaunch();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-auto-launch');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          webMain.webEventEmitter.on('auto-launch', listener);
          return () => webMain.webEventEmitter.removeListener('auto-launch', listener);
        } else if (isRenderer()) {
          const listener = (_: any, enabled: boolean) => callback(enabled);
          ipcRenderer.on('auto-launch', listener);
          return () => ipcRenderer.removeListener('auto-launch', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    alwaysOnTop: {
      set: (enable: boolean) => {
        if (isWebsite()) {
          webMain.setAlwaysOnTop(enable);
        } else if (isRenderer()) {
          ipcRenderer.send('set-always-on-top', enable);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return webMain.getAlwaysOnTop();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-always-on-top');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          webMain.webEventEmitter.on('always-on-top', listener);
          return () => webMain.webEventEmitter.removeListener('always-on-top', listener);
        } else if (isRenderer()) {
          const listener = (_: any, enabled: boolean) => callback(enabled);
          ipcRenderer.on('always-on-top', listener);
          return () => ipcRenderer.removeListener('always-on-top', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    statusAutoIdle: {
      set: (enable: boolean) => {
        if (isWebsite()) {
          webMain.setStatusAutoIdle(enable);
        } else if (isRenderer()) {
          ipcRenderer.send('set-status-auto-idle', enable);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return webMain.getStatusAutoIdle();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-status-auto-idle');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          webMain.webEventEmitter.on('status-auto-idle', listener);
          return () => webMain.webEventEmitter.removeListener('status-auto-idle', listener);
        } else if (isRenderer()) {
          const listener = (_: any, enabled: boolean) => callback(enabled);
          ipcRenderer.on('status-auto-idle', listener);
          return () => ipcRenderer.removeListener('status-auto-idle', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    statusAutoIdleMinutes: {
      set: (fontSize: number) => {
        if (isWebsite()) {
          webMain.setStatusAutoIdleMinutes(fontSize);
        } else if (isRenderer()) {
          ipcRenderer.send('set-status-auto-idle-minutes', fontSize);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): number => {
        if (isWebsite()) {
          return webMain.getStatusAutoIdleMinutes();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-status-auto-idle-minutes');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (fontSize: number) => void) => {
        if (isWebsite()) {
          const listener = (fontSize: number) => callback(fontSize);
          webMain.webEventEmitter.on('status-auto-idle-minutes', listener);
          return () => webMain.webEventEmitter.removeListener('status-auto-idle-minutes', listener);
        } else if (isRenderer()) {
          const listener = (_: any, fontSize: number) => callback(fontSize);
          ipcRenderer.on('status-auto-idle-minutes', listener);
          return () => ipcRenderer.removeListener('status-auto-idle-minutes', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    statusAutoDnd: {
      set: (enable: boolean) => {
        if (isWebsite()) {
          webMain.setStatusAutoDnd(enable);
        } else if (isRenderer()) {
          ipcRenderer.send('set-status-auto-dnd', enable);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return webMain.getStatusAutoDnd();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-status-auto-dnd');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          webMain.webEventEmitter.on('status-auto-dnd', listener);
          return () => webMain.webEventEmitter.removeListener('status-auto-dnd', listener);
        } else if (isRenderer()) {
          const listener = (_: any, enabled: boolean) => callback(enabled);
          ipcRenderer.on('status-auto-dnd', listener);
          return () => ipcRenderer.removeListener('status-auto-dnd', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    channelUIMode: {
      set: (key: Types.ChannelUIMode) => {
        if (isWebsite()) {
          webMain.setChannelUIMode(key);
        } else if (isRenderer()) {
          ipcRenderer.send('set-channel-ui-mode', key);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): Types.ChannelUIMode => {
        if (isWebsite()) {
          return webMain.getChannelUIMode();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-channel-ui-mode');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (key: Types.ChannelUIMode) => void) => {
        if (isWebsite()) {
          const listener = (channelUIMode: Types.ChannelUIMode) => callback(channelUIMode);
          webMain.webEventEmitter.on('channel-ui-mode', listener);
          return () => webMain.webEventEmitter.removeListener('channel-ui-mode', listener);
        } else if (isRenderer()) {
          const listener = (_: any, channelUIMode: Types.ChannelUIMode) => callback(channelUIMode);
          ipcRenderer.on('channel-ui-mode', listener);
          return () => ipcRenderer.removeListener('channel-ui-mode', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    closeToTray: {
      set: (enable: boolean) => {
        if (isWebsite()) {
          webMain.setCloseToTray(enable);
        } else if (isRenderer()) {
          ipcRenderer.send('set-close-to-tray', enable);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return webMain.getCloseToTray();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-close-to-tray');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          webMain.webEventEmitter.on('close-to-tray', listener);
          return () => webMain.webEventEmitter.removeListener('close-to-tray', listener);
        } else if (isRenderer()) {
          const listener = (_: any, enabled: boolean) => callback(enabled);
          ipcRenderer.on('close-to-tray', listener);
          return () => ipcRenderer.removeListener('close-to-tray', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    font: {
      set: (font: string) => {
        if (isWebsite()) {
          webMain.setFont(font);
        } else if (isRenderer()) {
          ipcRenderer.send('set-font', font);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): string => {
        if (isWebsite()) {
          return webMain.getFont();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-font');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (font: string) => void) => {
        if (isWebsite()) {
          const listener = (font: string) => callback(font);
          webMain.webEventEmitter.on('font', listener);
          return () => webMain.webEventEmitter.removeListener('font', listener);
        } else if (isRenderer()) {
          const listener = (_: any, font: string) => callback(font);
          ipcRenderer.on('font', listener);
          return () => ipcRenderer.removeListener('font', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    fontSize: {
      set: (fontSize: number) => {
        if (isWebsite()) {
          webMain.setFontSize(fontSize);
        } else if (isRenderer()) {
          ipcRenderer.send('set-font-size', fontSize);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): number => {
        if (isWebsite()) {
          return webMain.getFontSize();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-font-size');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (fontSize: number) => void) => {
        if (isWebsite()) {
          const listener = (fontSize: number) => callback(fontSize);
          webMain.webEventEmitter.on('font-size', listener);
          return () => webMain.webEventEmitter.removeListener('font-size', listener);
        } else if (isRenderer()) {
          const listener = (_: any, fontSize: number) => callback(fontSize);
          ipcRenderer.on('font-size', listener);
          return () => ipcRenderer.removeListener('font-size', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    inputAudioDevice: {
      set: (deviceId: string) => {
        if (isWebsite()) {
          webMain.setInputAudioDevice(deviceId);
        } else if (isRenderer()) {
          ipcRenderer.send('set-input-audio-device', deviceId);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): string => {
        if (isWebsite()) {
          return webMain.getInputAudioDevice();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-input-audio-device');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (deviceId: string) => void) => {
        if (isWebsite()) {
          const listener = (deviceId: string) => callback(deviceId);
          webMain.webEventEmitter.on('input-audio-device', listener);
          return () => webMain.webEventEmitter.removeListener('input-audio-device', listener);
        } else if (isRenderer()) {
          const listener = (_: any, deviceId: string) => callback(deviceId);
          ipcRenderer.on('input-audio-device', listener);
          return () => ipcRenderer.removeListener('input-audio-device', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    outputAudioDevice: {
      set: (deviceId: string) => {
        if (isWebsite()) {
          webMain.setOutputAudioDevice(deviceId);
        } else if (isRenderer()) {
          ipcRenderer.send('set-output-audio-device', deviceId);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): string => {
        if (isWebsite()) {
          return webMain.getOutputAudioDevice();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-output-audio-device');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (deviceId: string) => void) => {
        if (isWebsite()) {
          const listener = (deviceId: string) => callback(deviceId);
          webMain.webEventEmitter.on('output-audio-device', listener);
          return () => webMain.webEventEmitter.removeListener('output-audio-device', listener);
        } else if (isRenderer()) {
          const listener = (_: any, deviceId: string) => callback(deviceId);
          ipcRenderer.on('output-audio-device', listener);
          return () => ipcRenderer.removeListener('output-audio-device', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    recordFormat: {
      set: (format: Types.RecordFormat) => {
        if (isWebsite()) {
          webMain.setRecordFormat(format);
        } else if (isRenderer()) {
          ipcRenderer.send('set-record-format', format);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): Types.RecordFormat => {
        if (isWebsite()) {
          return webMain.getRecordFormat();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-record-format');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (format: Types.RecordFormat) => void) => {
        if (isWebsite()) {
          const listener = (format: Types.RecordFormat) => callback(format);
          webMain.webEventEmitter.on('record-format', listener);
          return () => webMain.webEventEmitter.removeListener('record-format', listener);
        } else if (isRenderer()) {
          const listener = (_: any, format: Types.RecordFormat) => callback(format);
          ipcRenderer.on('record-format', listener);
          return () => ipcRenderer.removeListener('record-format', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    recordSavePath: {
      set: (path: string) => {
        if (isWebsite()) {
          webMain.setRecordSavePath(path);
        } else if (isRenderer()) {
          ipcRenderer.send('set-record-save-path', path);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): string => {
        if (isWebsite()) {
          return webMain.getRecordSavePath();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-record-save-path');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (path: string) => void) => {
        if (isWebsite()) {
          const listener = (path: string) => callback(path);
          webMain.webEventEmitter.on('record-save-path', listener);
          return () => webMain.webEventEmitter.removeListener('record-save-path', listener);
        } else if (isRenderer()) {
          const listener = (_: any, path: string) => callback(path);
          ipcRenderer.on('record-save-path', listener);
          return () => ipcRenderer.removeListener('record-save-path', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    mixEffect: {
      set: (enabled: boolean) => {
        if (isWebsite()) {
          webMain.setMixEffect(enabled);
        } else if (isRenderer()) {
          ipcRenderer.send('set-mix-effect', enabled);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return webMain.getMixEffect();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-mix-effect');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          webMain.webEventEmitter.on('mix-effect', listener);
          return () => webMain.webEventEmitter.removeListener('mix-effect', listener);
        } else if (isRenderer()) {
          const listener = (_: any, enabled: boolean) => callback(enabled);
          ipcRenderer.on('mix-effect', listener);
          return () => ipcRenderer.removeListener('mix-effect', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    mixEffectType: {
      set: (key: string) => {
        if (isWebsite()) {
          webMain.setMixEffectType(key);
        } else if (isRenderer()) {
          ipcRenderer.send('set-mix-effect-type', key);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): string => {
        if (isWebsite()) {
          return webMain.getMixEffectType();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-mix-effect-type');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (key: string) => void) => {
        if (isWebsite()) {
          const listener = (key: string) => callback(key);
          webMain.webEventEmitter.on('mix-effect-type', listener);
          return () => webMain.webEventEmitter.removeListener('mix-effect-type', listener);
        } else if (isRenderer()) {
          const listener = (_: any, key: string) => callback(key);
          ipcRenderer.on('mix-effect-type', listener);
          return () => ipcRenderer.removeListener('mix-effect-type', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    autoMixSetting: {
      set: (enabled: boolean) => {
        if (isWebsite()) {
          webMain.setAutoMixSetting(enabled);
        } else if (isRenderer()) {
          ipcRenderer.send('set-auto-mix-setting', enabled);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return webMain.getAutoMixSetting();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-auto-mix-setting');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          webMain.webEventEmitter.on('auto-mix-setting', listener);
          return () => webMain.webEventEmitter.removeListener('auto-mix-setting', listener);
        } else if (isRenderer()) {
          const listener = (_: any, enabled: boolean) => callback(enabled);
          ipcRenderer.on('auto-mix-setting', listener);
          return () => ipcRenderer.removeListener('auto-mix-setting', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    echoCancellation: {
      set: (enabled: boolean) => {
        if (isWebsite()) {
          webMain.setEchoCancellation(enabled);
        } else if (isRenderer()) {
          ipcRenderer.send('set-echo-cancellation', enabled);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return webMain.getEchoCancellation();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-echo-cancellation');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          webMain.webEventEmitter.on('echo-cancellation', listener);
          return () => webMain.webEventEmitter.removeListener('echo-cancellation', listener);
        } else if (isRenderer()) {
          const listener = (_: any, enabled: boolean) => callback(enabled);
          ipcRenderer.on('echo-cancellation', listener);
          return () => ipcRenderer.removeListener('echo-cancellation', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    noiseCancellation: {
      set: (enabled: boolean) => {
        if (isWebsite()) {
          webMain.setNoiseCancellation(enabled);
        } else if (isRenderer()) {
          ipcRenderer.send('set-noise-cancellation', enabled);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return webMain.getNoiseCancellation();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-noise-cancellation');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          webMain.webEventEmitter.on('noise-cancellation', listener);
          return () => webMain.webEventEmitter.removeListener('noise-cancellation', listener);
        } else if (isRenderer()) {
          const listener = (_: any, enabled: boolean) => callback(enabled);
          ipcRenderer.on('noise-cancellation', listener);
          return () => ipcRenderer.removeListener('noise-cancellation', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    microphoneAmplification: {
      set: (enabled: boolean) => {
        if (isWebsite()) {
          webMain.setMicrophoneAmplification(enabled);
        } else if (isRenderer()) {
          ipcRenderer.send('set-microphone-amplification', enabled);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return webMain.getMicrophoneAmplification();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-microphone-amplification');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          webMain.webEventEmitter.on('microphone-amplification', listener);
          return () => webMain.webEventEmitter.removeListener('microphone-amplification', listener);
        } else if (isRenderer()) {
          const listener = (_: any, enabled: boolean) => callback(enabled);
          ipcRenderer.on('microphone-amplification', listener);
          return () => ipcRenderer.removeListener('microphone-amplification', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    manualMixMode: {
      set: (enabled: boolean) => {
        if (isWebsite()) {
          webMain.setManualMixMode(enabled);
        } else if (isRenderer()) {
          ipcRenderer.send('set-manual-mix-mode', enabled);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return webMain.getManualMixMode();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-manual-mix-mode');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          webMain.webEventEmitter.on('manual-mix-mode', listener);
          return () => webMain.webEventEmitter.removeListener('manual-mix-mode', listener);
        } else if (isRenderer()) {
          const listener = (_: any, enabled: boolean) => callback(enabled);
          ipcRenderer.on('manual-mix-mode', listener);
          return () => ipcRenderer.removeListener('manual-mix-mode', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    mixMode: {
      set: (key: Types.MixMode) => {
        if (isWebsite()) {
          webMain.setMixMode(key);
        } else if (isRenderer()) {
          ipcRenderer.send('set-mix-mode', key);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): Types.MixMode => {
        if (isWebsite()) {
          return webMain.getMixMode();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-mix-mode');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (key: Types.MixMode) => void) => {
        if (isWebsite()) {
          const listener = (key: Types.MixMode) => callback(key);
          webMain.webEventEmitter.on('mix-mode', listener);
          return () => webMain.webEventEmitter.removeListener('mix-mode', listener);
        } else if (isRenderer()) {
          const listener = (_: any, key: Types.MixMode) => callback(key);
          ipcRenderer.on('mix-mode', listener);
          return () => ipcRenderer.removeListener('mix-mode', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    speakingMode: {
      set: (key: Types.SpeakingMode) => {
        if (isWebsite()) {
          webMain.setSpeakingMode(key);
        } else if (isRenderer()) {
          ipcRenderer.send('set-speaking-mode', key);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): Types.SpeakingMode => {
        if (isWebsite()) {
          return webMain.getSpeakingMode();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-speaking-mode');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (key: Types.SpeakingMode) => void) => {
        if (isWebsite()) {
          const listener = (key: Types.SpeakingMode) => callback(key);
          webMain.webEventEmitter.on('speaking-mode', listener);
          return () => webMain.webEventEmitter.removeListener('speaking-mode', listener);
        } else if (isRenderer()) {
          const listener = (_: any, key: Types.SpeakingMode) => callback(key);
          ipcRenderer.on('speaking-mode', listener);
          return () => ipcRenderer.removeListener('speaking-mode', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    defaultSpeakingKey: {
      set: (key: string) => {
        if (isWebsite()) {
          webMain.setDefaultSpeakingKey(key);
        } else if (isRenderer()) {
          ipcRenderer.send('set-default-speaking-key', key);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): string => {
        if (isWebsite()) {
          return webMain.getDefaultSpeakingKey();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-default-speaking-key');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (key: string) => void) => {
        if (isWebsite()) {
          const listener = (key: string) => callback(key);
          webMain.webEventEmitter.on('default-speaking-key', listener);
          return () => webMain.webEventEmitter.removeListener('default-speaking-key', listener);
        } else if (isRenderer()) {
          const listener = (_: any, key: string) => callback(key);
          ipcRenderer.on('default-speaking-key', listener);
          return () => ipcRenderer.removeListener('default-speaking-key', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    notSaveMessageHistory: {
      set: (enabled: boolean) => {
        if (isWebsite()) {
          webMain.setNotSaveMessageHistory(enabled);
        } else if (isRenderer()) {
          ipcRenderer.send('set-not-save-message-history', enabled);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return webMain.getNotSaveMessageHistory();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-not-save-message-history');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          webMain.webEventEmitter.on('not-save-message-history', listener);
          return () => webMain.webEventEmitter.removeListener('not-save-message-history', listener);
        } else if (isRenderer()) {
          const listener = (_: any, enabled: boolean) => callback(enabled);
          ipcRenderer.on('not-save-message-history', listener);
          return () => ipcRenderer.removeListener('not-save-message-history', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    hotKeyOpenMainWindow: {
      set: (key: string) => {
        if (isWebsite()) {
          webMain.setHotKeyOpenMainWindow(key);
        } else if (isRenderer()) {
          ipcRenderer.send('set-hot-key-open-main-window', key);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): string => {
        if (isWebsite()) {
          return webMain.getHotKeyOpenMainWindow();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-hot-key-open-main-window');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (key: string) => void) => {
        if (isWebsite()) {
          const listener = (key: string) => callback(key);
          webMain.webEventEmitter.on('hot-key-open-main-window', listener);
          return () => webMain.webEventEmitter.removeListener('hot-key-open-main-window', listener);
        } else if (isRenderer()) {
          const listener = (_: any, key: string) => callback(key);
          ipcRenderer.on('hot-key-open-main-window', listener);
          return () => ipcRenderer.removeListener('hot-key-open-main-window', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    hotKeyIncreaseVolume: {
      set: (key: string) => {
        if (isWebsite()) {
          webMain.setHotKeyIncreaseVolume(key);
        } else if (isRenderer()) {
          ipcRenderer.send('set-hot-key-increase-volume', key);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): string => {
        if (isWebsite()) {
          return webMain.getHotKeyIncreaseVolume();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-hot-key-increase-volume');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (key: string) => void) => {
        if (isWebsite()) {
          const listener = (key: string) => callback(key);
          webMain.webEventEmitter.on('hot-key-increase-volume', listener);
          return () => webMain.webEventEmitter.removeListener('hot-key-increase-volume', listener);
        } else if (isRenderer()) {
          const listener = (_: any, key: string) => callback(key);
          ipcRenderer.on('hot-key-increase-volume', listener);
          return () => ipcRenderer.removeListener('hot-key-increase-volume', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    hotKeyDecreaseVolume: {
      set: (key: string) => {
        if (isWebsite()) {
          webMain.setHotKeyDecreaseVolume(key);
        } else if (isRenderer()) {
          ipcRenderer.send('set-hot-key-decrease-volume', key);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): string => {
        if (isWebsite()) {
          return webMain.getHotKeyDecreaseVolume();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-hot-key-decrease-volume');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (key: string) => void) => {
        if (isWebsite()) {
          const listener = (key: string) => callback(key);
          webMain.webEventEmitter.on('hot-key-decrease-volume', listener);
          return () => webMain.webEventEmitter.removeListener('hot-key-decrease-volume', listener);
        } else if (isRenderer()) {
          const listener = (_: any, key: string) => callback(key);
          ipcRenderer.on('hot-key-decrease-volume', listener);
          return () => ipcRenderer.removeListener('hot-key-decrease-volume', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    hotKeyToggleSpeaker: {
      set: (key: string) => {
        if (isWebsite()) {
          webMain.setHotKeyToggleSpeaker(key);
        } else if (isRenderer()) {
          ipcRenderer.send('set-hot-key-toggle-speaker', key);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): string => {
        if (isWebsite()) {
          return webMain.getHotKeyToggleSpeaker();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-hot-key-toggle-speaker');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (key: string) => void) => {
        if (isWebsite()) {
          const listener = (key: string) => callback(key);
          webMain.webEventEmitter.on('hot-key-toggle-speaker', listener);
          return () => webMain.webEventEmitter.removeListener('hot-key-toggle-speaker', listener);
        } else if (isRenderer()) {
          const listener = (_: any, key: string) => callback(key);
          ipcRenderer.on('hot-key-toggle-speaker', listener);
          return () => ipcRenderer.removeListener('hot-key-toggle-speaker', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    hotKeyToggleMicrophone: {
      set: (key: string) => {
        if (isWebsite()) {
          webMain.setHotKeyToggleMicrophone(key);
        } else if (isRenderer()) {
          ipcRenderer.send('set-hot-key-toggle-microphone', key);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): string => {
        if (isWebsite()) {
          return webMain.getHotKeyToggleMicrophone();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-hot-key-toggle-microphone');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (key: string) => void) => {
        if (isWebsite()) {
          const listener = (key: string) => callback(key);
          webMain.webEventEmitter.on('hot-key-toggle-microphone', listener);
          return () => webMain.webEventEmitter.removeListener('hot-key-toggle-microphone', listener);
        } else if (isRenderer()) {
          const listener = (_: any, key: string) => callback(key);
          ipcRenderer.on('hot-key-toggle-microphone', listener);
          return () => ipcRenderer.removeListener('hot-key-toggle-microphone', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    disableAllSoundEffect: {
      set: (enabled: boolean) => {
        if (isWebsite()) {
          webMain.setDisableAllSoundEffect(enabled);
        } else if (isRenderer()) {
          ipcRenderer.send('set-disable-all-sound-effect', enabled);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return webMain.getDisableAllSoundEffect();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-disable-all-sound-effect');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          webMain.webEventEmitter.on('disable-all-sound-effect', listener);
          return () => webMain.webEventEmitter.removeListener('disable-all-sound-effect', listener);
        } else if (isRenderer()) {
          const listener = (_: any, enabled: boolean) => callback(enabled);
          ipcRenderer.on('disable-all-sound-effect', listener);
          return () => ipcRenderer.removeListener('disable-all-sound-effect', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    enterVoiceChannelSound: {
      set: (enabled: boolean) => {
        if (isWebsite()) {
          webMain.setEnterVoiceChannelSound(enabled);
        } else if (isRenderer()) {
          ipcRenderer.send('set-enter-voice-channel-sound', enabled);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return webMain.getEnterVoiceChannelSound();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-enter-voice-channel-sound');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          webMain.webEventEmitter.on('enter-voice-channel-sound', listener);
          return () => webMain.webEventEmitter.removeListener('enter-voice-channel-sound', listener);
        } else if (isRenderer()) {
          const listener = (_: any, enabled: boolean) => callback(enabled);
          ipcRenderer.on('enter-voice-channel-sound', listener);
          return () => ipcRenderer.removeListener('enter-voice-channel-sound', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    leaveVoiceChannelSound: {
      set: (enabled: boolean) => {
        if (isWebsite()) {
          webMain.setLeaveVoiceChannelSound(enabled);
        } else if (isRenderer()) {
          ipcRenderer.send('set-leave-voice-channel-sound', enabled);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return webMain.getLeaveVoiceChannelSound();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-leave-voice-channel-sound');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          webMain.webEventEmitter.on('leave-voice-channel-sound', listener);
          return () => webMain.webEventEmitter.removeListener('leave-voice-channel-sound', listener);
        } else if (isRenderer()) {
          const listener = (_: any, enabled: boolean) => callback(enabled);
          ipcRenderer.on('leave-voice-channel-sound', listener);
          return () => ipcRenderer.removeListener('leave-voice-channel-sound', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    startSpeakingSound: {
      set: (enabled: boolean) => {
        if (isWebsite()) {
          webMain.setStartSpeakingSound(enabled);
        } else if (isRenderer()) {
          ipcRenderer.send('set-start-speaking-sound', enabled);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return webMain.getStartSpeakingSound();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-start-speaking-sound');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          webMain.webEventEmitter.on('start-speaking-sound', listener);
          return () => webMain.webEventEmitter.removeListener('start-speaking-sound', listener);
        } else if (isRenderer()) {
          const listener = (_: any, enabled: boolean) => callback(enabled);
          ipcRenderer.on('start-speaking-sound', listener);
          return () => ipcRenderer.removeListener('start-speaking-sound', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    stopSpeakingSound: {
      set: (enabled: boolean) => {
        if (isWebsite()) {
          webMain.setStopSpeakingSound(enabled);
        } else if (isRenderer()) {
          ipcRenderer.send('set-stop-speaking-sound', enabled);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return webMain.getStopSpeakingSound();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-stop-speaking-sound');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          webMain.webEventEmitter.on('stop-speaking-sound', listener);
          return () => webMain.webEventEmitter.removeListener('stop-speaking-sound', listener);
        } else if (isRenderer()) {
          const listener = (_: any, enabled: boolean) => callback(enabled);
          ipcRenderer.on('stop-speaking-sound', listener);
          return () => ipcRenderer.removeListener('stop-speaking-sound', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    receiveDirectMessageSound: {
      set: (enabled: boolean) => {
        if (isWebsite()) {
          webMain.setReceiveDirectMessageSound(enabled);
        } else if (isRenderer()) {
          ipcRenderer.send('set-receive-direct-message-sound', enabled);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return webMain.getReceiveDirectMessageSound();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-receive-direct-message-sound');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          webMain.webEventEmitter.on('receive-direct-message-sound', listener);
          return () => webMain.webEventEmitter.removeListener('receive-direct-message-sound', listener);
        } else if (isRenderer()) {
          const listener = (_: any, enabled: boolean) => callback(enabled);
          ipcRenderer.on('receive-direct-message-sound', listener);
          return () => ipcRenderer.removeListener('receive-direct-message-sound', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    receiveChannelMessageSound: {
      set: (enabled: boolean) => {
        if (isWebsite()) {
          webMain.setReceiveChannelMessageSound(enabled);
        } else if (isRenderer()) {
          ipcRenderer.send('set-receive-channel-message-sound', enabled);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return webMain.getReceiveChannelMessageSound();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-receive-channel-message-sound');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          webMain.webEventEmitter.on('receive-channel-message-sound', listener);
          return () => webMain.webEventEmitter.removeListener('receive-channel-message-sound', listener);
        } else if (isRenderer()) {
          const listener = (_: any, enabled: boolean) => callback(enabled);
          ipcRenderer.on('receive-channel-message-sound', listener);
          return () => ipcRenderer.removeListener('receive-channel-message-sound', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    autoCheckForUpdates: {
      set: (enabled: boolean) => {
        if (isWebsite()) {
          webMain.setAutoCheckForUpdates(enabled);
        } else if (isRenderer()) {
          ipcRenderer.send('set-auto-check-for-updates', enabled);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return webMain.getAutoCheckForUpdates();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-auto-check-for-updates');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          webMain.webEventEmitter.on('auto-check-for-updates', listener);
          return () => webMain.webEventEmitter.removeListener('auto-check-for-updates', listener);
        } else if (isRenderer()) {
          const listener = (_: any, enabled: boolean) => callback(enabled);
          ipcRenderer.on('auto-check-for-updates', listener);
          return () => ipcRenderer.removeListener('auto-check-for-updates', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    updateCheckInterval: {
      set: (interval: number) => {
        if (isWebsite()) {
          webMain.setUpdateCheckInterval(interval);
        } else if (isRenderer()) {
          ipcRenderer.send('set-update-check-interval', interval);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): number => {
        if (isWebsite()) {
          return webMain.getUpdateCheckInterval();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-update-check-interval');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (interval: number) => void) => {
        if (isWebsite()) {
          const listener = (interval: number) => callback(interval);
          webMain.webEventEmitter.on('update-check-interval', listener);
          return () => webMain.webEventEmitter.removeListener('update-check-interval', listener);
        } else if (isRenderer()) {
          const listener = (_: any, interval: number) => callback(interval);
          ipcRenderer.on('update-check-interval', listener);
          return () => ipcRenderer.removeListener('update-check-interval', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    updateChannel: {
      set: (channel: string) => {
        if (isWebsite()) {
          webMain.setUpdateChannel(channel);
        } else if (isRenderer()) {
          ipcRenderer.send('set-update-channel', channel);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): string => {
        if (isWebsite()) {
          return webMain.getUpdateChannel();
        } else if (isRenderer()) {
          return ipcRenderer.sendSync('get-update-channel');
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (channel: string) => void) => {
        if (isWebsite()) {
          const listener = (channel: string) => callback(channel);
          webMain.webEventEmitter.on('update-channel', listener);
          return () => webMain.webEventEmitter.removeListener('update-channel', listener);
        } else if (isRenderer()) {
          const listener = (_: any, channel: string) => callback(channel);
          ipcRenderer.on('update-channel', listener);
          return () => ipcRenderer.removeListener('update-channel', listener);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },
  },

  network: {
    runDiagnosis: async (params: { domains: string[]; duration?: number }): Promise<any> => {
      if (isWebsite()) {
        return await webMain.runNetworkDiagnosis(params);
      }
      if (isRenderer()) {
        return await ipcRenderer.invoke('run-network-diagnosis', params);
      }
      throw new Error('Unsupported platform');
    },

    cancelDiagnosis: () => {
      if (isWebsite()) {
        webMain.cancelNetworkDiagnosis();
      } else if (isRenderer()) {
        ipcRenderer.send('cancel-network-diagnosis');
      } else {
        throw new Error('Unsupported platform');
      }
    },

    onProgress: (callback: (progress: any) => void) => {
      if (isWebsite()) {
        const listener = (progress: any) => callback(progress);
        webMain.webEventEmitter.on('network-diagnosis-progress', listener);
        return () => webMain.webEventEmitter.removeListener('network-diagnosis-progress', listener);
      }
      if (isRenderer()) {
        const listener = (_: any, progress: any) => callback(progress);
        ipcRenderer.on('network-diagnosis-progress', listener);
        return () => ipcRenderer.removeListener('network-diagnosis-progress', listener);
      }
      throw new Error('Unsupported platform');
    },
  },

  sfuDiagnosis: {
    request: () => {
      if (isWebsite()) {
        webMain.requestSfuDiagnosis();
      } else if (isRenderer()) {
        ipcRenderer.send('request-sfu-diagnosis');
      } else {
        throw new Error('Unsupported platform');
      }
    },

    onResponse: (callback: (data: any) => void) => {
      if (isWebsite()) {
        const listener = (data: any) => callback(data);
        webMain.webEventEmitter.on('sfu-diagnosis-response', listener);
        return () => webMain.webEventEmitter.removeListener('sfu-diagnosis-response', listener);
      }
      if (isRenderer()) {
        const listener = (_: any, data: any) => callback(data);
        ipcRenderer.on('sfu-diagnosis-response', listener);
        return () => ipcRenderer.removeListener('sfu-diagnosis-response', listener);
      }
      throw new Error('Unsupported platform');
    },
  },
};

export default ipc;

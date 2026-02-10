import { isRenderer, isWebsite } from '@/platform/isElectron';
import * as WebMain from '@/web/main';

import * as Types from '@/types';

let _ipcRenderer: typeof window.ipcRenderer | null = null;
let _webMain: typeof WebMain | null = null;

const modules = {
  get ipcRenderer(): NonNullable<typeof window.ipcRenderer> {
    if (!_ipcRenderer && isRenderer()) {
      console.log('window.ipcRenderer', window.ipcRenderer);
      _ipcRenderer = window.ipcRenderer;
    }
    return _ipcRenderer!;
  },
  get webMain(): typeof import('@/web/main') {
    if (!_webMain && isWebsite()) {
      _webMain = WebMain;
    }
    return _webMain!;
  },
};

const ipc = {
  error: {
    submit: (errorId: string, error: Error): void => {
      if (isWebsite()) {
        modules.webMain.errorSubmit(errorId, error);
      } else if (isRenderer()) {
        modules.ipcRenderer.errorSubmit(errorId, error);
      } else {
        throw new Error('Unsupported platform');
      }
    },
  },

  exit: (): void => {
    if (isWebsite()) {
      modules.webMain.exit();
    } else if (isRenderer()) {
      modules.ipcRenderer.exit();
    } else {
      throw new Error('Unsupported platform');
    }
  },

  socket: {
    send: <T extends keyof Types.ClientToServerEvents>(event: T, ...args: Parameters<Types.ClientToServerEvents[T]>): void => {
      if (isWebsite()) {
        return modules.webMain.socketSend(event, ...args);
      } else if (isRenderer()) {
        modules.ipcRenderer.socketSend(event, ...args);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    on: <T extends keyof Types.ServerToClientEvents>(event: T, callback: (...args: Parameters<Types.ServerToClientEvents[T]>) => ReturnType<Types.ServerToClientEvents[T]>): (() => void) => {
      if (isWebsite()) {
        const listener = (...args: Parameters<Types.ServerToClientEvents[T]>) => callback(...args);
        modules.webMain.webEventEmitter.on(event, listener);
        return () => {
          modules.webMain.webEventEmitter.removeListener(event, listener);
        };
      } else if (isRenderer()) {
        const listener = (_: unknown, ...args: Parameters<Types.ServerToClientEvents[T]>) => callback(...args);
        modules.ipcRenderer.ipcEventEmitter.on(event, listener);
        return () => {
          modules.ipcRenderer.ipcEventEmitter.removeListener(event, listener);
        };
      } else {
        throw new Error('Unsupported platform');
      }
    },

    emit: async <T extends keyof Types.ClientToServerEventsWithAck>(
      event: T,
      payload: Parameters<Types.ClientToServerEventsWithAck[T]>[0],
    ): Promise<ReturnType<Types.ClientToServerEventsWithAck[T]>> => {
      if (isWebsite()) {
        const ack = await modules.webMain.socketEmit(event, payload);
        if (ack?.ok) return ack.data;
        throw new Error(ack?.error || 'Unknown error');
      } else if (isRenderer()) {
        const ack = await modules.ipcRenderer.socketEmit(event, payload);
        if (ack?.ok) return ack.data;
        throw new Error(ack?.error || 'Unknown error');
      } else {
        throw new Error('Unsupported platform');
      }
    },
  },

  auth: {
    login: async (formData: { account: string; password: string }): Promise<{ success: true; token: string } | { success: false }> => {
      if (isWebsite()) {
        return await modules.webMain.login(formData);
      } else if (isRenderer()) {
        return await modules.ipcRenderer.authLogin(formData);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    logout: async (): Promise<void> => {
      if (isWebsite()) {
        return await modules.webMain.logout();
      } else if (isRenderer()) {
        return await modules.ipcRenderer.authLogout();
      } else {
        throw new Error('Unsupported platform');
      }
    },

    register: async (formData: { account: string; password: string; email: string; username: string; locale: string }): Promise<{ success: true; message: string } | { success: false }> => {
      if (isWebsite()) {
        return await modules.webMain.register(formData);
      } else if (isRenderer()) {
        return await modules.ipcRenderer.authRegister(formData);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    autoLogin: async (token: string): Promise<{ success: true; token: string } | { success: false }> => {
      if (isWebsite()) {
        return await modules.webMain.autoLogin(token);
      } else if (isRenderer()) {
        return await modules.ipcRenderer.authAutoLogin(token);
      } else {
        throw new Error('Unsupported platform');
      }
    },
  },

  data: {
    user: async (params: { userId: string }): Promise<Types.User | null> => {
      if (isWebsite()) {
        return await modules.webMain.dataUser(params);
      } else if (isRenderer()) {
        return await modules.ipcRenderer.dataUser(params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    userHotReload: async (params: { userId: string }): Promise<Types.User | null> => {
      if (isWebsite()) {
        return await modules.webMain.dataUserHotReload(params);
      } else if (isRenderer()) {
        return await modules.ipcRenderer.dataUserHotReload(params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    friend: async (params: { userId: string; targetId: string }): Promise<Types.Friend | null> => {
      if (isWebsite()) {
        return await modules.webMain.dataFriend(params);
      } else if (isRenderer()) {
        return await modules.ipcRenderer.dataFriend(params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    friends: async (params: { userId: string }): Promise<Types.Friend[]> => {
      if (isWebsite()) {
        return await modules.webMain.dataFriends(params);
      } else if (isRenderer()) {
        return await modules.ipcRenderer.dataFriends(params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    friendActivities: async (params: { userId: string }): Promise<Types.FriendActivity[]> => {
      if (isWebsite()) {
        return await modules.webMain.dataFriendActivities(params);
      } else if (isRenderer()) {
        return await modules.ipcRenderer.dataFriendActivities(params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    friendGroup: async (params: { userId: string; friendGroupId: string }): Promise<Types.FriendGroup | null> => {
      if (isWebsite()) {
        return await modules.webMain.dataFriendGroup(params);
      } else if (isRenderer()) {
        return await modules.ipcRenderer.dataFriendGroup(params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    friendGroups: async (params: { userId: string }): Promise<Types.FriendGroup[]> => {
      if (isWebsite()) {
        return await modules.webMain.dataFriendGroups(params);
      } else if (isRenderer()) {
        return await modules.ipcRenderer.dataFriendGroups(params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    friendApplication: async (params: { receiverId: string; senderId: string }): Promise<Types.FriendApplication | null> => {
      if (isWebsite()) {
        return await modules.webMain.dataFriendApplication(params);
      } else if (isRenderer()) {
        return await modules.ipcRenderer.dataFriendApplication(params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    friendApplications: async (params: { receiverId: string }): Promise<Types.FriendApplication[]> => {
      if (isWebsite()) {
        return await modules.webMain.dataFriendApplications(params);
      } else if (isRenderer()) {
        return await modules.ipcRenderer.dataFriendApplications(params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    server: async (params: { userId: string; serverId: string }): Promise<Types.Server | null> => {
      if (isWebsite()) {
        return await modules.webMain.dataServer(params);
      } else if (isRenderer()) {
        return await modules.ipcRenderer.dataServer(params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    servers: async (params: { userId: string }): Promise<Types.Server[]> => {
      if (isWebsite()) {
        return await modules.webMain.dataServers(params);
      } else if (isRenderer()) {
        return await modules.ipcRenderer.dataServers(params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    serverMembers: async (params: { serverId: string }): Promise<Types.Member[]> => {
      if (isWebsite()) {
        return await modules.webMain.dataServerMembers(params);
      } else if (isRenderer()) {
        return await modules.ipcRenderer.dataServerMembers(params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    serverOnlineMembers: async (params: { serverId: string }): Promise<Types.OnlineMember[]> => {
      if (isWebsite()) {
        return await modules.webMain.dataServerOnlineMembers(params);
      } else if (isRenderer()) {
        return await modules.ipcRenderer.dataServerOnlineMembers(params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    channel: async (params: { userId: string; serverId: string; channelId: string }): Promise<Types.Channel | null> => {
      if (isWebsite()) {
        return await modules.webMain.dataChannel(params);
      } else if (isRenderer()) {
        return await modules.ipcRenderer.dataChannel(params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    channels: async (params: { userId: string; serverId: string }): Promise<Types.Channel[]> => {
      if (isWebsite()) {
        return await modules.webMain.dataChannels(params);
      } else if (isRenderer()) {
        return await modules.ipcRenderer.dataChannels(params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    channelMembers: async (params: { serverId: string; channelId: string }): Promise<Types.Member[]> => {
      if (isWebsite()) {
        return await modules.webMain.dataChannelMembers(params);
      } else if (isRenderer()) {
        return await modules.ipcRenderer.dataChannelMembers(params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    member: async (params: { userId: string; serverId: string; channelId?: string }): Promise<Types.Member | null> => {
      if (isWebsite()) {
        return await modules.webMain.dataMember(params);
      } else if (isRenderer()) {
        return await modules.ipcRenderer.dataMember(params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    memberApplication: async (params: { userId: string; serverId: string }): Promise<Types.MemberApplication | null> => {
      if (isWebsite()) {
        return await modules.webMain.dataMemberApplication(params);
      } else if (isRenderer()) {
        return await modules.ipcRenderer.dataMemberApplication(params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    memberApplications: async (params: { serverId: string }): Promise<Types.MemberApplication[]> => {
      if (isWebsite()) {
        return await modules.webMain.dataMemberApplications(params);
      } else if (isRenderer()) {
        return await modules.ipcRenderer.dataMemberApplications(params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    memberInvitation: async (params: { receiverId: string; serverId: string }): Promise<Types.MemberInvitation | null> => {
      if (isWebsite()) {
        return await modules.webMain.dataMemberInvitation(params);
      } else if (isRenderer()) {
        return await modules.ipcRenderer.dataMemberInvitation(params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    memberInvitations: async (params: { receiverId: string }): Promise<Types.MemberInvitation[]> => {
      if (isWebsite()) {
        return await modules.webMain.dataMemberInvitations(params);
      } else if (isRenderer()) {
        return await modules.ipcRenderer.dataMemberInvitations(params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    notifications: async (params: { region: Types.LanguageKey }): Promise<Types.Notification[]> => {
      if (isWebsite()) {
        return await modules.webMain.dataNotifications(params);
      } else if (isRenderer()) {
        return await modules.ipcRenderer.dataNotifications(params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    announcements: async (params: { region: Types.LanguageKey }): Promise<Types.Announcement[]> => {
      if (isWebsite()) {
        return await modules.webMain.dataAnnouncements(params);
      } else if (isRenderer()) {
        return await modules.ipcRenderer.dataAnnouncements(params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    recommendServers: async (params: { region: Types.LanguageKey }): Promise<Types.RecommendServer[]> => {
      if (isWebsite()) {
        return await modules.webMain.dataRecommendServers(params);
      } else if (isRenderer()) {
        return await modules.ipcRenderer.dataRecommendServers(params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    uploadImage: async (params: { folder: string; imageName: string; imageUnit8Array: Uint8Array }): Promise<{ imageName: string; imageUrl: string } | null> => {
      if (isWebsite()) {
        return await modules.webMain.dataUploadImage(params);
      } else if (isRenderer()) {
        return await modules.ipcRenderer.dataUploadImage(params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    searchServer: async (params: { query: string }): Promise<Types.Server[]> => {
      if (isWebsite()) {
        return await modules.webMain.dataSearchServer(params);
      } else if (isRenderer()) {
        return await modules.ipcRenderer.dataSearchServer(params);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    searchUser: async (params: { query: string }): Promise<Types.User[]> => {
      if (isWebsite()) {
        return await modules.webMain.dataSearchUser(params);
      } else if (isRenderer()) {
        return await modules.ipcRenderer.dataSearchUser(params);
      } else {
        throw new Error('Unsupported platform');
      }
    },
  },

  deepLink: {
    onDeepLink: (callback: (serverId: string) => void): (() => void) => {
      if (isWebsite()) {
        return () => { };
      } else if (isRenderer()) {
        const listener = (_: unknown, serverId: string) => callback(serverId);
        modules.ipcRenderer.ipcEventEmitter.on('deepLink', listener);
        return () => {
          modules.ipcRenderer.ipcEventEmitter.removeListener('deepLink', listener);
        };
      } else {
        throw new Error('Unsupported platform');
      }
    },
  },

  window: {
    minimize: (popupId?: string): void => {
      if (isWebsite()) {
        if (popupId) modules.webMain.windowMinimize(popupId);
      } else if (isRenderer()) {
        modules.ipcRenderer.windowControlMinimize();
      } else {
        throw new Error('Unsupported platform');
      }
    },

    maximize: (): void => {
      if (isWebsite()) {
        // ignore
      } else if (isRenderer()) {
        modules.ipcRenderer.windowControlMaximize();
      } else {
        throw new Error('Unsupported platform');
      }
    },

    unmaximize: (): void => {
      if (isWebsite()) {
        // ignore
      } else if (isRenderer()) {
        modules.ipcRenderer.windowControlUnmaximize();
      } else {
        throw new Error('Unsupported platform');
      }
    },

    close: (): void => {
      if (isWebsite()) {
        // ignore
      } else if (isRenderer()) {
        modules.ipcRenderer.windowControlClose();
      } else {
        throw new Error('Unsupported platform');
      }
    },

    onMaximize: (callback: () => void): (() => void) => {
      if (isWebsite()) {
        return () => { };
      } else if (isRenderer()) {
        const listener = () => callback();
        modules.ipcRenderer.ipcEventEmitter.on('maximize', listener);
        return () => {
          modules.ipcRenderer.ipcEventEmitter.removeListener('maximize', listener);
        };
      } else {
        throw new Error('Unsupported platform');
      }
    },

    onUnmaximize: (callback: () => void): (() => void) => {
      if (isWebsite()) {
        return () => { };
      } else if (isRenderer()) {
        const listener = () => callback();
        modules.ipcRenderer.ipcEventEmitter.on('unmaximize', listener);
        return () => {
          modules.ipcRenderer.ipcEventEmitter.removeListener('unmaximize', listener);
        };
      } else {
        throw new Error('Unsupported platform');
      }
    },
  },

  initialData: {
    get: (id: string): unknown | null => {
      if (isWebsite()) {
        return null;
      } else if (isRenderer()) {
        return modules.ipcRenderer.getInitialData(id);
      } else {
        throw new Error('Unsupported platform');
      }
    },
  },

  popup: {
    open: async (type: Types.PopupType, id: string, initialData: unknown = {}, force?: boolean): Promise<unknown> => {
      if (isWebsite()) {
        return modules.webMain.openPopup(type, id, initialData, force);
      } else if (isRenderer()) {
        modules.ipcRenderer.openPopup(type, id, initialData, force);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    close: (id: string): void => {
      if (isWebsite()) {
        return modules.webMain.closePopup(id);
      } else if (isRenderer()) {
        modules.ipcRenderer.closePopup(id);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    closeAll: (): void => {
      if (isWebsite()) {
        return modules.webMain.closeAllPopups();
      } else if (isRenderer()) {
        modules.ipcRenderer.closeAllPopups();
      } else {
        throw new Error('Unsupported platform');
      }
    },

    submit: (to: string, data?: unknown): void => {
      if (isWebsite()) {
        modules.webMain.webEventEmitter.emit('popup-submit', to, data);
      } else if (isRenderer()) {
        modules.ipcRenderer.popupSubmit(to, data);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    onSubmit: <T>(host: string, callback: (data: T) => void): (() => void) => {
      if (isWebsite()) {
        const listener = (from: string, data: T) => {
          if (from === host) callback(data);
          modules.webMain.webEventEmitter.removeListener('popup-submit', listener);
        };
        modules.webMain.webEventEmitter.removeListener('popup-submit', listener);
        modules.webMain.webEventEmitter.on('popup-submit', listener);
        return () => {
          modules.webMain.webEventEmitter.removeListener('popup-submit', listener);
        };
      } else if (isRenderer()) {
        const listener = (_: unknown, from: string, data: T) => {
          if (from === host) callback(data);
          modules.ipcRenderer.ipcEventEmitter.removeListener('popup-submit', listener);
        };
        modules.ipcRenderer.ipcEventEmitter.removeListener('popup-submit', listener);
        modules.ipcRenderer.ipcEventEmitter.on('popup-submit', listener);
        return () => {
          modules.ipcRenderer.ipcEventEmitter.removeListener('popup-submit', listener);
        };
      } else {
        throw new Error('Unsupported platform');
      }
    },
  },

  accounts: {
    get: (): Record<string, { autoLogin: boolean; rememberAccount: boolean; password: string }> => {
      if (isWebsite()) {
        return modules.webMain.getAccounts();
      } else if (isRenderer()) {
        return modules.ipcRenderer.getAccounts();
      } else {
        throw new Error('Unsupported platform');
      }
    },

    add: (account: string, data: { autoLogin: boolean; rememberAccount: boolean; password: string }): void => {
      if (isWebsite()) {
        return modules.webMain.addAccount(account, data);
      } else if (isRenderer()) {
        modules.ipcRenderer.addAccount(account, data);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    delete: (account: string): void => {
      if (isWebsite()) {
        return modules.webMain.deleteAccount(account);
      } else if (isRenderer()) {
        modules.ipcRenderer.deleteAccount(account);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    onUpdate: (callback: (accounts: Record<string, { autoLogin: boolean; rememberAccount: boolean; password: string }>) => void): (() => void) => {
      if (isWebsite()) {
        const listener = (accounts: Record<string, { autoLogin: boolean; rememberAccount: boolean; password: string }>) => callback(accounts);
        modules.webMain.webEventEmitter.on('accounts', listener);
        return () => {
          modules.webMain.webEventEmitter.removeListener('accounts', listener);
        };
      } else if (isRenderer()) {
        const listener = (_: unknown, accounts: Record<string, { autoLogin: boolean; rememberAccount: boolean; password: string }>) => callback(accounts);
        modules.ipcRenderer.ipcEventEmitter.on('accounts', listener);
        return () => {
          modules.ipcRenderer.ipcEventEmitter.removeListener('accounts', listener);
        };
      } else {
        throw new Error('Unsupported platform');
      }
    },
  },

  language: {
    get: (): Types.LanguageKey => {
      if (isWebsite()) {
        return modules.webMain.getLanguage();
      } else if (isRenderer()) {
        return modules.ipcRenderer.getLanguage();
      } else {
        throw new Error('Unsupported platform');
      }
    },

    set: (language: Types.LanguageKey): void => {
      if (isWebsite()) {
        modules.webMain.setLanguage(language);
      } else if (isRenderer()) {
        modules.ipcRenderer.setLanguage(language);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    onUpdate: (callback: (language: Types.LanguageKey) => void): (() => void) => {
      if (isWebsite()) {
        const listener = (language: Types.LanguageKey) => callback(language);
        modules.webMain.webEventEmitter.on('language', listener);
        return () => {
          modules.webMain.webEventEmitter.removeListener('language', listener);
        };
      } else if (isRenderer()) {
        const listener = (_: unknown, language: Types.LanguageKey) => callback(language);
        modules.ipcRenderer.ipcEventEmitter.on('language', listener);
        return () => {
          modules.ipcRenderer.ipcEventEmitter.removeListener('language', listener);
        };
      } else {
        throw new Error('Unsupported platform');
      }
    },
  },

  customThemes: {
    get: (): Types.Theme[] => {
      if (isWebsite()) {
        return modules.webMain.getCustomThemes();
      } else if (isRenderer()) {
        return modules.ipcRenderer.getCustomThemes();
      } else {
        throw new Error('Unsupported platform');
      }
    },

    add: (theme: Types.Theme): void => {
      if (isWebsite()) {
        modules.webMain.addCustomTheme(theme);
      } else if (isRenderer()) {
        modules.ipcRenderer.addCustomTheme(theme);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    delete: (index: number): void => {
      if (isWebsite()) {
        modules.webMain.deleteCustomTheme(index);
      } else if (isRenderer()) {
        modules.ipcRenderer.deleteCustomTheme(index);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    onUpdate: (callback: (themes: Types.Theme[]) => void): (() => void) => {
      if (isWebsite()) {
        const listener = (themes: Types.Theme[]) => callback(themes);
        modules.webMain.webEventEmitter.on('custom-themes', listener);
        return () => {
          modules.webMain.webEventEmitter.removeListener('custom-themes', listener);
        };
      } else if (isRenderer()) {
        const listener = (_: unknown, themes: Types.Theme[]) => callback(themes);
        modules.ipcRenderer.ipcEventEmitter.on('custom-themes', listener);
        return () => {
          modules.ipcRenderer.ipcEventEmitter.removeListener('custom-themes', listener);
        };
      } else {
        throw new Error('Unsupported platform');
      }
    },

    saveImage: async (buffer: ArrayBuffer, directory: string, filenamePrefix: string, extension: string): Promise<string | null> => {
      if (isWebsite()) {
        return await modules.webMain.saveImage(buffer);
      } else if (isRenderer()) {
        return await modules.ipcRenderer.saveImage(buffer, directory, filenamePrefix, extension);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    current: {
      get: (): Types.Theme | null => {
        if (isWebsite()) {
          return modules.webMain.getCurrentTheme();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getCurrentTheme();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      set: (theme: Types.Theme | null): void => {
        if (isWebsite()) {
          modules.webMain.setCurrentTheme(theme);
        } else if (isRenderer()) {
          modules.ipcRenderer.setCurrentTheme(theme);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (theme: Types.Theme | null) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (theme: Types.Theme | null) => callback(theme);
          modules.webMain.webEventEmitter.on('current-theme', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('current-theme', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, theme: Types.Theme | null) => callback(theme);
          modules.ipcRenderer.ipcEventEmitter.on('current-theme', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('current-theme', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },
  },

  discord: {
    updatePresence: (presence: Types.DiscordPresence): void => {
      if (isWebsite()) {
        // ignore
      } else if (isRenderer()) {
        modules.ipcRenderer.updateDiscordPresence(presence);
      } else {
        throw new Error('Unsupported platform');
      }
    },
  },

  fontList: {
    get: (): string[] => {
      if (isWebsite()) {
        return modules.webMain.getFontList();
      } else if (isRenderer()) {
        return modules.ipcRenderer.getFontList();
      } else {
        throw new Error('Unsupported platform');
      }
    },
  },

  record: {
    save: (record: ArrayBuffer): void => {
      if (isWebsite()) {
        return modules.webMain.saveRecord(record);
      } else if (isRenderer()) {
        modules.ipcRenderer.saveRecord(record);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    savePath: {
      select: async (): Promise<string | null> => {
        if (isWebsite()) {
          return null;
        } else if (isRenderer()) {
          return await modules.ipcRenderer.selectRecordSavePath();
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },
  },

  tray: {
    title: {
      set: (title: string): void => {
        if (isWebsite()) {
          // ignore
        } else if (isRenderer()) {
          modules.ipcRenderer.setTrayTitle(title);
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },
  },

  loopbackAudio: {
    enable: (): void => {
      if (isWebsite()) {
        // ignore
      } else if (isRenderer()) {
        modules.ipcRenderer.enableLoopbackAudio();
      } else {
        throw new Error('Unsupported platform');
      }
    },

    disable: (): void => {
      if (isWebsite()) {
        // ignore
      } else if (isRenderer()) {
        modules.ipcRenderer.disableLoopbackAudio();
      } else {
        throw new Error('Unsupported platform');
      }
    },
  },

  dontShowDisclaimerNextTime: (): void => {
    if (isWebsite()) {
      modules.webMain.dontShowDisclaimerNextTime();
    } else if (isRenderer()) {
      modules.ipcRenderer.dontShowDisclaimerNextTime();
    } else {
      throw new Error('Unsupported platform');
    }
  },

  checkForUpdates: (): void => {
    if (isWebsite()) {
      // ignore
    } else if (isRenderer()) {
      modules.ipcRenderer.checkForUpdates();
    } else {
      throw new Error('Unsupported platform');
    }
  },

  changeServer: (server: 'prod' | 'dev'): void => {
    if (isWebsite()) {
      modules.webMain.changeServer(server);
    } else if (isRenderer()) {
      modules.ipcRenderer.changeServer(server);
    } else {
      throw new Error('Unsupported platform');
    }
  },

  sendServerSelect: (data: { serverDisplayId: Types.Server['displayId']; serverId: Types.Server['serverId']; timestamp: number }): void => {
    if (isWebsite()) {
      modules.webMain.webEventEmitter.emit('server-select', data);
    } else if (isRenderer()) {
      localStorage.setItem('server-select', JSON.stringify(data));
    } else {
      throw new Error('Unsupported platform');
    }
  },

  systemSettings: {
    set: (settings: Partial<Types.SystemSettings>): void => {
      if (isWebsite()) {
        if (settings.autoLogin !== undefined) modules.webMain.setAutoLogin(settings.autoLogin);
        if (settings.autoLaunch !== undefined) modules.webMain.setAutoLaunch(settings.autoLaunch);
        if (settings.alwaysOnTop !== undefined) modules.webMain.setAlwaysOnTop(settings.alwaysOnTop);
        if (settings.statusAutoIdle !== undefined) modules.webMain.setStatusAutoIdle(settings.statusAutoIdle);
        if (settings.statusAutoIdleMinutes !== undefined) modules.webMain.setStatusAutoIdleMinutes(settings.statusAutoIdleMinutes);
        if (settings.channelUIMode !== undefined) modules.webMain.setChannelUIMode(settings.channelUIMode);
        if (settings.closeToTray !== undefined) modules.webMain.setCloseToTray(settings.closeToTray);
        if (settings.font !== undefined) modules.webMain.setFont(settings.font);
        if (settings.fontSize !== undefined) modules.webMain.setFontSize(settings.fontSize);
        if (settings.inputAudioDevice !== undefined) modules.webMain.setInputAudioDevice(settings.inputAudioDevice);
        if (settings.outputAudioDevice !== undefined) modules.webMain.setOutputAudioDevice(settings.outputAudioDevice);
        if (settings.recordFormat !== undefined) modules.webMain.setRecordFormat(settings.recordFormat);
        if (settings.recordSavePath !== undefined) modules.webMain.setRecordSavePath(settings.recordSavePath);
        if (settings.mixEffect !== undefined) modules.webMain.setMixEffect(settings.mixEffect);
        if (settings.mixEffectType !== undefined) modules.webMain.setMixEffectType(settings.mixEffectType);
        if (settings.autoMixSetting !== undefined) modules.webMain.setAutoMixSetting(settings.autoMixSetting);
        if (settings.echoCancellation !== undefined) modules.webMain.setEchoCancellation(settings.echoCancellation);
        if (settings.noiseCancellation !== undefined) modules.webMain.setNoiseCancellation(settings.noiseCancellation);
        if (settings.microphoneAmplification !== undefined) modules.webMain.setMicrophoneAmplification(settings.microphoneAmplification);
        if (settings.manualMixMode !== undefined) modules.webMain.setManualMixMode(settings.manualMixMode);
        if (settings.mixMode !== undefined) modules.webMain.setMixMode(settings.mixMode);
        if (settings.speakingMode !== undefined) modules.webMain.setSpeakingMode(settings.speakingMode);
        if (settings.defaultSpeakingKey !== undefined) modules.webMain.setDefaultSpeakingKey(settings.defaultSpeakingKey);
        if (settings.notSaveMessageHistory !== undefined) modules.webMain.setNotSaveMessageHistory(settings.notSaveMessageHistory);
        if (settings.hotKeyOpenMainWindow !== undefined) modules.webMain.setHotKeyOpenMainWindow(settings.hotKeyOpenMainWindow);
        if (settings.hotKeyIncreaseVolume !== undefined) modules.webMain.setHotKeyIncreaseVolume(settings.hotKeyIncreaseVolume);
        if (settings.hotKeyDecreaseVolume !== undefined) modules.webMain.setHotKeyDecreaseVolume(settings.hotKeyDecreaseVolume);
        if (settings.hotKeyToggleSpeaker !== undefined) modules.webMain.setHotKeyToggleSpeaker(settings.hotKeyToggleSpeaker);
        if (settings.hotKeyToggleMicrophone !== undefined) modules.webMain.setHotKeyToggleMicrophone(settings.hotKeyToggleMicrophone);
        if (settings.disableAllSoundEffect !== undefined) modules.webMain.setDisableAllSoundEffect(settings.disableAllSoundEffect);
        if (settings.enterVoiceChannelSound !== undefined) modules.webMain.setEnterVoiceChannelSound(settings.enterVoiceChannelSound);
        if (settings.leaveVoiceChannelSound !== undefined) modules.webMain.setLeaveVoiceChannelSound(settings.leaveVoiceChannelSound);
        if (settings.startSpeakingSound !== undefined) modules.webMain.setStartSpeakingSound(settings.startSpeakingSound);
        if (settings.stopSpeakingSound !== undefined) modules.webMain.setStopSpeakingSound(settings.stopSpeakingSound);
        if (settings.receiveDirectMessageSound !== undefined) modules.webMain.setReceiveDirectMessageSound(settings.receiveDirectMessageSound);
        if (settings.receiveChannelMessageSound !== undefined) modules.webMain.setReceiveChannelMessageSound(settings.receiveChannelMessageSound);
        if (settings.autoCheckForUpdates !== undefined) modules.webMain.setAutoCheckForUpdates(settings.autoCheckForUpdates);
        if (settings.updateCheckInterval !== undefined) modules.webMain.setUpdateCheckInterval(settings.updateCheckInterval);
        if (settings.updateChannel !== undefined) modules.webMain.setUpdateChannel(settings.updateChannel);
      } else if (isRenderer()) {
        if (settings.autoLogin !== undefined) modules.ipcRenderer.setAutoLogin(settings.autoLogin);
        if (settings.autoLaunch !== undefined) modules.ipcRenderer.setAutoLaunch(settings.autoLaunch);
        if (settings.alwaysOnTop !== undefined) modules.ipcRenderer.setAlwaysOnTop(settings.alwaysOnTop);
        if (settings.statusAutoIdle !== undefined) modules.ipcRenderer.setStatusAutoIdle(settings.statusAutoIdle);
        if (settings.statusAutoIdleMinutes !== undefined) modules.ipcRenderer.setStatusAutoIdleMinutes(settings.statusAutoIdleMinutes);
        if (settings.statusAutoDnd !== undefined) modules.ipcRenderer.setStatusAutoDnd(settings.statusAutoDnd);
        if (settings.channelUIMode !== undefined) modules.ipcRenderer.setChannelUIMode(settings.channelUIMode);
        if (settings.closeToTray !== undefined) modules.ipcRenderer.setCloseToTray(settings.closeToTray);
        if (settings.font !== undefined) modules.ipcRenderer.setFont(settings.font);
        if (settings.fontSize !== undefined) modules.ipcRenderer.setFontSize(settings.fontSize);
        if (settings.inputAudioDevice !== undefined) modules.ipcRenderer.setInputAudioDevice(settings.inputAudioDevice);
        if (settings.outputAudioDevice !== undefined) modules.ipcRenderer.setOutputAudioDevice(settings.outputAudioDevice);
        if (settings.recordFormat !== undefined) modules.ipcRenderer.setRecordFormat(settings.recordFormat);
        if (settings.recordSavePath !== undefined) modules.ipcRenderer.setRecordSavePath(settings.recordSavePath);
        if (settings.mixEffect !== undefined) modules.ipcRenderer.setMixEffect(settings.mixEffect);
        if (settings.mixEffectType !== undefined) modules.ipcRenderer.setMixEffectType(settings.mixEffectType);
        if (settings.autoMixSetting !== undefined) modules.ipcRenderer.setAutoMixSetting(settings.autoMixSetting);
        if (settings.echoCancellation !== undefined) modules.ipcRenderer.setEchoCancellation(settings.echoCancellation);
        if (settings.noiseCancellation !== undefined) modules.ipcRenderer.setNoiseCancellation(settings.noiseCancellation);
        if (settings.microphoneAmplification !== undefined) modules.ipcRenderer.setMicrophoneAmplification(settings.microphoneAmplification);
        if (settings.manualMixMode !== undefined) modules.ipcRenderer.setManualMixMode(settings.manualMixMode);
        if (settings.mixMode !== undefined) modules.ipcRenderer.setMixMode(settings.mixMode);
        if (settings.speakingMode !== undefined) modules.ipcRenderer.setSpeakingMode(settings.speakingMode);
        if (settings.defaultSpeakingKey !== undefined) modules.ipcRenderer.setDefaultSpeakingKey(settings.defaultSpeakingKey);
        if (settings.notSaveMessageHistory !== undefined) modules.ipcRenderer.setNotSaveMessageHistory(settings.notSaveMessageHistory);
        if (settings.hotKeyOpenMainWindow !== undefined) modules.ipcRenderer.setHotKeyOpenMainWindow(settings.hotKeyOpenMainWindow);
        if (settings.hotKeyIncreaseVolume !== undefined) modules.ipcRenderer.setHotKeyIncreaseVolume(settings.hotKeyIncreaseVolume);
        if (settings.hotKeyDecreaseVolume !== undefined) modules.ipcRenderer.setHotKeyDecreaseVolume(settings.hotKeyDecreaseVolume);
        if (settings.hotKeyToggleSpeaker !== undefined) modules.ipcRenderer.setHotKeyToggleSpeaker(settings.hotKeyToggleSpeaker);
        if (settings.hotKeyToggleMicrophone !== undefined) modules.ipcRenderer.setHotKeyToggleMicrophone(settings.hotKeyToggleMicrophone);
        if (settings.disableAllSoundEffect !== undefined) modules.ipcRenderer.setDisableAllSoundEffect(settings.disableAllSoundEffect);
        if (settings.enterVoiceChannelSound !== undefined) modules.ipcRenderer.setEnterVoiceChannelSound(settings.enterVoiceChannelSound);
        if (settings.leaveVoiceChannelSound !== undefined) modules.ipcRenderer.setLeaveVoiceChannelSound(settings.leaveVoiceChannelSound);
        if (settings.startSpeakingSound !== undefined) modules.ipcRenderer.setStartSpeakingSound(settings.startSpeakingSound);
        if (settings.stopSpeakingSound !== undefined) modules.ipcRenderer.setStopSpeakingSound(settings.stopSpeakingSound);
        if (settings.receiveDirectMessageSound !== undefined) modules.ipcRenderer.setReceiveDirectMessageSound(settings.receiveDirectMessageSound);
        if (settings.receiveChannelMessageSound !== undefined) modules.ipcRenderer.setReceiveChannelMessageSound(settings.receiveChannelMessageSound);
        if (settings.autoCheckForUpdates !== undefined) modules.ipcRenderer.setAutoCheckForUpdates(settings.autoCheckForUpdates);
        if (settings.updateCheckInterval !== undefined) modules.ipcRenderer.setUpdateCheckInterval(settings.updateCheckInterval);
        if (settings.updateChannel !== undefined) modules.ipcRenderer.setUpdateChannel(settings.updateChannel);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    get: (): Types.SystemSettings | null => {
      if (isWebsite()) {
        return modules.webMain.getSystemSettings();
      } else if (isRenderer()) {
        return modules.ipcRenderer.getSystemSettings();
      } else {
        throw new Error('Unsupported platform');
      }
    },

    autoLogin: {
      set: (enable: boolean): void => {
        if (isWebsite()) {
          modules.webMain.setAutoLogin(enable);
        } else if (isRenderer()) {
          modules.ipcRenderer.setAutoLogin(enable);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return false;
        } else if (isRenderer()) {
          return modules.ipcRenderer.getAutoLogin();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          modules.webMain.webEventEmitter.on('auto-login', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('auto-login', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, enabled: boolean) => callback(enabled);
          modules.ipcRenderer.ipcEventEmitter.on('auto-login', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('auto-login', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    autoLaunch: {
      set: (enable: boolean): void => {
        if (isWebsite()) {
          // ignore
        } else if (isRenderer()) {
          modules.ipcRenderer.setAutoLaunch(enable);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return modules.webMain.getAutoLaunch();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getAutoLaunch();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          modules.webMain.webEventEmitter.on('auto-launch', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('auto-launch', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, enabled: boolean) => callback(enabled);
          modules.ipcRenderer.ipcEventEmitter.on('auto-launch', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('auto-launch', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    alwaysOnTop: {
      set: (enable: boolean): void => {
        if (isWebsite()) {
          modules.webMain.setAlwaysOnTop(enable);
        } else if (isRenderer()) {
          modules.ipcRenderer.setAlwaysOnTop(enable);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return modules.webMain.getAlwaysOnTop();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getAlwaysOnTop();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          modules.webMain.webEventEmitter.on('always-on-top', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('always-on-top', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, enabled: boolean) => callback(enabled);
          modules.ipcRenderer.ipcEventEmitter.on('always-on-top', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('always-on-top', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    statusAutoIdle: {
      set: (enable: boolean): void => {
        if (isWebsite()) {
          modules.webMain.setStatusAutoIdle(enable);
        } else if (isRenderer()) {
          modules.ipcRenderer.setStatusAutoIdle(enable);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return modules.webMain.getStatusAutoIdle();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getStatusAutoIdle();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          modules.webMain.webEventEmitter.on('status-auto-idle', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('status-auto-idle', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, enabled: boolean) => callback(enabled);
          modules.ipcRenderer.ipcEventEmitter.on('status-auto-idle', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('status-auto-idle', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    statusAutoIdleMinutes: {
      set: (fontSize: number): void => {
        if (isWebsite()) {
          modules.webMain.setStatusAutoIdleMinutes(fontSize);
        } else if (isRenderer()) {
          modules.ipcRenderer.setStatusAutoIdleMinutes(fontSize);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): number => {
        if (isWebsite()) {
          return modules.webMain.getStatusAutoIdleMinutes();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getStatusAutoIdleMinutes();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (fontSize: number) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (fontSize: number) => callback(fontSize);
          modules.webMain.webEventEmitter.on('status-auto-idle-minutes', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('status-auto-idle-minutes', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, fontSize: number) => callback(fontSize);
          modules.ipcRenderer.ipcEventEmitter.on('status-auto-idle-minutes', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('status-auto-idle-minutes', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    statusAutoDnd: {
      set: (enable: boolean): void => {
        if (isWebsite()) {
          modules.webMain.setStatusAutoDnd(enable);
        } else if (isRenderer()) {
          modules.ipcRenderer.setStatusAutoDnd(enable);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return modules.webMain.getStatusAutoDnd();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getStatusAutoDnd();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          modules.webMain.webEventEmitter.on('status-auto-dnd', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('status-auto-dnd', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, enabled: boolean) => callback(enabled);
          modules.ipcRenderer.ipcEventEmitter.on('status-auto-dnd', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('status-auto-dnd', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    channelUIMode: {
      set: (key: Types.ChannelUIMode): void => {
        if (isWebsite()) {
          modules.webMain.setChannelUIMode(key);
        } else if (isRenderer()) {
          modules.ipcRenderer.setChannelUIMode(key);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): Types.ChannelUIMode => {
        if (isWebsite()) {
          return modules.webMain.getChannelUIMode();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getChannelUIMode();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (key: Types.ChannelUIMode) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (channelUIMode: Types.ChannelUIMode) => callback(channelUIMode);
          modules.webMain.webEventEmitter.on('channel-ui-mode', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('channel-ui-mode', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, channelUIMode: Types.ChannelUIMode) => callback(channelUIMode);
          modules.ipcRenderer.ipcEventEmitter.on('channel-ui-mode', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('channel-ui-mode', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    closeToTray: {
      set: (enable: boolean): void => {
        if (isWebsite()) {
          modules.webMain.setCloseToTray(enable);
        } else if (isRenderer()) {
          modules.ipcRenderer.setCloseToTray(enable);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return modules.webMain.getCloseToTray();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getCloseToTray();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          modules.webMain.webEventEmitter.on('close-to-tray', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('close-to-tray', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, enabled: boolean) => callback(enabled);
          modules.ipcRenderer.ipcEventEmitter.on('close-to-tray', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('close-to-tray', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    font: {
      set: (font: string): void => {
        if (isWebsite()) {
          modules.webMain.setFont(font);
        } else if (isRenderer()) {
          modules.ipcRenderer.setFont(font);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): string => {
        if (isWebsite()) {
          return modules.webMain.getFont();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getFont();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (font: string) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (font: string) => callback(font);
          modules.webMain.webEventEmitter.on('font', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('font', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, font: string) => callback(font);
          modules.ipcRenderer.ipcEventEmitter.on('font', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('font', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    fontSize: {
      set: (fontSize: number): void => {
        if (isWebsite()) {
          modules.webMain.setFontSize(fontSize);
        } else if (isRenderer()) {
          modules.ipcRenderer.setFontSize(fontSize);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): number => {
        if (isWebsite()) {
          return modules.webMain.getFontSize();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getFontSize();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (fontSize: number) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (fontSize: number) => callback(fontSize);
          modules.webMain.webEventEmitter.on('font-size', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('font-size', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, fontSize: number) => callback(fontSize);
          modules.ipcRenderer.ipcEventEmitter.on('font-size', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('font-size', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    inputAudioDevice: {
      set: (deviceId: string): void => {
        if (isWebsite()) {
          modules.webMain.setInputAudioDevice(deviceId);
        } else if (isRenderer()) {
          modules.ipcRenderer.setInputAudioDevice(deviceId);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): string => {
        if (isWebsite()) {
          return modules.webMain.getInputAudioDevice();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getInputAudioDevice();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (deviceId: string) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (deviceId: string) => callback(deviceId);
          modules.webMain.webEventEmitter.on('input-audio-device', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('input-audio-device', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, deviceId: string) => callback(deviceId);
          modules.ipcRenderer.ipcEventEmitter.on('input-audio-device', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('input-audio-device', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    outputAudioDevice: {
      set: (deviceId: string): void => {
        if (isWebsite()) {
          modules.webMain.setOutputAudioDevice(deviceId);
        } else if (isRenderer()) {
          modules.ipcRenderer.setOutputAudioDevice(deviceId);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): string => {
        if (isWebsite()) {
          return modules.webMain.getOutputAudioDevice();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getOutputAudioDevice();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (deviceId: string) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (deviceId: string) => callback(deviceId);
          modules.webMain.webEventEmitter.on('output-audio-device', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('output-audio-device', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, deviceId: string) => callback(deviceId);
          modules.ipcRenderer.ipcEventEmitter.on('output-audio-device', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('output-audio-device', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    recordFormat: {
      set: (format: Types.RecordFormat): void => {
        if (isWebsite()) {
          modules.webMain.setRecordFormat(format);
        } else if (isRenderer()) {
          modules.ipcRenderer.setRecordFormat(format);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): Types.RecordFormat => {
        if (isWebsite()) {
          return modules.webMain.getRecordFormat();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getRecordFormat();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (format: Types.RecordFormat) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (format: Types.RecordFormat) => callback(format);
          modules.webMain.webEventEmitter.on('record-format', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('record-format', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, format: Types.RecordFormat) => callback(format);
          modules.ipcRenderer.ipcEventEmitter.on('record-format', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('record-format', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    recordSavePath: {
      set: (path: string): void => {
        if (isWebsite()) {
          modules.webMain.setRecordSavePath(path);
        } else if (isRenderer()) {
          modules.ipcRenderer.setRecordSavePath(path);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): string => {
        if (isWebsite()) {
          return modules.webMain.getRecordSavePath();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getRecordSavePath();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (path: string) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (path: string) => callback(path);
          modules.webMain.webEventEmitter.on('record-save-path', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('record-save-path', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, path: string) => callback(path);
          modules.ipcRenderer.ipcEventEmitter.on('record-save-path', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('record-save-path', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    mixEffect: {
      set: (enabled: boolean): void => {
        if (isWebsite()) {
          modules.webMain.setMixEffect(enabled);
        } else if (isRenderer()) {
          modules.ipcRenderer.setMixEffect(enabled);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return modules.webMain.getMixEffect();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getMixEffect();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          modules.webMain.webEventEmitter.on('mix-effect', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('mix-effect', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, enabled: boolean) => callback(enabled);
          modules.ipcRenderer.ipcEventEmitter.on('mix-effect', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('mix-effect', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    mixEffectType: {
      set: (key: string): void => {
        if (isWebsite()) {
          modules.webMain.setMixEffectType(key);
        } else if (isRenderer()) {
          modules.ipcRenderer.setMixEffectType(key);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): string => {
        if (isWebsite()) {
          return modules.webMain.getMixEffectType();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getMixEffectType();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (key: string) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (key: string) => callback(key);
          modules.webMain.webEventEmitter.on('mix-effect-type', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('mix-effect-type', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, key: string) => callback(key);
          modules.ipcRenderer.ipcEventEmitter.on('mix-effect-type', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('mix-effect-type', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    autoMixSetting: {
      set: (enabled: boolean): void => {
        if (isWebsite()) {
          modules.webMain.setAutoMixSetting(enabled);
        } else if (isRenderer()) {
          modules.ipcRenderer.setAutoMixSetting(enabled);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return modules.webMain.getAutoMixSetting();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getAutoMixSetting();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          modules.webMain.webEventEmitter.on('auto-mix-setting', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('auto-mix-setting', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, enabled: boolean) => callback(enabled);
          modules.ipcRenderer.ipcEventEmitter.on('auto-mix-setting', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('auto-mix-setting', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    echoCancellation: {
      set: (enabled: boolean): void => {
        if (isWebsite()) {
          modules.webMain.setEchoCancellation(enabled);
        } else if (isRenderer()) {
          modules.ipcRenderer.setEchoCancellation(enabled);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return modules.webMain.getEchoCancellation();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getEchoCancellation();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          modules.webMain.webEventEmitter.on('echo-cancellation', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('echo-cancellation', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, enabled: boolean) => callback(enabled);
          modules.ipcRenderer.ipcEventEmitter.on('echo-cancellation', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('echo-cancellation', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    noiseCancellation: {
      set: (enabled: boolean): void => {
        if (isWebsite()) {
          modules.webMain.setNoiseCancellation(enabled);
        } else if (isRenderer()) {
          modules.ipcRenderer.setNoiseCancellation(enabled);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return modules.webMain.getNoiseCancellation();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getNoiseCancellation();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          modules.webMain.webEventEmitter.on('noise-cancellation', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('noise-cancellation', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, enabled: boolean) => callback(enabled);
          modules.ipcRenderer.ipcEventEmitter.on('noise-cancellation', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('noise-cancellation', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    microphoneAmplification: {
      set: (enabled: boolean): void => {
        if (isWebsite()) {
          modules.webMain.setMicrophoneAmplification(enabled);
        } else if (isRenderer()) {
          modules.ipcRenderer.setMicrophoneAmplification(enabled);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return modules.webMain.getMicrophoneAmplification();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getMicrophoneAmplification();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          modules.webMain.webEventEmitter.on('microphone-amplification', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('microphone-amplification', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, enabled: boolean) => callback(enabled);
          modules.ipcRenderer.ipcEventEmitter.on('microphone-amplification', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('microphone-amplification', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    manualMixMode: {
      set: (enabled: boolean): void => {
        if (isWebsite()) {
          modules.webMain.setManualMixMode(enabled);
        } else if (isRenderer()) {
          modules.ipcRenderer.setManualMixMode(enabled);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return modules.webMain.getManualMixMode();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getManualMixMode();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          modules.webMain.webEventEmitter.on('manual-mix-mode', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('manual-mix-mode', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, enabled: boolean) => callback(enabled);
          modules.ipcRenderer.ipcEventEmitter.on('manual-mix-mode', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('manual-mix-mode', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    mixMode: {
      set: (key: Types.MixMode): void => {
        if (isWebsite()) {
          modules.webMain.setMixMode(key);
        } else if (isRenderer()) {
          modules.ipcRenderer.setMixMode(key);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): Types.MixMode => {
        if (isWebsite()) {
          return modules.webMain.getMixMode();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getMixMode();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (key: Types.MixMode) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (key: Types.MixMode) => callback(key);
          modules.webMain.webEventEmitter.on('mix-mode', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('mix-mode', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, key: Types.MixMode) => callback(key);
          modules.ipcRenderer.ipcEventEmitter.on('mix-mode', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('mix-mode', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    speakingMode: {
      set: (key: Types.SpeakingMode): void => {
        if (isWebsite()) {
          modules.webMain.setSpeakingMode(key);
        } else if (isRenderer()) {
          modules.ipcRenderer.setSpeakingMode(key);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): Types.SpeakingMode => {
        if (isWebsite()) {
          return modules.webMain.getSpeakingMode();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getSpeakingMode();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (key: Types.SpeakingMode) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (key: Types.SpeakingMode) => callback(key);
          modules.webMain.webEventEmitter.on('speaking-mode', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('speaking-mode', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, key: Types.SpeakingMode) => callback(key);
          modules.ipcRenderer.ipcEventEmitter.on('speaking-mode', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('speaking-mode', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    defaultSpeakingKey: {
      set: (key: string): void => {
        if (isWebsite()) {
          modules.webMain.setDefaultSpeakingKey(key);
        } else if (isRenderer()) {
          modules.ipcRenderer.setDefaultSpeakingKey(key);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): string => {
        if (isWebsite()) {
          return modules.webMain.getDefaultSpeakingKey();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getDefaultSpeakingKey();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (key: string) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (key: string) => callback(key);
          modules.webMain.webEventEmitter.on('default-speaking-key', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('default-speaking-key', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, key: string) => callback(key);
          modules.ipcRenderer.ipcEventEmitter.on('default-speaking-key', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('default-speaking-key', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    notSaveMessageHistory: {
      set: (enabled: boolean): void => {
        if (isWebsite()) {
          modules.webMain.setNotSaveMessageHistory(enabled);
        } else if (isRenderer()) {
          modules.ipcRenderer.setNotSaveMessageHistory(enabled);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return modules.webMain.getNotSaveMessageHistory();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getNotSaveMessageHistory();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          modules.webMain.webEventEmitter.on('not-save-message-history', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('not-save-message-history', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, enabled: boolean) => callback(enabled);
          modules.ipcRenderer.ipcEventEmitter.on('not-save-message-history', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('not-save-message-history', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    hotKeyOpenMainWindow: {
      set: (key: string): void => {
        if (isWebsite()) {
          modules.webMain.setHotKeyOpenMainWindow(key);
        } else if (isRenderer()) {
          modules.ipcRenderer.setHotKeyOpenMainWindow(key);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): string => {
        if (isWebsite()) {
          return modules.webMain.getHotKeyOpenMainWindow();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getHotKeyOpenMainWindow();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (key: string) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (key: string) => callback(key);
          modules.webMain.webEventEmitter.on('hot-key-open-main-window', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('hot-key-open-main-window', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, key: string) => callback(key);
          modules.ipcRenderer.ipcEventEmitter.on('hot-key-open-main-window', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('hot-key-open-main-window', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    hotKeyIncreaseVolume: {
      set: (key: string): void => {
        if (isWebsite()) {
          modules.webMain.setHotKeyIncreaseVolume(key);
        } else if (isRenderer()) {
          modules.ipcRenderer.setHotKeyIncreaseVolume(key);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): string => {
        if (isWebsite()) {
          return modules.webMain.getHotKeyIncreaseVolume();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getHotKeyIncreaseVolume();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (key: string) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (key: string) => callback(key);
          modules.webMain.webEventEmitter.on('hot-key-increase-volume', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('hot-key-increase-volume', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, key: string) => callback(key);
          modules.ipcRenderer.ipcEventEmitter.on('hot-key-increase-volume', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('hot-key-increase-volume', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    hotKeyDecreaseVolume: {
      set: (key: string): void => {
        if (isWebsite()) {
          modules.webMain.setHotKeyDecreaseVolume(key);
        } else if (isRenderer()) {
          modules.ipcRenderer.setHotKeyDecreaseVolume(key);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): string => {
        if (isWebsite()) {
          return modules.webMain.getHotKeyDecreaseVolume();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getHotKeyDecreaseVolume();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (key: string) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (key: string) => callback(key);
          modules.webMain.webEventEmitter.on('hot-key-decrease-volume', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('hot-key-decrease-volume', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, key: string) => callback(key);
          modules.ipcRenderer.ipcEventEmitter.on('hot-key-decrease-volume', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('hot-key-decrease-volume', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    hotKeyToggleSpeaker: {
      set: (key: string): void => {
        if (isWebsite()) {
          modules.webMain.setHotKeyToggleSpeaker(key);
        } else if (isRenderer()) {
          modules.ipcRenderer.setHotKeyToggleSpeaker(key);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): string => {
        if (isWebsite()) {
          return modules.webMain.getHotKeyToggleSpeaker();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getHotKeyToggleSpeaker();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (key: string) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (key: string) => callback(key);
          modules.webMain.webEventEmitter.on('hot-key-toggle-speaker', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('hot-key-toggle-speaker', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, key: string) => callback(key);
          modules.ipcRenderer.ipcEventEmitter.on('hot-key-toggle-speaker', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('hot-key-toggle-speaker', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    hotKeyToggleMicrophone: {
      set: (key: string): void => {
        if (isWebsite()) {
          modules.webMain.setHotKeyToggleMicrophone(key);
        } else if (isRenderer()) {
          modules.ipcRenderer.setHotKeyToggleMicrophone(key);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): string => {
        if (isWebsite()) {
          return modules.webMain.getHotKeyToggleMicrophone();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getHotKeyToggleMicrophone();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (key: string) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (key: string) => callback(key);
          modules.webMain.webEventEmitter.on('hot-key-toggle-microphone', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('hot-key-toggle-microphone', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, key: string) => callback(key);
          modules.ipcRenderer.ipcEventEmitter.on('hot-key-toggle-microphone', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('hot-key-toggle-microphone', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    disableAllSoundEffect: {
      set: (enabled: boolean): void => {
        if (isWebsite()) {
          modules.webMain.setDisableAllSoundEffect(enabled);
        } else if (isRenderer()) {
          modules.ipcRenderer.setDisableAllSoundEffect(enabled);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return modules.webMain.getDisableAllSoundEffect();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getDisableAllSoundEffect();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          modules.webMain.webEventEmitter.on('disable-all-sound-effect', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('disable-all-sound-effect', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, enabled: boolean) => callback(enabled);
          modules.ipcRenderer.ipcEventEmitter.on('disable-all-sound-effect', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('disable-all-sound-effect', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    enterVoiceChannelSound: {
      set: (enabled: boolean): void => {
        if (isWebsite()) {
          modules.webMain.setEnterVoiceChannelSound(enabled);
        } else if (isRenderer()) {
          modules.ipcRenderer.setEnterVoiceChannelSound(enabled);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return modules.webMain.getEnterVoiceChannelSound();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getEnterVoiceChannelSound();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          modules.webMain.webEventEmitter.on('enter-voice-channel-sound', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('enter-voice-channel-sound', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, enabled: boolean) => callback(enabled);
          modules.ipcRenderer.ipcEventEmitter.on('enter-voice-channel-sound', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('enter-voice-channel-sound', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    leaveVoiceChannelSound: {
      set: (enabled: boolean): void => {
        if (isWebsite()) {
          modules.webMain.setLeaveVoiceChannelSound(enabled);
        } else if (isRenderer()) {
          modules.ipcRenderer.setLeaveVoiceChannelSound(enabled);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return modules.webMain.getLeaveVoiceChannelSound();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getLeaveVoiceChannelSound();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          modules.webMain.webEventEmitter.on('leave-voice-channel-sound', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('leave-voice-channel-sound', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, enabled: boolean) => callback(enabled);
          modules.ipcRenderer.ipcEventEmitter.on('leave-voice-channel-sound', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('leave-voice-channel-sound', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    startSpeakingSound: {
      set: (enabled: boolean): void => {
        if (isWebsite()) {
          modules.webMain.setStartSpeakingSound(enabled);
        } else if (isRenderer()) {
          modules.ipcRenderer.setStartSpeakingSound(enabled);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return modules.webMain.getStartSpeakingSound();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getStartSpeakingSound();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          modules.webMain.webEventEmitter.on('start-speaking-sound', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('start-speaking-sound', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, enabled: boolean) => callback(enabled);
          modules.ipcRenderer.ipcEventEmitter.on('start-speaking-sound', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('start-speaking-sound', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    stopSpeakingSound: {
      set: (enabled: boolean): void => {
        if (isWebsite()) {
          modules.webMain.setStopSpeakingSound(enabled);
        } else if (isRenderer()) {
          modules.ipcRenderer.setStopSpeakingSound(enabled);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return modules.webMain.getStopSpeakingSound();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getStopSpeakingSound();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          modules.webMain.webEventEmitter.on('stop-speaking-sound', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('stop-speaking-sound', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, enabled: boolean) => callback(enabled);
          modules.ipcRenderer.ipcEventEmitter.on('stop-speaking-sound', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('stop-speaking-sound', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    receiveDirectMessageSound: {
      set: (enabled: boolean): void => {
        if (isWebsite()) {
          modules.webMain.setReceiveDirectMessageSound(enabled);
        } else if (isRenderer()) {
          modules.ipcRenderer.setReceiveDirectMessageSound(enabled);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return modules.webMain.getReceiveDirectMessageSound();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getReceiveDirectMessageSound();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          modules.webMain.webEventEmitter.on('receive-direct-message-sound', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('receive-direct-message-sound', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, enabled: boolean) => callback(enabled);
          modules.ipcRenderer.ipcEventEmitter.on('receive-direct-message-sound', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('receive-direct-message-sound', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    receiveChannelMessageSound: {
      set: (enabled: boolean): void => {
        if (isWebsite()) {
          modules.webMain.setReceiveChannelMessageSound(enabled);
        } else if (isRenderer()) {
          modules.ipcRenderer.setReceiveChannelMessageSound(enabled);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return modules.webMain.getReceiveChannelMessageSound();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getReceiveChannelMessageSound();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          modules.webMain.webEventEmitter.on('receive-channel-message-sound', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('receive-channel-message-sound', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, enabled: boolean) => callback(enabled);
          modules.ipcRenderer.ipcEventEmitter.on('receive-channel-message-sound', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('receive-channel-message-sound', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    autoCheckForUpdates: {
      set: (enabled: boolean): void => {
        if (isWebsite()) {
          modules.webMain.setAutoCheckForUpdates(enabled);
        } else if (isRenderer()) {
          modules.ipcRenderer.setAutoCheckForUpdates(enabled);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): boolean => {
        if (isWebsite()) {
          return modules.webMain.getAutoCheckForUpdates();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getAutoCheckForUpdates();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (enabled: boolean) => callback(enabled);
          modules.webMain.webEventEmitter.on('auto-check-for-updates', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('auto-check-for-updates', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, enabled: boolean) => callback(enabled);
          modules.ipcRenderer.ipcEventEmitter.on('auto-check-for-updates', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('auto-check-for-updates', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    updateCheckInterval: {
      set: (interval: number): void => {
        if (isWebsite()) {
          modules.webMain.setUpdateCheckInterval(interval);
        } else if (isRenderer()) {
          modules.ipcRenderer.setUpdateCheckInterval(interval);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): number => {
        if (isWebsite()) {
          return modules.webMain.getUpdateCheckInterval();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getUpdateCheckInterval();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (interval: number) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (interval: number) => callback(interval);
          modules.webMain.webEventEmitter.on('update-check-interval', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('update-check-interval', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, interval: number) => callback(interval);
          modules.ipcRenderer.ipcEventEmitter.on('update-check-interval', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('update-check-interval', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },

    updateChannel: {
      set: (channel: string): void => {
        if (isWebsite()) {
          modules.webMain.setUpdateChannel(channel);
        } else if (isRenderer()) {
          modules.ipcRenderer.setUpdateChannel(channel);
        } else {
          throw new Error('Unsupported platform');
        }
      },

      get: (): string => {
        if (isWebsite()) {
          return modules.webMain.getUpdateChannel();
        } else if (isRenderer()) {
          return modules.ipcRenderer.getUpdateChannel();
        } else {
          throw new Error('Unsupported platform');
        }
      },

      onUpdate: (callback: (channel: string) => void): (() => void) => {
        if (isWebsite()) {
          const listener = (channel: string) => callback(channel);
          modules.webMain.webEventEmitter.on('update-channel', listener);
          return () => {
            modules.webMain.webEventEmitter.removeListener('update-channel', listener);
          };
        } else if (isRenderer()) {
          const listener = (_: unknown, channel: string) => callback(channel);
          modules.ipcRenderer.ipcEventEmitter.on('update-channel', listener);
          return () => {
            modules.ipcRenderer.ipcEventEmitter.removeListener('update-channel', listener);
          };
        } else {
          throw new Error('Unsupported platform');
        }
      },
    },
  },

  network: {
    runDiagnosis: async (params: { domains: string[]; duration?: number }): Promise<Types.FullReport | { error: string }> => {
      if (isWebsite()) {
        return { error: 'Network diagnosis is only available in the desktop version.' };
      }
      if (isRenderer()) {
        return await modules.ipcRenderer.runNetworkDiagnosis(params);
      }
      throw new Error('Unsupported platform');
    },

    cancelDiagnosis: (): void => {
      if (isWebsite()) {
        // ignore
      } else if (isRenderer()) {
        modules.ipcRenderer.cancelNetworkDiagnosis();
      } else {
        throw new Error('Unsupported platform');
      }
    },

    onProgress: (callback: (progress: Types.ProgressData) => void): (() => void) => {
      if (isWebsite()) {
        return () => { };
      }
      if (isRenderer()) {
        const listener = (_: unknown, progress: Types.ProgressData) => callback(progress);
        modules.ipcRenderer.ipcEventEmitter.on('network-diagnosis-progress', listener);
        return () => {
          modules.ipcRenderer.ipcEventEmitter.removeListener('network-diagnosis-progress', listener);
        };
      }
      throw new Error('Unsupported platform');
    },
  },

  sfuDiagnosis: {
    request: (): void => {
      if (isWebsite()) {
        return;
      } else if (isRenderer()) {
        modules.ipcRenderer.requestSfuDiagnosis();
      } else {
        throw new Error('Unsupported platform');
      }
    },

    onRequest: (callback: ({ senderId }: { senderId: number }) => void): (() => void) => {
      if (isWebsite()) {
        return () => { };
      } else if (isRenderer()) {
        const listener = (_: unknown, { senderId }: { senderId: number }) => callback({ senderId });
        modules.ipcRenderer.ipcEventEmitter.on('get-sfu-diagnosis', listener);
        return () => {
          modules.ipcRenderer.ipcEventEmitter.removeListener('get-sfu-diagnosis', listener);
        };
      }
      throw new Error('Unsupported platform');
    },

    response: (data: { targetSenderId: number; info: unknown }): void => {
      if (isWebsite()) {
        // ignore
      } else if (isRenderer()) {
        modules.ipcRenderer.sfuDiagnosisResponse(data);
      } else {
        throw new Error('Unsupported platform');
      }
    },

    onResponse: (callback: (data: { targetSenderId: number; info: unknown }) => void): (() => void) => {
      if (isWebsite()) {
        return () => { };
      }
      if (isRenderer()) {
        const listener = (_: unknown, data: { targetSenderId: number; info: unknown }) => callback(data);
        modules.ipcRenderer.ipcEventEmitter.on('sfu-diagnosis-response', listener);
        return () => {
          modules.ipcRenderer.ipcEventEmitter.removeListener('sfu-diagnosis-response', listener);
        };
      }
      throw new Error('Unsupported platform');
    },
  },
};

export default ipc;

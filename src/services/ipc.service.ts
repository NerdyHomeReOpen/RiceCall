/* eslint-disable @typescript-eslint/no-explicit-any */
import { DiscordPresence, PopupType, SpeakingMode, MixMode, ServerToClientEvents, ClientToServerEvents, ChannelUIMode, ACK } from '@/types';

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
      ipcRenderer.removeAllListeners(event);
      ipcRenderer.on(event, (_: any, ...args: Parameters<ServerToClientEvents[T]>) => callback(...args));
      return () => ipcRenderer.removeAllListeners(event);
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
      ipcRenderer.removeAllListeners('deepLink');
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
      ipcRenderer.removeAllListeners('maximize');
      ipcRenderer.on('maximize', callback);
      return () => ipcRenderer.removeAllListeners('maximize');
    },

    onUnmaximize: (callback: () => void) => {
      if (!isElectron) return () => {};
      ipcRenderer.removeAllListeners('unmaximize');
      ipcRenderer.on('unmaximize', callback);
      return () => ipcRenderer.removeAllListeners('unmaximize');
    },
  },

  initialData: {
    get: (): any | null => {
      if (!isElectron) return null;
      return ipcRenderer.sendSync('get-initial-data');
    },
  },

  popup: {
    open: (type: PopupType, id: string, initialData: any, force?: boolean) => {
      if (!isElectron) return;
      if (type === 'applyMember') {
        const { userId, serverId } = initialData;
        Promise.all([data.server({ userId, serverId }), data.memberApplication({ userId, serverId })]).then(([server, memberApplication]) => {
          ipcRenderer.send('open-popup', type, id, { server, memberApplication }, force);
        });
      } else if (type === 'applyFriend') {
        const { userId, targetId } = initialData;
        Promise.all([
          data.user({ userId: targetId }),
          data.friendGroups({ userId }),
          data.friendApplication({ senderId: userId, receiverId: targetId }),
          data.friendApplication({ senderId: targetId, receiverId: userId }),
        ]).then(([target, friendGroups, sentFriendApplication, receivedFriendApplication]) => {
          if (!receivedFriendApplication) {
            ipcRenderer.send('open-popup', 'applyFriend', 'applyFriend', { userId, targetId, target, friendGroups, sentFriendApplication }, force);
          } else {
            ipcRenderer.send('open-popup', 'approveFriend', 'approveFriend', { targetId, friendGroups }, force);
          }
        });
      } else if (type === 'approveFriend') {
        const { userId, targetId } = initialData;
        Promise.all([data.friendGroups({ userId })]).then(([friendGroups]) => {
          ipcRenderer.send('open-popup', type, id, { targetId, friendGroups }, force);
        });
      } else if (type === 'blockMember') {
        const { userId, serverId } = initialData;
        Promise.all([data.member({ userId, serverId })]).then(([member]) => {
          ipcRenderer.send('open-popup', type, id, { userId, serverId, member }, force);
        });
      } else if (type === 'channelSetting') {
        const { userId, serverId, channelId } = initialData;
        Promise.all([data.user({ userId }), data.server({ userId, serverId }), data.channel({ userId, serverId, channelId })]).then(([user, server, channel]) => {
          ipcRenderer.send('open-popup', type, id, { userId, serverId, channelId, user, server, channel }, force);
        });
      } else if (type === 'createServer') {
        const { userId } = initialData;
        Promise.all([data.user({ userId }), data.servers({ userId })]).then(([user, servers]) => {
          ipcRenderer.send('open-popup', type, id, { userId, user, servers }, force);
        });
      } else if (type === 'createChannel') {
        const { userId, serverId, channelId } = initialData;
        Promise.all([data.channel({ userId, serverId, channelId })]).then(([parent]) => {
          ipcRenderer.send('open-popup', type, id, { userId, serverId, channelId, parent }, force);
        });
      } else if (type === 'directMessage') {
        const { userId, targetId, event, message } = initialData;
        Promise.all([data.user({ userId }), data.friend({ userId, targetId }), data.user({ userId: targetId })]).then(([user, friend, target]) => {
          ipcRenderer.send('open-popup', type, id, { userId, targetId, user, friend, target, event, message }, force);
        });
      } else if (type === 'editChannelOrder') {
        const { userId, serverId } = initialData;
        Promise.all([data.channels({ userId, serverId })]).then(([serverChannels]) => {
          ipcRenderer.send('open-popup', type, id, { userId, serverId, serverChannels }, force);
        });
      } else if (type === 'editChannelName') {
        const { userId, serverId, channelId } = initialData;
        Promise.all([data.channel({ userId, serverId, channelId })]).then(([channel]) => {
          ipcRenderer.send('open-popup', type, id, { userId, serverId, channelId, channel }, force);
        });
      } else if (type === 'editFriendNote') {
        const { userId, targetId } = initialData;
        Promise.all([data.friend({ userId, targetId }), data.friendGroups({ userId })]).then(([friend, friendGroups]) => {
          ipcRenderer.send('open-popup', type, id, { userId, targetId, friend, friendGroups }, force);
        });
      } else if (type === 'editFriendGroupName') {
        const { userId, friendGroupId } = initialData;
        Promise.all([data.friendGroup({ userId, friendGroupId })]).then(([friendGroup]) => {
          ipcRenderer.send('open-popup', type, id, { userId, friendGroupId, friendGroup }, force);
        });
      } else if (type === 'editNickname') {
        const { userId, serverId } = initialData;
        Promise.all([data.member({ userId, serverId })]).then(([member]) => {
          ipcRenderer.send('open-popup', type, id, { userId, serverId, member }, force);
        });
      } else if (type === 'friendVerification') {
        const { userId } = initialData;
        Promise.all([data.friendApplications({ receiverId: userId })]).then(([friendApplications]) => {
          ipcRenderer.send('open-popup', type, id, { userId, friendApplications }, force);
        });
      } else if (type === 'inviteMember') {
        const { userId, serverId } = initialData;
        Promise.all([data.user({ userId }), data.memberInvitation({ serverId, receiverId: userId })]).then(([target, memberInvitation]) => {
          ipcRenderer.send('open-popup', type, id, { userId, serverId, target, memberInvitation }, force);
        });
      } else if (type === 'memberApplicationSetting') {
        const { userId, serverId } = initialData;
        Promise.all([data.server({ userId, serverId })]).then(([server]) => {
          ipcRenderer.send('open-popup', type, id, { userId, serverId, server }, force);
        });
      } else if (type === 'memberInvitation') {
        const { userId } = initialData;
        Promise.all([data.memberInvitations({ receiverId: userId })]).then(([memberInvitations]) => {
          ipcRenderer.send('open-popup', type, id, { userId, memberInvitations }, force);
        });
      } else if (type === 'serverSetting') {
        const { userId, serverId } = initialData;
        Promise.all([data.user({ userId }), data.server({ userId, serverId }), data.serverMembers({ serverId }), data.memberApplications({ serverId })]).then(
          ([user, server, serverMembers, memberApplications]) => {
            ipcRenderer.send('open-popup', type, id, { userId, serverId, user, server, serverMembers, memberApplications }, force);
          },
        );
      } else if (type === 'userInfo') {
        const { userId, targetId } = initialData;
        Promise.all([data.friend({ userId, targetId }), data.user({ userId: targetId }), data.servers({ userId: targetId })]).then(([friend, target, targetServers]) => {
          ipcRenderer.send('open-popup', type, id, { userId, targetId, friend, target, targetServers }, force);
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
      ipcRenderer.on('popup-submit', (_: any, from: string, data?: any) => {
        if (from != host) return;
        callback(data);
        ipcRenderer.removeAllListeners('popup-submit');
      });
      return () => ipcRenderer.removeAllListeners('popup-submit');
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
    get: (): string[] => {
      if (!isElectron) return [];
      return ipcRenderer.sendSync('get-font-list');
    },
  },

  systemSettings: {
    get: (): {
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
    } | null => {
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
        ipcRenderer.removeAllListeners('auto-login');
        ipcRenderer.on('auto-login', (_: any, enabled: boolean) => callback(enabled));
        return () => ipcRenderer.removeAllListeners('auto-login');
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
        ipcRenderer.removeAllListeners('auto-launch');
        ipcRenderer.on('auto-launch', (_: any, enabled: boolean) => callback(enabled));
        return () => ipcRenderer.removeAllListeners('auto-launch');
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
        ipcRenderer.removeAllListeners('always-on-top');
        ipcRenderer.on('always-on-top', (_: any, enabled: boolean) => callback(enabled));
        return () => ipcRenderer.removeAllListeners('always-on-top');
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
        ipcRenderer.removeAllListeners('status-auto-idle');
        ipcRenderer.on('status-auto-idle', (_: any, enabled: boolean) => callback(enabled));
        return () => ipcRenderer.removeAllListeners('status-auto-idle');
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
        ipcRenderer.removeAllListeners('status-auto-idle-minutes');
        ipcRenderer.on('status-auto-idle-minutes', (_: any, fontSize: number) => callback(fontSize));
        return () => ipcRenderer.removeAllListeners('status-auto-idle-minutes');
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
        ipcRenderer.removeAllListeners('status-auto-dnd');
        ipcRenderer.on('status-auto-dnd', (_: any, enabled: boolean) => callback(enabled));
        return () => ipcRenderer.removeAllListeners('status-auto-dnd');
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
        ipcRenderer.removeAllListeners('channel-ui-mode');
        ipcRenderer.on('channel-ui-mode', (_: any, channelUIMode: ChannelUIMode) => callback(channelUIMode));
        return () => ipcRenderer.removeAllListeners('channel-ui-mode');
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
        ipcRenderer.removeAllListeners('close-to-tray');
        ipcRenderer.on('close-to-tray', (_: any, enabled: boolean) => callback(enabled));
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
        ipcRenderer.removeAllListeners('font');
        ipcRenderer.on('font', (_: any, font: string) => callback(font));
        return () => ipcRenderer.removeAllListeners('font');
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
        ipcRenderer.removeAllListeners('font-size');
        ipcRenderer.on('font-size', (_: any, fontSize: number) => callback(fontSize));
        return () => ipcRenderer.removeAllListeners('font-size');
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
        ipcRenderer.removeAllListeners('input-audio-device');
        ipcRenderer.on('input-audio-device', (_: any, deviceId: string) => callback(deviceId));
        return () => ipcRenderer.removeAllListeners('input-audio-device');
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
        ipcRenderer.removeAllListeners('output-audio-device');
        ipcRenderer.on('output-audio-device', (_: any, deviceId: string) => callback(deviceId));
        return () => ipcRenderer.removeAllListeners('output-audio-device');
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
        ipcRenderer.removeAllListeners('mix-effect');
        ipcRenderer.on('mix-effect', (_: any, enabled: boolean) => callback(enabled));
        return () => ipcRenderer.removeAllListeners('mix-effect');
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
        ipcRenderer.removeAllListeners('mix-effect-type');
        ipcRenderer.on('mix-effect-type', (_: any, key: string) => callback(key));
        return () => ipcRenderer.removeAllListeners('mix-effect-type');
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
        ipcRenderer.removeAllListeners('auto-mix-setting');
        ipcRenderer.on('auto-mix-setting', (_: any, enabled: boolean) => callback(enabled));
        return () => ipcRenderer.removeAllListeners('auto-mix-setting');
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
        ipcRenderer.removeAllListeners('echo-cancellation');
        ipcRenderer.on('echo-cancellation', (_: any, enabled: boolean) => callback(enabled));
        return () => ipcRenderer.removeAllListeners('echo-cancellation');
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
        ipcRenderer.removeAllListeners('noise-cancellation');
        ipcRenderer.on('noise-cancellation', (_: any, enabled: boolean) => callback(enabled));
        return () => ipcRenderer.removeAllListeners('noise-cancellation');
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
        ipcRenderer.removeAllListeners('microphone-amplification');
        ipcRenderer.on('microphone-amplification', (_: any, enabled: boolean) => callback(enabled));
        return () => ipcRenderer.removeAllListeners('microphone-amplification');
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
        ipcRenderer.removeAllListeners('manual-mix-mode');
        ipcRenderer.on('manual-mix-mode', (_: any, enabled: boolean) => callback(enabled));
        return () => ipcRenderer.removeAllListeners('manual-mix-mode');
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
        ipcRenderer.removeAllListeners('mix-mode');
        ipcRenderer.on('mix-mode', (_: any, key: MixMode) => callback(key));
        return () => ipcRenderer.removeAllListeners('mix-mode');
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
        ipcRenderer.removeAllListeners('speaking-mode');
        ipcRenderer.on('speaking-mode', (_: any, key: SpeakingMode) => callback(key));
        return () => ipcRenderer.removeAllListeners('speaking-mode');
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
        ipcRenderer.removeAllListeners('default-speaking-key');
        ipcRenderer.on('default-speaking-key', (_: any, key: string) => callback(key));
        return () => ipcRenderer.removeAllListeners('default-speaking-key');
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
        ipcRenderer.removeAllListeners('not-save-message-history');
        ipcRenderer.on('not-save-message-history', (_: any, enabled: boolean) => callback(enabled));
        return () => ipcRenderer.removeAllListeners('not-save-message-history');
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
        ipcRenderer.removeAllListeners('hot-key-open-main-window');
        ipcRenderer.on('hot-key-open-main-window', (_: any, key: string) => callback(key));
        return () => ipcRenderer.removeAllListeners('hot-key-open-main-window');
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
        ipcRenderer.removeAllListeners('hot-key-increase-volume');
        ipcRenderer.on('hot-key-increase-volume', (_: any, key: string) => callback(key));
        return () => ipcRenderer.removeAllListeners('hot-key-increase-volume');
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
        ipcRenderer.removeAllListeners('hot-key-decrease-volume');
        ipcRenderer.on('hot-key-decrease-volume', (_: any, key: string) => callback(key));
        return () => ipcRenderer.removeAllListeners('hot-key-decrease-volume');
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
        ipcRenderer.removeAllListeners('hot-key-toggle-speaker');
        ipcRenderer.on('hot-key-toggle-speaker', (_: any, key: string) => callback(key));
        return () => ipcRenderer.removeAllListeners('hot-key-toggle-speaker');
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
        ipcRenderer.removeAllListeners('hot-key-toggle-microphone');
        ipcRenderer.on('hot-key-toggle-microphone', (_: any, key: string) => callback(key));
        return () => ipcRenderer.removeAllListeners('hot-key-toggle-microphone');
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
        ipcRenderer.removeAllListeners('disable-all-sound-effect');
        ipcRenderer.on('disable-all-sound-effect', (_: any, enabled: boolean) => callback(enabled));
        return () => ipcRenderer.removeAllListeners('disable-all-sound-effect');
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
        ipcRenderer.removeAllListeners('enter-voice-channel-sound');
        ipcRenderer.on('enter-voice-channel-sound', (_: any, enabled: boolean) => callback(enabled));
        return () => ipcRenderer.removeAllListeners('enter-voice-channel-sound');
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
        ipcRenderer.removeAllListeners('leave-voice-channel-sound');
        ipcRenderer.on('leave-voice-channel-sound', (_: any, enabled: boolean) => callback(enabled));
        return () => ipcRenderer.removeAllListeners('leave-voice-channel-sound');
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
        ipcRenderer.removeAllListeners('start-speaking-sound');
        ipcRenderer.on('start-speaking-sound', (_: any, enabled: boolean) => callback(enabled));
        return () => ipcRenderer.removeAllListeners('start-speaking-sound');
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
        ipcRenderer.removeAllListeners('stop-speaking-sound');
        ipcRenderer.on('stop-speaking-sound', (_: any, enabled: boolean) => callback(enabled));
        return () => ipcRenderer.removeAllListeners('stop-speaking-sound');
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
        ipcRenderer.removeAllListeners('receive-direct-message-sound');
        ipcRenderer.on('receive-direct-message-sound', (_: any, enabled: boolean) => callback(enabled));
        return () => ipcRenderer.removeAllListeners('receive-direct-message-sound');
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
        ipcRenderer.removeAllListeners('receive-channel-message-sound');
        ipcRenderer.on('receive-channel-message-sound', (_: any, enabled: boolean) => callback(enabled));
        return () => ipcRenderer.removeAllListeners('receive-channel-message-sound');
      },
    },
  },
};

export default ipcService;

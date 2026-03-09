import * as Types from '@/types';
import { modules } from './modules';

export const error = {
  submit: (errorId: string, error: Error): void => {
    modules.default.errorSubmit(errorId, error);
  },
};

export const webrtc = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signalStateChange: (formData: { signalState: string; userId: string; channelId: string; info?: any }) => {
    modules.default.webRTCSignalStateChange(formData);
  },
};

export const deepLink = {
  onDeepLink: (callback: (serverId: string) => void): (() => void) => {
    return modules.default.listen('deepLink', callback);
  },
};

export const discord = {
  updatePresence: (presence: Types.DiscordPresence): void => {
    modules.default.updateDiscordPresence(presence);
  },
};

export const fontList = {
  get: (): string[] => {
    return modules.default.getFontList();
  },
};

export const record = {
  save: (record: ArrayBuffer): void => {
    modules.default.saveRecord(record);
  },

  savePath: {
    select: async (): Promise<string | null> => {
      return await modules.default.selectRecordSavePath();
    },
  },
};

export const tray = {
  title: {
    set: (title: string): void => {
      modules.default.setTrayTitle(title);
    },
  },
};

export const loopbackAudio = {
  enable: async (): Promise<void> => {
    return await modules.default.enableLoopbackAudio();
  },

  disable: async (): Promise<void> => {
    return await modules.default.disableLoopbackAudio();
  },
};

export const env = {
  change: (server: 'prod' | 'dev'): void => {
    modules.default.changeEnv(server);
  },
};

export const server = {
  select: (data: { serverDisplayId: Types.Server['displayId']; serverId: Types.Server['serverId']; timestamp: number }): void => {
    modules.default.serverSelect(data);
  },

  onSelect: (callback: (data: { serverDisplayId: Types.Server['displayId']; serverId: Types.Server['serverId']; timestamp: number }) => void): (() => void) => {
    return modules.default.listen('server-select', callback);
  },
};

export const dontShowDisclaimerNextTime = (): void => {
  modules.default.dontShowDisclaimerNextTime();
};

export const checkForUpdates = (): void => {
  modules.default.checkForUpdates();
};

export const exit = (): void => {
  modules.default.exit();
};

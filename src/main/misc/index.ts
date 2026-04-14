import { modules } from '@/main/modules';

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

export const fontList = {
  get: (): string[] => {
    return modules.default.getFontList();
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

export const exit = (): void => {
  modules.default.exit();
};

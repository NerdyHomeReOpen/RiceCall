import type * as Types from '@/types';

import { modules } from '@/main/modules';

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

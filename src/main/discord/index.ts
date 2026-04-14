import type * as Types from '@/types';

import { modules } from '@/main/modules';

export const discord = {
  updatePresence: (presence: Types.DiscordPresence): void => {
    modules.default.updateDiscordPresence(presence);
  },
};

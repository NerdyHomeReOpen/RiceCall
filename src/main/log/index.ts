import { modules } from '@/main/modules';

export const log = {
    logInfo: (message: string): void => {
        modules.default.logInfo(message);
    },

    logWarn: (message: string): void => {
        modules.default.logWarn(message);
    },

    logError: (message: string): void => {
        modules.default.logError(message);
    },
};
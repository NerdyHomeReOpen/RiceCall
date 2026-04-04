import { modules } from '@/main/modules';

export const env = {
    change: (server: 'prod' | 'dev'): void => {
        modules.default.changeEnv(server);
    },
};
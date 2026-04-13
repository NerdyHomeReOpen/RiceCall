import { modules } from '@/main/modules';

export const env = {
  change: (enviroment: 'prod' | 'dev'): void => {
    modules.default.changeEnv(enviroment);
  },
};

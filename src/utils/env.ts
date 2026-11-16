import { isMain } from '@/utils/platform';

import Logger from '@/utils/logger';

type EnvType = {
  MAIN_SERVICE_URL: string;
  MAIN_SERVICE_WS_URL: string;
  DOCS_BASE_URL: string;
  REACT_DEV_TOOLS_PATH: string | undefined;
  ERROR_SUBMISSION_URL: string | undefined;
};

let env: EnvType | null = null;

async function loadEnv(enviroment: 'dev' | 'prod' = 'prod') {
  let envLoaded: Record<string, string> = {
    ...process.env,
    MAIN_SERVICE_URL: process.env.MAIN_SERVICE_URL || '',
    MAIN_SERVICE_WS_URL: process.env.MAIN_SERVICE_WS_URL || '',
    DOCS_BASE_URL: process.env.DOCS_BASE_URL || '',
    ERROR_SUBMISSION_URL: process.env.ERROR_SUBMISSION_URL || '',
  };

  if (isMain()) {
    try {
      const createRequire = await import(/* webpackIgnore: true */ 'module').then((module) => module.createRequire).then((createRequire) => createRequire(import.meta.url));
      const electron = createRequire('electron');
      const path = createRequire('path');
      const dotenv = createRequire('dotenv');
      const expand = createRequire('dotenv-expand').expand;

      const app = electron.app || (electron.remote && electron.remote.app);
      const envPaths: string[] = [];
      const root = process.cwd();

      if (app && app.isPackaged) {
        const resourcesPath = process.resourcesPath;
        envPaths.push(path.join(resourcesPath, 'app.env'));
        if (enviroment === 'dev') envPaths.push(path.join(resourcesPath, 'app.env.dev'));
      } else {
        envPaths.push(path.join(root, '.env'));
        if (enviroment === 'dev') envPaths.push(path.join(root, '.env.dev'));
      }

      const cfg = dotenv.config({ path: envPaths, override: true });
      expand(cfg);
      envLoaded = { ...envLoaded, ...(cfg.parsed ?? {}) };
    } catch (e) {
      new Logger('Env').error(`Failed to load Electron env files: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  env = envLoaded as EnvType;
}

loadEnv();

export default class Env {
  static async load(enviroment: 'prod' | 'dev' = 'prod') {
    loadEnv(enviroment);
  }

  static get(): EnvType {
    if (!env) {
      new Logger('Env').error('Env is not loaded');
      return {
        MAIN_SERVICE_URL: '',
        MAIN_SERVICE_WS_URL: '',
        DOCS_BASE_URL: '',
        REACT_DEV_TOOLS_PATH: undefined,
        ERROR_SUBMISSION_URL: undefined,
      };
    }
    return env;
  }
}

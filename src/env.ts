/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';
import { isElectron, isRenderer } from '@/platform/isElectron';
import Logger from '@/logger';

export let env: Record<string, string> = {
  API_URL: '',
  WS_URL: '',
  CROWDIN_DISTRIBUTION_HASH: '',
};

const EnvSchema = z.object({
  API_URL: z.string(),
  WS_URL: z.string(),
  CROWDIN_DISTRIBUTION_HASH: z.string().optional(),
  REACT_DEV_TOOLS_PATH: z.string().optional(),
});

export async function loadEnv(server: 'dev' | 'prod' = 'prod') {
  let envLoaded: Record<string, string> = {};

  if (isElectron()) {
    try {
      let electron: any;
      let path: any;
      let dotenv: any;
      let expand: any;

      if (isRenderer()) {
        electron = window.require('electron');
        path = window.require('path');
        dotenv = window.require('dotenv');
        expand = window.require('dotenv-expand').expand;
      } else {
        await import(/* webpackIgnore: true */ 'module')
          .then((module) => module.createRequire)
          .then((createRequire) => {
            const require = createRequire(import.meta.url);
            electron = require('electron');
            path = require('path');
            dotenv = require('dotenv');
            expand = require('dotenv-expand').expand;
          });
      }

      const app = electron.app || (electron.remote && electron.remote.app);
      envLoaded = { ...process.env } as any;

      const envPaths: string[] = [];
      const root = !isRenderer() ? process.cwd() : '/';

      if (app && app.isPackaged) {
        const resourcesPath = process.resourcesPath;
        envPaths.push(path.join(resourcesPath, 'app.env'));
        if (server === 'dev') envPaths.push(path.join(resourcesPath, 'app.env.dev'));
      } else {
        envPaths.push(path.join(root, '.env'));
        if (server === 'dev') envPaths.push(path.join(root, '.env.dev'));
      }

      const cfg = dotenv.config({ path: envPaths, override: true });
      expand(cfg);
      envLoaded = { ...envLoaded, ...(cfg.parsed ?? {}) };
    } catch (err) {
      console.error('Failed to load Electron env files:', err);
    }
  } else {
    envLoaded = {
      API_URL: process.env.API_URL || '',
      WS_URL: process.env.WS_URL || '',
      CROWDIN_DISTRIBUTION_HASH: process.env.CROWDIN_DISTRIBUTION_HASH || '',
    };
  }

  const parsed = EnvSchema.safeParse(envLoaded);
  if (!parsed.success) {
    new Logger('Env').warn(`Invalid env values: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`);
  } else {
    Object.assign(envLoaded, parsed.data);
  }

  env = envLoaded;
  return { env };
}

export function getEnv() {
  return env;
}

loadEnv();

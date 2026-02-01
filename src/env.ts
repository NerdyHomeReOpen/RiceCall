/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';
import { isElectron } from '@/platform/isElectron';
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
  const _isElectron = isElectron();
  const isRenderer = typeof window !== 'undefined';

  if (_isElectron) {
    try {
      let electron: any;
      let path: any;
      let dotenv: any;
      let expand: any;

      if (isRenderer) {
        electron = (window as any).require('electron');
        path = (window as any).require('path');
        dotenv = (window as any).require('dotenv');
        expand = (window as any).require('dotenv-expand').expand;
      } else {
        const { createRequire } = await import('module');
        const _require = createRequire(import.meta.url);
        
        electron = _require('electron');
        path = _require('path');
        dotenv = _require('dotenv');
        expand = _require('dotenv-expand').expand;
      }
      
      const app = electron.app || (electron.remote && electron.remote.app);
      envLoaded = { ...process.env } as any;
      
      const envPaths: string[] = [];
      const root = !isRenderer ? process.cwd() : '/';

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
      API_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
      WS_URL: process.env.NEXT_PUBLIC_WS_URL || '',
      CROWDIN_DISTRIBUTION_HASH: process.env.NEXT_PUBLIC_CROWDIN_DISTRIBUTION_HASH || '',
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
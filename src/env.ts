/* eslint-disable @typescript-eslint/no-explicit-any */
import path from 'path';
import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import { z } from 'zod';
import { app } from 'electron';
import Logger from './logger.js';

export let env: Record<string, string> = {};

const EnvSchema = z.object({
  API_URL: z.string(),
  WS_URL: z.string(),
  CROWDIN_DISTRIBUTION_HASH: z.string().optional(),
  REACT_DEV_TOOLS_PATH: z.string().optional(),
});

export function loadEnv(server: 'dev' | 'prod' = 'prod') {
  let envLoaded: Record<string, string> = { ...process.env } as any;
  const envPaths: string[] = [];

  if (app.isPackaged) {
    envPaths.push(path.join(process.resourcesPath, 'app.env')); // default for packaged
    if (server === 'dev') envPaths.push(path.join(process.resourcesPath, 'app.env.dev')); // dev server override
  } else {
    const root = process.cwd();
    envPaths.push(path.join(root, '.env')); // default for dev
    if (server === 'dev') envPaths.push(path.join(root, '.env.dev')); // dev server override
  }

  const cfg = dotenv.config({ path: envPaths, override: true });
  expand(cfg);

  envLoaded = cfg.parsed ?? {};

  const parsed = EnvSchema.safeParse(envLoaded);

  if (!parsed.success) {
    new Logger('Env').warn(`Invalid env values: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`);
  } else {
    Object.assign(envLoaded, parsed.data);
  }

  env = envLoaded;

  return { env, envPaths };
}

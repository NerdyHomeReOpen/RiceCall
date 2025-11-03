/* eslint-disable @typescript-eslint/no-explicit-any */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import { z } from 'zod';
import { app } from 'electron';

// Env
export let env: Record<string, string> = {};

const EnvSchema = z
  .object({
    API_URL: z.string(),
    WS_URL: z.string(),
    CROWDIN_DISTRIBUTION_HASH: z.string(),
    UPDATE_CHANNEL: z.enum(['latest', 'dev']).default('latest'),
  })
  .partial();

function readEnvFile(file: string, base: Record<string, string>) {
  if (!fs.existsSync(file)) return base;
  const cfg = dotenv.config({ path: file, processEnv: base, override: true });
  expand(cfg);
  return { ...base, ...(cfg.parsed ?? {}) };
}

export function loadEnv() {
  // 1) Using process.env as base (can be overridden by system env)
  let envLoaded: Record<string, string> = { ...process.env } as any;

  // 2) Read files by context (from low to high, higher will override)
  const files: string[] = [];
  if (app.isPackaged) {
    files.push(path.join(process.resourcesPath, 'app.env')); // default for packaged
    files.push(path.join(app.getPath('userData'), 'app.env')); // user override
  } else {
    const root = process.cwd();
    files.push(path.join(root, '.env')); // default for dev
    // files.push(path.join(root, '.env.local')); // dev override
  }
  for (const file of files) envLoaded = readEnvFile(file, envLoaded);

  // 3) Validate (optional: warn if missing values)
  const parsed = EnvSchema.safeParse(envLoaded);
  if (!parsed.success) {
    console.warn(`${new Date().toLocaleString()} | Invalid env values:`, parsed.error.flatten().fieldErrors);
  } else {
    Object.assign(envLoaded, parsed.data);
  }

  // 4) Fill process.env (for main process/sub process)
  for (const [k, v] of Object.entries(envLoaded)) process.env[k] = String(v);

  env = envLoaded;
  return { env, filesLoaded: files.filter(fs.existsSync) };
}

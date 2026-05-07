# i18n Storage Abstraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded `localStorage` calls in the i18n cache layer with an environment-aware storage abstraction that uses `localStorage` in renderer/web and `fs`-based cache in the Electron main process.

**Architecture:** Create `src/i18n/storage.ts` with an `I18nStorage` interface and two adapters (`LocalStorageAdapter` for renderer/web, `FsAdapter` for main process). `loadStorage()` selects the right adapter via `isMain()`. `src/i18n/index.ts` then uses `getStorage()` throughout and chains `loadStorage()` before `checkCacheVersion()` in `i18nReady`. Also fixes a bug where `checkCacheVersion()` uses `DOCS_BASE_URL` instead of `I18N_BASE_URL`.

**Tech Stack:** TypeScript, i18next 25, `isMain()`/`isRenderer()` from `@/utils/platform`, Node.js `fs`/`path` via `createRequire` (same pattern as `src/env.ts`), `electron.app.getPath`

---

## File Map

| File | Change |
|------|--------|
| `src/i18n/storage.ts` | Create — `I18nStorage` interface, `LocalStorageAdapter`, `FsAdapter`, `loadStorage()`, `getStorage()` |
| `src/i18n/index.ts` | Modify — remove `isElectron` guards, import and use `getStorage()`/`loadStorage()`, fix `DOCS_BASE_URL` → `I18N_BASE_URL` bug, update `i18nReady` chain |

---

### Task 1: Create storage.ts with interface and adapters

**Files:**
- Create: `src/i18n/storage.ts`

No test framework in this project — skip test steps.

- [ ] **Step 1: Create `src/i18n/storage.ts` with the full content below**

```typescript
import { isMain } from '@/utils/platform';

export interface I18nStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  keys(): string[];
}

class LocalStorageAdapter implements I18nStorage {
  getItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  setItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  keys(): string[] {
    const result: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) result.push(k);
    }
    return result;
  }
}

class FsAdapter implements I18nStorage {
  constructor(
    private dir: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private fs: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private path: any,
  ) {}

  private filePath(key: string): string {
    return this.path.join(this.dir, encodeURIComponent(key) + '.dat') as string;
  }

  getItem(key: string): string | null {
    try {
      return this.fs.readFileSync(this.filePath(key), 'utf-8') as string;
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      this.fs.writeFileSync(this.filePath(key), value, 'utf-8');
    } catch (e) {
      console.warn('[i18n] fs write failed:', e);
    }
  }

  removeItem(key: string): void {
    try {
      this.fs.unlinkSync(this.filePath(key));
    } catch {
      // ignore if file does not exist
    }
  }

  keys(): string[] {
    try {
      return (this.fs.readdirSync(this.dir) as string[])
        .filter((f: string) => f.endsWith('.dat'))
        .map((f: string) => decodeURIComponent(f.slice(0, -4)));
    } catch {
      return [];
    }
  }
}

let storage: I18nStorage | null = null;

export async function loadStorage(): Promise<void> {
  if (isMain()) {
    const createRequire = await import(/* webpackIgnore: true */ 'module')
      .then((module) => module.createRequire)
      .then((cr) => cr(import.meta.url));
    const electron = createRequire('electron');
    const path = createRequire('path');
    const fs = createRequire('fs');
    const app = electron.app;
    const cacheDir = path.join(app.getPath('userData'), 'i18n-cache') as string;
    fs.mkdirSync(cacheDir, { recursive: true });
    storage = new FsAdapter(cacheDir, fs, path);
  } else {
    storage = new LocalStorageAdapter();
  }
}

export function getStorage(): I18nStorage {
  if (!storage) throw new Error('[i18n] storage not initialized');
  return storage;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors in `src/i18n/storage.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/i18n/storage.ts
git commit -m "feat(i18n): add environment-aware storage abstraction"
```

---

### Task 2: Update index.ts to use storage abstraction

**Files:**
- Modify: `src/i18n/index.ts`

This task:
1. Imports `loadStorage` and `getStorage` from `./storage`
2. Removes the `isElectron` import (no longer needed in this file)
3. Removes all `if (isElectron()) return;` guards
4. Replaces all direct `localStorage.*` calls with `getStorage().*`
5. Fixes `DOCS_BASE_URL` → `I18N_BASE_URL` in `checkCacheVersion`
6. Updates `i18nReady` to chain `loadStorage()` first

- [ ] **Step 1: Replace `src/i18n/index.ts` entirely with**

```typescript
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import type * as Types from '@/types';

import Logger from '@/logger';

import Env from '@/env';

import { loadStorage, getStorage } from '@/i18n/storage';

const I18N_VERSION_KEY = 'i18n_version';
const I18N_CACHE_PREFIX = 'i18n_cache:';

function cacheKey(lng: string, ns: string): string {
  return `${I18N_CACHE_PREFIX}${lng}:${ns}`;
}

function readCache(lng: string, ns: string): Record<string, unknown> | null {
  try {
    const raw = getStorage().getItem(cacheKey(lng, ns));
    if (!raw) return null;
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    getStorage().removeItem(cacheKey(lng, ns));
    return null;
  }
}

function writeCache(lng: string, ns: string, data: Record<string, unknown>): void {
  try {
    getStorage().setItem(cacheKey(lng, ns), JSON.stringify(data));
  } catch {
    new Logger('i18n').warn('storage write failed');
  }
}

function purgeCache(): void {
  const keysToRemove = getStorage()
    .keys()
    .filter((k) => k.startsWith(I18N_CACHE_PREFIX));
  keysToRemove.forEach((k) => getStorage().removeItem(k));
}

async function checkCacheVersion(): Promise<void> {
  const baseUrl = Env.get().I18N_BASE_URL;
  if (!baseUrl) return;

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/manifest.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const manifest = (await res.json()) as Record<string, unknown>;
    const remoteVersion = typeof manifest.version === 'string' ? manifest.version : null;

    if (!remoteVersion) {
      new Logger('i18n').warn('manifest.json missing version field, skipping cache invalidation');
      return;
    }

    const cachedVersion = getStorage().getItem(I18N_VERSION_KEY);
    if (cachedVersion !== remoteVersion) {
      purgeCache();
      getStorage().setItem(I18N_VERSION_KEY, remoteVersion);
    }
  } catch (e) {
    new Logger('i18n').warn(`manifest.json fetch failed, using existing cache: ${e}`);
  }
}

class HttpBackend {
  type = 'backend' as const;
  read(lng: string, ns: string, cb: (error: Error | null, data: Record<string, unknown> | null) => void) {
    const cached = readCache(lng, ns);
    if (cached) {
      cb(null, cached);
      return;
    }

    const baseUrl = Env.get().I18N_BASE_URL;
    if (!baseUrl) {
      cb(new Error('I18N_BASE_URL is not configured'), null);
      return;
    }

    fetch(`${baseUrl.replace(/\/$/, '')}/${lng}/${ns}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        return res.json();
      })
      .then((data: Record<string, unknown>) => {
        writeCache(lng, ns, data);
        cb(null, data);
      })
      .catch((error: Error) => cb(error, null));
  }
}

export const i18nReady = loadStorage()
  .then(() => checkCacheVersion())
  .then(() =>
    i18next
      .use(new HttpBackend())
      .use(initReactI18next)
      .init({
        lng: 'zh-TW',
        fallbackLng: 'zh-TW',
        supportedLngs: ['zh-TW', 'zh-CN', 'en-US', 'fa-IR', 'pt-BR', 'ru-RU', 'es-ES', 'tr-TR'],

        ns: ['app', 'rpc', 'message', 'country', 'badge', 'position', 'system'],
        defaultNS: 'app',
        fallbackNS: ['app'],

        interpolation: { escapeValue: false },
        load: 'currentOnly' as const,
        nonExplicitSupportedLngs: false,
      }),
  );

export function t(key: string, params?: Record<string, string>) {
  return i18next.t(key, params);
}

export function changeLanguage(language: Types.LanguageKey) {
  i18next.changeLanguage(language);
}

export default i18next;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/i18n/index.ts
git commit -m "feat(i18n): use storage abstraction, fix DOCS_BASE_URL bug"
```

---

## Server-side note (unchanged)

`manifest.json` at `${I18N_BASE_URL}/manifest.json`:

```json
{
  "version": "1.0.5"
}
```

Bump `version` when translation files update. No app rebuild needed.

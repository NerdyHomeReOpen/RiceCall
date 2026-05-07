# i18n localStorage Cache Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cache i18n translation JSON files in `localStorage`, invalidated by `manifest.json` version check on app startup.

**Architecture:** On init, fetch `${I18N_BASE_URL}/manifest.json`, compare `.version` with stored `localStorage['i18n_version']`; if changed, purge all `i18n_cache:*` keys and store new version. `HttpBackend.read()` checks `localStorage` before fetching from server; on cache miss it fetches and stores. All errors are non-fatal — fallback to normal fetch behavior.

**Tech Stack:** i18next 25, react-i18next 15, TypeScript, localStorage (browser + Electron Chromium)

---

## File Map

| File | Change |
|------|--------|
| `src/i18n/index.ts` | Modify — add cache helpers, version check, update `HttpBackend` and `i18nReady` |

---

### Task 1: Add localStorage cache helpers

**Files:**
- Modify: `src/i18n/index.ts`

These three helpers encapsulate all localStorage access. Add them at the top of the file, before `HttpBackend`.

- [ ] **Step 1: Open `src/i18n/index.ts` and add cache constants + helpers after the imports**

Replace the file content up to (but not including) `class HttpBackend`) with:

```typescript
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import type * as Types from '@/types';

import Env from '@/env';

const I18N_VERSION_KEY = 'i18n_version';
const I18N_CACHE_PREFIX = 'i18n_cache:';

function cacheKey(lng: string, ns: string): string {
  return `${I18N_CACHE_PREFIX}${lng}:${ns}`;
}

function readCache(lng: string, ns: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(cacheKey(lng, ns));
    if (!raw) return null;
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    localStorage.removeItem(cacheKey(lng, ns));
    return null;
  }
}

function writeCache(lng: string, ns: string, data: Record<string, unknown>): void {
  try {
    localStorage.setItem(cacheKey(lng, ns), JSON.stringify(data));
  } catch {
    console.warn('[i18n] localStorage write failed (quota exceeded?)');
  }
}

function purgeCache(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(I18N_CACHE_PREFIX)) keysToRemove.push(k);
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}
```

- [ ] **Step 2: Commit**

```bash
git add src/i18n/index.ts
git commit -m "feat(i18n): add localStorage cache helpers"
```

---

### Task 2: Add version check function

**Files:**
- Modify: `src/i18n/index.ts`

Add `checkCacheVersion()` after the helpers from Task 1, before `class HttpBackend`.

- [ ] **Step 1: Add the version check function**

```typescript
async function checkCacheVersion(): Promise<void> {
  const baseUrl = Env.get().I18N_BASE_URL;
  if (!baseUrl) return;

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/manifest.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const manifest = (await res.json()) as Record<string, unknown>;
    const remoteVersion = typeof manifest.version === 'string' ? manifest.version : null;

    if (!remoteVersion) {
      console.warn('[i18n] manifest.json missing version field, skipping cache invalidation');
      return;
    }

    const cachedVersion = localStorage.getItem(I18N_VERSION_KEY);
    if (cachedVersion !== remoteVersion) {
      purgeCache();
      localStorage.setItem(I18N_VERSION_KEY, remoteVersion);
    }
  } catch (e) {
    console.warn('[i18n] manifest.json fetch failed, using existing cache:', e);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/i18n/index.ts
git commit -m "feat(i18n): add manifest.json version check for cache invalidation"
```

---

### Task 3: Update HttpBackend to use cache

**Files:**
- Modify: `src/i18n/index.ts`

Replace the existing `HttpBackend` class with a cache-aware version.

- [ ] **Step 1: Replace `class HttpBackend` with**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/i18n/index.ts
git commit -m "feat(i18n): use localStorage cache in HttpBackend"
```

---

### Task 4: Run version check before i18next init

**Files:**
- Modify: `src/i18n/index.ts`

`i18nReady` must await `checkCacheVersion()` before init, so cache is clean before any `read()` calls.

- [ ] **Step 1: Replace the `export const i18nReady = ...` block with**

```typescript
export const i18nReady = checkCacheVersion().then(() =>
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors related to `src/i18n/index.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/i18n/index.ts
git commit -m "feat(i18n): await version check before i18next init"
```

---

### Task 5: Manual verification

- [ ] **Step 1: Start the app and open DevTools → Application → Local Storage**

Confirm after first load:
- Key `i18n_version` exists with a version string (e.g. `"1.0.5"`)
- Keys like `i18n_cache:zh-TW:app`, `i18n_cache:zh-TW:message` etc. exist

- [ ] **Step 2: Reload the app**

Open Network tab filtered by `Fetch/XHR`. Confirm translation JSON files (`zh-TW/app.json` etc.) are **not** fetched (served from cache). Only `manifest.json` should appear.

- [ ] **Step 3: Simulate cache invalidation**

On the server, update `manifest.json` to a new version string. Reload the app. Confirm:
- Translation JSON files **are** fetched (cache was purged)
- `i18n_version` in localStorage updated to new version
- On next reload, translations are cached again (no re-fetch)

- [ ] **Step 4: Simulate manifest fetch failure**

Temporarily stop the server or change `I18N_BASE_URL` to an invalid URL. Reload. Confirm:
- App still loads with previously cached translations
- Console shows `[i18n] manifest.json fetch failed, using existing cache:`

---

## Server-side note

`manifest.json` must exist at `${I18N_BASE_URL}/manifest.json`:

```json
{
  "version": "1.0.5"
}
```

Bump `version` whenever translation files are updated. No app rebuild required.

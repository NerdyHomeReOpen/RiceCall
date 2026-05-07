# i18n Storage Abstraction Design

**Date:** 2026-05-07
**Extends:** `2026-05-07-i18n-localstorage-cache-design.md`

## Problem

Current implementation uses `if (isElectron()) return;` to skip all caching in Electron — this blocks caching in the renderer process too. Main process has no `localStorage`; renderer does. Need environment-aware storage.

Also: `checkCacheVersion()` incorrectly uses `DOCS_BASE_URL` instead of `I18N_BASE_URL` — fix in this changeset.

## Architecture

### Storage Interface

```typescript
interface I18nStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  keys(): string[];
}
```

### Adapters

| Adapter | Environment | Backing store |
|---------|-------------|---------------|
| `LocalStorageAdapter` | Renderer + Web browser | `window.localStorage` |
| `FsAdapter` | Electron main process | `fs` sync, `{userData}/i18n-cache/*.dat` |

**FsAdapter filename encoding:** `encodeURIComponent(key) + '.dat'`
- Handles `:` and other special chars
- `keys()` decodes with `decodeURIComponent(f.slice(0, -4))`

**FsAdapter construction:** receives `dir`, `fs`, `path` as constructor args (loaded via dynamic `createRequire` in `loadStorage()`, same pattern as `env.ts`)

### Initialization

```
loadStorage() → Promise<void>
  isMain() → FsAdapter (electron.app.getPath('userData') + '/i18n-cache')
  else     → LocalStorageAdapter
```

`i18nReady` chain:
```
loadStorage()
  .then(() => checkCacheVersion())
  .then(() => i18next.init(...))
```

## Files

| File | Change |
|------|--------|
| `src/i18n/storage.ts` | Create — interface + adapters + `loadStorage` + `getStorage` |
| `src/i18n/index.ts` | Modify — remove `isElectron` guard, use `getStorage()`, fix `DOCS_BASE_URL` bug, update `i18nReady` chain |

## Error Handling

| Scenario | Behavior |
|----------|----------|
| FsAdapter `getItem` read fails | Return `null` (miss) |
| FsAdapter `setItem` write fails | `console.warn`, continue |
| FsAdapter `removeItem` not found | Ignore silently |
| FsAdapter `keys()` dir read fails | Return `[]` |
| `getStorage()` called before `loadStorage()` | Throw `Error('[i18n] storage not initialized')` |

## Key Schema (unchanged)

- `i18n_version` — current cached translation version
- `i18n_cache:{lng}:{ns}` — cached translation namespace

## Bug Fix

`checkCacheVersion()` line using `Env.get().DOCS_BASE_URL` → change to `Env.get().I18N_BASE_URL`

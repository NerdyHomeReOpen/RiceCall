# i18n localStorage Cache Design

**Date:** 2026-05-07  
**File scope:** `src/i18n/index.ts` only

## Goal

Cache i18n translation JSON files in `localStorage` so the app avoids redundant network requests on every load. Cache invalidation is driven by `manifest.json` on the server — no app rebuild required to deliver new translations.

## Architecture

### Version Check (runs once at init)

Before `i18next.init()`, fetch `${I18N_BASE_URL}/manifest.json` and read `data.version`.

Compare with `localStorage.getItem('i18n_version')`:

| Condition | Action |
|-----------|--------|
| Version changed | Clear all `i18n_cache:*` keys from localStorage, store new version |
| Version same | No-op, keep cached data |
| Fetch fails | Log warn, keep existing cache (offline-friendly) |

### HttpBackend Cache Layer

`read(lng, ns, cb)` flow:

```
cacheKey = "i18n_cache:{lng}:{ns}"

1. localStorage.getItem(cacheKey)
   → hit: JSON.parse → cb(null, data) ✓
   → parse error: delete key, treat as miss
2. miss: fetch from server
   → success: localStorage.setItem(cacheKey, JSON.stringify(data)) → cb(null, data)
   → write fails (storage full): log warn, still cb(null, data)
   → fetch fails: cb(error, null)
```

### localStorage Key Schema

| Key | Value | Purpose |
|-----|-------|---------|
| `i18n_version` | `"1.0.5"` | Current cached translation version |
| `i18n_cache:{lng}:{ns}` | JSON string | Cached translation namespace |

Example keys:
- `i18n_cache:zh-TW:app`
- `i18n_cache:en-US:message`

## Error Handling

| Scenario | Behavior |
|----------|----------|
| `manifest.json` fetch fails | Warn + keep old cache, init continues |
| `manifest.json` missing `version` field | Warn + skip version check, use cache as-is |
| localStorage parse error on read | Delete corrupted key, fetch from server |
| localStorage write fails (QuotaExceededError) | Warn, translation still works (just not cached) |
| Translation fetch fails | Pass error to i18next (existing behavior) |

## Server Requirements

`manifest.json` must exist at `${I18N_BASE_URL}/manifest.json` and include a `version` field:

```json
{
  "version": "1.0.5"
}
```

When updating translations: update the translation files **and** bump `manifest.json` version. The next app startup will detect the change and re-fetch all translations.

## Constraints

- `localStorage` only — works in both Electron (Chromium-based) and web browser
- No new npm dependencies
- All changes confined to `src/i18n/index.ts`
- Version check is async; must complete before `i18next.init()` so cache is clean before any `read()` calls

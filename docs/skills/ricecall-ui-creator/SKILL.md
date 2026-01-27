---
name: ricecall-ui-creator
description: Create and register new UI components (Popups/Windows) in the RiceCall architecture. Use this when the user asks to "add a new UI", "create a popup", "add a window", or "add a feature view".
---

# RiceCall UI Creator

## Overview

This skill guides the creation of new UI components within the RiceCall architecture. In RiceCall, most isolated UIs are "Popups" that work across both Electron (as Windows) and Web (as Overlays).

## Workflow

Follow these steps to add a new UI.

### Step 1: Define Popup Name
Determine a unique `camelCase` name for the popup (e.g., `myNewFeature`, `gameOverlay`).
*   **Name**: `<PopupName>` (e.g., `userProfile`)
*   **Component Name**: `<ComponentName>` (PascalCase, e.g., `UserProfile`)

### Step 2: Update Type Definitions
You MUST add the new popup name to the `PopupType` union in `src/types/index.ts`.

1.  Read `src/types/index.ts`.
2.  Locate `export type PopupType = ...`.
3.  Add `| '<PopupName>'` to the list (alphabetical order preferred).

### Step 3: Create Component
Create the React component in `src/out/<Category>/<ComponentName>.tsx` or `src/popups/<ComponentName>.tsx`.
*Check existing folder structure `src/out` to decide the best category folder.*

1.  Use `assets/PopupTemplate.tsx` as a base.
2.  Replace placeholders `{ComponentName}`.
3.  Ensure imports match project structure (check `@/hooks/...` availability).

### Step 4: Register Configuration
Register the new popup in `src/popup.config.ts`. You must update MULTIPLE sections:

1.  **POPUP_SIZES**: Add `{ width: <w>, height: <h> }`.
2.  **POPUP_HEADERS**: Add configuration (usually `{ buttons: ['close'], hideHeader: false }`).
3.  **POPUP_TITLE_KEYS**: Add i18n key (e.g., `'my-feature-title'`).
4.  **POPUP_BEHAVIORS**: Add `{ resizable: false, maximizable: false, fullscreenable: false }` (adjust as needed).
5.  **POPUP_COMPONENTS**: Add mapping to the component filename (e.g., `'UserProfile'`).

### Step 5: Verify
1.  Check for build errors (types).
2.  Explain to the user how to open it: `popup.open('<PopupName>', { ...data })`.

## Reference

See `references/popup-architecture.md` for architectural details if you need to understand the underlying system.
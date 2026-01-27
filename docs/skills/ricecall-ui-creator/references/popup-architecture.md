# RiceCall Popup System Architecture

## Core Concepts
RiceCall uses a dual-strategy for UIs (Popups/Windows):
- **Electron**: Uses `BrowserWindow` (Native isolation).
- **Web**: Uses `React Portal / Modal Overlay` (Single DOM).

A unified interface hides these implementation details.

## Key Components

### 1. Popup Config (`src/popup.config.ts`)
Registry of all available popups.
```typescript
export const POPUP_CONFIGS = {
  'MyNewFeature': {
    component: lazy(() => import('@/popups/MyNewFeature')),
    width: 600,
    height: 400
  },
};
```

### 2. InAppPopupHost (`src/app/layout.tsx`)
The React component that listens for popup events and renders them in the DOM (for Web).

### 3. Usage
Open popups via the unified controller:
```typescript
import { popup } from '@/platform/popup'; // Check exact path in codebase

popup.open('MyNewFeature', { someId: 123 });
```

## Data Passing
- **Initial Data**: Passed via second argument to `popup.open`.
  - Inside the popup, access it via `usePopupContext()` or similar hook (check codebase for exact hook).
- **Electron**: Data is passed via URL query or IPC.
- **Web**: Data is stored in `sessionStorage` or React State.

## Best Practices
- **Isolation**: Keep popup logic self-contained.
- **Cleanup**: Ensure `useEffect` cleanup functions are correct, especially for listeners.
- **Styling**: Use the project's CSS/Styling conventions (check `.stylelintrc.json` or existing files).

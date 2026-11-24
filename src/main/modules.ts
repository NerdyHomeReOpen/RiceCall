/* eslint-disable @typescript-eslint/no-require-imports */
import type { IpcRendererHandlers } from '@/types/preload';

import { isRenderer, isWebsite } from '@/utils/platform';

let _ipcRenderer: typeof window.ipcRenderer | null = null;
let _webMain: IpcRendererHandlers | null = null;

export const modules = {
  // The web build implements the same handlers as the Electron preload bridge.
  get default(): IpcRendererHandlers {
    if (isRenderer()) {
      if (!_ipcRenderer) {
        _ipcRenderer = window.ipcRenderer;
      }

      return _ipcRenderer!;
    } else if (isWebsite()) {
      if (!_webMain) {
        const webMain: typeof import('@/main/web') = require('@/main/web');
        _webMain = webMain;
      }

      return _webMain!;
    } else {
      throw new Error('Unsupported platform');
    }
  },
};

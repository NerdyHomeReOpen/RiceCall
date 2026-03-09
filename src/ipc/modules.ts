/* eslint-disable @typescript-eslint/no-require-imports */
import { isRenderer, isWebsite } from '@/utils/platform';

let _ipcRenderer: typeof window.ipcRenderer | null = null;
let _webMain: typeof import('@/web/main') | null = null;

export const modules = {
  get default() {
    if (isRenderer()) {
      if (!_ipcRenderer) {
        _ipcRenderer = window.ipcRenderer;
      }
      return _ipcRenderer!;
    } else if (isWebsite()) {
      if (!_webMain) {
        _webMain = require('@/web/main');
      }
      return _webMain!;
    } else {
      throw new Error('Unsupported platform');
    }
  },
};

import type { PopupController } from './types';
import { ElectronPopupController } from './electron';
import { WebPopupController } from './web';

let singleton: PopupController | null = null;

function isElectronRenderer(): boolean {
  // Mirrors the existing check style used in `src/ipc.ts`.
  return typeof window !== 'undefined' && typeof (window as unknown as { require?: unknown }).require === 'function';
}

export function getPopupController(): PopupController {
  if (singleton) return singleton;
  singleton = isElectronRenderer() ? new ElectronPopupController() : new WebPopupController();
  return singleton;
}

export type { PopupController } from './types';

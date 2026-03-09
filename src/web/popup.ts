import * as Types from '@/types';

import { createPopup, getSettings } from '@/web/main';
import { eventEmitter } from '@/web/event';

import Logger from '@/logger';
import * as Loader from '@/loader';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function openPopup(type: Types.PopupType, id: string, initialData: any, force: boolean = true) {
  new Logger('System').info(`Opening ${type} (${id})...`);

  if (typeof initialData !== 'object' || initialData === null) {
    initialData = {};
  }

  const loader = Loader[type as keyof typeof Loader];
  if (loader)
    initialData = await loader({ ...initialData, systemSettings: getSettings() }).catch(() => {
      new Logger('System').error(`Cannot load ${type} data, aborting...`);
      return null;
    });
  if (!initialData) return;

  createPopup(type, id, initialData, force);
}

export function closePopup(id: string) {
  eventEmitter.emit('close-popup', id);
}

export function closeAllPopups() {
  eventEmitter.emit('close-all-popups');
}

export function popupSubmit(to: string, data: unknown | null = null) {
  eventEmitter.emit(`popup-submit-${to}`, data);
}

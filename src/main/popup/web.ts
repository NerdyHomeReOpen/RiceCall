import type * as Types from '@/types';

import Logger from '@/utils/logger';

import initialDataLoader from '@/main/popup/initial-data-loader';
import { createPopup, getSettings } from '@/main/web';
import { eventEmitter } from '@/main/event';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function openPopup(type: Types.PopupType, id: string, initialData: any, force: boolean = true): Promise<void> {
  new Logger('SYSTEM').info(`Opening ${type} (${id})...`);

  if (typeof initialData !== 'object' || initialData === null) {
    initialData = {};
  }

  const loader = initialDataLoader[type];
  if (loader) {
    const loadedData = await loader({ ...initialData }).catch(() => {
      new Logger('SYSTEM').error(`Cannot load ${type} data, aborting...`);
      return null;
    });
    if (!loadedData) return;

    initialData = { ...loadedData, ...initialData, systemSettings: getSettings() };
  }

  if (!initialData) return;

  createPopup(type, id, initialData, force);
}

export function closePopup(id: string): void {
  eventEmitter.emit('close-popup', id);
}

export function closeAllPopups(): void {
  eventEmitter.emit('close-all-popups');
}

export function popupSubmit(to: string, data: unknown | null = null): void {
  eventEmitter.emit(`popup-submit-${to}`, data);
}

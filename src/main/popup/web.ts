import type * as Types from '@/types';

import Logger from '@/utils/logger';

import { loadPopupData } from '@/main/popup/initial-data-loader';
import { createPopup, getSettings } from '@/main/web';
import { eventEmitter } from '@/main/event';

export async function openPopup<T extends Types.PopupType>(type: T, id: string, initialData: Types.PopupOpenData<T>, force: boolean = true): Promise<void> {
  new Logger('SYSTEM').info(`Opening ${type} (${id})...`);

  const popupData = await loadPopupData(type, initialData ?? {}, getSettings()).catch(() => {
    new Logger('SYSTEM').error(`Cannot load ${type} data, aborting...`);
    return null;
  });

  if (!popupData) return;
  createPopup(type, id, popupData, force);
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

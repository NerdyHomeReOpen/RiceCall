import { ipcMain } from 'electron';

import { broadcast, createPopup, store } from '@/electron/main';
import { checkForUpdates } from '@/electron/auto-updater';

import { t } from '@/i18n';

export function registerAppHandlers() {
  ipcMain.on('dont-show-disclaimer-next-time', () => {
    store.set('dontShowDisclaimer', true);
  });

  ipcMain.on('server-select', (_, data: { serverDisplayId: string; serverId: string; timestamp: number }) => {
    broadcast('server-select', data);
  });

  ipcMain.on('check-for-updates', async () => {
    const result = await checkForUpdates(true);
    if (!result || !result.isUpdateAvailable) {
      createPopup('dialogInfo', 'dialogInfo', { message: t('is-latest-version'), timestamp: Date.now() }, true);
    }
  });
}

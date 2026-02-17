import path from 'path';
import ElectronUpdater, { ProgressInfo, UpdateInfo } from 'electron-updater';
const { autoUpdater } = ElectronUpdater;
import { app, dialog } from 'electron';

import { DEV, store } from '@/electron/main';

import { t } from '@/i18n';
import Logger from '@/logger';

let isUpdateNotified: boolean = false;
let checkForUpdatesInterval: NodeJS.Timeout | null = null;

export async function checkForUpdates(force = false) {
  if (isUpdateNotified && !force) return;

  if (DEV) {
    autoUpdater.forceDevUpdateConfig = true;
    autoUpdater.updateConfigPath = path.join(app.getAppPath(), 'dev-app-update.yml');
  }

  const channel = store.get('updateChannel');
  new Logger('System').info(`Checking for updates, channel: ${channel}`);

  if (channel === 'dev') {
    autoUpdater.allowPrerelease = true;
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'NerdyHomeReOpen',
      repo: 'RiceCall',
      channel: 'dev',
    });
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;
    autoUpdater.allowDowngrade = true;
    const result = await autoUpdater.checkForUpdates().catch((e) => {
      const error = e instanceof Error ? e : new Error('Unknown error');
      new Logger('System').error(`Cannot check for updates in dev channel: ${error.message}`);
    });
    if (result?.isUpdateAvailable) return result;
  }

  autoUpdater.allowPrerelease = false;
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'NerdyHomeReOpen',
    repo: 'RiceCall',
    channel: 'latest',
  });
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.allowDowngrade = false;
  const result = await autoUpdater.checkForUpdates().catch((e) => {
    const error = e instanceof Error ? e : new Error('Unknown error');
    new Logger('System').error(`Cannot check for updates in latest channel: ${error.message}`);
  });
  if (result?.isUpdateAvailable) return result;
}

export async function configureAutoUpdater() {
  autoUpdater.on('update-available', (info: UpdateInfo) => {
    new Logger('System').info(`Update available: ${info.version}`);

    dialog
      .showMessageBox({
        type: 'info',
        title: t('update-available'),
        message: t('update-available-message', { version: info.version, releaseDate: new Date(info.releaseDate).toLocaleDateString() }),
        buttons: [t('download-update'), t('cancel')],
        cancelId: 1,
      })
      .then((buttonIndex) => {
        if (buttonIndex.response === 0) {
          autoUpdater.downloadUpdate();
        }
      })
      .catch((e) => {
        const error = e instanceof Error ? e : new Error('Unknown error');
        new Logger('System').error(`Cannot show update dialog: ${error.message}`);
      });
    isUpdateNotified = true;
  });

  autoUpdater.on('update-not-available', () => {
    new Logger('System').info(`Is latest version`);
  });

  autoUpdater.on('download-progress', (progressInfo: ProgressInfo) => {
    let message = `${progressInfo.bytesPerSecond}`;
    message = `${message} - ${progressInfo.percent}%`;
    message = `${message} (${progressInfo.transferred}/${progressInfo.total})`;
    new Logger('System').info(`Downloading update: ${message}`);
  });

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    new Logger('System').info(`Update downloaded: ${info.version}`);

    dialog
      .showMessageBox({
        type: 'info',
        title: t('update-downloaded'),
        message: t('update-downloaded-message', { version: info.version }),
        buttons: [t('install-update'), t('install-after-quit'), t('cancel')],
        cancelId: 2,
      })
      .then((buttonIndex) => {
        if (buttonIndex.response === 0) {
          autoUpdater.quitAndInstall(false, true);
        } else if (buttonIndex.response === 1) {
          autoUpdater.autoInstallOnAppQuit = true;
        }
      })
      .catch((e) => {
        const error = e instanceof Error ? e : new Error('Unknown error');
        new Logger('System').error(`Cannot show update dialog: ${error.message}`);
      });
    isUpdateNotified = false;
  });

  if (store.get('autoCheckForUpdates')) startCheckForUpdates();
}

export function startCheckForUpdates() {
  if (checkForUpdatesInterval) clearInterval(checkForUpdatesInterval);
  checkForUpdatesInterval = setInterval(checkForUpdates, store.get('updateCheckInterval'));
  checkForUpdates();
}

export function stopCheckForUpdates() {
  if (checkForUpdatesInterval) clearInterval(checkForUpdatesInterval);
  checkForUpdatesInterval = null;
}

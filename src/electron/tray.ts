import path from 'path';
import { app, Menu, Tray, nativeImage } from 'electron';

import { authWindow, mainWindow, VERSION_TITLE } from '@/electron/main';

import { logout } from '@/electron/handlers/auth';

import { t } from '@/i18n';

export const APP_TRAY_ICON = {
  gray: process.platform === 'win32' ? path.join(app.getAppPath(), 'resources', 'tray_gray.ico') : path.join(app.getAppPath(), 'resources', 'tray_gray.png'),
  normal: process.platform === 'win32' ? path.join(app.getAppPath(), 'resources', 'tray.ico') : path.join(app.getAppPath(), 'resources', 'tray.png'),
};

export let tray: Tray | null = null;

let _isLogin: boolean = false;

export function setTrayDetail(isLogin?: boolean) {
  if (!tray) return;

  if (isLogin !== undefined) {
    _isLogin = isLogin;
  }

  const trayIconPath = _isLogin ? APP_TRAY_ICON.normal : APP_TRAY_ICON.gray;
  const contextMenu = Menu.buildFromTemplate([
    {
      id: 'open-main-window',
      label: t('open-main-window'),
      type: 'normal',
      click: () => {
        if (_isLogin) mainWindow?.showInactive();
        else authWindow?.showInactive();
      },
    },
    { type: 'separator' },
    {
      id: 'logout',
      label: t('logout'),
      type: 'normal',
      enabled: _isLogin,
      click: () => logout(),
    },
    {
      id: 'exit',
      label: t('exit'),
      type: 'normal',
      click: () => app.exit(),
    },
  ]);
  tray.on('click', () => {
    if (_isLogin) mainWindow?.showInactive();
    else authWindow?.showInactive();
  });
  tray.setToolTip(VERSION_TITLE);
  tray.setImage(nativeImage.createFromPath(trayIconPath));
  tray.setContextMenu(contextMenu);
}

export function configureTray() {
  if (tray) tray.destroy();
  const trayIconPath = APP_TRAY_ICON.gray;
  tray = new Tray(nativeImage.createFromPath(trayIconPath));
  setTrayDetail();
}

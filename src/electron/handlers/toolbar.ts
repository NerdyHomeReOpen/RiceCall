import { ipcMain } from 'electron';

import { mainWindow, MAIN_TITLE, VERSION_TITLE } from '@/electron/main';
import { tray } from '@/electron/tray';

export function registerToolbarHandlers() {
  ipcMain.on('set-tray-title', (_, title: string) => {
    if (!tray) return;
    const fullTitle = title ? `${title} · ${MAIN_TITLE}` : VERSION_TITLE;
    tray.setToolTip(fullTitle);
    mainWindow?.setTitle(fullTitle);
  });
}

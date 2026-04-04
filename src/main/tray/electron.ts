import { ipcMain } from 'electron';

import { mainWindow, tray, MAIN_TITLE, VERSION_TITLE } from '@/main/electron';

export function registerTrayHandlers() {
  ipcMain.on('set-tray-title', (_, title: string) => {
    if (!tray) return;
    const fullTitle = title ? `${title} · ${MAIN_TITLE}` : VERSION_TITLE;
    tray.setToolTip(fullTitle);
    mainWindow?.setTitle(fullTitle);
  });
}

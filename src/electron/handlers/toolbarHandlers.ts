import { ipcMain } from 'electron';
import { mainWindow, tray, MAIN_TITLE, VERSION_TITLE } from '@/electron/main';

export default function registerToolbarHandlers() {
  ipcMain.on('set-tray-title', (_, title: string) => {
    if (!tray) return;
    const fullTitle = title ? `${title} · ${MAIN_TITLE}` : VERSION_TITLE;
    tray.setToolTip(fullTitle);
    mainWindow?.setTitle(fullTitle);
  });
}

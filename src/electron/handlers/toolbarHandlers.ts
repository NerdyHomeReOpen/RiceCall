

export default function registerToolbarHandlers(ipcMain: Electron.IpcMain, mainWindow: Electron.BrowserWindow | null, tray: Electron.Tray | null, MAIN_TITLE: string, VERSION_TITLE: string) {
  ipcMain.on('set-tray-title', (_, title: string) => {
    if (!tray) return;
    const fullTitle = title ? `${title} · ${MAIN_TITLE}` : VERSION_TITLE;
    tray.setToolTip(fullTitle);
    mainWindow?.setTitle(fullTitle);
  });  
}
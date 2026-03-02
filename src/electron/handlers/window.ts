import { BrowserWindow, ipcMain } from 'electron';

export function registerWindowHandlers() {
  ipcMain.on('window-control-minimize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return;
    window.minimize();
  });

  ipcMain.on('window-control-maximize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return;
    if (process.platform === 'darwin') {
      window.setFullScreen(true);
    } else {
      window.maximize();
    }
    window.webContents.send('maximize');
  });

  ipcMain.on('window-control-unmaximize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return;
    if (process.platform === 'darwin') {
      window.setFullScreen(false);
    } else {
      window.unmaximize();
    }
    window.webContents.send('unmaximize');
  });

  ipcMain.on('window-control-close', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return;
    window.close();
  });
}

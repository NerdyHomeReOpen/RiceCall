import { BrowserWindow, ipcMain } from 'electron';
import { env } from '@/env.js';
import Logger from '@/logger.js';
import { SocketService, SocketPlatformBridge } from './SocketService';
import { ClientToServerEventNames, ClientToServerEventWithAckNames } from './constants';

const logger = new Logger('Socket');

// Main window for sending events (set by main.ts)
let mainWindow: BrowserWindow | null = null;

// Bridge implementation for Electron Main Process
const electronBridge: SocketPlatformBridge = {
  onUIMessage(callback) {
    for (const event of ClientToServerEventNames) {
      ipcMain.removeAllListeners(event);
      ipcMain.on(event, (_, ...args) => callback(event, ...args));
    }
  },

  onUIInvoke(callback) {
    for (const event of ClientToServerEventWithAckNames) {
      ipcMain.removeHandler(event);
      ipcMain.handle(event, async (_, payload) => {
        try {
          const data = await callback(event, payload);
          return { ok: true, data };
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
          return { ok: false, error: err.message };
        }
      });
    }
  },

  sendToUI(event, ...args) {
    // CRITICAL: Sound events MUST ONLY be sent to the main window.
    // Broadcasting to all windows will cause duplicate overlapping audio.
    if (event === 'playSound') {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(event, ...args);
      }
      return;
    }

    BrowserWindow.getAllWindows().forEach((window) => {
      if (!window.isDestroyed()) {
        window.webContents.send(event, ...args);
      }
    });
  },

  log(level, message) {
    logger[level](message);
  }
};

const service = new SocketService(electronBridge, () => env.WS_URL);

export function connectSocket(token: string) {
  service.connect(token);
}

export function disconnectSocket() {
  service.disconnect();
}

// Compatibility exports
export function setMainWindow(window: BrowserWindow | null) {
  mainWindow = window;
}
export const socket: unknown = null; // Removed direct access

import { IpcMain } from 'electron';
import { ElectronIpcRouter } from '@/platform/ipc/router';
import { registerSharedDataHandlers } from '../shared/data';

export function registerDataHandlers(ipcMain: IpcMain) {
  const router = new ElectronIpcRouter(ipcMain);
  registerSharedDataHandlers(router);
}
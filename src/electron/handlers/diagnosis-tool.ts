import { ipcMain } from 'electron';

import * as Types from '@/types';

import { mainWindow, broadcast } from '@/electron/main';

import Logger from '@/logger';

let DiagnosisTool: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
let activeTool: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any

async function loadTool() {
  if (DiagnosisTool) return DiagnosisTool;
  try {
    const createdRequire = await import(/* webpackIgnore: true */ 'module').then((module) => module.createRequire).then((createRequire) => createRequire(import.meta.url));
    DiagnosisTool = createdRequire('networkdiagnosistool');
    if (DiagnosisTool.default) DiagnosisTool = DiagnosisTool.default;
    return DiagnosisTool;
  } catch (e1) {
    const error = e1 instanceof Error ? e1 : new Error('Unknown error');
    new Logger('NetworkDiagnosisTool').warn(`createRequire failed, trying dynamic import: ${error.message}`);

    try {
      // @ts-expect-error - No types for networkdiagnosistool
      const { default: module } = await import('networkdiagnosistool');
      DiagnosisTool = module.default || module;
      return DiagnosisTool;
    } catch (e2) {
      const error = e2 instanceof Error ? e2 : new Error('Unknown error');
      new Logger('NetworkDiagnosisTool').error(`Failed to load networkdiagnosistool via all methods: ${error.message}`);
      throw new Error(`Tool loading failed: ${error.message}`);
    }
  }
}

export function registerDiagnosisToolHandlers() {
  ipcMain.handle('run-network-diagnosis', async (event, params: { domains: string[]; duration?: number }): Promise<Types.FullReport | { error: string }> => {
    const sender = event.sender;
    new Logger('NetworkDiagnosisTool').info(`Received run-network-diagnosis request: ${JSON.stringify(params)}`);
    try {
      const Tool = await loadTool();
      if (!Tool) {
        new Logger('NetworkDiagnosisTool').error('Network diagnosis tool could not be loaded. Please check node_modules.');
        return { error: 'Network diagnosis tool could not be loaded. Please check node_modules.' };
      }

      if (activeTool) {
        try {
          activeTool.cancel?.();
        } catch {
          // ignore
        }
      }

      return new Promise<Types.FullReport | { error: string }>((resolve) => {
        try {
          const { domains, duration = 3 } = params;
          const uniqueDomains = Array.from(new Set(domains)).filter(Boolean);

          activeTool = new Tool(uniqueDomains, duration);

          activeTool
            .run((progress: Types.ProgressData) => {
              if (!sender.isDestroyed()) {
                sender.send('network-diagnosis-progress', progress);
              }
            })
            .then((report: Types.FullReport) => {
              activeTool = null;
              resolve(report);
            })
            .catch((e: unknown) => {
              activeTool = null;
              const error = e instanceof Error ? e : new Error('Unknown error');
              new Logger('NetworkDiagnosisTool').error(`Diagnosis execution error: ${error.message}`);
              resolve({ error: error.message });
            });
        } catch (e) {
          activeTool = null;
          const error = e instanceof Error ? e : new Error('Unknown error');
          new Logger('NetworkDiagnosisTool').error(`Tool instantiation error: ${error.message}`);
          resolve({ error: error.message });
        }
      });
    } catch (e) {
      const error = e instanceof Error ? e : new Error('Unknown error');
      return { error: error.message };
    }
  });

  ipcMain.on('cancel-network-diagnosis', () => {
    if (activeTool) {
      activeTool.cancel?.();
      activeTool = null;
    }
  });

  ipcMain.on('request-sfu-diagnosis', (event) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('get-sfu-diagnosis');
    } else {
      event.sender.send('sfu-diagnosis-response', null);
    }
  });

  ipcMain.on('sfu-diagnosis-response', (_, data: { targetSenderId: number; info: unknown } | null) => {
    broadcast('sfu-diagnosis-response', data?.info);
  });
}

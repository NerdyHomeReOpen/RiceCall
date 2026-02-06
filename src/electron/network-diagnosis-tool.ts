/* eslint-disable @typescript-eslint/no-explicit-any */

import { ipcMain } from 'electron';
import { createRequire } from 'module';
import Logger from '../logger.js';

const require = createRequire(import.meta.url);

let DiagnosisTool: any = null;
let activeTool: any = null;
let isInitialized = false;

async function loadTool() {
  if (DiagnosisTool) return DiagnosisTool;
  try {
    DiagnosisTool = require('networkdiagnosistool');
    if (DiagnosisTool.default) DiagnosisTool = DiagnosisTool.default;
    return DiagnosisTool;
  } catch (error1: any) {
    new Logger('NetworkDiagnosisTool').warn(`createRequire failed, trying dynamic import: ${error1.message}`);
    try {
      // @ts-expect-error - No types for networkdiagnosistool
      const { default: module } = await import('networkdiagnosistool');
      DiagnosisTool = module.default || module;
      return DiagnosisTool;
    } catch (error2: any) {
      new Logger('NetworkDiagnosisTool').error(`Failed to load networkdiagnosistool via all methods: ${error2.message}`);
      throw new Error(`Tool loading failed: ${error2.message}`);
    }
  }
}

export function initNetworkDiagnosisTool() {
  if (isInitialized) {
    new Logger('NetworkDiagnosisTool').info('NetworkDiagnosisTool already initialized, skipping handler registration.');
    return;
  }

  new Logger('NetworkDiagnosisTool').info('Initializing NetworkDiagnosisTool IPC handlers...');

  ipcMain.handle('run-network-diagnosis', async (event, params: { domains: string[]; duration?: number }) => {
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

      return new Promise((resolve) => {
        try {
          const { domains, duration = 3 } = params;
          const uniqueDomains = Array.from(new Set(domains)).filter(Boolean);

          activeTool = new Tool(uniqueDomains, duration);

          activeTool
            .run((progress: any) => {
              if (!sender.isDestroyed()) {
                sender.send('network-diagnosis-progress', progress);
              }
            })
            .then((report: any) => {
              activeTool = null;
              resolve(report);
            })
            .catch((err: any) => {
              activeTool = null;
              new Logger('NetworkDiagnosisTool').error(`Diagnosis execution error: ${err.message}`);
              resolve({ error: err.message || String(err) });
            });
        } catch (err: any) {
          activeTool = null;
          new Logger('NetworkDiagnosisTool').error(`Tool instantiation error: ${err.message}`);
          resolve({ error: err.message || String(err) });
        }
      });
    } catch (err: any) {
      return { error: err.message || 'Unknown error loading diagnosis tool.' };
    }
  });

  ipcMain.on('cancel-network-diagnosis', () => {
    if (activeTool) {
      activeTool.cancel?.();
      activeTool = null;
    }
  });

  isInitialized = true;
  new Logger('NetworkDiagnosisTool').info('NetworkDiagnosisTool IPC handlers registered successfully.');
}

import { ipcMain } from 'electron';

import type * as Types from '@/types';

import Logger from '@/utils/logger';

import { broadcast } from '@/main/electron';

// networkdiagnosistool ships without types; these are the parts this module uses.
type DiagnosisToolInstance = { run: (onProgress: (progress: Types.ProgressData) => void) => Promise<Types.FullReport>; cancel?: () => void };

type DiagnosisToolConstructor = new (domains: string[], duration: number) => DiagnosisToolInstance;

let DiagnosisTool: DiagnosisToolConstructor | null = null;
let activeTool: DiagnosisToolInstance | null = null;

async function loadTool() {
  if (DiagnosisTool) return DiagnosisTool;

  try {
    const createdRequire = await import(/* webpackIgnore: true */ 'module').then((module) => module.createRequire).then((createRequire) => createRequire(import.meta.url));
    const loaded = createdRequire('networkdiagnosistool') as DiagnosisToolConstructor | { default: DiagnosisToolConstructor };
    DiagnosisTool = 'default' in loaded ? loaded.default : loaded;
    return DiagnosisTool;
  } catch (e1) {
    const error = e1 instanceof Error ? e1 : new Error('Unknown error');
    new Logger('NETWORK_DIAGNOSIS_TOOL').warn(`createRequire failed, trying dynamic import: ${error.message}`);

    try {
      // @ts-expect-error - No types for networkdiagnosistool
      const { default: module } = await import('networkdiagnosistool');

      DiagnosisTool = (module.default || module) as DiagnosisToolConstructor;
      return DiagnosisTool;
    } catch (e2) {
      const error = e2 instanceof Error ? e2 : new Error('Unknown error');
      new Logger('NETWORK_DIAGNOSIS_TOOL').error(`Failed to load networkdiagnosistool via all methods: ${error.message}`);
      throw new Error(`Tool loading failed: ${error.message}`);
    }
  }
}

export function registerNetworkHandlers(): void {
  ipcMain.handle('run-network-diagnosis', async (event, params: { domains: string[]; duration?: number }): Promise<Types.FullReport | { error: string }> => {
    const sender = event.sender;
    new Logger('NETWORK_DIAGNOSIS_TOOL').info(`Received run-network-diagnosis request: ${JSON.stringify(params)}`);

    try {
      const Tool = await loadTool();

      if (!Tool) {
        new Logger('NETWORK_DIAGNOSIS_TOOL').error('Network diagnosis tool could not be loaded. Please check node_modules.');
        return { error: 'Network diagnosis tool could not be loaded. Please check node_modules.' };
      }

      if (activeTool) {
        try {
          activeTool.cancel?.();
        } catch {}
      }

      return new Promise<Types.FullReport | { error: string }>((resolve) => {
        try {
          const { domains, duration = 3 } = params;
          const uniqueDomains = Array.from(new Set(domains)).filter(Boolean);
          const tool = new Tool(uniqueDomains, duration);
          activeTool = tool;

          tool
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
              new Logger('NETWORK_DIAGNOSIS_TOOL').error(`Diagnosis execution error: ${error.message}`);
              resolve({ error: error.message });
            });
        } catch (e) {
          activeTool = null;
          const error = e instanceof Error ? e : new Error('Unknown error');
          new Logger('NETWORK_DIAGNOSIS_TOOL').error(`Tool instantiation error: ${error.message}`);
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

  ipcMain.on('request-sfu-diagnosis', () => {
    broadcast('request-sfu-diagnosis');
  });

  ipcMain.on('sfu-diagnosis-response', (_, data: { targetSenderId: number; info: unknown } | null) => {
    broadcast('sfu-diagnosis-response', data?.info);
  });
}

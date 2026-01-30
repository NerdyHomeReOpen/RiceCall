import { ipcMain, BrowserWindow } from 'electron';
import { createRequire } from 'module';
import Logger from './logger.js';

const require = createRequire(import.meta.url);
let DiagnosisTool: any = null;

async function loadTool() {
    if (DiagnosisTool) return DiagnosisTool;
    try {
        // Try createRequire first for CJS module compatibility in ESM
        DiagnosisTool = require('networkdiagnosistool');
        if (DiagnosisTool.default) DiagnosisTool = DiagnosisTool.default;
        return DiagnosisTool;
    } catch (e1) {
        new Logger('NetworkService').warn('createRequire failed, trying dynamic import:', e1);
        try {
            const module = await import('networkdiagnosistool');
            DiagnosisTool = module.default || module;
            return DiagnosisTool;
        } catch (e2: any) {
            new Logger('NetworkService').error('Failed to load networkdiagnosistool via all methods:', e2);
            throw new Error(`Tool loading failed: ${e2.message || String(e2)}`);
        }
    }
}

let activeTool: any = null;
let isInitialized = false;

export function initNetworkService(mainWindow: BrowserWindow | null) {
  if (isInitialized) {
    new Logger('NetworkService').info('NetworkService already initialized, skipping handler registration.');
    return;
  }

  new Logger('NetworkService').info('Initializing NetworkService IPC handlers...');

  ipcMain.handle('run-network-diagnosis', async (event, params: { domains: string[]; duration?: number }) => {
    const sender = event.sender;
    new Logger('NetworkService').info('Received run-network-diagnosis request', params);
    try {
        const Tool = await loadTool();
        if (!Tool) {
            new Logger('NetworkService').error('Tool could not be loaded');
            return { error: 'Network diagnosis tool could not be loaded. Please check node_modules.' };
        }

        if (activeTool) {
            try { activeTool.cancel?.(); } catch (e) { /* ignore */ }
        }

        return new Promise((resolve) => {
            try {
                const { domains, duration = 3 } = params;
                // Ensure domains are unique and filtered
                const uniqueDomains = Array.from(new Set(domains)).filter(Boolean);
                
                activeTool = new Tool(uniqueDomains, duration);

                activeTool.run((progress: any) => {
                    if (!sender.isDestroyed()) {
                        sender.send('network-diagnosis-progress', progress);
                    }
                }).then((report: any) => {
                    activeTool = null;
                    resolve(report);
                }).catch((err: any) => {
                    activeTool = null;
                    new Logger('NetworkService').error('Diagnosis execution error:', err);
                    resolve({ error: err.message || String(err) });
                });
            } catch (err: any) {
                activeTool = null;
                new Logger('NetworkService').error('Tool instantiation error:', err);
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
  new Logger('NetworkService').info('NetworkService IPC handlers registered successfully.');
}

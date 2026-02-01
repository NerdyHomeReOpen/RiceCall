/* eslint-disable @typescript-eslint/no-explicit-any */
import type { IpcMain } from 'electron';
import type { HandlerContext, HandlerRegistration } from './types';

/**
 * Universal IPC Router interface mimicking Electron's ipcMain.
 */
export interface IpcRouter {
  on(channel: string, listener: (event: any, ...args: any[]) => void): void;
  handle(channel: string, listener: (event: any, ...args: any[]) => Promise<any>): void;
}

// ----------------------------------------------------------------------
// Electron Implementation
// ----------------------------------------------------------------------

export class ElectronIpcRouter implements IpcRouter {
  constructor(private ipcMain: IpcMain) {}

  on(channel: string, listener: (event: any, ...args: any[]) => void): void {
    this.ipcMain.on(channel, listener);
  }

  handle(channel: string, listener: (event: any, ...args: any[]) => Promise<any>): void {
    this.ipcMain.handle(channel, listener);
  }
}

// ----------------------------------------------------------------------
// Web Implementation
// ----------------------------------------------------------------------

export class WebIpcRouter implements IpcRouter {
  private registration: HandlerRegistration = {
    sync: {},
    async: {},
    send: {},
  };

  /**
   * Adapts a shared registration function to the Web IPC model.
   */
  public createWebHandlers(
    registrar: (ipc: IpcRouter, storage: any, broadcast: any, getSettings: any) => void
  ): HandlerRegistration {
    
    const recordingRouter: IpcRouter = {
      on: (channel, listener) => {
        const webHandler = (ctx: HandlerContext, ...args: any[]) => {
          const event = { returnValue: undefined };
          // Note: We need to pass these to the listener if we want them available
          // But our shared handlers use the ones from the registrar closure.
          // So we must satisfy the registrar's arguments.
          
          listener(event, ...args);
          return event.returnValue;
        };
        this.registration.sync![channel] = webHandler;
        this.registration.send![channel] = webHandler;
      },
      handle: (channel, listener) => {
        this.registration.async![channel] = async (ctx: HandlerContext, ...args: any[]) => {
          return await listener({}, ...args);
        };
      }
    };

    // To make the registrar's closure-bound storage/broadcast work,
    // we use a "Proxy" that always looks up the current context of the handler.
    // However, since Web IPC handlers are executed one by one, we can use a simpler approach.
    
    let activeCtx: HandlerContext | null = null;

    const proxyStorage = {
      get: (key: string) => activeCtx?.storage.get(key),
      set: (key: string, val: any) => activeCtx?.storage.set(key, val),
      delete: (key: string) => activeCtx?.storage.delete(key),
    };

    const proxyBroadcast = (ch: string, val: any) => activeCtx?.broadcast(ch, val);
    
    const proxyGetSettings = () => {
      if (!activeCtx) return {};
      return (this.registration.sync as any)['get-system-settings']?.(activeCtx);
    };

    // Register all channels
    registrar(recordingRouter, proxyStorage, proxyBroadcast, proxyGetSettings);

    // Wrap all registered handlers to set the activeCtx
    const wrap = (handlers: any) => {
      if (!handlers) return;
      for (const ch of Object.keys(handlers)) {
        const original = handlers[ch];
        handlers[ch] = (ctx: HandlerContext, ...args: any[]) => {
          activeCtx = ctx;
          try {
            return original(ctx, ...args);
          } finally {
            // We don't clear it immediately to avoid issues with sync return,
            // but in Web, the next handler will overwrite it anyway.
          }
        };
      }
    };

    wrap(this.registration.sync);
    wrap(this.registration.send);
    wrap(this.registration.async);

    return this.registration;
  }

  on() {}
  handle() {}
  getRegistration() { return this.registration; }
}

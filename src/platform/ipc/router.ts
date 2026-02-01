/* eslint-disable @typescript-eslint/no-explicit-any */
import type { IpcMain } from 'electron';
import type { HandlerContext, HandlerRegistration } from './types';

/**
 * Universal IPC Router interface mimicking Electron's ipcMain.
 * Allows writing shared IPC logic that works on both Web and Electron.
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
   * 
   * This is the bridge that allows Electron-style code:
   *   ipc.on('ch', (event, val) => { storage.set(key, val); broadcast('ch', val); })
   * To work with Web-style handlers:
   *   (ctx, val) => { ctx.storage.set(key, val); ctx.broadcast('ch', val); }
   */
  public createWebHandlers(
    registrar: (ipc: IpcRouter, storage: any, broadcast: any, getSettings: any) => void
  ): HandlerRegistration {
    
    // We create a "Recording Router" that captures the calls to .on()
    const recordingRouter: IpcRouter = {
      on: (channel, listener) => {
        // Create a Web Handler that adapts (ctx, ...args) to (event, ...args)
        const webHandler = (ctx: HandlerContext, ...args: any[]) => {
          // Mock Electron Event
          const event = { returnValue: undefined };
          
          // Execute the listener, but we need to satisfy the 'storage' and 'broadcast'
          // dependencies that were passed to the registrar.
          // This is handled by the closure in registrar call below.
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

    // This is the magic part:
    // We call the registrar, providing "Dynamic Adapters" for storage and broadcast.
    // These adapters use a global pointer or a shared state to find the current 'ctx'.
    
    let currentCtx: HandlerContext | null = null;

    const dynamicStorage = {
      get: (key: string) => currentCtx?.storage.get(key),
      set: (key: string, val: any) => currentCtx?.storage.set(key, val),
    };

    const dynamicBroadcast = (channel: string, val: any) => currentCtx?.broadcast(channel, val);
    
    const dynamicGetSettings = () => {
      // In Web mode, get-system-settings logic usually lives here
      // Let's implement it by reading all keys from currentCtx
      if (!currentCtx) return {};
      // This part might need to be more specific depending on the needs
      return (this.registration.sync as any)['get-system-settings']?.(currentCtx);
    };

    // Wrap the listeners to capture the context
    const originalOn = recordingRouter.on;
    recordingRouter.on = (channel, listener) => {
      const wrappedListener = (event: any, ...args: any[]) => {
        currentCtx = (recordingRouter as any)._lastCtx; // Set pointer
        listener(event, ...args);
        currentCtx = null; // Clear
      };
      originalOn(channel, wrappedListener);
    };

    // Execute the registrar once to record all handlers
    registrar(recordingRouter, dynamicStorage, dynamicBroadcast, dynamicGetSettings);

    // Now wrap the generated registration to inject the ctx
    const wrap = (handlers: any) => {
      if (!handlers) return;
      for (const ch of Object.keys(handlers)) {
        const original = handlers[ch];
        handlers[ch] = (ctx: HandlerContext, ...args: any[]) => {
          (recordingRouter as any)._lastCtx = ctx;
          return original(ctx, ...args);
        };
      }
    };

    wrap(this.registration.sync);
    wrap(this.registration.send);
    wrap(this.registration.async);

    return this.registration;
  }

  // Not used directly in this new flow, but kept for interface completeness
  on() {}
  handle() {}
  getRegistration() { return this.registration; }
}
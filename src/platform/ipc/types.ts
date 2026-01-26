/**
 * Type definitions for IPC abstraction layer.
 * Allows same handler definitions to work on both Electron and Web.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Handler function type - same signature for both platforms.
 * First argument is always the event (ignored in web), rest are the actual args.
 */
export type IpcHandler = (...args: any[]) => any;

/**
 * Handler map - channel name to handler function.
 */
export type IpcHandlerMap = Record<string, IpcHandler>;

/**
 * Sync handler that returns value immediately.
 */
export type IpcSyncHandler = (...args: any[]) => any;

/**
 * Async handler that returns a promise.
 */
export type IpcAsyncHandler = (...args: any[]) => Promise<any>;

/**
 * Handler registration options.
 */
export interface HandlerRegistration {
  /** Handlers for ipcMain.on (sync, uses event.returnValue) */
  sync?: IpcHandlerMap;
  /** Handlers for ipcMain.handle (async, returns promise) */
  async?: IpcHandlerMap;
  /** Handlers for ipcMain.on that don't return value (fire and forget) */
  send?: IpcHandlerMap;
}

/**
 * Abstract IpcRenderer interface.
 * Both Electron's real ipcRenderer and Web's fake one implement this.
 */
export interface IpcRenderer {
  /**
   * Send a message (fire and forget).
   */
  send(channel: string, ...args: any[]): void;

  /**
   * Send a message and get synchronous response.
   */
  sendSync(channel: string, ...args: any[]): any;

  /**
   * Send a message and get async response.
   */
  invoke(channel: string, ...args: any[]): Promise<any>;

  /**
   * Listen for messages from main process.
   */
  on(channel: string, listener: (event: any, ...args: any[]) => void): void;

  /**
   * Remove a listener.
   */
  removeListener(channel: string, listener: (...args: any[]) => void): void;

  /**
   * Remove all listeners for a channel.
   */
  removeAllListeners(channel: string): void;
}

/**
 * Storage interface for handlers that need persistence.
 * Electron uses electron-store, Web uses localStorage.
 */
export interface IpcStorage {
  get<T>(key: string): T | undefined;
  get<T>(key: string, defaultValue: T): T;
  set<T>(key: string, value: T): void;
  delete(key: string): void;
}

/**
 * Context passed to handlers - provides platform-specific dependencies.
 */
export interface HandlerContext {
  /** Storage for persistent data */
  storage: IpcStorage;
  /** API client for HTTP requests */
  api: {
    get<T>(endpoint: string): Promise<T | null>;
    post<T>(endpoint: string, data?: unknown): Promise<T | null>;
  };
  /** Broadcast to all listeners (windows in Electron, tabs in Web) */
  broadcast: (channel: string, ...args: any[]) => void;
}

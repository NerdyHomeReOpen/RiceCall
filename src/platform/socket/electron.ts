/**
 * Electron Socket Implementation
 * 
 * Uses IPC to communicate with main process which manages the actual socket connection.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import type * as Types from '@/types';
import type { SocketClient } from './types';
import type { IpcRenderer } from '@/platform/ipc';

export function createElectronSocketClient(getIpc: () => IpcRenderer): SocketClient {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    connect(_token: string): void {
      // Electron manages socket connection in main process
      // Token is handled through auth flow
    },

    disconnect(): void {
      // Electron manages socket disconnection in main process
    },

    send<T extends keyof Types.ClientToServerEvents>(
      event: T,
      ...args: Parameters<Types.ClientToServerEvents[T]>
    ): void {
      getIpc().send(event, ...args);
    },

    on<T extends keyof Types.ServerToClientEvents>(
      event: T,
      callback: (...args: Parameters<Types.ServerToClientEvents[T]>) => ReturnType<Types.ServerToClientEvents[T]>
    ): () => void {
      const listener = (_: any, ...args: Parameters<Types.ServerToClientEvents[T]>) => callback(...args);
      getIpc().on(event, listener);
      return () => getIpc().removeListener(event, listener);
    },

    emit<T extends keyof Types.ClientToServerEventsWithAck>(
      event: T,
      payload: Parameters<Types.ClientToServerEventsWithAck[T]>[0]
    ): Promise<ReturnType<Types.ClientToServerEventsWithAck[T]>> {
      return new Promise((resolve, reject) => {
        getIpc().invoke(event, payload).then((ack: Types.ACK<ReturnType<Types.ClientToServerEventsWithAck[T]>>) => {
          if (ack?.ok) resolve(ack.data);
          else reject(new Error(ack?.error || 'unknown error'));
        });
      });
    },
  };
}

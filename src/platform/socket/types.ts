/**
 * Platform Socket Types
 * 
 * Unified socket interface for both Electron and Web platforms.
 */

import type * as Types from '@/types';

export interface SocketClient {
  /**
   * Connect to the server with the given token
   */
  connect(token: string): void;

  /**
   * Disconnect from the server
   */
  disconnect(): void;

  /**
   * Send an event to the server (fire and forget)
   */
  send<T extends keyof Types.ClientToServerEvents>(
    event: T,
    ...args: Parameters<Types.ClientToServerEvents[T]>
  ): void;

  /**
   * Listen for an event from the server
   * Returns an unsubscribe function
   */
  on<T extends keyof Types.ServerToClientEvents>(
    event: T,
    callback: (...args: Parameters<Types.ServerToClientEvents[T]>) => ReturnType<Types.ServerToClientEvents[T]>
  ): () => void;

  /**
   * Emit an event to the server and wait for acknowledgment
   */
  emit<T extends keyof Types.ClientToServerEventsWithAck>(
    event: T,
    payload: Parameters<Types.ClientToServerEventsWithAck[T]>[0]
  ): Promise<ReturnType<Types.ClientToServerEventsWithAck[T]>>;
}

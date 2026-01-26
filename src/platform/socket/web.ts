/**
 * Web Socket Implementation
 * 
 * Uses socket.io-client directly in the renderer process.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import type * as Types from '@/types';
import type { SocketClient } from './types';
import { io as webIo, type Socket as WebSocketIO } from 'socket.io-client';

let webSocket: WebSocketIO | null = null;
let webSeq = 0;
let webHeartbeatInterval: number | null = null;

export function createWebSocketClient(): SocketClient {
  return {
    connect(token: string): void {
      if (!token) return;

      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!wsUrl) {
        console.warn('[Socket] Missing NEXT_PUBLIC_WS_URL for web socket connection');
        return;
      }

      // Clean up existing
      try {
        webSocket?.removeAllListeners();
        webSocket?.disconnect();
      } catch {
        // ignore
      }
      webSocket = null;
      webSeq = 0;

      webSocket = webIo(wsUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 20000,
        timeout: 10000,
        autoConnect: false,
        query: { token },
      });

      const sendHeartbeat = () => {
        webSocket?.timeout(5000).emit('heartbeat', { seq: ++webSeq }, () => {});
      };

      webSocket.on('connect', () => {
        if (webHeartbeatInterval) window.clearInterval(webHeartbeatInterval);
        sendHeartbeat();
        webHeartbeatInterval = window.setInterval(sendHeartbeat, 30000);
      });

      webSocket.on('disconnect', () => {
        if (webHeartbeatInterval) window.clearInterval(webHeartbeatInterval);
        webHeartbeatInterval = null;
      });

      webSocket.connect();
    },

    disconnect(): void {
      try {
        webSocket?.removeAllListeners();
        webSocket?.disconnect();
      } finally {
        webSocket = null;
        if (webHeartbeatInterval) window.clearInterval(webHeartbeatInterval);
        webHeartbeatInterval = null;
      }
    },

    send<T extends keyof Types.ClientToServerEvents>(
      event: T,
      ...args: Parameters<Types.ClientToServerEvents[T]>
    ): void {
      webSocket?.emit(event, ...args);
    },

    on<T extends keyof Types.ServerToClientEvents>(
      event: T,
      callback: (...args: Parameters<Types.ServerToClientEvents[T]>) => ReturnType<Types.ServerToClientEvents[T]>
    ): () => void {
      if (!webSocket) return () => {};
      const listener = (...args: Parameters<Types.ServerToClientEvents[T]>) => callback(...args);
      webSocket.on(event as string, listener as any);
      return () => webSocket?.off(event as string, listener as any);
    },

    emit<T extends keyof Types.ClientToServerEventsWithAck>(
      event: T,
      payload: Parameters<Types.ClientToServerEventsWithAck[T]>[0]
    ): Promise<ReturnType<Types.ClientToServerEventsWithAck[T]>> {
      if (!webSocket) return Promise.reject(new Error('socket not connected'));
      return new Promise((resolve, reject) => {
        webSocket!.timeout(5000).emit(event as string, payload, (err: unknown, ack: Types.ACK<ReturnType<Types.ClientToServerEventsWithAck[T]>>) => {
          if (err) return reject(err);
          if (ack?.ok) return resolve(ack.data);
          reject(new Error(ack?.error || 'unknown error'));
        });
      });
    },
  };
}

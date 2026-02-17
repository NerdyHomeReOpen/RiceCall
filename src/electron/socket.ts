import { ipcMain } from 'electron';
import { io, Socket } from 'socket.io-client';

import * as Types from '@/types';

import { broadcast } from '@/electron/main';

import { NO_LOG_ON_EVENTS, ON_EVENTS, SEND_EVENTS, EMIT_EVENTS } from '@/configs/socket';

import { getEnv } from '@/env';
import Logger from '@/logger';

// Socket
export let socket: Socket | null = null;
export let seq: number = 0;
export let interval: NodeJS.Timeout | null = null;

async function emitWithRetry<T>(event: string, payload: unknown, retries = 10): Promise<Types.ACK<T>> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await new Promise<Types.ACK<T>>((resolve, reject) => {
        socket?.timeout(5000).emit(event, payload, (e: unknown, ack: Types.ACK<T>) => {
          if (e) reject(e);
          else resolve(ack);
        });
      });
    } catch (e) {
      if (i === retries) throw e;
      new Logger('Socket').warn(`Retrying(#${i}) socket.emit ${event}: ${JSON.stringify(payload)}`);
    }
  }
  throw new Error('Failed to emit event with retry');
}

function sendHeartbeat() {
  const start = Date.now();
  socket?.timeout(5000).emit('heartbeat', { seq: ++seq }, (e: unknown, ack: { seq: number; t: number }) => {
    if (e) {
      new Logger('Socket').warn(`Heartbeat ${seq} timeout`);
    } else {
      const latency = Date.now() - start;
      new Logger('Socket').info(`ACK for #${ack.seq} in ${latency} ms`);
      broadcast('heartbeat', { seq: ack.seq, latency });
    }
  });
}

export function connectSocket(token: string) {
  if (!token) return;

  if (socket) disconnectSocket();

  seq = 0;

  socket = io(getEnv().WS_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 20000,
    timeout: 10000,
    autoConnect: false,
    query: { token: token },
  });

  socket.on('connect', () => {
    for (const event of ON_EVENTS) {
      ipcMain.removeAllListeners(event);
    }

    for (const event of SEND_EVENTS) {
      socket?.removeAllListeners(event);
    }

    // Register event listeners
    EMIT_EVENTS.forEach((event) => {
      ipcMain.handle(event, (_, payload) => {
        new Logger('Socket').info(`socket.emit ${event}: ${JSON.stringify(payload)}`);
        return new Promise((resolve) => {
          emitWithRetry(event, payload)
            .then((ack) => {
              new Logger('Socket').info(`socket.onAck ${event}: ${JSON.stringify(ack)}`);
              resolve(ack);
            })
            .catch((e) => {
              const error = e instanceof Error ? e : new Error('Unknown error');
              new Logger('Socket').error(`socket.emit ${event} error: ${error.message}`);
              resolve({ ok: false, error: error.message });
            });
        });
      });
    });

    ON_EVENTS.forEach((event) => {
      ipcMain.on(event, (_, ...args) => {
        new Logger('Socket').info(`socket.emit ${event}: ${JSON.stringify(args)}`);
        socket?.emit(event, ...args);
      });
    });

    SEND_EVENTS.forEach((event) => {
      socket?.on(event, (...args: unknown[]) => {
        if (!NO_LOG_ON_EVENTS.includes(event)) new Logger('Socket').info(`socket.on ${event}: ${JSON.stringify(args)}`);
        broadcast(event, ...args);
      });
    });

    sendHeartbeat();
    if (interval) clearInterval(interval);
    interval = setInterval(sendHeartbeat, 30000);

    new Logger('Socket').info(`Socket connected`);

    broadcast('connect', null);
  });

  socket.on('disconnect', (reason) => {
    // Clean up event listeners
    for (const event of EMIT_EVENTS) {
      ipcMain.removeHandler(event);
    }

    for (const event of ON_EVENTS) {
      ipcMain.removeAllListeners(event);
    }

    for (const event of SEND_EVENTS) {
      socket?.removeAllListeners(event);
    }

    if (interval) clearInterval(interval);

    new Logger('Socket').info(`Socket disconnected, reason: ${reason}`);

    broadcast('disconnect', reason);
  });

  socket.on('connect_error', (e) => {
    const error = e instanceof Error ? e : new Error('Unknown error');
    new Logger('Socket').error(`Socket connect error: ${error.message}`);

    broadcast('connect_error', e);
  });

  socket.on('reconnect', (attemptNumber) => {
    new Logger('Socket').info(`Socket reconnected, attempt number: ${attemptNumber}`);

    broadcast('reconnect', attemptNumber);
  });

  socket.on('reconnect_error', (e) => {
    const error = e instanceof Error ? e : new Error('Unknown error');
    new Logger('Socket').error(`Socket reconnect error: ${error.message}`);

    broadcast('reconnect_error', e);
  });

  socket.connect();
}

export function disconnectSocket() {
  if (!socket) return;

  socket.emit('disconnectUser');

  for (const event of ON_EVENTS) {
    ipcMain.removeAllListeners(event);
  }

  for (const event of SEND_EVENTS) {
    socket?.removeAllListeners(event);
  }

  socket.disconnect();
  socket = null;
}

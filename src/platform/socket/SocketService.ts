/**
 * Shared Socket Service Logic
 * Handles connection, heartbeat, retries, and event routing.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { io, Socket } from 'socket.io-client';
import * as Types from '@/types';
import { 
  ClientToServerEventNames, 
  ClientToServerEventWithAckNames, 
  ServerToClientEventNames,
  noLogEventSet
} from './constants';

export interface SocketPlatformBridge {
  onUIMessage(callback: (event: string, ...args: any[]) => void): void;
  onUIInvoke(callback: (event: string, payload: any) => Promise<any>): void;
  sendToUI(event: string, ...args: any[]): void;
  log(level: 'info' | 'warn' | 'error', message: string): void;
}

export class SocketService {
  private socket: Socket | null = null;
  private seq = 0;
  private heartbeatInterval: any = null;

  constructor(
    private bridge: SocketPlatformBridge,
    private getWsUrl: () => string
  ) {
    this.setupUIBridge();
  }

  public connect(token: string) {
    if (!token) return;
    if (this.socket) this.disconnect();

    const wsUrl = this.getWsUrl();
    this.seq = 0;
    this.bridge.log('info', `Connecting to Socket Server: ${wsUrl}`);

    this.socket = io(wsUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 20000,
      timeout: 10000,
      autoConnect: false,
      query: { token },
    });

    this.setupSocketListeners();
    
    this.socket.connect();
  }

  public disconnect() {
    if (!this.socket) return;
    
    this.socket.emit('disconnectUser');
    this.socket.disconnect();
    this.socket = null;

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    this.bridge.log('info', 'Socket disconnected manually');
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.bridge.log('info', 'Socket connected to server');
      this.startHeartbeat();
      this.bridge.sendToUI('connect', null);
    });

    this.socket.on('disconnect', (reason) => {
      this.bridge.log('info', `Socket disconnected from server, reason: ${reason}`);
      if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
      this.bridge.sendToUI('disconnect', reason);
    });

    this.socket.on('connect_error', (err) => {
      this.bridge.log('error', `Socket connection error: ${err.message}`);
      this.bridge.sendToUI('connect_error', err.message);
    });

    // Forward all server events to UI
    for (const event of ServerToClientEventNames) {
      this.socket.on(event, (...args: any[]) => {
        if (!noLogEventSet.has(event)) {
          this.bridge.log('info', `Server -> Socket: ${event} ${JSON.stringify(args)}`);
        }
        this.bridge.sendToUI(event, ...args);
      });
    }
  }

  private setupUIBridge() {
    // Listen for UI -> Server messages
    this.bridge.onUIMessage((event, ...args) => {
      if (ClientToServerEventNames.includes(event)) {
        this.bridge.log('info', `UI -> Server: ${event} ${JSON.stringify(args)}`);
        this.socket?.emit(event, ...args);
      }
    });

    // Listen for UI -> Server invokes (with ACK)
    this.bridge.onUIInvoke(async (event, payload) => {
      if (ClientToServerEventWithAckNames.includes(event)) {
        this.bridge.log('info', `UI -> Server (Invoke): ${event} ${JSON.stringify(payload)}`);
        return this.emitWithRetry(event, payload);
      }
      return { ok: false, error: 'Unknown invoke event' };
    });
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    
    const sendHeartbeat = () => {
      const start = Date.now();
      this.socket?.timeout(5000).emit('heartbeat', { seq: ++this.seq }, (err: any, ack: any) => {
        if (err) {
          this.bridge.log('warn', `Heartbeat #${this.seq} timeout`);
        } else {
          const latency = Date.now() - start;
          this.bridge.sendToUI('heartbeat', { seq: ack.seq, latency });
        }
      });
    };

    sendHeartbeat();
    this.heartbeatInterval = setInterval(sendHeartbeat, 30000);
  }

  private async emitWithRetry<T>(event: string, payload: any, retries = 5): Promise<T> {
    for (let i = 0; i <= retries; i++) {
      try {
        const ack = await new Promise<Types.ACK<T>>((resolve, reject) => {
          if (!this.socket) return reject(new Error('Socket not initialized'));
          this.socket.timeout(5000).emit(event, payload, (err: any, ack: Types.ACK<T>) => {
            if (err) reject(err);
            else resolve(ack);
          });
        });

        if (ack.ok) return ack.data;
        throw new Error(ack.error || 'Request failed');
      } catch (err: any) {
        if (i === retries) {
          this.bridge.log('error', `Failed to emit ${event} after ${retries} retries: ${err.message}`);
          throw err;
        }
        this.bridge.log('warn', `Retrying (#${i+1}) ${event}...`);
      }
    }
    throw new Error('Retry failed');
  }
}

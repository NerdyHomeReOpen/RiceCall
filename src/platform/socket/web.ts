/* eslint-disable @typescript-eslint/no-explicit-any */
import { getIpcRenderer, isElectron } from '@/platform/ipc';
import { SocketService, SocketPlatformBridge } from './SocketService';
import { ClientToServerEventNames } from './constants';

// Bridge implementation for Web (Renderer Process)
const webBridge: SocketPlatformBridge = {
  onUIMessage(callback) {
    const ipc = getIpcRenderer() as any;
    if (ipc.__bridgeInitialized) return;
    ipc.__bridgeInitialized = true;
    
    ipc.onBroadcast((channel: string, event: any, ...args: any[]) => {
      console.log(`[DEBUG.SocketBridge] Received broadcast: channel=${channel}, isRemote=${event?.isRemote}, _isSystemSending=${ipc._isSystemSending}`);
      
      // event is { isRemote: boolean }
      // Filter out messages from other tabs or server-pushed events
      if (event?.isRemote || ipc._isSystemSending) {
        console.log(`[DEBUG.SocketBridge] Skipping broadcast: reason=${event?.isRemote ? 'remote' : 'system'}`);
        return;
      }
      
      if (ClientToServerEventNames.includes(channel)) {
        console.log(`[DEBUG.SocketBridge] Forwarding to Server: channel=${channel}`, args);
        callback(channel, ...args);
      } else {
        console.log(`[DEBUG.SocketBridge] Not a server event: channel=${channel}`);
      }      
    });
  },

  onUIInvoke(callback) {
    const ipc = getIpcRenderer() as any;
    if (ipc.__invokeWrapped) return;
    ipc.__invokeWrapped = true;

    const originalInvoke = ipc.invoke.bind(ipc);
    ipc.invoke = async (channel: string, ...args: any[]) => {
      const isSocketEvent = [
        'SFUCreateTransport', 'SFUConnectTransport', 'SFUCreateProducer', 
        'SFUCreateConsumer', 'SFUJoin', 'SFULeave'
      ].includes(channel);

      if (isSocketEvent) {
        try {
          const data = await callback(channel, args[0]);
          return { ok: true, data };
        } catch (err: any) {
          return { ok: false, error: err.message };
        }
      }
      return originalInvoke(channel, ...args);
    };
  },

  sendToUI(event, ...args) {
    // Use systemSend to mark as server-pushed and avoid loop
    (getIpcRenderer() as any).systemSend(event, ...args);
  },

  log(level, message) {
    console[level](`[Socket.${level.toUpperCase()}] ${message}`);
  }
};

const service = isElectron() ? null : new SocketService(webBridge, () => process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '');

export function createWebSocketClient() {
  return {
    connect(token: string) {
      service?.connect(token);
    },
    disconnect() {
      service?.disconnect();
    },
    send(event: string, ...args: any[]) {
      getIpcRenderer().send(event, ...args);
    },
    on(event: string, callback: (...args: any[]) => void) {
      const ipc = getIpcRenderer();
      const listener = (_: any, ...args: any[]) => callback(...args);
      ipc.on(event, listener);
      return () => ipc.removeListener(event, listener);
    },
    emit(event: string, payload: any) {
      return getIpcRenderer().invoke(event, payload).then((ack: any) => {
        if (ack && typeof ack === 'object' && 'ok' in ack) {
          if (ack.ok) return ack.data;
          throw new Error(ack.error || 'unknown error');
        }
        return ack;
      });
    }
  };
}

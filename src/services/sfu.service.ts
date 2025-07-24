let sfuSocket: WebSocket | null = null;

type Listener = (data: any) => void;

const listeners: Record<string, Listener[]> = {};

export const sfuService = {
  connect(url: string) {
    if (sfuSocket) return;

    sfuSocket = new WebSocket(url);

    sfuSocket.onopen = () => {
      console.info('[SFU] Connected');
    };

    sfuSocket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      const { action } = msg;
      if (listeners[action]) {
        listeners[action].forEach((cb) => cb(msg));
      }
    };

    sfuSocket.onclose = () => {
      console.warn('[SFU] Disconnected');
      sfuSocket = null;
    };

    sfuSocket.onerror = (err) => {
      console.error('[SFU] Error:', err);
    };
  },

  send(data: any) {
    if (sfuSocket?.readyState === WebSocket.OPEN) {
      sfuSocket.send(JSON.stringify(data));
    } else {
      console.warn('[SFU] Socket not open');
    }
  },

  on(action: string, callback: Listener) {
    if (!listeners[action]) {
      listeners[action] = [];
    }
    listeners[action].push(callback);

    // Retornamos función para eliminar este listener
    return () => {
      listeners[action] = listeners[action].filter((cb) => cb !== callback);
    };
  },
  off(action: string, callback: Listener) {
    if (!listeners[action]) return;
    listeners[action] = listeners[action].filter(cb => cb !== callback);
    if (listeners[action].length === 0) {
        delete listeners[action];
    }
  },
  disconnect() {
    if (sfuSocket) {
      sfuSocket.close();
      sfuSocket = null;
    }
  },
  isConnected() {
    return sfuSocket?.readyState === WebSocket.OPEN;
  },
};

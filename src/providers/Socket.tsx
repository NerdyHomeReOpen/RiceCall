/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';

// Types
import { SocketServerEvent, SocketClientEvent } from '@/types';

// Services
import ipcService from '@/services/ipc.service';

// Utils
import StandardizedError, { errorHandler } from '@/utils/errorHandler';

type SocketContextType = {
  send: Record<SocketClientEvent, (...args: any[]) => void>;
  on: Record<
    SocketServerEvent,
    (callback: (...args: any[]) => void) => () => void
  >;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context || !context.on || !context.send)
    throw new Error('useSocket must be used within a SocketProvider');
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

const SocketProvider = ({ children }: SocketProviderProps) => {
  // States
  const [on, setOn] = useState<SocketContextType['on']>(
    {} as SocketContextType['on'],
  );
  const [send, setSend] = useState<SocketContextType['send']>(
    {} as SocketContextType['send'],
  );

  // Refs
  const cleanupRef = useRef<(() => void)[]>([]);

  // States
  const [isConnected, setIsConnected] = useState(false);

  // Handlers
  const handleConnect = () => {
    console.info('Socket connected');
    setIsConnected(true);
  };

  const handleDisconnect = () => {
    console.info('Socket disconnected');
    setIsConnected(false);
  };

  const handleReconnect = (attemptNumber: number) => {
    console.info('Socket reconnecting, attempt number:', attemptNumber);
  };

  const handleError = (error: any) => {
    error = new StandardizedError({
      name: 'Error',
      message: error.message,
      part: 'SOCKET',
      tag: 'ERROR',
      statusCode: 500,
    });
    new errorHandler(error).show();
  };

  const handleConnectError = (error: any) => {
    error = new StandardizedError({
      name: 'ConnectError',
      message: '連線失敗，正在嘗試重新連線，按下確定後將自動登出',
      part: 'SOCKET',
      tag: 'CONNECT_ERROR',
      statusCode: 500,
      handler: () => ipcService.auth.logout(),
    });
    new errorHandler(error).show();
  };

  const handleReconnectError = (error: any) => {
    error = new StandardizedError({
      name: 'ReconnectError',
      message: '重新連線失敗，按下確定後將自動登出',
      part: 'SOCKET',
      tag: 'RECONNECT_ERROR',
      statusCode: 500,
      handler: () => ipcService.auth.logout(),
    });
    new errorHandler(error).show();
  };

  // Effects
  useEffect(() => {
    console.info('SocketProvider initialization');

    setOn(
      Object.values(SocketServerEvent).reduce((acc, event) => {
        acc[event] = (callback: (...args: any[]) => void) =>
          ipcService.socket.on(event, callback);
        return acc;
      }, {} as SocketContextType['on']),
    );

    setSend(
      Object.values(SocketClientEvent).reduce((acc, event) => {
        acc[event] = (...args: any[]) => ipcService.socket.send(event, ...args);
        return acc;
      }, {} as SocketContextType['send']),
    );

    cleanupRef.current.push(
      ipcService.socket.on('connect', handleConnect),
      ipcService.socket.on('reconnect', handleReconnect),
      ipcService.socket.on('disconnect', handleDisconnect),
      ipcService.socket.on('error', handleError),
      ipcService.socket.on('connect_error', handleConnectError),
      ipcService.socket.on('reconnect_error', handleReconnectError),
    );

    return () => {
      cleanupRef.current.forEach((cleanup) => cleanup());
      cleanupRef.current = [];
    };
  }, []);

  return (
    <SocketContext.Provider value={{ on, send, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

SocketProvider.displayName = 'SocketProvider';

export default SocketProvider;

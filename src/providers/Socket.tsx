/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';

// Types
import { SocketServerEvent, SocketClientEvent } from '@/types';

// Services
import ipcService from '@/services/ipc.service';
import { errorHandler } from '@/utils/errorHandler';
import { StandardizedError } from '@/utils/errorHandler';
import { useLanguage } from './Language';

type SocketContextType = {
  send: Record<SocketClientEvent, (data: any) => () => void>;
  on: Record<SocketServerEvent, (callback: (data: any) => void) => () => void>;
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
  // Language
  const lang = useLanguage();

  // States
  const [on, setOn] = useState<SocketContextType['on']>(
    Object.values(SocketServerEvent).reduce((acc, event) => {
      acc[event] = (callback: (data: any) => void) => {
        ipcService.onSocketEvent(event, callback);
        return () => ipcService.removeListener(event);
      };
      return acc;
    }, {} as SocketContextType['on']),
  );
  const [send, setSend] = useState<SocketContextType['send']>(
    Object.values(SocketClientEvent).reduce((acc, event) => {
      acc[event] = (data: any) => {
        ipcService.sendSocketEvent(event, data);
        return () => {};
      };
      return acc;
    }, {} as SocketContextType['send']),
  );

  // Refs
  const cleanupRef = useRef<(() => void)[]>([]);

  // States
  const [isConnected, setIsConnected] = useState(false);

  // Handlers
  const handleConnect = () => {
    console.log('Socket connected');
    setIsConnected(true);
  };

  const handleDisconnect = () => {
    console.log('Socket disconnected');
    setIsConnected(false);
  };

  const handleConnectError = (error: any) => {
    console.log('Socket connection error', error);
    setIsConnected(false);
  };

  const handleReconnect = (attemptNumber: number) => {
    console.log('Socket reconnected', attemptNumber);
    setIsConnected(true);
  };

  const handleReconnectError = (error: any) => {
    console.log('Socket reconnected error', error);
    setIsConnected(false);
  };

  const handleError = (error: StandardizedError) => {
    console.log('Socket error', error);
    new errorHandler(error).show();
  };

  const handleOpenPopup = (data: any) => {
    console.log('Socket open popup', data);
    const { popupType } = data;
    ipcService.popup.open(popupType);
    ipcService.initialData.onRequest(popupType, {
      iconType: 'danger',
      title: (lang.tr as unknown as Record<string, string>)[popupType],
      submitTo: popupType,
    });
  };

  // Effects
  useEffect(() => {
    console.log('SocketProvider initialization');

    cleanupRef.current = Object.values(SocketServerEvent).reduce(
      (acc, event) => {
        acc.push(() => ipcService.removeListener(event));
        return acc;
      },
      [] as (() => void)[],
    );

    cleanupRef.current.push(() => {
      ipcService.onSocketEvent('connect', handleConnect);
      ipcService.onSocketEvent('connect_error', handleConnectError);
      ipcService.onSocketEvent('reconnect', handleReconnect);
      ipcService.onSocketEvent('reconnect_error', handleReconnectError);
      ipcService.onSocketEvent('disconnect', handleDisconnect);
      ipcService.onSocketEvent('error', handleError);
      ipcService.onSocketEvent('openPopup', handleOpenPopup);
    });

    setOn(
      Object.values(SocketServerEvent).reduce((acc, event) => {
        acc[event] = (callback: (data: any) => void) => {
          ipcService.onSocketEvent(event, callback);
          return () => ipcService.removeListener(event);
        };
        return acc;
      }, {} as SocketContextType['on']),
    );

    setSend(
      Object.values(SocketClientEvent).reduce((acc, event) => {
        acc[event] = (data: any) => {
          ipcService.sendSocketEvent(event, data);
          return () => {};
        };
        return acc;
      }, {} as SocketContextType['send']),
    );

    ipcService.onSocketEvent('connect', handleConnect);
    ipcService.onSocketEvent('connect_error', handleConnectError);
    ipcService.onSocketEvent('reconnect', handleReconnect);
    ipcService.onSocketEvent('reconnect_error', handleReconnectError);
    ipcService.onSocketEvent('disconnect', handleDisconnect);
    ipcService.onSocketEvent('error', handleError);
    ipcService.onSocketEvent('openPopup', handleOpenPopup);

    return () => {
      console.log('SocketProvider cleanup');
      ipcService.removeListener('connect');
      ipcService.removeListener('connect_error');
      ipcService.removeListener('reconnect');
      ipcService.removeListener('reconnect_error');
      ipcService.removeListener('disconnect');
      ipcService.removeListener('error');
      ipcService.removeListener('openPopup');
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

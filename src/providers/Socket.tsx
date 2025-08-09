/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';

// Services
import ipcService from '@/services/ipc.service';

// Utils
import ErrorHandler from '@/utils/error';

// Providers
import { useTranslation } from 'react-i18next';

type SocketContextType = {
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

const SocketProvider = ({ children }: SocketProviderProps) => {
  // Hooks
  const { t } = useTranslation();

  // Refs
  const tRef = useRef(t);

  // States
  const [isConnected, setIsConnected] = useState(false);

  // Handlers
  const handleConnect = () => {
    console.info('[Socket] connected');
    ipcService.popup.close('errorDialog');
    setIsConnected(true);
  };

  const handleDisconnect = () => {
    console.info('[Socket] disconnected');
    setIsConnected(false);
  };

  const handleReconnect = (attemptNumber: number) => {
    console.info('[Socket] reconnecting, attempt number:', attemptNumber);
  };

  const handleError = (message: string) => {
    console.error('[Socket] error:', message);
    new ErrorHandler(new Error(message)).show();
  };

  const handleConnectError = (error: any) => {
    console.error('[Socket] connect error:', error);
    new ErrorHandler(new Error(tRef.current('connection-failed-message')), () => ipcService.auth.logout()).show();
  };

  const handleReconnectError = (error: any) => {
    console.error('[Socket] reconnect error:', error);
    new ErrorHandler(new Error(tRef.current('reconnection-failed-message')), () => ipcService.auth.logout()).show();
  };

  // Effects
  useEffect(() => {
    const unsubscribe = [
      ipcService.socket.on('connect', handleConnect),
      ipcService.socket.on('reconnect', handleReconnect),
      ipcService.socket.on('disconnect', handleDisconnect),
      ipcService.socket.on('error', handleError),
      ipcService.socket.on('connect_error', handleConnectError),
      ipcService.socket.on('reconnect_error', handleReconnectError),
    ];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, []);

  return <SocketContext.Provider value={{ isConnected }}>{children}</SocketContext.Provider>;
};

SocketProvider.displayName = 'SocketProvider';

export default SocketProvider;

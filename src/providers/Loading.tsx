import React, { useContext, createContext, ReactNode, useState, useMemo, useCallback } from 'react';

import LoadingOverlay from '@/components/LoadingOverlay';

interface LoadingContextType {
  getIsLoading: () => boolean;
  loadServer: (displayId: string) => void;
  stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | null>(null);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

interface LoadingProviderProps {
  children: ReactNode;
}

const LoadingProvider = ({ children }: LoadingProviderProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingServerId, setLoadingServerId] = useState<string>('');

  const getIsLoading = useCallback(() => {
    return isLoading;
  }, [isLoading]);

  const loadServer = useCallback((displayId: string) => {
    setIsLoading(true);
    setLoadingServerId(displayId);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleCloseLoading = () => {
    stopLoading();
  };

  const contextValue = useMemo(() => ({ getIsLoading, loadServer, stopLoading }), [getIsLoading, loadServer, stopLoading]);

  return (
    <LoadingContext.Provider value={contextValue}>
      {isLoading && <LoadingOverlay loadingServerId={loadingServerId} onClose={handleCloseLoading} />}
      {children}
    </LoadingContext.Provider>
  );
};

LoadingProvider.displayName = 'LoadingProvider';

export default LoadingProvider;

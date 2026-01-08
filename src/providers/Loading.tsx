import React, { useContext, createContext, ReactNode, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import homeStyles from '@/styles/home.module.css';

interface LoadingContextType {
  isLoading: boolean;
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
  // Hooks
  const { t } = useTranslation();

  // States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingServerId, setLoadingServerId] = useState<string>('');

  // Functions
  const loadServer = useCallback((displayId: string) => {
    setIsLoading(true);
    setLoadingServerId(displayId);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Handlers
  const handleCloseLoading = () => {
    stopLoading();
  };

  const contextValue = useMemo(() => ({ loadServer, stopLoading, isLoading }), [loadServer, stopLoading, isLoading]);

  return (
    <LoadingContext.Provider value={contextValue}>
      {isLoading && (
        <div className={homeStyles['loading-wrapper']}>
          <div className={homeStyles['loading-box']}>
            <div className={homeStyles['loading-title-contain']}>{t('connecting-server', { '0': loadingServerId })}</div>
            <div className={homeStyles['loading-gif']} />
            <div className={homeStyles['loading-close-btn']} onClick={handleCloseLoading} />
          </div>
        </div>
      )}
      {children}
    </LoadingContext.Provider>
  );
};

LoadingProvider.displayName = 'LoadingProvider';

export default LoadingProvider;

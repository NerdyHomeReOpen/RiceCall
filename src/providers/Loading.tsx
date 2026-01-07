import React, { useContext, createContext, ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

import homeStyles from '@/styles/home.module.css';

interface LoadingContextType {
  setIsLoading: (value: boolean) => void;
  setLoadingServerId: (value: string) => void;
  setLoadingTimeStamp: (value: number) => void;
  isLoading: boolean;
  loadingServerId: string;
  loadingTimeStamp: number;
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
  const [loadingTimeStamp, setLoadingTimeStamp] = useState<number>(500);

  // Handlers
  const handleCloseLoading = () => {
    setIsLoading(false);
  };

  return (
    <LoadingContext.Provider
      value={{
        setIsLoading,
        setLoadingServerId,
        setLoadingTimeStamp,
        isLoading,
        loadingServerId,
        loadingTimeStamp,
      }}
    >
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

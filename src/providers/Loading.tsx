import React, { useContext, createContext, ReactNode, useState } from 'react';

// CSS
import homePage from '@/styles/home.module.css';

// Providers
import { useTranslation } from 'react-i18next';

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
        <div className={homePage['loading-wrapper']}>
          <div className={homePage['loading-box']}>
            <div className={homePage['loading-title-contain']}>{t('connecting-server', { '0': loadingServerId })}</div>
            <div className={homePage['loading-gif']}></div>
            <div className={homePage['loading-close-btn']} onClick={() => setIsLoading(false)} />
          </div>
        </div>
      )}
      {children}
    </LoadingContext.Provider>
  );
};

LoadingProvider.displayName = 'MainTabProvider';

export default LoadingProvider;

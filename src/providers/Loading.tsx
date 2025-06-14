import React, { useContext, createContext, ReactNode, useState } from 'react';

// CSS
import homePage from '@/styles/pages/home.module.css';

// Providers
import { useLanguage } from '@/providers/Language';

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
  const lang = useLanguage();

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
      {/* Loading */}
      {isLoading && (
        <div className={homePage['loadingWrapper']}>
          <div className={homePage['loadingBox']}>
            <div className={homePage['loadingTitleContain']}>
              <div>{lang.tr.connectingServer}</div>
              <div className={homePage['loadingServerID']}>
                {loadingServerId}
              </div>
            </div>
            <div className={homePage['loadingGif']}></div>
            <div
              className={homePage['loadingCloseBtn']}
              onClick={() => setIsLoading(false)}
            />
          </div>
        </div>
      )}
      {children}
    </LoadingContext.Provider>
  );
};

LoadingProvider.displayName = 'MainTabProvider';

export default LoadingProvider;

import React, { useContext, createContext, ReactNode, useState } from 'react';

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
  // States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingServerId, setLoadingServerId] = useState<string>('');
  const [loadingTimeStamp, setLoadingTimeStamp] = useState<number>(1000);

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
      {children}
    </LoadingContext.Provider>
  );
};

LoadingProvider.displayName = 'MainTabProvider';

export default LoadingProvider;